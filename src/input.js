import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import pc from 'picocolors';

export default class InputHandler {
    constructor() {
        this.rl = readline.createInterface({
            input,
            output
        });
    }

    async question(query) {
        return this.rl.question(query);
    }

    async getDatabaseConfig() {
        console.log(pc.cyan(pc.bold('\n🔧 Database Configuration Setup')));
        console.log(pc.cyan('═'.repeat(40)));
        
        const config = {};
        
        config.host = await this.question(pc.yellow('📊 Database Host (default: localhost): ')) || 'localhost';
        
        const portInput = await this.question(pc.yellow('🔌 Database Port (default: 3306): '));
        config.port = parseInt(portInput, 10) || 3306;
        
        config.user = await this.question(pc.yellow('👤 Database Username: '));
        config.password = await this.question(pc.yellow('🔐 Database Password (leave empty if none): ')) || '';
        config.database = await this.question(pc.yellow('🗄️  Database Name: '));

        return config;
    }

    async getDiscordConfig() {
        console.log(pc.cyan(pc.bold('\n🎮 Discord Configuration Setup')));
        console.log(pc.cyan('═'.repeat(40)));
        
        const webhookUrl = await this.question(pc.yellow('🔗 Discord Webhook URL: '));
        
        return { webhookUrl };
    }

    async getGoFileConfig() {
        console.log(pc.cyan(pc.bold('\n🔗 GoFile.io Configuration Setup')));
        console.log(pc.cyan('═'.repeat(40)));
        
        console.log(pc.blue('ℹ️  GoFile.io API Token Information:'));
        console.log(pc.white('   • Get your API token from: https://gofile.io/myProfile'));
        console.log(pc.white('   • Free accounts can upload files but with limitations'));
        console.log(pc.white('   • Premium accounts get full API access and features'));
        console.log(pc.white('   • You can leave this blank to use guest uploads'));
        
        const apiToken = await this.question(pc.yellow('🔑 GoFile.io API Token (optional): '));
        
        return { 
            apiToken: apiToken || null,
            deleteAfterDays: 30
        };
    }

    async getBackupConfig() {
        console.log(pc.cyan(pc.bold('\n⚙️  Backup Configuration Setup')));
        console.log(pc.cyan('═'.repeat(40)));
        
        console.log(pc.blue('⏰ Schedule options:'));
        console.log(pc.white('  1. Every 12 hours (default)'));
        console.log(pc.white('  2. Every 6 hours'));
        console.log(pc.white('  3. Every 24 hours'));
        console.log(pc.white('  4. Custom cron expression'));
        
        const scheduleChoice = await this.question(pc.yellow('Choose schedule (1-4, default: 1): ')) || '1';
        
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
                schedule = await this.question(pc.yellow('Enter cron expression: '));
                break;
            default:
                schedule = '0 */12 * * *';
        }

        const maxBackupsInput = await this.question(pc.yellow('📦 Maximum backups to keep (default: 10): '));
        const maxBackups = parseInt(maxBackupsInput, 10) || 10;

        const cleanupInput = await this.question(pc.yellow('🧹 Auto cleanup old backups? (y/N): '));
        const cleanupOldBackups = cleanupInput.toLowerCase() === 'y';

        return {
            schedule,
            maxBackups,
            cleanupOldBackups
        };
    }

    async confirmConfig(config) {
        console.log(pc.cyan(pc.bold('\n📋 Configuration Summary')));
        console.log(pc.cyan('═'.repeat(50)));
        
        console.log(pc.yellow(pc.bold('Database:')));
        console.log(pc.white(`  Host: ${config.database.host}:${config.database.port}`));
        console.log(pc.white(`  User: ${config.database.user}`));
        console.log(pc.white(`  Database: ${config.database.database}`));
        
        console.log(pc.yellow(pc.bold('\nDiscord:')));
        console.log(pc.white(`  Webhook: ${config.discord.webhookUrl.substring(0, 50)}...`));
        
        console.log(pc.yellow(pc.bold('\nGoFile.io:')));
        if (config.gofile.apiToken) {
            console.log(pc.white(`  API Token: ${config.gofile.apiToken.substring(0, 8)}...`));
            console.log(pc.green(`  Account Type: Premium/Authenticated`));
        } else {
            console.log(pc.gray(`  API Token: Not provided (Guest uploads)`));
            console.log(pc.yellow(`  Account Type: Guest`));
        }
        
        console.log(pc.yellow(pc.bold('\nBackup:')));
        console.log(pc.white(`  Schedule: ${config.backup.schedule}`));
        console.log(pc.white(`  Max Backups: ${config.backup.maxBackups}`));
        console.log(pc.white(`  Auto Cleanup: ${config.backup.cleanupOldBackups}`));
        
        const confirmation = await this.question(pc.green('\n✅ Confirm configuration? (Y/n): '));
        return confirmation.toLowerCase() !== 'n';
    }

    close() {
        this.rl.close();
    }

    async waitForEnter(message = 'Press Enter to continue...') {
        await this.question(pc.gray(`\n${message}`));
    }
}