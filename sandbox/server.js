import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { checkAndBackup, startFileWatcher } from './prt.js';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import fsSync from 'fs';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';  

// Get the directory where this script is located (Blueprint folder)
const __filename = fileURLToPath(import.meta.url);
const BASE_DIR = path.dirname(__filename) // Read from anywhere
const SANDBOX_DIR = path.join(BASE_DIR, 'sandbox'); 
const ERROR_LOG_FILE = path.join(SANDBOX_DIR, 'browser-errors.jsonl');
const MAX_ERRORS = 1000;
const RETENTION_HOURS = 24;
const MAX_FILES = 50;

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

// Helper function for searching content (UPDATED VERSION)
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

// Helper to extract JS from HTML files
function extractJSFromHTML(content, filename) {
        // If not HTML, return as-is
        if (!filename.endsWith('.html') && !content.trim().startsWith('<')) {
            return content;
        }

        // Extract all <script> tag contents
        const scriptRegex = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi;
        let match;
        const jsBlocks = [];
        let currentLine = 1;

        while ((match = scriptRegex.exec(content)) !== null) {
            const beforeScript = content.substring(0, match.index);
            const linesBeforeScript = (beforeScript.match(/\n/g) || []).length + 1;

            // Add line padding to preserve line numbers
            const padding = '\n'.repeat(linesBeforeScript - currentLine);
            jsBlocks.push(padding + match[1]);

            currentLine = linesBeforeScript + (match[1].match(/\n/g) || []).length + 1;
        }

        return jsBlocks.join('\n');
    }

// List all functions tool - extracts function names/signatures using AST parsing
function listAllFunctions(content) {
    try {
        const ast = acorn.parse(content, {
            ecmaVersion: 2022,
            sourceType: 'module',
            locations: true
        });
        
        const functions = [];
        
        walk.simple(ast, {
            FunctionDeclaration(node) {
                functions.push({
                    name: node.id ? node.id.name : 'anonymous',
                    line: node.loc.start.line,
                    type: 'function'
                });
            },
            VariableDeclarator(node) {
                // Arrow functions: const name = () => {}
                if (node.init && node.init.type === 'ArrowFunctionExpression') {
                    functions.push({
                        name: node.id.name,
                        line: node.loc.start.line,
                        type: 'arrow function'
                    });
                }
                // Function expressions: const name = function() {}
                else if (node.init && node.init.type === 'FunctionExpression') {
                    functions.push({
                        name: node.id.name,
                        line: node.loc.start.line,
                        type: 'function expression'
                    });
                }
            },
            ClassDeclaration(node) {
                functions.push({
                    name: node.id.name,
                    line: node.loc.start.line,
                    type: 'class'
                });
            },
            MethodDefinition(node) {
                functions.push({
                    name: node.key.name || 'anonymous',
                    line: node.loc.start.line,
                    type: 'method'
                });
            }
        });
        
        if (functions.length === 0) {
            return 'No functions found in file';
        }
        
        // Sort by line number
        functions.sort((a, b) => a.line - b.line);
        
        // Format output
        let output = `Found ${functions.length} function(s):\n\n`;
        functions.forEach(func => {
            output += `• ${func.name} (line ${func.line}) - ${func.type}\n`;
        });
        
        return output;
    } catch (error) {
        return `Error parsing JavaScript: ${error.message}`;
    }
}

// Function search tool - finds complete functions using AST parsing
function findFunctions(content, query, maxResults = 10) {
    try {
        const lines = content.split('\n');
        const ast = acorn.parse(content, {
            ecmaVersion: 2022,
            sourceType: 'module',
            locations: true
        });
        
        const matches = [];
        const searchQuery = query.toLowerCase();
        
        walk.simple(ast, {
            FunctionDeclaration(node) {
                const name = node.id ? node.id.name.toLowerCase() : '';
                if (name.includes(searchQuery)) {
                    matches.push({
                        name: node.id.name,
                        type: 'function',
                        startLine: node.loc.start.line,
                        endLine: node.loc.end.line
                    });
                }
            },
            VariableDeclarator(node) {
                // Skip destructuring patterns - only handle simple identifiers
                if (!node.id.name) return;
                const name = node.id.name.toLowerCase();
                // Arrow functions
                if (node.init && node.init.type === 'ArrowFunctionExpression' && name.includes(searchQuery)) {
                    matches.push({
                        name: node.id.name,
                        type: 'arrow function',
                        startLine: node.loc.start.line,
                        endLine: node.init.loc.end.line
                    });
                }
                // Function expressions
                else if (node.init && node.init.type === 'FunctionExpression' && name.includes(searchQuery)) {
                    matches.push({
                        name: node.id.name,
                        type: 'function expression',
                        startLine: node.loc.start.line,
                        endLine: node.init.loc.end.line
                    });
                }
            },
            ClassDeclaration(node) {
                // Skip anonymous classes
                if (!node.id || !node.id.name) return;
                const name = node.id.name.toLowerCase();
                if (name.includes(searchQuery)) {
                    matches.push({
                        name: node.id.name,
                        type: 'class',
                        startLine: node.loc.start.line,
                        endLine: node.loc.end.line
                    });
                }
            },
            MethodDefinition(node) {
                const name = node.key.name ? node.key.name.toLowerCase() : '';
                if (name.includes(searchQuery)) {
                    matches.push({
                        name: node.key.name || 'anonymous',
                        type: 'method',
                        startLine: node.loc.start.line,
                        endLine: node.loc.end.line
                    });
                }
            }
        });
        
        if (matches.length === 0) {
            return `No functions found for "${query}"`;
        }
        
        // Limit results
        const limitedMatches = matches.slice(0, maxResults);
        
        // Format output with actual code
        const results = limitedMatches.map(match => {
            const blockLines = [];
            for (let i = match.startLine - 1; i < match.endLine; i++) {
                const prefix = i === match.startLine - 1 ? '>>> ' : '    ';
                blockLines.push(`${prefix}Line ${i + 1}: ${lines[i]}`);
            }
            
            return `[${match.type.toUpperCase()}] Lines ${match.startLine}-${match.endLine}:\n${blockLines.join('\n')}`;
        });
        
        return results.join('\n\n---\n\n');
    } catch (error) {
        return `Error parsing JavaScript: ${error.message}`;
    }
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
const ALLOWED_BASE_FILES = [
    'blueprint.txt',
    'prt.js',
    'generate.js',
];

// Directories allowed for unrestricted writes
const ALLOWED_DIRECTORIES = [
    'C:/Users/magic/Desktop/Texterity/texterity_app'
];

function resolveFilePath(filename) {
    // Check if it's an allowed absolute path first
    if (ALLOWED_BASE_FILES.includes(filename)) {
        return filename;
    }

    // Check if path is within an allowed directory
    if (path.isAbsolute(filename)) {
        const normalizedPath = path.normalize(filename);
        for (const allowedDir of ALLOWED_DIRECTORIES) {
            if (normalizedPath.startsWith(path.normalize(allowedDir))) {
                return filename; // Allow any file in this directory
            }
        }
    }

    if (filename.includes('..') || path.isAbsolute(filename)) {
        throw new Error('JAILBREAK ATTEMPT: Invalid filename');
    }

    const normalizedFilename = filename.startsWith('sandbox/')
        ? filename.replace('sandbox/', '')
        : filename;

    if (ALLOWED_BASE_FILES.includes(normalizedFilename)) {
        return path.join(BASE_DIR, normalizedFilename);
    }

    return resolveInSandbox(normalizedFilename);
}

// Cleanup old errors
function cleanupErrorLog() {
    try {
        if (!fsSync.existsSync(ERROR_LOG_FILE)) return;
        
        const lines = fsSync.readFileSync(ERROR_LOG_FILE, 'utf-8').split('\n').filter(Boolean);
        
        // Remove entries older than 24 hours
        const cutoffTime = new Date(Date.now() - RETENTION_HOURS * 60 * 60 * 1000);
        let validLines = lines.filter(line => {
            try {
                const entry = JSON.parse(line);
                return new Date(entry.timestamp) > cutoffTime;
            } catch {
                return false;
            }
        });
        
        // Keep only last MAX_ERRORS
        if (validLines.length > MAX_ERRORS) {
            validLines = validLines.slice(-MAX_ERRORS);
        }
        
        // Rewrite file
        fsSync.writeFileSync(ERROR_LOG_FILE, validLines.join('\n') + (validLines.length > 0 ? '\n' : ''));
    } catch (error) {
        console.error('Error cleaning up error log:', error);
    }
}

// Create HTTP server for error logging
const errorLogServer = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    if (req.url === '/log-browser-error' && req.method === 'POST') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const errorData = JSON.parse(body);
                
                // Append to JSONL file
                fsSync.appendFileSync(ERROR_LOG_FILE, JSON.stringify(errorData) + '\n');
                
                // Cleanup if needed
                cleanupErrorLog();
                
                res.writeHead(200);
                res.end('OK');
            } catch (error) {
                res.writeHead(400);
                res.end('Bad Request');
            }
        });
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

// Start error logging server
errorLogServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log('Port 3002 already in use (error logging server already running)');
    } else {
        console.error('Error logging server error:', err);
    }
});

errorLogServer.listen(3002, () => {
    console.log('Error logging server running on http://localhost:3002');
});

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
            },            {
                name: 'search',
                description: 'Search and analyze code: find text with context, discover component info, find specific functions, or list all functions in a file',
                inputSchema: {
                    type: 'object',
                    properties: {
                        filename: { type: 'string', description: 'File to search in (for file search mode)' },
                        query: { type: 'string', description: 'Text to search for (for file search mode)' },
                        context: { type: 'number', default: 3, description: 'Lines of context before/after matches' },
                        case_sensitive: { type: 'boolean', default: false, description: 'Whether search should be case sensitive' },
                        max_results: { type: 'number', default: 10, description: 'Maximum number of matches to return' },                        function_search: { type: 'boolean', default: false, description: 'Find complete functions, variables, classes, and code blocks' },
                        list_functions: { type: 'boolean', default: false, description: 'List all functions in a file (table of contents)' },
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
            },            {
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
            },
            {
                name: 'read_errors',
                description: 'Read browser errors from generated Blueprint pages. Returns JS errors, console logs, and network failures.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        page: {
                            type: 'string',
                            description: 'Filter by page name (e.g., "app.html")'
                        },
                        type: {
                            type: 'string',
                            enum: ['error', 'warning', 'log', 'network'],
                            description: 'Filter by error type'
                        },
                        last_n: {
                            type: 'number',
                            description: 'Return only last N errors (default: all)'
                        },
                        clear_old: {
                            type: 'boolean',
                            description: 'Remove errors older than 24 hours (default: true)'
                        }
                    }
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
                }            }            // Original file search mode
            if (!args.filename) {
                throw new Error('filename is required for file search/analysis');
            }
            
            // Allow absolute paths or resolve relative to BASE_DIR
            // You can access absolute file paths for READING, LISTING OR SEARCHING.
            const filePath = path.isAbsolute(args.filename)
                ? args.filename
                : path.resolve(BASE_DIR, args.filename);
            let fileContent = await fs.readFile(filePath, 'utf-8');

            // Extract JS from HTML if needed for function parsing
            if (args.list_functions || args.function_search) {
                fileContent = extractJSFromHTML(fileContent, args.filename);
            }
            
            // Check if list_functions is requested
            if (args.list_functions) {
                const results = listAllFunctions(fileContent);
                
                return {
                    content: [{
                        type: 'text',
                        text: `Function list for ${args.filename}:\n\n${results}`
                    }]
                };
            }
            
            // Check if function search is requested
            if (args.function_search) {
                if (!args.query) {
                    throw new Error('query is required for function_search mode');
                }
                const maxResults = args.max_results || 10;
                const results = findFunctions(fileContent, args.query, maxResults);
                
                return {
                    content: [{
                        type: 'text',
                        text: `Function search results for "${args.query}" in ${args.filename}:\n\n${results}`
                    }]
                };
            }
            
            // Regular search mode requires query
            if (!args.query) {
                throw new Error('query is required for text search mode');
            }
            
                        // Regular search mode
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
                    // Find column position of the match
                    const columnStart = searchLine.indexOf(searchQuery);
                    const columnEnd = columnStart + searchQuery.length;
                    
                    const startLine = Math.max(0, i - context);
                    const endLine = Math.min(lines.length - 1, i + context);
                    
                    const contextLines = [];
                    for (let j = startLine; j <= endLine; j++) {
                        const prefix = j === i ? '>>> ' : '    ';
                        contextLines.push(`${prefix}Line ${j + 1}: ${lines[j]}`);
                    }
                    
                    // Add visual indicator for column position on the matched line
                    if (columnStart >= 0) {
                        const indicator = ' '.repeat(4 + `Line ${i + 1}: `.length + columnStart) + '^'.repeat(searchQuery.length);
                        contextLines.splice(context + 1, 0, indicator);
                    }
                    
                    matches.push({
                        lineNumber: i + 1,
                        columnStart: columnStart,
                        columnEnd: columnEnd,
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
                matches.map(match => `Match at Line ${match.lineNumber}, Col ${match.columnStart}-${match.columnEnd}:\n${match.context}`).join('\n\n---\n\n');
            
            return {
                content: [{
                    type: 'text',
                    text: resultText
                }]
            };
        }
        
        // READ TOOL - Handles file reading, blueprint reference, generated output
        // You can access absolute file paths for READING, LISTING OR SEARCHING.
        if (name === 'read') {
            switch (args.target) {
                case 'file':
                    if (!args.filename) {
                        throw new Error('filename is required when target=file');
                    }
                    
                    // Allow absolute paths or resolve relative to BASE_DIR
                    const filePath = path.isAbsolute(args.filename)
                        ? args.filename
                        : path.resolve(BASE_DIR, args.filename);
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
                    
                    const overwritePath = resolveFilePath(args.filename);

                    // Only enforce limits and backup for sandbox files
                    if (!path.isAbsolute(args.filename)) {
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
                    } else {
                        // For absolute paths (allowed directories)
                        await fs.writeFile(overwritePath, args.content);

                        return {
                            content: [{
                                type: 'text',
                                text: `✅ Written to ${args.filename}`
                            }]
                        };
                    }
                case 'segment':
                    if (!args.old_str || !args.new_str) {
                        throw new Error('old_str and new_str are required for segment mode');
                    }
                
                    const segmentPath = resolveFilePath(args.filename);
                    let fileContent = await fs.readFile(segmentPath, 'utf-8');
                
                    // Helper: normalize text for matching (removes excess whitespace)
                    const normalizeForMatching = (text) => {
                        return text
                            .replace(/\r\n/g, '\n')  // Normalize line endings
                            .split('\n')
                            .map(line => line.trim())
                            .filter(line => line !== '')  // Remove empty lines
                            .join('\n');
                    };
                
                    // Helper: get indentation of first line
                    const getIndentation = (text) => {
                        const firstLine = text.split('\n')[0];
                        const match = firstLine.match(/^(\s*)/);
                        return match ? match[1] : '';
                    };
                
                    // Helper: adjust indentation of all lines
                    const adjustIndentation = (text, targetIndent, currentIndent) => {
                        const lines = text.split('\n');
                        return lines.map((line, i) => {
                            if (i === 0) {
                                return targetIndent + line.trimStart();
                            } else {
                                const lineIndent = line.match(/^(\s*)/)[0];
                                if (lineIndent.length > currentIndent.length) {
                                    const extraIndent = lineIndent.slice(currentIndent.length);
                                    return targetIndent + extraIndent + line.trimStart();
                                } else {
                                    return targetIndent + line.trimStart();
                                }
                            }
                        }).join('\n');
                    };
                
                    // Split file into lines
                    const fileLines = fileContent.split('\n');
                
                    // CREATE MAPPING: normalized line index -> original line index + character positions
                    const lineMapping = [];
                    const normalizedLines = [];
                
                    for (let i = 0; i < fileLines.length; i++) {
                        const trimmed = fileLines[i].trim();
                        if (trimmed !== '') {
                            lineMapping.push(i);  // Map normalized index to original index
                            normalizedLines.push(trimmed);
                        }
                    }
                
                    // Normalize the search pattern
                    const normalizedOldStr = normalizeForMatching(args.old_str);
                    const normalizedOldLines = normalizedOldStr.split('\n');
                
                                        // Find match in normalized content (supports substring matching)
                    let matchStartLineNormalized = -1;
                    let matchEndLineNormalized = -1;
                    let matchStartColumn = -1;
                    let matchEndColumn = -1;
                    
                    // Try multi-line exact match first
                    if (normalizedOldLines.length > 1) {
                        for (let i = 0; i <= normalizedLines.length - normalizedOldLines.length; i++) {
                            let matches = true;
                            for (let j = 0; j < normalizedOldLines.length; j++) {
                                if (normalizedLines[i + j] !== normalizedOldLines[j]) {
                                    matches = false;
                                    break;
                                }
                            }
                            if (matches) {
                                matchStartLineNormalized = i;
                                matchEndLineNormalized = i + normalizedOldLines.length - 1;
                                matchStartColumn = 0;
                                matchEndColumn = normalizedLines[matchEndLineNormalized].length;
                                break;
                            }
                        }
                    }
                    
                    // If no multi-line match, try substring match within single lines
                    if (matchStartLineNormalized === -1 && normalizedOldLines.length === 1) {
                        const searchStr = normalizedOldLines[0];
                        for (let i = 0; i < normalizedLines.length; i++) {
                            const idx = normalizedLines[i].indexOf(searchStr);
                            if (idx !== -1) {
                                matchStartLineNormalized = i;
                                matchEndLineNormalized = i;
                                matchStartColumn = idx;
                                matchEndColumn = idx + searchStr.length;
                                break;
                            }
                        }
                    }
                
                    if (matchStartLineNormalized === -1) {
                        return {
                            content: [{
                                type: 'text',
                                text: `❌ Could not find the specified old_str in ${args.filename}`
                            }]
                        };
                    }
                
                    // MAP BACK to original line numbers
                    const originalStartLine = lineMapping[matchStartLineNormalized];
                    const originalEndLine = lineMapping[matchEndLineNormalized];
                
                                        // Find COLUMN positions by matching trimmed content within original lines
                    const firstOriginalLine = fileLines[originalStartLine];
                    const firstNormalizedLine = normalizedLines[matchStartLineNormalized];
                    
                    // For substring matches, we need to find the exact position
                    let startColumn;
                    if (matchStartColumn !== undefined && matchStartColumn > 0) {
                        // Substring match - find where the match starts in the original line
                        const matchedSubstr = firstNormalizedLine.substring(matchStartColumn, matchEndColumn);
                        const trimmedOriginal = firstOriginalLine.trim();
                        const offsetInTrimmed = trimmedOriginal.indexOf(matchedSubstr);
                        const leadingWhitespace = firstOriginalLine.length - firstOriginalLine.trimStart().length;
                        startColumn = leadingWhitespace + offsetInTrimmed;
                    } else {
                        // Full line match - find where the trimmed content starts
                        startColumn = firstOriginalLine.indexOf(firstNormalizedLine);
                    }
                    
                    // For end position
                    const lastOriginalLine = fileLines[originalEndLine];
                    const lastNormalizedLine = normalizedLines[matchEndLineNormalized];
                    
                    let endColumn;
                    if (matchEndColumn !== undefined) {
                        // Substring match
                        const matchedSubstr = lastNormalizedLine.substring(matchStartColumn, matchEndColumn);
                        const trimmedOriginal = lastOriginalLine.trim();
                        const offsetInTrimmed = trimmedOriginal.indexOf(matchedSubstr);
                        const leadingWhitespace = lastOriginalLine.length - lastOriginalLine.trimStart().length;
                        endColumn = leadingWhitespace + offsetInTrimmed + matchedSubstr.length;
                    } else {
                        // Full line match
                        const endColumnStart = lastOriginalLine.indexOf(lastNormalizedLine);
                        endColumn = endColumnStart + lastNormalizedLine.length;
                    }
                
                    // Calculate byte offsets for the range
                    let startOffset = 0;
                    for (let i = 0; i < originalStartLine; i++) {
                        startOffset += fileLines[i].length + 1; // +1 for newline
                    }
                    startOffset += startColumn;
                
                    let endOffset = 0;
                    for (let i = 0; i < originalEndLine; i++) {
                        endOffset += fileLines[i].length + 1;
                    }
                    endOffset += endColumn;
                
                                        // Get indentation from the match position
                    // For inline matches (not at start of line), don't adjust indentation
                    let adjustedNewCode;
                    if (startColumn > 0 && matchStartColumn !== undefined && matchStartColumn > 0) {
                        // Inline replacement - use new_str as-is, no indentation adjustment
                        adjustedNewCode = args.new_str;
                    } else {
                        // Start-of-line replacement - adjust indentation to match original
                        const originalIndent = firstOriginalLine.substring(0, startColumn);
                        const newCodeIndent = getIndentation(args.new_str);
                        adjustedNewCode = adjustIndentation(args.new_str, originalIndent, newCodeIndent);
                    }
                
                    // Perform replacement using character positions (offsets)
                    const beforeMatch = fileContent.substring(0, startOffset);
                    const afterMatch = fileContent.substring(endOffset);
                    const updatedContent = beforeMatch + adjustedNewCode + afterMatch;
                
                    // Skip backup for absolute paths
                    if (!path.isAbsolute(args.filename)) {
                        const relativePath = ALLOWED_BASE_FILES.includes(args.filename) ? args.filename : `sandbox/${args.filename}`;
                        await checkAndBackup(relativePath, updatedContent);
                    }
                    await fs.writeFile(segmentPath, updatedContent);
                
                    const isWhitelisted = ALLOWED_BASE_FILES.includes(args.filename);
                    return {
                        content: [{
                            type: 'text',
                            text: `✅ Updated segment in ${args.filename} (line ${originalStartLine + 1}, col ${startColumn} to line ${originalEndLine + 1}, col ${endColumn})`
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
        // You can access absolute file paths for READING, LISTING OR SEARCHING.
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
                    //if (args.directory.includes('..') || path.isAbsolute(args.directory)) {
                    //    throw new Error('Invalid directory path');
                    //}

                    // Ensure the path is within BASE_DIR
                    //if (!targetDir.startsWith(BASE_DIR)) {
                    //    throw new Error('Directory outside project bounds');
                    //}

                    // Allow absolute paths or resolve relative to BASE_DIR
                    const targetDir = path.isAbsolute(args.directory)
                        ? args.directory
                        : path.resolve(BASE_DIR, args.directory);
                    
                    const dirFiles = await fs.readdir(targetDir);
                    const dirFileList = dirFiles.join(', ');
                    
                    return {
                        content: [{
                            type: 'text',
                            text: `Files in ${args.directory}: ${dirFileList} (${dirFiles.length} total)`
                        }]
                    };
                    
                default:                    throw new Error(`Unknown execute command: ${args.command}`);
            }
        }
        
        // READ_ERRORS TOOL - Read browser error logs
        if (name === 'read_errors') {
            try {
                // Cleanup old errors if requested
                if (args.clear_old !== false) {
                    cleanupErrorLog();
                }
                
                if (!fsSync.existsSync(ERROR_LOG_FILE)) {
                    return {
                        content: [{
                            type: 'text',
                            text: 'No errors logged yet.'
                        }]
                    };
                }
                
                // Read and parse errors
                const fileContent = fsSync.readFileSync(ERROR_LOG_FILE, 'utf-8');
                const lines = fileContent.split('\n').filter(Boolean);
                let errors = lines.map(line => {
                    try {
                        return JSON.parse(line);
                    } catch {
                        return null;
                    }
                }).filter(Boolean);
                
                // Apply filters
                if (args.page) {
                    errors = errors.filter(e => e.page === args.page);
                }
                
                if (args.type) {
                    errors = errors.filter(e => e.type === args.type);
                }
                
                // Get last N
                if (args.last_n) {
                    errors = errors.slice(-args.last_n);
                }
                
                // Generate summary
                const errorTypes = {};
                errors.forEach(e => {
                    errorTypes[e.type] = (errorTypes[e.type] || 0) + 1;
                });
                
                const summary = {
                    total: errors.length,
                    by_type: errorTypes,
                    pages: [...new Set(errors.map(e => e.page))],
                    errors: errors
                };
                
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify(summary, null, 2)
                    }]
                };
                
            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `Error reading logs: ${error.message}`
                    }]
                };
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
