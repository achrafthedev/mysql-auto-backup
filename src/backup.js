const fs = require('fs-extra');
const path = require('path');
const colors = require('colors');

class BackupManager {
    constructor(backupDir) {
        this.backupDir = backupDir;
    }

    async ensureBackupDirectory() {
        try {
            await fs.ensureDir(this.backupDir);
            console.log('📁 Backup directory ensured'.blue);
        } catch (error) {
            console.log('❌ Failed to create backup directory:'.red, error.message);
            throw error;
        }
    }

    async getBackupFiles() {
        try {
            const files = await fs.readdir(this.backupDir);
            const backupFiles = files
                .filter(file => file.endsWith('.sql'))
                .map(file => {
                    const filePath = path.join(this.backupDir, file);
                    const stats = fs.statSync(filePath);
                    return {
                        name: file,
                        path: filePath,
                        size: stats.size,
                        created: stats.birthtime,
                        modified: stats.mtime
                    };
                })
                .sort((a, b) => b.created - a.created);

            return backupFiles;
        } catch (error) {
            console.log('⚠️ Failed to get backup files:'.yellow, error.message);
            return [];
        }
    }

    async cleanupOldBackups(maxBackups = 10) {
        try {
            const backupFiles = await this.getBackupFiles();
            
            if (backupFiles.length > maxBackups) {
                const filesToDelete = backupFiles.slice(maxBackups);
                
                console.log(`🧹 Cleaning up ${filesToDelete.length} old backup(s)...`.yellow);
                
                for (const file of filesToDelete) {
                    await fs.remove(file.path);
                    console.log(`🗑️ Deleted: ${file.name}`.gray);
                }
                
                console.log('✅ Backup cleanup completed'.green);
            }
        } catch (error) {
            console.log('⚠️ Failed to cleanup old backups:'.yellow, error.message);
        }
    }

    async getBackupStats() {
        try {
            const backupFiles = await this.getBackupFiles();
            
            if (backupFiles.length === 0) {
                return {
                    totalBackups: 0,
                    totalSize: 0,
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
            console.log('⚠️ Failed to get backup stats:'.yellow, error.message);
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
            const stats = await fs.stat(filePath);
            
            if (stats.size === 0) {
                throw new Error('Backup file is empty');
            }

            const content = await fs.readFile(filePath, 'utf8');
            
            if (!content.includes('-- MySQL dump') && !content.includes('CREATE TABLE')) {
                throw new Error('Backup file does not appear to be a valid MySQL dump');
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
        // Optional: Add compression functionality using zlib
        // For now, we'll just return the original file path
        return filePath;
    }
}

module.exports = BackupManager;