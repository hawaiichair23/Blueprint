import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import chokidar from 'chokidar';

const __filename = fileURLToPath(import.meta.url);
const BASE_DIR = path.dirname(__filename);
const VERSIONS_DIR = path.join(BASE_DIR, 'versions');
const HASHES_FILE = path.join(BASE_DIR, 'hashes.txt');

// Generate random ID for backup folders
function generateRandomId() {
    return crypto.randomBytes(3).toString('hex');
}

// Calculate SHA256 hash of content
function calculateHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
}

// Get stored hash for a filename from hashes.txt
async function getStoredHash(filename) {
    // We don't care about filename matching anymore, just return null
    // so it always checks the hash comparison in checkAndBackup
    return null;
}

// Update or add hash entry in hashes.txt
async function updateHashFile(filename, newHash) {
    // Check if this hash already exists - if so, don't add duplicate
    try {
        const hashData = await fs.readFile(HASHES_FILE, 'utf-8');
        const lines = hashData.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
            const [file, hash] = line.split(' ');
            if (hash === newHash) {
                // Hash already exists, don't add duplicate
                return;
            }
        }
    } catch (error) {
        // File doesn't exist, we'll create it
    }
    
    // Hash doesn't exist, add it
    const entry = `${filename} ${newHash}\n`;
    await fs.appendFile(HASHES_FILE, entry);
}

// Create backup in versions directory
async function createBackup(filename, content) {
    const randomId = generateRandomId();
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    const backupFolderName = `${randomId}-${timestamp}`;
    const backupDir = path.join(VERSIONS_DIR, backupFolderName);
    
    // Ensure versions directory exists
    await fs.mkdir(VERSIONS_DIR, { recursive: true });
    
    // Create versions folder
    await fs.mkdir(backupDir, { recursive: true });
    
    // Write file to versions folder
    const backupFilePath = path.join(backupDir, filename);
    
    // Create subdirectories if needed (for sandbox/filename.html)
    const backupFileDir = path.dirname(backupFilePath);
    await fs.mkdir(backupFileDir, { recursive: true });
    
    await fs.writeFile(backupFilePath, content);
}

// Main function: check if content changed and backup if needed
export async function checkAndBackup(filename, content) {
    const currentHash = calculateHash(content);
    
    // Check if this exact hash already exists in our hash file
    try {
        const hashData = await fs.readFile(HASHES_FILE, 'utf-8');
        const lines = hashData.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
            const [file, hash] = line.split(' ');
            if (hash === currentHash) {
                // Hash already exists, no backup needed
                return false;
            }
        }
    } catch (error) {
        // hashes.txt doesn't exist yet, that's fine
    }
    
    // Hash doesn't exist, create backup
    await createBackup(filename, content);
    await updateHashFile(filename, currentHash);
    return true; // File was backed up
}

export function startFileWatcher() {
    return null;
}

// Start the file watcher when this module is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('Starting file watcher...');
    startFileWatcher();
}
