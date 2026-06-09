# 🚀 BitoraBackup - FiveM MySQL Backup Solution

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![FiveM](https://img.shields.io/badge/FiveM-Ready-green)](https://fivem.net/)
[![XAMPP](https://img.shields.io/badge/XAMPP-Compatible-orange)](https://www.apachefriends.org/)
[![Platform](https://img.shields.io/badge/platform-Windows-lightgrey)](https://www.microsoft.com/windows)

**Simple automated MySQL backup for FiveM servers using XAMPP with Discord notifications.**

---

## 🎯 What is Bitora Auto MySQL Backup?

Bitora Auto MySQL Backup automatically backs up your FiveM server's MySQL database every 12 hours, uploads it to the cloud, and sends you Discord notifications. Perfect for server owners who want to protect their player data without hassle.

**Built specifically for:**
- 🎮 FiveM server owners
- 💾 MySQL databases (XAMPP/phpMyAdmin)
- 🔄 Automatic scheduled backups
- 📢 Discord notifications
- ☁️ Cloud storage

---

## ⚡ Quick Setup (5 Minutes)

### 1. **Requirements**
- Windows computer/server
- XAMPP with MySQL running
- Discord server (for notifications)
- Internet connection

### 2. **Download**
```bash
git clone https://github.com/achrafthedev/mysql-auto-backup.git
cd mysql-auto-backup
```

### 3. **Install**
```cmd
install.bat
```

### 4. **Configure & Start**
```cmd
run.bat
```

### 5. **Follow Setup**
- Enter your MySQL details (usually localhost:3306)
- Add Discord webhook URL
- Choose backup schedule
- Done! ✅

---

## 🔧 Installation Guide

### Step 1: Download BitoraBackup
- Download from GitHub: `https://github.com/achrafthedev/mysql-auto-backup`
- Extract to any folder (e.g., `C:\mysql-auto-backup\`)

### Step 2: Install Dependencies
1. **Run installer:**
   ```cmd
   install.bat
   ```
   
2. **If Node.js missing:**
   - Download from: https://nodejs.org/
   - Install with default settings
   - Run `install.bat` again

### Step 3: Setup Configuration
1. **Start configuration:**
   ```cmd
   run.bat
   ```

2. **Database Settings** (for XAMPP):
   ```
   Host: localhost
   Port: 3306
   Username: root
   Password: (leave empty for default XAMPP)
   Database: your_fivem_database
   ```

3. **Discord Webhook:**
   - Go to your Discord server
   - Server Settings → Integrations → Webhooks
   - Create new webhook, copy URL
   - Paste URL in BitoraBackup

4. **GoFile.io** (optional):
   - Leave empty for free uploads
   - Or add API token for premium features

---

## 🎮 For FiveM Server Owners

### Common FiveM Database Names:
- `es_extended` (ESX servers)
- `vrp` (vRP servers)  
- `qbcore` (QB-Core servers)
- `fivem` (custom servers)

### XAMPP Default Settings:
```
Host: localhost
Port: 3306
Username: root
Password: (empty)
```

### Backup Schedule Options:
- **Every 6 hours** - High activity servers
- **Every 12 hours** - Normal servers (recommended)
- **Every 24 hours** - Low activity servers

### What Gets Backed Up:
- Player data
- Character information
- Inventories and items
- Vehicle data
- Gang/organization data
- All custom tables

---

## 🎛️ Using BitoraBackup

### Start the Application
```cmd
run.bat
```

### Management Menu Options:
```
[1] Start BitoraBackup        - Begin automatic backups
[2] Stop Application        - Stop all backups
[3] View Status            - Check if running
[4] View Logs              - See backup history
[5] Reconfigure            - Change settings
[0] Exit                   - Close menu
```

### Discord Notifications
You'll receive messages like:
```
🚀 BitoraBackup - Backup Complete
Database: es_extended
Time: 2025-06-09 15:30:00
File: backup_es_extended_2025-07-31.sql
Download: [Click here]
```

---

## ❓ Troubleshooting

### "Database connection failed"
**Solution:**
1. Check XAMPP is running (MySQL service green)
2. Open phpMyAdmin to verify database exists
3. Use correct database name in BitoraBackup

### "Node.js not found"
**Solution:**
1. Download Node.js from https://nodejs.org/
2. Install with default settings
3. Restart Command Prompt
4. Run `install.bat` again

### "Discord notifications not working"
**Solution:**
1. Check webhook URL is complete
2. Test webhook in Discord server settings
3. Ensure bot has permission to send messages

### "Backup files too large"
**Solution:**
1. Get GoFile.io premium account for larger uploads
2. Or enable database cleanup in your FiveM server
3. Check `backups/` folder for local copies

### "XAMPP MySQL won't start"
**Solution:**
1. Check port 3306 isn't used by other programs
2. Run XAMPP as Administrator
3. Check MySQL error logs in XAMPP

---

## 📁 File Structure

```
BitoraBackup/
├── install.bat           # Installation script
├── run.bat              # Management console
├── src/                 # Application code
├── logs/                # Application logs
├── backups/             # Local backup files
└── config.json          # Your settings
```

---

## 🔄 How It Works

1. **Every 12 hours** (or your schedule):
   - Connects to your MySQL database
   - Creates complete backup file
   - Uploads to GoFile.io cloud storage
   - Sends Discord notification with download link

2. **Backup Files:**
   - Stored locally in `backups/` folder
   - Uploaded to cloud for remote access
   - Named with date/time for easy identification

3. **Monitoring:**
   - Check Discord for notifications
   - Use `run.bat` to view status and logs
   - Automatic restart if something fails

---

## 🛠️ Advanced Configuration

### Custom Backup Schedule
Edit `config.json`:
```json
{
  "backup": {
    "schedule": "0 */6 * * *"
  }
}
```

**Schedule Examples:**
- `0 */6 * * *` - Every 6 hours
- `0 */12 * * *` - Every 12 hours (default)
- `0 2 * * *` - Daily at 2 AM
- `0 2 * * 0` - Weekly on Sunday at 2 AM

### Multiple Databases
Run separate BitoraBackup instances for different databases:
1. Copy BitoraBackup to different folders
2. Configure each with different database
3. Use different Discord channels for notifications

---

## 🆘 Support

### Quick Help
- 📖 **Check this README** for common solutions
- 🐛 **GitHub Issues**: Report bugs or ask questions
- 💬 **Discord**: Join our community server

### FiveM Community
- 🎮 **FiveM Forums**: Share with other server owners
- 📺 **YouTube**: Video tutorials available
- 🌐 **Reddit**: r/FiveM discussions

### Contact
- 🐙 **GitHub**: [@achrafthedev](https://github.com/achrafthedev)
- 🏢 **Company**: [Bitora](https://Bitora.fr/)

---

## 📋 Requirements Details

### System Requirements
- **Windows 10/11** or Windows Server
- **2GB RAM** minimum
- **1GB free space** for backups
- **Stable internet** for uploads

### Software Requirements
- **XAMPP** (or similar with MySQL)
- **Node.js (v18.0.0+)**
- **Discord account** for notifications

### Database Requirements
- **MySQL 5.7+** or **MariaDB 10.3+**
- **Database user** with read permissions
- **Network access** to database server

---

## 🔒 Security Notes

### Database Security
- Uses read-only database access
- No data modification, only backup creation
- Credentials stored locally only

### Cloud Storage
- Files uploaded to GoFile.io are private
- Download links expire based on GoFile policy
- Local backups remain on your server

### Discord Integration
- Only sends notifications (no data access)
- Webhook URL should be kept private
- No sensitive data in Discord messages

---

## 🎯 Why Choose BitoraBackup?

### ✅ **FiveM Optimized**
- Built specifically for FiveM servers
- Understands common database structures
- Works with all popular frameworks (ESX, vRP, QB-Core, Qbox)

### ✅ **XAMPP Friendly**
- No complex MySQL setup required
- Works with default XAMPP configuration
- Simple localhost connection

### ✅ **Zero Maintenance**
- Set it and forget it
- Automatic restarts on failure
- Self-monitoring with Discord alerts

### ✅ **Free & Open Source**
- Completely free to use
- Open source code on GitHub
- Community-driven development

---

## 📄 License

MIT License - Use freely for personal and commercial projects.

---

## 👨‍💻 Credits

**Developer:** Achraf CHARDOUDI
🌐 [Achraf](https://github.com/achrafthedev)

**Company:** Bitora  
🌐 [Bitora.fr](https://bitora.fr/)

**Open Source:** Available on GitHub  
🐙 [github.com/achrafthedev/mysql-auto-backup](https://github.com/achrafthedev/mysql-auto-backup)
---

<div align="center">

**⭐ Star this repo if it helps your FiveM server! ⭐**

Made with ❤️ for the FiveM community

</div>