import { readFile } from 'node:fs/promises';
import path from 'node:path';
import pc from 'picocolors';

export default class GoFileUploader {
    constructor(apiToken = null) {
        this.baseUrl = 'https://api.gofile.io';
        this.uploadUrl = 'https://upload.gofile.io/uploadfile';
        this.apiToken = apiToken;
    }

    setApiToken(token) {
        this.apiToken = token;
    }

    getAuthHeaders() {
        if (this.apiToken) {
            return {
                'Authorization': `Bearer ${this.apiToken}`
            };
        }
        return {};
    }

    async uploadFile(filePath, folderId = null) {
        let timeoutId;
        try {
            const fileName = path.basename(filePath);
            
            console.log(pc.yellow(`🔄 Uploading ${fileName} to GoFile...`));
            
            const fileBuffer = await readFile(filePath);
            const fileBlob = new Blob([fileBuffer], { type: 'application/octet-stream' });
            
            const form = new FormData();
            form.append('file', fileBlob, fileName);
            
            // Add folderId if provided (for authenticated uploads)
            if (folderId) {
                form.append('folderId', folderId);
            }
            
            const headers = {
                ...this.getAuthHeaders()
            };

            // Setup AbortController for a 5-minute request timeout
            const controller = new AbortController();
            timeoutId = setTimeout(() => controller.abort(), 300000);

            const response = await fetch(this.uploadUrl, {
                method: 'POST',
                headers: headers,
                body: form,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            const result = await response.json();

            if (result.status === 'ok') {
                const downloadLink = result.data.downloadPage;
                console.log(pc.green('✅ File uploaded successfully to GoFile'));
                console.log(pc.cyan(`🔗 Download link: ${downloadLink}`));
                
                return {
                    success: true,
                    downloadLink: downloadLink,
                    fileId: result.data.fileId,
                    fileName: fileName,
                    guestToken: result.data.guestToken || null,
                    parentFolder: result.data.parentFolder || null
                };
            } else {
                throw new Error('Upload failed: ' + (result.error || result.status));
            }
        } catch (error) {
            if (timeoutId) clearTimeout(timeoutId);
            console.log(pc.red(`❌ GoFile upload failed: ${error.message}`));
            return {
                success: false,
                error: error.message
            };
        }
    }

    async createFolder(parentFolderId, folderName = null) {
        try {
            if (!this.apiToken) {
                throw new Error('API token required for folder creation');
            }

            console.log(pc.yellow('📁 Creating folder on GoFile...'));
            
            const payload = {
                parentFolderId: parentFolderId
            };
            
            if (folderName) {
                payload.folderName = folderName;
            }

            const response = await fetch(`${this.baseUrl}/contents/createFolder`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.status === 'ok') {
                console.log(pc.green('✅ Folder created successfully'));
                return {
                    success: true,
                    folderId: result.data.id,
                    folderName: result.data.name
                };
            } else {
                throw new Error('Folder creation failed: ' + (result.error || result.status));
            }
        } catch (error) {
            console.log(pc.red(`❌ Folder creation failed: ${error.message}`));
            return {
                success: false,
                error: error.message
            };
        }
    }

    async deleteContent(contentIds) {
        try {
            if (!this.apiToken) {
                console.log(pc.yellow('⚠️ No API token provided, cannot delete files'));
                return false;
            }

            console.log(pc.yellow('🗑️ Deleting content from GoFile...'));
            
            const payload = {
                contentsId: Array.isArray(contentIds) ? contentIds.join(',') : contentIds
            };

            const response = await fetch(`${this.baseUrl}/contents`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            
            if (result.status === 'ok') {
                console.log(pc.green('✅ Content deleted from GoFile successfully'));
                return true;
            }
            return false;
        } catch (error) {
            console.log(pc.yellow(`⚠️ Failed to delete content from GoFile: ${error.message}`));
            return false;
        }
    }

    async getAccountId() {
        try {
            if (!this.apiToken) {
                throw new Error('API token required');
            }

            const response = await fetch(`${this.baseUrl}/accounts/getid`, {
                headers: this.getAuthHeaders()
            });

            const result = await response.json();

            if (result.status === 'ok') {
                return result.data.id;
            } else {
                throw new Error('Failed to get account ID');
            }
        } catch (error) {
            console.log(pc.red(`❌ Failed to get account ID: ${error.message}`));
            return null;
        }
    }

    async getAccountInfo() {
        try {
            const accountId = await this.getAccountId();
            if (!accountId) {
                throw new Error('Could not get account ID');
            }

            const response = await fetch(`${this.baseUrl}/accounts/${accountId}`, {
                headers: this.getAuthHeaders()
            });

            const result = await response.json();

            if (result.status === 'ok') {
                return result.data;
            } else {
                throw new Error('Failed to get account info');
            }
        } catch (error) {
            console.log(pc.red(`❌ Failed to get account info: ${error.message}`));
            return null;
        }
    }
}