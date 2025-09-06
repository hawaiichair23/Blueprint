import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { checkAndBackup, startFileWatcher } from './prt.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory where this script is located (Blueprint folder)
const __filename = fileURLToPath(import.meta.url);
const BASE_DIR = path.dirname(__filename); 
const SANDBOX_DIR = path.join(BASE_DIR, 'sandbox'); 

const server = new Server(
    {
        name: 'blueprint-generator',
        version: '0.2.0', 
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

const MAX_FILES = 40;

// Helper function for searching content
function searchInContent(content, query, contextLines = 3) {
    const lines = content.split('\n');
    const matches = [];
    const maxResults = 10;
    
    for (let i = 0; i < lines.length && matches.length < maxResults; i++) {
        const line = lines[i];
        const searchLine = line.toLowerCase();
        const searchQuery = query.toLowerCase();
        
        if (searchLine.includes(searchQuery)) {
            const startLine = Math.max(0, i - contextLines);
            const endLine = Math.min(lines.length - 1, i + contextLines);
            
            const contextLines_array = [];
            for (let j = startLine; j <= endLine; j++) {
                const prefix = j === i ? '>>> ' : '    ';
                contextLines_array.push(`${prefix}Line ${j + 1}: ${lines[j]}`);
            }
            
            matches.push(contextLines_array.join('\n'));
        }
    }
    
    if (matches.length === 0) {
        return `No matches found for "${query}"`;
    }
    
    return matches.join('\n\n---\n\n');
}

// Security functions
function resolveInSandbox(filename) {
    if (filename.includes('..') || path.isAbsolute(filename)) {
        throw new Error('JAILBREAK ATTEMPT: Invalid filename');
    }
    const fullPath = path.join(SANDBOX_DIR, filename);
    if (!fullPath.startsWith(SANDBOX_DIR)) {
        throw new Error('JAILBREAK ATTEMPT: Escaped sandbox');
    }
    return fullPath;
}

async function enforceWriteLimits(content, filename) {
    if (content.length > 1_000_000) {
        throw new Error('FILE TOO LARGE');
    }

    let files;
    try {
        files = await fs.readdir(SANDBOX_DIR);
    } catch (readError) {
        return '[DEBUG] Sandbox directory not found (will be created)';
    }
    const visibleFiles = files.filter(f => !f.startsWith('.'));

    if (visibleFiles.length >= MAX_FILES) {
        throw new Error(`File limit of ${MAX_FILES} reached. Currently ${visibleFiles.length} files.`);
    }

    return `[DEBUG] ${visibleFiles.length}/${MAX_FILES} files`;
}

// Files allowed to be written to outside sandbox
const ALLOWED_BASE_FILES = ['blueprint.txt', 'prt.js', 'generate.js'];

function resolveFilePath(filename) {
    if (filename.includes('..') || path.isAbsolute(filename)) {
        throw new Error('JAILBREAK ATTEMPT: Invalid filename');
    }

    // Strip leading sandbox/ to normalize paths
    const normalizedFilename = filename.startsWith('sandbox/') 
        ? filename.replace('sandbox/', '') 
        : filename;

    if (ALLOWED_BASE_FILES.includes(normalizedFilename)) {
        return path.join(BASE_DIR, normalizedFilename);
    }

    return resolveInSandbox(normalizedFilename);
}

// 3 core tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'read',
                description: "Read files or get content from the system. 🚨 START HERE: Use {\"target\": \"index\"} to read the full documentation first.",
                inputSchema: {
                    type: 'object',
                    properties: {
                        target: { 
                            type: 'string', 
                            enum: ['file', 'index', 'generated'],
                            description: 'What to read: file (any file), index (schema reference), generated (latest output)'
                        },
                        filename: { 
                            type: 'string', 
                            description: 'File to read (required for target=file)'
                        },
                        directory: { 
                            type: 'string', 
                            description: 'Directory to list files from (optional, for file listing)'
                        }
                    },
                    required: ['target']
                }
            },
            {
                name: 'search',
                description: 'Search for text within files and show surrounding context OR discover component info',
                inputSchema: {
                    type: 'object',
                    properties: {
                        filename: { type: 'string', description: 'File to search in (for file search mode)' },
                        query: { type: 'string', description: 'Text to search for (for file search mode)' },
                        context: { type: 'number', default: 3, description: 'Lines of context before/after matches' },
                        case_sensitive: { type: 'boolean', default: false, description: 'Whether search should be case sensitive' },
                        max_results: { type: 'number', default: 10, description: 'Maximum number of matches to return' },
                        // COMPONENTS LIBRARY
                        component: { type: 'string', description: 'Component name to get definition (discovery mode)' },
                        parameter: { type: 'string', description: 'Parameter name to find usage across components (discovery mode)' },
                        universal: { type: 'boolean', description: 'Show all universal parameters (discovery mode)' },
                        examples: { type: 'string', description: 'Component name to find examples (discovery mode)' }
                    },
                    required: []
                }
            },
            {
                name: 'write',
                description: 'Write or update files in different ways',
                inputSchema: {
                    type: 'object',
                    properties: {
                        mode: { 
                            type: 'string', 
                            enum: ['overwrite', 'segment', 'blueprint'],
                            description: 'Write mode: overwrite (replace entire file), segment (find/replace), blueprint (write blueprint.txt)'
                        },
                        filename: { 
                            type: 'string', 
                            description: 'Target file to modify' 
                        },
                        content: { 
                            type: 'string', 
                            description: 'New content (for overwrite/blueprint modes)' 
                        },
                        old_str: { 
                            type: 'string', 
                            description: 'Exact string to find (for segment mode)' 
                        },
                        new_str: { 
                            type: 'string', 
                            description: 'Replacement string (for segment mode)' 
                        }
                    },
                    required: ['mode', 'filename'],
                    // Conditional requirements handled in validation
                }
            },
            {
                name: 'execute',
                description: 'Run operations on the blueprint system',
                inputSchema: {
                    type: 'object',
                    properties: {
                        command: { 
                            type: 'string', 
                            enum: ['generate', 'list'],
                            description: 'Command: generate (compile blueprint.txt), list (show files in directory)'
                        },
                        directory: { 
                            type: 'string', 
                            enum: ['sandbox', 'schema', '.'],
                            description: 'Directory to list (required for list command)'
                        }
                    },
                    required: ['command']
                }
            }
        ],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    try {
        // SEARCH TOOL - Search for text within files with context OR discover component info
        if (name === 'search') {
            // Component discovery mode
            if (args.component || args.parameter || args.universal || args.examples) {
                const schemaPath = path.join(BASE_DIR, 'schema', 'components.js');
                const schemaContent = await fs.readFile(schemaPath, 'utf-8');
                
                if (args.component) {
                    // Load the component and extract parameters
                    const componentsPath = path.join(BASE_DIR, 'schema', 'components.js');
                    const componentsContent = await fs.readFile(componentsPath, 'utf-8');
                    
                    // Search for the component definition
                    const componentQuery = `'${args.component}': {`;
                    const startIndex = componentsContent.indexOf(componentQuery);
                    
                    if (startIndex === -1) {
                        return {
                            content: [{
                                type: 'text',
                                text: `Component "${args.component}" not found`
                            }]
                        };
                    }

                    // Extract the component's html function to analyze parameters
                    const openBraceIndex = componentsContent.indexOf('{', startIndex);
                    let braceCount = 1;
                    let endIndex = openBraceIndex;
                    let inString = false;
                    let stringChar = '';

                    for (let i = openBraceIndex + 1; i < componentsContent.length; i++) {
                        const char = componentsContent[i];

                        if (!inString && (char === '"' || char === "'" || char === '`')) {
                            inString = true;
                            stringChar = char;
                        } else if (inString && char === stringChar && componentsContent[i - 1] !== '\\') {
                            inString = false;
                        } else if (!inString) {
                            if (char === '{') braceCount++;
                            if (char === '}') braceCount--;
                            if (braceCount === 0) {
                                endIndex = i;
                                break;
                            }
                        }
                    }

                    const componentCode = componentsContent.substring(startIndex, endIndex + 1);
                    
                    // Extract parameters from the code
                    const paramMatches = componentCode.match(/params\.(\w+)/g) || [];
                    const expectedParams = [...new Set(paramMatches.map(match => match.replace('params.', '')))];
                    
                    // Format the response nicely
                    let response = `Component "${args.component}" parameters:\n\n`;
                    if (expectedParams.length > 0) {
                        response += `Available parameters: ${expectedParams.join(', ')}\n\n`;
                    } else {
                        response += `No parameters found.\n\n`;
                    }
                    response += `Full definition:\n${componentCode}`;
                    
                    return {
                        content: [{
                            type: 'text',
                            text: response
                        }]
                    };
                }
                
                if (args.parameter) {
                    // Search for parameter usage across components
                    const paramQuery = `params.${args.parameter}`;
                    const results = searchInContent(schemaContent, paramQuery, 3);
                    return {
                        content: [{
                            type: 'text',
                            text: `Parameter "${args.parameter}" usage:\n\n${results}`
                        }]
                    };
                }
                
                if (args.universal) {
                    // Search for universal parameters
                    const universalParams = ['theme', 'font', 'color', 'spacing'];
                    let results = 'Universal parameters:\n\n';
                    for (const param of universalParams) {
                        const paramResults = searchInContent(schemaContent, `params.${param}`, 1);
                        if (paramResults !== `No matches found for "params.${param}"`) {
                            results += `${param}:\n${paramResults}\n\n`;
                        }
                    }
                    return {
                        content: [{
                            type: 'text',
                            text: results
                        }]
                    };
                }
                
                if (args.examples) {
                    // Extract complete component definition
                    const componentPath = path.join(BASE_DIR, 'schema', 'components.js');
                    const componentContent = await fs.readFile(componentPath, 'utf-8');

                    // Find the complete component block
                    const componentStart = `'${args.examples}': {`;
                    const startIndex = componentContent.indexOf(componentStart);

                    if (startIndex === -1) {
                        return {
                            content: [{
                                type: 'text',
                                text: `Component "${args.examples}" not found`
                            }]
                        };
                    }

                    // Find the opening brace position
                    const openBraceIndex = componentContent.indexOf('{', startIndex);

                    // Find the matching closing brace
                    let braceCount = 1; // Start with 1 since we found the opening brace
                    let endIndex = openBraceIndex;
                    let inString = false;
                    let stringChar = '';

                    for (let i = openBraceIndex + 1; i < componentContent.length; i++) {
                        const char = componentContent[i];

                        if (!inString && (char === '"' || char === "'" || char === '`')) {
                            inString = true;
                            stringChar = char;
                        } else if (inString && char === stringChar && componentContent[i - 1] !== '\\') {
                            inString = false;
                        } else if (!inString) {
                            if (char === '{') braceCount++;
                            if (char === '}') braceCount--;
                            if (braceCount === 0) {
                                endIndex = i;
                                break;
                            }
                        }
                    }

                    const componentBlock = componentContent.substring(startIndex, endIndex + 1);

                    return {
                        content: [{
                            type: 'text',
                            text: `Complete component definition for "${args.examples}":\n\n${componentBlock}`
                        }]
                    };
                }
            }
            
            // Original file search mode
            if (!args.filename || !args.query) {
                throw new Error('filename and query are required for file search, or use component discovery parameters');
            }
            
            const filePath = path.join(BASE_DIR, args.filename);
            const fileContent = await fs.readFile(filePath, 'utf-8');
            const lines = fileContent.split('\n');
            
            const caseSensitive = args.case_sensitive !== false;
            const context = args.context || 3;
            const maxResults = args.max_results || 10;
            
            const searchQuery = caseSensitive ? args.query : args.query.toLowerCase();
            const matches = [];
            
            for (let i = 0; i < lines.length && matches.length < maxResults; i++) {
                const line = lines[i];
                const searchLine = caseSensitive ? line : line.toLowerCase();
                
                if (searchLine.includes(searchQuery)) {
                    const startLine = Math.max(0, i - context);
                    const endLine = Math.min(lines.length - 1, i + context);
                    
                    const contextLines = [];
                    for (let j = startLine; j <= endLine; j++) {
                        const prefix = j === i ? '>>> ' : '    ';
                        contextLines.push(`${prefix}Line ${j + 1}: ${lines[j]}`);
                    }
                    
                    matches.push({
                        lineNumber: i + 1,
                        context: contextLines.join('\n')
                    });
                }
            }
            
            if (matches.length === 0) {
                return {
                    content: [{
                        type: 'text',
                        text: `No matches found for "${args.query}" in ${args.filename}`
                    }]
                };
            }
            
            const resultText = `Found ${matches.length} match(es) for "${args.query}" in ${args.filename}:\n\n` +
                matches.map(match => match.context).join('\n\n---\n\n');
            
            return {
                content: [{
                    type: 'text',
                    text: resultText
                }]
            };
        }
        
        // READ TOOL - Handles file reading, blueprint reference, generated output
        if (name === 'read') {
            switch (args.target) {
                case 'file':
                    if (!args.filename) {
                        throw new Error('filename is required when target=file');
                    }
                    
                    const filePath = path.join(BASE_DIR, args.filename);
                    const fileContent = await fs.readFile(filePath, 'utf-8');
                    
                    // Get directory listing for debug
                    const currentDir = path.dirname(filePath);
                    const filesInDir = await fs.readdir(currentDir);
                    const fileList = filesInDir.join(', ');
                    
                    return {
                        content: [{
                            type: 'text',
                            text: `${fileContent}\n[DEBUG] Files in directory: ${fileList} (${filesInDir.length} total)`
                        }]
                    };
                    
                case 'index':
                    const schemaPath = path.join(BASE_DIR, 'schema', 'index.js');
                    const blueprints = await fs.readFile(schemaPath, 'utf-8');
                    return {
                        content: [{
                            type: 'text',
                            text: `Schema/index.js file contents:\n\n${blueprints}`
                        }]
                    };
                    
                case 'generated':
                    const files = await fs.readdir(SANDBOX_DIR);
                    const htmlFile = files.find(f => f.endsWith('.html')) || 'app.html';
                    const generatedPath = path.join(SANDBOX_DIR, htmlFile);
                    const html = await fs.readFile(generatedPath, 'utf-8');
                    return { 
                        content: [{ 
                            type: 'text', 
                            text: `Generated ${htmlFile} (first 800 chars):\n${html.slice(0, 800)}...` 
                        }] 
                    };
                    
                default:
                    throw new Error(`Unknown read target: ${args.target}`);
            }
        }
        
        // WRITE TOOL - Handles all file writing operations
        if (name === 'write') {
            switch (args.mode) {
                case 'overwrite':
                    if (!args.content) {
                        throw new Error('content is required for overwrite mode');
                    }
                    
                    // Prevent writing whitelisted files with overwrite mode
                    if (ALLOWED_BASE_FILES.includes(args.filename)) {
                        return {
                            content: [{
                                type: 'text',
                                text: `❌ Cannot overwrite ${args.filename}. Use blueprint mode for blueprint.txt.`
                            }]
                        };
                    }
                    
                    const overwritePath = resolveInSandbox(args.filename);
                    const debugInfo = await enforceWriteLimits(args.content, args.filename);
                    await checkAndBackup(`sandbox/${args.filename}`, args.content);
                    await fs.writeFile(overwritePath, args.content);
                    
                    const sandboxFiles = await fs.readdir(SANDBOX_DIR);
                    const fileList = sandboxFiles.join(', ');
                    
                    return {
                        content: [{
                            type: 'text',
                            text: `✅ Written to sandbox/${args.filename}\n${debugInfo}\n[DEBUG] Files in sandbox: ${fileList}`
                        }]
                    };
                    
                case 'segment':
                    if (!args.old_str || !args.new_str) {
                        throw new Error('old_str and new_str are required for segment mode');
                    }
                    
                    const segmentPath = resolveFilePath(args.filename);
                    let fileContent = await fs.readFile(segmentPath, 'utf-8');
                    
                    if (!fileContent.includes(args.old_str)) {
                        return {
                            content: [{
                                type: 'text',
                                text: `❌ Could not find the specified old_str in ${args.filename}`
                            }]
                        };
                    }
                    
                    const updatedContent = fileContent.replace(args.old_str, args.new_str);
                    const relativePath = ALLOWED_BASE_FILES.includes(args.filename) ? args.filename : `sandbox/${args.filename}`;
                    await checkAndBackup(relativePath, updatedContent);
                    await fs.writeFile(segmentPath, updatedContent);
                    
                    const isWhitelisted = ALLOWED_BASE_FILES.includes(args.filename);
                    return {
                        content: [{
                            type: 'text',
                            text: isWhitelisted
                                ? `✅ Updated segment in ${args.filename}`
                                : `⚠️ SANDBOX REDIRECT: Updated segment in sandbox/${args.filename} (not whitelisted)`
                        }]
                    };
                    
                case 'blueprint':
                    if (!args.content) {
                        throw new Error('content is required for blueprint mode');
                    }
                    
                    const blueprintPath = resolveFilePath('blueprint.txt');
                    await enforceWriteLimits(args.content, 'blueprint.txt');
                    await checkAndBackup('blueprint.txt', args.content);
                    await fs.writeFile(blueprintPath, args.content);
                    
                    return { 
                        content: [{ 
                            type: 'text', 
                            text: '✅ Blueprint written to blueprint.txt' 
                        }] 
                    };
                    
                default:
                    throw new Error(`Unknown write mode: ${args.mode}`);
            }
        }
        
        // EXECUTE TOOL - Handles system operations
        if (name === 'execute') {
            switch (args.command) {
                case 'generate':
                    return new Promise((resolve) => {
                        exec('node generate.js', { cwd: BASE_DIR }, (error, stdout, stderr) => {
                            resolve({
                                content: [{
                                    type: 'text',
                                    text: error ? `❌ Error: ${stderr}` : `✅ ${stdout}`
                                }]
                            });
                        });
                    });
                    
                case 'list':
                    if (!args.directory) {
                        throw new Error('directory is required for list command');
                    }
                    
                    // Security check to prevent directory traversal
                    if (args.directory.includes('..') || path.isAbsolute(args.directory)) {
                        throw new Error('Invalid directory path');
                    }

                    const targetDir = path.join(BASE_DIR, args.directory);

                    // Ensure the path is within BASE_DIR
                    if (!targetDir.startsWith(BASE_DIR)) {
                        throw new Error('Directory outside project bounds');
                    }
                    
                    const dirFiles = await fs.readdir(targetDir);
                    const dirFileList = dirFiles.join(', ');
                    
                    return {
                        content: [{
                            type: 'text',
                            text: `Files in ${args.directory}: ${dirFileList} (${dirFiles.length} total)`
                        }]
                    };
                    
                default:
                    throw new Error(`Unknown execute command: ${args.command}`);
            }
        }
        
        return { content: [{ type: 'text', text: `❌ Unknown tool: ${name}` }] };
        
    } catch (error) {
        return {
            content: [{
                type: 'text',
                text: `❌ Error in ${name}: ${error.message}`
            }]
        };
    }
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);

    // Start prt file watcher
    startFileWatcher();
}

main().catch(console.error);
