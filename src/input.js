const readline = require('readline');
const colors = require('colors');

class InputHandler {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    question(query) {
        return new Promise((resolve) => {
            this.rl.question(query, resolve);
        });
    }

    async getDatabaseConfig() {
        console.log('\n🔧 Database Configuration Setup'.cyan.bold);
        console.log('═'.repeat(40).cyan);
        
        const config = {};
        
        config.host = await this.question('📊 Database Host (default: localhost): '.yellow) || 'localhost';
        
        const portInput = await this.question('🔌 Database Port (default: 3306): '.yellow);
        config.port = parseInt(portInput) || 3306;
        
        config.user = await this.question('👤 Database Username: '.yellow);
        config.password = await this.question('🔐 Database Password (leave empty if none): '.yellow) || '';
        config.database = await this.question('🗄️  Database Name: '.yellow);

        return config;
    }

    async getDiscordConfig() {
        console.log('\n🎮 Discord Configuration Setup'.cyan.bold);
        console.log('═'.repeat(40).cyan);
        
        const webhookUrl = await this.question('🔗 Discord Webhook URL: '.yellow);
        
        return { webhookUrl };
    }

    async getGoFileConfig() {
        console.log('\n🔗 GoFile.io Configuration Setup'.cyan.bold);
        console.log('═'.repeat(40).cyan);
        
        console.log('ℹ️  GoFile.io API Token Information:'.blue);
        console.log('   • Get your API token from: https://gofile.io/myProfile'.white);
        console.log('   • Free accounts can upload files but with limitations'.white);
        console.log('   • Premium accounts get full API access and features'.white);
        console.log('   • You can leave this blank to use guest uploads'.white);
        
        const apiToken = await this.question('🔑 GoFile.io API Token (optional): '.yellow);
        
        return { 
            apiToken: apiToken || null,
            deleteAfterDays: 30
        };
    }

    async getBackupConfig() {
        console.log('\n⚙️  Backup Configuration Setup'.cyan.bold);
        console.log('═'.repeat(40).cyan);
        
        console.log('⏰ Schedule options:'.blue);
        console.log('  1. Every 12 hours (default)'.white);
        console.log('  2. Every 6 hours'.white);
        console.log('  3. Every 24 hours'.white);
        console.log('  4. Custom cron expression'.white);
        
        const scheduleChoice = await this.question('Choose schedule (1-4, default: 1): '.yellow) || '1';
        
        let schedule;
        switch (scheduleChoice) {
            case '1':
                schedule = '0 */12 * * *';
                break;
            case '2':
                schedule = '0 */6 * * *';
                break;
            case '3':
                schedule = '0 0 * * *';
                break;
            case '4':
                schedule = await this.question('Enter cron expression: '.yellow);
                break;
            default:
                schedule = '0 */12 * * *';
        }

        const maxBackupsInput = await this.question('📦 Maximum backups to keep (default: 10): '.yellow);
        const maxBackups = parseInt(maxBackupsInput) || 10;

        const cleanupInput = await this.question('🧹 Auto cleanup old backups? (y/N): '.yellow);
        const cleanupOldBackups = cleanupInput.toLowerCase() === 'y';

        return {
            schedule,
            maxBackups,
            cleanupOldBackups
        };
    }

    async confirmConfig(config) {
        console.log('\n📋 Configuration Summary'.cyan.bold);
        console.log('═'.repeat(50).cyan);
        
        console.log('Database:'.yellow.bold);
        console.log(`  Host: ${config.database.host}:${config.database.port}`.white);
        console.log(`  User: ${config.database.user}`.white);
        console.log(`  Database: ${config.database.database}`.white);
        
        console.log('\nDiscord:'.yellow.bold);
        console.log(`  Webhook: ${config.discord.webhookUrl.substring(0, 50)}...`.white);
        
        console.log('\nGoFile.io:'.yellow.bold);
        if (config.gofile.apiToken) {
            console.log(`  API Token: ${config.gofile.apiToken.substring(0, 8)}...`.white);
            console.log(`  Account Type: Premium/Authenticated`.green);
        } else {
            console.log(`  API Token: Not provided (Guest uploads)`.gray);
            console.log(`  Account Type: Guest`.yellow);
        }
        
        console.log('\nBackup:'.yellow.bold);
        console.log(`  Schedule: ${config.backup.schedule}`.white);
        console.log(`  Max Backups: ${config.backup.maxBackups}`.white);
        console.log(`  Auto Cleanup: ${config.backup.cleanupOldBackups}`.white);
        
        const confirmation = await this.question('\n✅ Confirm configuration? (Y/n): '.green);
        return confirmation.toLowerCase() !== 'n';
    }

    close() {
        this.rl.close();
    }

    async waitForEnter(message = 'Press Enter to continue...') {
        await this.question(`\n${message}`.gray);
    }
}

module.exports = InputHandler;