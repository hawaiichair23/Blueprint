import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import chokidar from 'chokidar';

const __filename = fileURLToPath(import.meta.url);
const BASE_DIR = path.dirname(__filename);
const VERSIONS_DIR = path.join(BASE_DIR, 'versions');
const HASHES_FILE = path.join(BASE_DIR, 'hashes.txt');

/*
 * prt.js is an automatic file versioning system.
 * 
 * It watches project files and creates timestamped backups 
 * for every file change in versions/ with /YYYY-MM-DD/H-MM-SS-AM-filename/.
 * 
 * prt tracks file changes by user, as well as file changes by AI assistant.
 * 
 * prt uses SHA-256 hashing to deduplicate so it will only save when content
 * has actually changed. 
 * 
 * No commands needed to run; it will run automatically when the MCP server starts.
 * Browse your versions/ folder to see previous versions of files by day.
 */

// Simple lock for hash file operations
let hashFileLock = Promise.resolve();

// Calculate SHA256 hash of content
// Used for deduplication
function calculateHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
}

// Update or add hash entry in hashes.txt
// Returns true if hash was added, false if it already existed
async function updateHashFile(filename, newHash) {
    // Wait for any pending hash file operations
    await hashFileLock;
    
    // Create new lock
    let releaseLock;
    hashFileLock = new Promise(resolve => { releaseLock = resolve; });
    
    try {
        // Check if this hash already exists - if so, don't add duplicate
        try {
            const hashData = await fs.readFile(HASHES_FILE, 'utf-8');
            const lines = hashData.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
                const [file, hash] = line.split(' ');
                if (hash === newHash) {
                    // Hash already exists, don't add duplicate
                    return false;
                }
            }
        } catch (error) {
            // File doesn't exist, we'll create it
        }
        
        // Hash doesn't exist, add it
        const entry = `${filename} ${newHash}\n`;
        await fs.appendFile(HASHES_FILE, entry);
        return true;
    } finally {
        // Release lock
        releaseLock();
    }
}

// Create backup in versions directory
async function createBackup(filename, content) {
    const now = new Date();
    
    // Create date folder (YYYY-MM-DD) using local time
    const dateFolder = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    // Create time string (H-MM-SS-AM/PM)
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // Convert to 12-hour format
    const timeStr = `${hours}-${minutes}-${seconds}-${ampm}`;
    
    // Create folder name with time and just the base filename
    const baseFilename = path.basename(filename);
    const backupFolderName = `${timeStr}-${baseFilename}`;
    const backupDir = path.join(VERSIONS_DIR, dateFolder, backupFolderName);
    
    // Create backup directory
    await fs.mkdir(backupDir, { recursive: true });
    
    // Write file to backup folder
    const backupFilePath = path.join(backupDir, filename);
    
    // Create subdirectories if needed (for sandbox/filename.html)
    const backupFileDir = path.dirname(backupFilePath);
    await fs.mkdir(backupFileDir, { recursive: true });
    
    await fs.writeFile(backupFilePath, content);
}

// Main function: check if content changed and backup if needed
export async function checkAndBackup(filename, content) {
    // Ignore blacklisted files/folders
    const IGNORED_PATTERNS = [
        'versions/',
        'node_modules/',
        '.git/',
        '.claude/',
        'generate.bat',
        'hashes.txt',
        'package-lock.json',
        'package.json',
        'tools/'
    ];
    
    // Check if filename matches any ignored pattern
    for (const pattern of IGNORED_PATTERNS) {
        if (filename.includes(pattern)) {
            return false; // Skip backup for ignored files
        }
    }
    
    const currentHash = calculateHash(content);
    
    // Check if hash already exists (returns true if new hash was added)
    const hashAdded = await updateHashFile(filename, currentHash);
    
    if (!hashAdded) {
        return false; // Hash already existed, no backup needed
    }
    
    // Hash is new, create backup
    await createBackup(filename, content);
    return true; // File was backed up
}

export function startFileWatcher() {
    // Specific files and directories to watch
    const WATCH_PATHS = [
        path.join(BASE_DIR, 'blueprint.txt'),
        path.join(BASE_DIR, 'blueprints.js'),
        path.join(BASE_DIR, 'generate.js'),
        path.join(BASE_DIR, 'prt.js'),
        path.join(BASE_DIR, 'server.js'),
        path.join(BASE_DIR, '.gitignore'),
        path.join(BASE_DIR, 'schema'),
        path.join(BASE_DIR, 'sandbox')
    ];
    
    // Manual debounce tracking
    const debounceTimers = {};
    const DEBOUNCE_MS = 2000;
    
        const watcher = chokidar.watch(WATCH_PATHS, {
        usePolling: false,
        ignoreInitial: true
    });
    
    function handleFileEvent(filePath) {
        if (debounceTimers[filePath]) {
            clearTimeout(debounceTimers[filePath]);
        }
        
        debounceTimers[filePath] = setTimeout(async () => {
            delete debounceTimers[filePath];
            
            try {
                const relativePath = path.relative(BASE_DIR, filePath);
                const content = await fs.readFile(filePath, 'utf-8');
                await checkAndBackup(relativePath, content);
            } catch (error) {
                // Error backing up file
            }
        }, DEBOUNCE_MS);
    }
    
    watcher.on('change', handleFileEvent);
    watcher.on('add', handleFileEvent);
    
    return watcher;
}

// Start the file watcher when this module is run directly...
if (import.meta.url === `file://${process.argv[1]}`) {
    startFileWatcher();
}
