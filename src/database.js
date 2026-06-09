import mysql from 'mysql2/promise';
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import pc from 'picocolors';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default class DatabaseManager {
    constructor(config) {
        this.config = config;
        this.connection = null;
    }

    async connect() {
        try {
            this.connection = await mysql.createConnection({
                host: this.config.host,
                port: this.config.port,
                user: this.config.user,
                password: this.config.password,
                database: this.config.database
            });
            
            console.log(pc.green('✅ Database connection established successfully'));
            return true;
        } catch (error) {
            console.log(pc.red(`❌ Database connection failed: ${error.message}`));
            return false;
        }
    }

    async testConnection() {
        try {
            if (!this.connection) return false;
            await this.connection.ping();
            return true;
        } catch (error) {
            console.log(pc.red(`❌ Database connection test failed: ${error.message}`));
            return false;
        }
    }

    async createBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const backupFileName = `backup_${this.config.database}_${timestamp}.sql`;
        const backupPath = path.join(__dirname, '..', 'backups', backupFileName);
        
        // Ensure backups directory exists
        await mkdir(path.dirname(backupPath), { recursive: true });
        
        console.log(pc.yellow('🔄 Creating database backup...'));
        
        const mysqldumpPath = this.findMysqldumpPath();
        if (!mysqldumpPath) {
            throw new Error('mysqldump not found. Please ensure MySQL is installed and in PATH.');
        }

        // Use environment variable for password to avoid interactive prompt
        const env = {
            ...process.env
        };
        
        if (this.config.password) {
            env.MYSQL_PWD = this.config.password;
        }

        const args = [
            '-h', this.config.host,
            '-P', this.config.port.toString(),
            '-u', this.config.user,
            '--single-transaction',
            '--routines',
            '--triggers',
            '--no-tablespaces',
            this.config.database
        ];

        return new Promise((resolve, reject) => {
            const mysqldump = spawn(mysqldumpPath, args, { env });
            const writeStream = createWriteStream(backupPath);

            mysqldump.stdout.pipe(writeStream);

            let errorOutput = '';
            mysqldump.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            mysqldump.on('close', (code) => {
                if (code === 0) {
                    console.log(pc.green('✅ Database backup created successfully'));
                    resolve(backupPath);
                } else {
                    reject(new Error(`mysqldump failed with code ${code}: ${errorOutput}`));
                }
            });

            mysqldump.on('error', (error) => {
                reject(new Error(`Failed to start mysqldump: ${error.message}`));
            });
        });
    }

    findMysqldumpPath() {
        const possiblePaths = [
            'mysqldump',
            'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe',
            'C:\\Program Files\\MySQL\\MySQL Server 5.7\\bin\\mysqldump.exe',
            'C:\\xampp\\mysql\\bin\\mysqldump.exe',
            'C:\\wamp64\\bin\\mysql\\mysql8.0.31\\bin\\mysqldump.exe'
        ];

        for (const cmdPath of possiblePaths) {
            try {
                execSync(`"${cmdPath}" --version`, { stdio: 'ignore' });
                return cmdPath;
            } catch (error) {
                continue;
            }
        }
        return null;
    }

    async close() {
        if (this.connection) {
            try {
                await this.connection.end();
                console.log(pc.blue('🔌 Database connection closed'));
            } catch (error) {
                // Ignore failure if already closed
            }
            this.connection = null;
        }
    }
}