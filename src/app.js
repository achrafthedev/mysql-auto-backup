import cron from 'node-cron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import pc from 'picocolors';

// Import all modules
import DatabaseManager from './database.js';
import GoFileUploader from './gofile.js';
import DiscordNotifier from './discord.js';
import ConfigManager from './config.js';
import InputHandler from './input.js';
import BackupManager from './backup.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function formatDate(date = new Date()) {
    const pad = (num) => String(num).padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    const sec = pad(date.getSeconds());
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${sec}`;
}

function formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    const seconds = ((ms / 1000) % 60).toFixed(1);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    
    return [
        hours > 0 ? `${hours}h` : '',
        minutes > 0 ? `${minutes}m` : '',
        `${seconds}s`
    ].filter(Boolean).join(' ');
}

class BitoraBackup {
    constructor() {
        this.config = null;
        this.dbManager = null;
        this.uploader = new GoFileUploader();
        this.discord = null;
        this.configManager = new ConfigManager();
        this.backupManager = new BackupManager(path.join(__dirname, '..', 'backups'));
        this.inputHandler = new InputHandler();
        this.cronJob = null;
        this.isRunning = false;
    }

    async initialize() {
        console.clear();
        this.printBanner();
        
        try {
            // Load existing config or create new one
            this.config = await this.configManager.loadConfig();
            
            if (!this.config) {
                console.log(pc.yellow('🔧 No configuration found. Starting setup...'));
                await this.setupConfiguration();
            } else {
                console.log(pc.green('✅ Configuration loaded successfully'));
                
                // Validate existing config
                try {
                    this.configManager.validateConfig(this.config);
                } catch (error) {
                    console.log(pc.yellow(`⚠️ Configuration validation failed: ${error.message}`));
                    console.log(pc.yellow('🔧 Please reconfigure the application'));
                    await this.setupConfiguration();
                }
            }

            // Initialize components
            this.dbManager = new DatabaseManager(this.config.database);
            this.uploader = new GoFileUploader(this.config.gofile?.apiToken);
            this.discord = new DiscordNotifier(this.config.discord.webhookUrl);
            
            // Test connections
            await this.testConnections();
            
            // Ensure backup directory
            await this.backupManager.ensureBackupDirectory();
            
            console.log(pc.cyan(pc.bold('\n🚀 Starting BitoraBackup Bot...')));
            
            // Send startup notification
            await this.discord.sendStartupNotification(this.config.database);
            
            // Start the scheduler
            this.startScheduler();
            
            // Keep the process running
            this.keepAlive();
            
        } catch (error) {
            console.log(pc.red(`❌ Initialization failed: ${error.message}`));
            process.exit(1);
        }
    }

    printBanner() {
        console.log(`
${pc.cyan('╔══════════════════════════════════════════════╗')}
${pc.cyan('║')}            🚀 ${pc.bold(pc.white('BitoraBackup Bot'))}               ${pc.cyan('║')}
${pc.cyan('║')}        ${pc.gray('Automated MySQL Backup System')}        ${pc.cyan('║')}
${pc.cyan('║')}     ${pc.gray('with GoFile Upload & Discord Alerts')}     ${pc.cyan('║')}
${pc.cyan('╚══════════════════════════════════════════════╝')}
`);
    }

    async setupConfiguration() {
        try {
            console.log(pc.cyan(pc.bold('\n🎯 Welcome to BitoraBackup Configuration Setup')));
            
            // Get database config
            const dbConfig = await this.inputHandler.getDatabaseConfig();
            
            // Get Discord config
            const discordConfig = await this.inputHandler.getDiscordConfig();
            
            // Get GoFile config
            const gofileConfig = await this.inputHandler.getGoFileConfig();
            
            // Get backup config
            const backupConfig = await this.inputHandler.getBackupConfig();
            
            // Create complete config object
            const config = {
                database: dbConfig,
                discord: discordConfig,
                gofile: gofileConfig,
                backup: backupConfig
            };
            
            // Confirm configuration
            const confirmed = await this.inputHandler.confirmConfig(config);
            
            if (!confirmed) {
                console.log(pc.red('❌ Configuration cancelled. Exiting...'));
                process.exit(0);
            }
            
            // Save configuration
            await this.configManager.saveConfig(config);
            this.config = config;
            
            console.log(pc.green('✅ Configuration setup completed successfully!'));
            
        } catch (error) {
            console.log(pc.red(`❌ Configuration setup failed: ${error.message}`));
            process.exit(1);
        }
    }

    async testConnections() {
        console.log(pc.yellow('\n🔍 Testing connections...'));
        
        // Test database connection
        const dbConnected = await this.dbManager.connect();
        if (!dbConnected) {
            throw new Error('Database connection failed');
        }
        
        // Test Discord webhook
        const discordWorking = await this.discord.testWebhook();
        if (!discordWorking) {
            console.log(pc.yellow('⚠️ Discord webhook test failed, but continuing...'));
        }
        
        console.log(pc.green('✅ Connection tests completed'));
    }

    startScheduler() {
        try {
            console.log(pc.blue(`⏰ Setting up backup schedule: ${this.config.backup.schedule}`));
            
            this.cronJob = cron.schedule(this.config.backup.schedule, async () => {
                await this.performBackup();
            }, {
                scheduled: true,
                timezone: "America/New_York"
            });
            
            console.log(pc.green('✅ Backup scheduler started successfully'));
            
            // Perform initial backup
            setTimeout(async () => {
                console.log(pc.yellow('🔄 Performing initial backup...'));
                await this.performBackup();
            }, 5000);
            
        } catch (error) {
            console.log(pc.red(`❌ Failed to start scheduler: ${error.message}`));
            throw error;
        }
    }

    async performBackup() {
        if (this.isRunning) {
            console.log(pc.yellow('⚠️ Backup already in progress, skipping...'));
            return;
        }

        this.isRunning = true;
        const startTime = Date.now();
        
        console.log(`\n${pc.cyan('='.repeat(60))}`);
        console.log(pc.cyan(pc.bold(`🔄 Starting backup process at ${formatDate(new Date(startTime))}`)));
        console.log(`${pc.cyan('='.repeat(60))}`);

        let backupInfo = {
            success: false,
            database: this.config.database.database,
            fileName: '',
            downloadLink: '',
            error: null
        };

        try {
            // Test database connection
            const isConnected = await this.dbManager.testConnection();
            if (!isConnected) {
                await this.dbManager.connect();
            }

            // Create database backup
            const backupPath = await this.dbManager.createBackup();
            
            // Validate backup file
            const validation = await this.backupManager.validateBackupFile(backupPath);
            if (!validation.valid) {
                throw new Error(`Backup validation failed: ${validation.error}`);
            }

            backupInfo.fileName = path.basename(backupPath);
            
            // Upload to GoFile
            const uploadResult = await this.uploader.uploadFile(backupPath);
            
            if (uploadResult.success) {
                backupInfo.success = true;
                backupInfo.downloadLink = uploadResult.downloadLink;
                
                console.log(pc.green(pc.bold('🎉 Backup process completed successfully!')));
                
                // Cleanup old backups if enabled
                if (this.config.backup.cleanupOldBackups) {
                    await this.backupManager.cleanupOldBackups(this.config.backup.maxBackups);
                }
                
            } else {
                throw new Error(`Upload failed: ${uploadResult.error}`);
            }

        } catch (error) {
            console.log(pc.red(`❌ Backup process failed: ${error.message}`));
            backupInfo.error = error.message;
        }

        // Send Discord notification
        await this.discord.sendBackupNotification(backupInfo);
        
        const duration = Date.now() - startTime;
        
        console.log(pc.blue(`⏱️ Backup process completed in ${formatDuration(duration)}`));
        console.log(`${pc.cyan('='.repeat(60))}`);
        
        this.isRunning = false;

        // Check if running directly (not with PM2) and auto-start with PM2
        await this.autoStartWithPM2();
    }

    keepAlive() {
        console.log(pc.green(pc.bold('\n🟢 BitoraBackup Bot is now running in the background')));
        console.log(pc.blue(`📅 Next backup scheduled for: ${this.getNextBackupTime()}`));
        console.log(pc.gray('📊 Use Ctrl+C to stop the bot'));
        
        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            console.log(pc.yellow('\n🛑 Shutting down BitoraBackup Bot...'));
            
            if (this.cronJob) {
                this.cronJob.stop();
                console.log(pc.blue('⏰ Scheduler stopped'));
            }
            
            if (this.dbManager) {
                await this.dbManager.close();
            }
            
            if (this.inputHandler) {
                this.inputHandler.close();
            }
            
            console.log(pc.green('👋 BitoraBackup Bot stopped successfully'));
            process.exit(0);
        });

        // Keep process alive
        setInterval(() => {
            // This keeps the process running
        }, 1000);
    }

    getNextBackupTime() {
        return `Cron schedule (${this.config.backup.schedule})`;
    }

    async getStatus() {
        const stats = await this.backupManager.getBackupStats();
        
        console.log(pc.cyan(pc.bold('\n📊 BitoraBackup Status')));
        console.log(pc.cyan('═'.repeat(40)));
        
        if (stats) {
            console.log(pc.white(`Total Backups: ${stats.totalBackups}`));
            console.log(pc.white(`Total Size: ${stats.totalSize}`));
            console.log(pc.white(`Latest Backup: ${stats.latestBackup || 'None'}`));
            console.log(pc.white(`Oldest Backup: ${stats.oldestBackup || 'None'}`));
        }
        
        console.log(pc.white(`Database: ${this.config.database.database}`));
        console.log(pc.white(`Schedule: ${this.config.backup.schedule}`));
        console.log(pc.white(`Status: ${this.isRunning ? 'Running' : 'Idle'}`));
    }

    async autoStartWithPM2() {
        try {
            // Check if we're already running under PM2
            if (process.env.PM2_HOME || process.env.pm_id !== undefined) {
                console.log(pc.blue('ℹ️ Already running with PM2, skipping auto-start'));
                return;
            }

            console.log(pc.yellow('\n🔄 Checking if PM2 is available...'));
            
            const pm2Check = spawn('pm2', ['--version'], { shell: true });
            
            pm2Check.on('close', async (code) => {
                if (code === 0) {
                    console.log(pc.green('✅ PM2 is available, starting with PM2...'));
                    
                    // Check if already running in PM2
                    const pm2List = spawn('pm2', ['list', 'BitoraBackup'], { shell: true });
                    let pm2Output = '';
                    
                    pm2List.stdout.on('data', (data) => {
                        pm2Output += data.toString();
                    });
                    
                    pm2List.on('close', (listCode) => {
                        if (!pm2Output.includes('BitoraBackup') || pm2Output.includes('stopped')) {
                            console.log(pc.cyan('🚀 Starting BitoraBackup with PM2 in 5 seconds...'));
                            console.log(pc.gray('📝 This will run the application in the background'));
                            console.log(pc.gray('🎮 Use run.bat to manage the application'));
                            
                            setTimeout(() => {
                                const pm2Start = spawn('pm2', ['start', 'ecosystem.config.cjs'], { 
                                    shell: true,
                                    detached: true,
                                    stdio: 'ignore'
                                });
                                
                                pm2Start.unref();
                                
                                setTimeout(() => {
                                    console.log(pc.green(pc.bold('\n✅ BitoraBackup started with PM2!')));
                                    console.log(pc.cyan('🎮 Use run.bat for management or pm2 logs BitoraBackup for logs'));
                                    process.exit(0);
                                }, 2000);
                                
                            }, 5000);
                        } else {
                            console.log(pc.blue('ℹ️ BitoraBackup already running with PM2'));
                        }
                    });
                } else {
                    console.log(pc.yellow('⚠️ PM2 not available, continuing with direct execution'));
                }
            });

        } catch (error) {
            console.log(pc.yellow(`⚠️ Auto-start with PM2 failed: ${error.message}`));
            console.log(pc.blue('ℹ️ Continuing with direct execution'));
        }
    }
}

// Start the application
const app = new BitoraBackup();

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.log(pc.red('❌ Unhandled Rejection at:'), promise, pc.red('reason:'), reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.log(pc.red(`❌ Uncaught Exception: ${error.message}`));
    process.exit(1);
});

// Initialize and start the application
app.initialize().catch((error) => {
    console.log(pc.red(`❌ Application failed to start: ${error.message}`));
    process.exit(1);
});

export default BitoraBackup;