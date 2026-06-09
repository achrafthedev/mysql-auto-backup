import pc from 'picocolors';

export default class DiscordNotifier {
    constructor(webhookUrl) {
        this.webhookUrl = webhookUrl;
    }

    async sendBackupNotification(backupInfo) {
        try {
            console.log(pc.yellow('📨 Sending Discord notification...'));
            
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
                        value: backupInfo.fileName || 'N/A',
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

            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                console.log(pc.green('✅ Discord notification sent successfully'));
                return true;
            } else {
                throw new Error(`Discord API returned status ${response.status}`);
            }
        } catch (error) {
            console.log(pc.red(`❌ Failed to send Discord notification: ${error.message}`));
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

            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                console.log(pc.green('✅ Startup notification sent to Discord'));
            } else {
                console.log(pc.yellow(`⚠️ Failed to send startup notification: Discord API status ${response.status}`));
            }
        } catch (error) {
            console.log(pc.yellow(`⚠️ Failed to send startup notification: ${error.message}`));
        }
    }

    async testWebhook() {
        try {
            console.log(pc.yellow('🔄 Testing Discord webhook...'));
            
            const testPayload = {
                username: "BitoraBackup Bot",
                content: "🧪 **Test Message** - BitoraBackup bot webhook is working correctly!"
            };

            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testPayload)
            });
            
            if (response.ok) {
                console.log(pc.green('✅ Discord webhook test successful'));
                return true;
            }
            return false;
        } catch (error) {
            console.log(pc.red(`❌ Discord webhook test failed: ${error.message}`));
            return false;
        }
    }
}