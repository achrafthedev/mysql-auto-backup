const cron = require('node-cron');
const path = require('path');
const colors = require('colors');
const moment = require('moment');

// Import all modules
const DatabaseManager = require('./database');
const GoFileUploader = require('./gofile');
const DiscordNotifier = require('./discord');
const ConfigManager = require('./config');
const InputHandler = require('./input');
const BackupManager = require('./backup');

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
                console.log('🔧 No configuration found. Starting setup...'.yellow);
                await this.setupConfiguration();
            } else {
                console.log('✅ Configuration loaded successfully'.green);
                
                // Validate existing config
                try {
                    this.configManager.validateConfig(this.config);
                } catch (error) {
                    console.log('⚠️ Configuration validation failed:'.yellow, error.message);
                    console.log('🔧 Please reconfigure the application'.yellow);
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
            
            console.log('\n🚀 Starting BitoraBackup Bot...'.cyan.bold);
            
            // Send startup notification
            await this.discord.sendStartupNotification(this.config.database);
            
            // Start the scheduler
            this.startScheduler();
            
            // Keep the process running
            this.keepAlive();
            
        } catch (error) {
            console.log('❌ Initialization failed:'.red, error.message);
            process.exit(1);
        }
    }

    printBanner() {
        console.log(`
${'╔══════════════════════════════════════════════╗'.cyan}
${'║'.cyan}            🚀 ${'BitoraBackup Bot'.white.bold}               ${'║'.cyan}
${'║'.cyan}        ${'Automated MySQL Backup System'.gray}        ${'║'.cyan}
${'║'.cyan}     ${'with GoFile Upload & Discord Alerts'.gray}     ${'║'.cyan}
${'╚══════════════════════════════════════════════╝'.cyan}
`);
    }

    async setupConfiguration() {
        try {
            console.log('\n🎯 Welcome to BitoraBackup Configuration Setup'.cyan.bold);
            
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
                console.log('❌ Configuration cancelled. Exiting...'.red);
                process.exit(0);
            }
            
            // Save configuration
            await this.configManager.saveConfig(config);
            this.config = config;
            
            console.log('✅ Configuration setup completed successfully!'.green);
            
        } catch (error) {
            console.log('❌ Configuration setup failed:'.red, error.message);
            process.exit(1);
        }
    }

    async testConnections() {
        console.log('\n🔍 Testing connections...'.yellow);
        
        // Test database connection
        const dbConnected = await this.dbManager.connect();
        if (!dbConnected) {
            throw new Error('Database connection failed');
        }
        
        // Test Discord webhook
        const discordWorking = await this.discord.testWebhook();
        if (!discordWorking) {
            console.log('⚠️ Discord webhook test failed, but continuing...'.yellow);
        }
        
        console.log('✅ Connection tests completed'.green);
    }
    startScheduler() {
        try {
            console.log(`⏰ Setting up backup schedule: ${this.config.backup.schedule}`.blue);
            
            this.cronJob = cron.schedule(this.config.backup.schedule, async () => {
                await this.performBackup();
            }, {
                scheduled: true,
                timezone: "America/New_York"
            });
            
            console.log('✅ Backup scheduler started successfully'.green);
            
            // Perform initial backup
            setTimeout(async () => {
                console.log('🔄 Performing initial backup...'.yellow);
                await this.performBackup();
            }, 5000);
            
        } catch (error) {
            console.log('❌ Failed to start scheduler:'.red, error.message);
            throw error;
        }
    }

    async performBackup() {
        if (this.isRunning) {
            console.log('⚠️ Backup already in progress, skipping...'.yellow);
            return;
        }

        this.isRunning = true;
        const startTime = moment();
        
        console.log(`\n${'='.repeat(60)}`.cyan);
        console.log(`🔄 Starting backup process at ${startTime.format('YYYY-MM-DD HH:mm:ss')}`.cyan.bold);
        console.log(`${'='.repeat(60)}`.cyan);

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

            backupInfo.fileName = require('path').basename(backupPath);
            
            // Upload to GoFile
            const uploadResult = await this.uploader.uploadFile(backupPath);
            
            if (uploadResult.success) {
                backupInfo.success = true;
                backupInfo.downloadLink = uploadResult.downloadLink;
                
                console.log('🎉 Backup process completed successfully!'.green.bold);
                
                // Cleanup old backups if enabled
                if (this.config.backup.cleanupOldBackups) {
                    await this.backupManager.cleanupOldBackups(this.config.backup.maxBackups);
                }
                
            } else {
                throw new Error(`Upload failed: ${uploadResult.error}`);
            }

        } catch (error) {
            console.log('❌ Backup process failed:'.red, error.message);
            backupInfo.error = error.message;
        }

        // Send Discord notification
        await this.discord.sendBackupNotification(backupInfo);
        
        const endTime = moment();
        const duration = moment.duration(endTime.diff(startTime));
        
        console.log(`⏱️ Backup process completed in ${duration.humanize()}`.blue);
        console.log(`${'='.repeat(60)}`.cyan);
        
        this.isRunning = false;

        // Check if running directly (not with PM2) and auto-start with PM2
        await this.autoStartWithPM2();
    }

    keepAlive() {
        console.log('\n🟢 BitoraBackup Bot is now running in the background'.green.bold);
        console.log('📅 Next backup scheduled for:'.blue, this.getNextBackupTime());
        console.log('📊 Use Ctrl+C to stop the bot'.gray);
        
        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n🛑 Shutting down BitoraBackup Bot...'.yellow);
            
            if (this.cronJob) {
                this.cronJob.stop();
                console.log('⏰ Scheduler stopped'.blue);
            }
            
            if (this.dbManager) {
                await this.dbManager.close();
            }
            
            if (this.inputHandler) {
                this.inputHandler.close();
            }
            
            console.log('👋 BitoraBackup Bot stopped successfully'.green);
            process.exit(0);
        });

        // Keep process alive
        setInterval(() => {
            // This keeps the process running
        }, 1000);
    }

    getNextBackupTime() {
        try {
            const cronParser = require('node-cron');
            // This is a simplified way to show next run time
            return 'Next scheduled backup according to cron schedule';
        } catch (error) {
            return 'Unable to determine next backup time';
        }
    }

    async getStatus() {
        const stats = await this.backupManager.getBackupStats();
        
        console.log('\n📊 BitoraBackup Status'.cyan.bold);
        console.log('═'.repeat(40).cyan);
        
        if (stats) {
            console.log(`Total Backups: ${stats.totalBackups}`.white);
            console.log(`Total Size: ${stats.totalSize}`.white);
            console.log(`Latest Backup: ${stats.latestBackup || 'None'}`.white);
            console.log(`Oldest Backup: ${stats.oldestBackup || 'None'}`.white);
        }
        
        console.log(`Database: ${this.config.database.database}`.white);
        console.log(`Schedule: ${this.config.backup.schedule}`.white);
        console.log(`Status: ${this.isRunning ? 'Running' : 'Idle'}`.white);
    }

    async autoStartWithPM2() {
        try {
            // Check if we're already running under PM2
            if (process.env.PM2_HOME || process.env.pm_id !== undefined) {
                console.log('ℹ️ Already running with PM2, skipping auto-start'.blue);
                return;
            }

            // Check if PM2 is available
            const { spawn } = require('child_process');
            
            console.log('\n🔄 Checking if PM2 is available...'.yellow);
            
            const pm2Check = spawn('pm2', ['--version'], { shell: true });
            
            pm2Check.on('close', async (code) => {
                if (code === 0) {
                    console.log('✅ PM2 is available, starting with PM2...'.green);
                    
                    // Check if already running in PM2
                    const pm2List = spawn('pm2', ['list', 'BitoraBackup'], { shell: true });
                    let pm2Output = '';
                    
                    pm2List.stdout.on('data', (data) => {
                        pm2Output += data.toString();
                    });
                    
                    pm2List.on('close', (listCode) => {
                        if (!pm2Output.includes('BitoraBackup') || pm2Output.includes('stopped')) {
                            console.log('🚀 Starting BitoraBackup with PM2 in 5 seconds...'.cyan);
                            console.log('📝 This will run the application in the background'.gray);
                            console.log('🎮 Use run.bat to manage the application'.gray);
                            
                            setTimeout(() => {
                                const pm2Start = spawn('pm2', ['start', 'ecosystem.config.js'], { 
                                    shell: true,
                                    detached: true,
                                    stdio: 'ignore'
                                });
                                
                                pm2Start.unref();
                                
                                setTimeout(() => {
                                    console.log('\n✅ BitoraBackup started with PM2!'.green.bold);
                                    console.log('🎮 Use run.bat for management or pm2 logs BitoraBackup for logs'.cyan);
                                    process.exit(0);
                                }, 2000);
                                
                            }, 5000);
                        } else {
                            console.log('ℹ️ BitoraBackup already running with PM2'.blue);
                        }
                    });
                } else {
                    console.log('⚠️ PM2 not available, continuing with direct execution'.yellow);
                }
            });

        } catch (error) {
            console.log('⚠️ Auto-start with PM2 failed:'.yellow, error.message);
            console.log('ℹ️ Continuing with direct execution'.blue);
        }
    }
}

// Start the application
const app = new BitoraBackup();

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.log('❌ Unhandled Rejection at:'.red, promise, 'reason:'.red, reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.log('❌ Uncaught Exception:'.red, error.message);
    process.exit(1);
});

// Initialize and start the application
app.initialize().catch((error) => {
    console.log('❌ Application failed to start:'.red, error.message);
    process.exit(1);
});

module.exports = BitoraBackup;