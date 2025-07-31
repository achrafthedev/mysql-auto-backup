const axios = require('axios');
const colors = require('colors');

class DiscordNotifier {
    constructor(webhookUrl) {
        this.webhookUrl = webhookUrl;
    }

    async sendBackupNotification(backupInfo) {
        try {
            console.log('📨 Sending Discord notification...'.yellow);
            
            const embed = {
                title: "🚀 BitoraBackup - Database Backup Complete",
                color: backupInfo.success ? 0x00ff00 : 0xff0000,
                timestamp: new Date().toISOString(),
                fields: [
                    {
                        name: "📊 Database",
                        value: backupInfo.database,
                        inline: true
                    },
                    {
                        name: "⏰ Backup Time",
                        value: new Date().toLocaleString(),
                        inline: true
                    },
                    {
                        name: "📁 File Name",
                        value: backupInfo.fileName,
                        inline: true
                    }
                ],
                footer: {
                    text: "BitoraBackup Bot",
                    icon_url: "https://cdn.discordapp.com/attachments/1234567890/BitoraBackup-icon.png"
                }
            };

            if (backupInfo.success) {
                embed.description = "✅ **Backup completed successfully!**";
                embed.fields.push({
                    name: "🔗 Download Link",
                    value: `[Click here to download](${backupInfo.downloadLink})`,
                    inline: false
                });
            } else {
                embed.description = "❌ **Backup failed!**";
                embed.fields.push({
                    name: "❌ Error",
                    value: backupInfo.error || "Unknown error occurred",
                    inline: false
                });
            }

            const payload = {
                username: "BitoraBackup Bot",
                avatar_url: "https://cdn.discordapp.com/attachments/1234567890/BitoraBackup-icon.png",
                embeds: [embed]
            };

            const response = await axios.post(this.webhookUrl, payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 204) {
                console.log('✅ Discord notification sent successfully'.green);
                return true;
            } else {
                throw new Error(`Discord API returned status ${response.status}`);
            }
        } catch (error) {
            console.log('❌ Failed to send Discord notification:'.red, error.message);
            return false;
        }
    }

    async sendStartupNotification(dbConfig) {
        try {
            const embed = {
                title: "🚀 BitoraBackup Bot Started",
                description: "Bot is now running and monitoring database backups",
                color: 0x0099ff,
                timestamp: new Date().toISOString(),
                fields: [
                    {
                        name: "📊 Database",
                        value: `${dbConfig.database} @ ${dbConfig.host}:${dbConfig.port}`,
                        inline: false
                    },
                    {
                        name: "⏰ Backup Schedule",
                        value: "Every 12 hours",
                        inline: true
                    },
                    {
                        name: "🟢 Status",
                        value: "Active",
                        inline: true
                    }
                ],
                footer: {
                    text: "BitoraBackup Bot",
                    icon_url: "https://cdn.discordapp.com/attachments/1234567890/BitoraBackup-icon.png"
                }
            };

            const payload = {
                username: "BitoraBackup Bot",
                avatar_url: "https://cdn.discordapp.com/attachments/1234567890/BitoraBackup-icon.png",
                embeds: [embed]
            };

            await axios.post(this.webhookUrl, payload);
            console.log('✅ Startup notification sent to Discord'.green);
        } catch (error) {
            console.log('⚠️ Failed to send startup notification:'.yellow, error.message);
        }
    }

    async testWebhook() {
        try {
            console.log('🔄 Testing Discord webhook...'.yellow);
            
            const testPayload = {
                username: "BitoraBackup Bot",
                content: "🧪 **Test Message** - BitoraBackup bot webhook is working correctly!"
            };

            const response = await axios.post(this.webhookUrl, testPayload);
            
            if (response.status === 204) {
                console.log('✅ Discord webhook test successful'.green);
                return true;
            }
            return false;
        } catch (error) {
            console.log('❌ Discord webhook test failed:'.red, error.message);
            return false;
        }
    }
}

module.exports = DiscordNotifier;