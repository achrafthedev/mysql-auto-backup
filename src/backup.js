import { readdir, stat, rm, mkdir } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import pc from 'picocolors';

export default class BackupManager {
    constructor(backupDir) {
        this.backupDir = backupDir;
    }

    async ensureBackupDirectory() {
        try {
            await mkdir(this.backupDir, { recursive: true });
            console.log(pc.blue('📁 Backup directory ensured'));
        } catch (error) {
            console.log(pc.red(`❌ Failed to create backup directory: ${error.message}`));
            throw error;
        }
    }

    async getBackupFiles() {
        try {
            const files = await readdir(this.backupDir);
            const sqlFiles = files.filter(file => file.endsWith('.sql'));

            const backupFiles = await Promise.all(sqlFiles.map(async file => {
                const filePath = path.join(this.backupDir, file);
                const stats = await stat(filePath);
                return {
                    name: file,
                    path: filePath,
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime
                };
            }));

            // Sort newest first
            return backupFiles.sort((a, b) => b.created - a.created);
        } catch (error) {
            console.log(pc.yellow(`⚠️ Failed to get backup files: ${error.message}`));
            return [];
        }
    }

    async cleanupOldBackups(maxBackups = 10) {
        try {
            const backupFiles = await this.getBackupFiles();
            
            if (backupFiles.length > maxBackups) {
                const filesToDelete = backupFiles.slice(maxBackups);
                
                console.log(pc.yellow(`🧹 Cleaning up ${filesToDelete.length} old backup(s)...`));
                
                for (const file of filesToDelete) {
                    await rm(file.path, { force: true });
                    console.log(pc.gray(`🗑️ Deleted: ${file.name}`));
                }
                
                console.log(pc.green('✅ Backup cleanup completed'));
            }
        } catch (error) {
            console.log(pc.yellow(`⚠️ Failed to cleanup old backups: ${error.message}`));
        }
    }

    async getBackupStats() {
        try {
            const backupFiles = await this.getBackupFiles();
            
            if (backupFiles.length === 0) {
                return {
                    totalBackups: 0,
                    totalSize: '0 Bytes',
                    latestBackup: null,
                    oldestBackup: null
                };
            }

            const totalSize = backupFiles.reduce((sum, file) => sum + file.size, 0);
            const latestBackup = backupFiles[0];
            const oldestBackup = backupFiles[backupFiles.length - 1];

            return {
                totalBackups: backupFiles.length,
                totalSize: this.formatBytes(totalSize),
                latestBackup: latestBackup.name,
                oldestBackup: oldestBackup.name,
                files: backupFiles
            };
        } catch (error) {
            console.log(pc.yellow(`⚠️ Failed to get backup stats: ${error.message}`));
            return null;
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async validateBackupFile(filePath) {
        try {
            const stats = await stat(filePath);
            
            if (stats.size === 0) {
                throw new Error('Backup file is empty');
            }

            // Stream checking: Only read first 1KB of the dump file to verify the header
            const stream = createReadStream(filePath, { start: 0, end: 1024, encoding: 'utf8' });
            let headText = '';
            for await (const chunk of stream) {
                headText += chunk;
                if (headText.length >= 1024) break;
            }

            const isSqlDump = headText.includes('-- MySQL dump') || 
                              headText.includes('CREATE TABLE') || 
                              headText.includes('-- MariaDB dump');

            if (!isSqlDump) {
                throw new Error('Backup file does not appear to be a valid MySQL/MariaDB dump');
            }

            return {
                valid: true,
                size: stats.size,
                path: filePath
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }

    async compressBackup(filePath) {
        // Optional: Add compression functionality using zlib in future
        return filePath;
    }
}