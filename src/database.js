const mysql = require('mysql2/promise');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const colors = require('colors');

class DatabaseManager {
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
            
            console.log('✅ Database connection established successfully'.green);
            return true;
        } catch (error) {
            console.log('❌ Database connection failed:'.red, error.message);
            return false;
        }
    }

    async testConnection() {
        try {
            await this.connection.ping();
            return true;
        } catch (error) {
            console.log('❌ Database connection test failed:'.red, error.message);
            return false;
        }
    }

    async createBackup() {
        return new Promise((resolve, reject) => {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const backupFileName = `backup_${this.config.database}_${timestamp}.sql`;
            const backupPath = path.join(__dirname, '..', 'backups', backupFileName);
            
            // Ensure backups directory exists
            fs.ensureDirSync(path.dirname(backupPath));
            
            console.log('🔄 Creating database backup...'.yellow);
            
            const mysqldumpPath = this.findMysqldumpPath();
            if (!mysqldumpPath) {
                reject(new Error('mysqldump not found. Please ensure MySQL is installed and in PATH.'));
                return;
            }

            // Use environment variable for password to avoid interactive prompt
            // Handle empty password case
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

            const mysqldump = spawn(mysqldumpPath, args, { env });
            const writeStream = fs.createWriteStream(backupPath);

            mysqldump.stdout.pipe(writeStream);

            let errorOutput = '';
            mysqldump.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            mysqldump.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ Database backup created successfully'.green);
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
                require('child_process').execSync(`"${cmdPath}" --version`, { stdio: 'ignore' });
                return cmdPath;
            } catch (error) {
                continue;
            }
        }
        return null;
    }

    async close() {
        if (this.connection) {
            await this.connection.end();
            console.log('🔌 Database connection closed'.blue);
        }
    }
}

module.exports = DatabaseManager;