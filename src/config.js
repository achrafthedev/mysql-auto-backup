import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pc from 'picocolors';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default class ConfigManager {
    constructor() {
        this.configPath = path.join(__dirname, '..', 'config.json');
    }

    async loadConfig() {
        try {
            const data = await readFile(this.configPath, 'utf8');
            const config = JSON.parse(data);
            return config;
        } catch (error) {
            if (error.code === 'ENOENT') {
                return null;
            }
            console.log(pc.yellow(`⚠️ Failed to load configuration: ${error.message}`));
            return null;
        }
    }

    async saveConfig(config) {
        try {
            await writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf8');
            console.log(pc.green('✅ Configuration saved successfully'));
            return true;
        } catch (error) {
            console.log(pc.red(`❌ Failed to save configuration: ${error.message}`));
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
        if (!Object.prototype.hasOwnProperty.call(config.database, 'password')) {
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