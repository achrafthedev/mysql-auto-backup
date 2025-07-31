const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const colors = require('colors');

class GoFileUploader {
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
        try {
            const fileName = require('path').basename(filePath);
            
            console.log(`🔄 Uploading ${fileName} to GoFile...`.yellow);
            
            const form = new FormData();
            form.append('file', fs.createReadStream(filePath));
            
            // Add folderId if provided (for authenticated uploads)
            if (folderId) {
                form.append('folderId', folderId);
            }
            
            const headers = {
                ...form.getHeaders(),
                ...this.getAuthHeaders()
            };

            const response = await axios.post(this.uploadUrl, form, {
                headers: headers,
                timeout: 300000, // 5 minutes timeout
            });

            if (response.data.status === 'ok') {
                const downloadLink = response.data.data.downloadPage;
                console.log('✅ File uploaded successfully to GoFile'.green);
                console.log('🔗 Download link:'.cyan, downloadLink);
                
                return {
                    success: true,
                    downloadLink: downloadLink,
                    fileId: response.data.data.fileId,
                    fileName: fileName,
                    guestToken: response.data.data.guestToken || null,
                    parentFolder: response.data.data.parentFolder || null
                };
            } else {
                throw new Error('Upload failed: ' + (response.data.error || response.data.status));
            }
        } catch (error) {
            console.log('❌ GoFile upload failed:'.red, error.message);
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

            console.log('📁 Creating folder on GoFile...'.yellow);
            
            const payload = {
                parentFolderId: parentFolderId
            };
            
            if (folderName) {
                payload.folderName = folderName;
            }

            const response = await axios.post(`${this.baseUrl}/contents/createFolder`, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                }
            });

            if (response.data.status === 'ok') {
                console.log('✅ Folder created successfully'.green);
                return {
                    success: true,
                    folderId: response.data.data.id,
                    folderName: response.data.data.name
                };
            } else {
                throw new Error('Folder creation failed: ' + (response.data.error || response.data.status));
            }
        } catch (error) {
            console.log('❌ Folder creation failed:'.red, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async deleteContent(contentIds) {
        try {
            if (!this.apiToken) {
                console.log('⚠️ No API token provided, cannot delete files'.yellow);
                return false;
            }

            console.log('🗑️ Deleting content from GoFile...'.yellow);
            
            const payload = {
                contentsId: Array.isArray(contentIds) ? contentIds.join(',') : contentIds
            };

            const response = await axios.delete(`${this.baseUrl}/contents`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                data: payload
            });
            
            if (response.data.status === 'ok') {
                console.log('✅ Content deleted from GoFile successfully'.green);
                return true;
            }
            return false;
        } catch (error) {
            console.log('⚠️ Failed to delete content from GoFile:'.yellow, error.message);
            return false;
        }
    }

    async getAccountId() {
        try {
            if (!this.apiToken) {
                throw new Error('API token required');
            }

            const response = await axios.get(`${this.baseUrl}/accounts/getid`, {
                headers: this.getAuthHeaders()
            });

            if (response.data.status === 'ok') {
                return response.data.data.id;
            } else {
                throw new Error('Failed to get account ID');
            }
        } catch (error) {
            console.log('❌ Failed to get account ID:'.red, error.message);
            return null;
        }
    }

    async getAccountInfo() {
        try {
            const accountId = await this.getAccountId();
            if (!accountId) {
                throw new Error('Could not get account ID');
            }

            const response = await axios.get(`${this.baseUrl}/accounts/${accountId}`, {
                headers: this.getAuthHeaders()
            });

            if (response.data.status === 'ok') {
                return response.data.data;
            } else {
                throw new Error('Failed to get account info');
            }
        } catch (error) {
            console.log('❌ Failed to get account info:'.red, error.message);
            return null;
        }
    }
}

module.exports = GoFileUploader;