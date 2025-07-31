const fs = require('fs-extra');
const path = require('path');
const colors = require('colors');

class ConfigManager {
    constructor() {
        this.configPath = path.join(__dirname, '..', 'config.json');
    }

    async loadConfig() {
        try {
            if (await fs.pathExists(this.configPath)) {
                const config = await fs.readJson(this.configPath);
                console.log('✅ Configuration loaded successfully'.green);
                return config;
            }
            return null;
        } catch (error) {
            console.log('⚠️ Failed to load configuration:'.yellow, error.message);
            return null;
        }
    }

    async saveConfig(config) {
        try {
            await fs.writeJson(this.configPath, config, { spaces: 2 });
            console.log('✅ Configuration saved successfully'.green);
            return true;
        } catch (error) {
            console.log('❌ Failed to save configuration:'.red, error.message);
            return false;
        }
    }

    validateConfig(config) {
        const required = ['database', 'discord', 'gofile'];
        const dbRequired = ['host', 'port', 'user', 'database'];
        const discordRequired = ['webhookUrl'];

        for (const field of required) {
            if (!config[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        for (const field of dbRequired) {
            if (config.database[field] === undefined || config.database[field] === null) {
                throw new Error(`Missing required database field: ${field}`);
            }
        }

        // Password can be empty string, but must exist as a property
        if (!config.database.hasOwnProperty('password')) {
            throw new Error('Missing required database field: password');
        }

        for (const field of discordRequired) {
            if (!config.discord[field]) {
                throw new Error(`Missing required discord field: ${field}`);
            }
        }

        // GoFile validation - apiToken is optional
        if (!config.gofile) {
            throw new Error('Missing gofile configuration');
        }

        return true;
    }

    getDefaultConfig() {
        return {
            database: {
                host: 'localhost',
                port: 3306,
                user: 'root',
                password: '', // Can be empty for databases without password
                database: 'your_database'
            },
            discord: {
                webhookUrl: 'https://discord.com/api/webhooks/YOUR_WEBHOOK_URL'
            },
            backup: {
                schedule: '0 */12 * * *', // Every 12 hours
                maxBackups: 10,
                cleanupOldBackups: true
            },
            gofile: {
                apiToken: null,
                deleteAfterDays: 30
            }
        };
    }
}

module.exports = ConfigManager;