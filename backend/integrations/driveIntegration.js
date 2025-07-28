// Google Drive API client setup
import { google } from 'googleapis';
import { getIntegrationToken, refreshIntegrationToken, storeIntegrationToken } from '../services/integrationService.js';


/**
 * Get a Google Drive API client for a user
 * Handles missing tokens and prepares OAuth2 client
 * @param {string|number} userId
 * @returns {google.drive_v3.Drive}
 */
export async function getDriveApiClient(userId) {
  try {
    let tokenData = await getIntegrationToken(userId, 'drive');
    if (!tokenData || !tokenData.accessToken) {
      throw new Error('Google Drive not connected');
    }
    const oAuth2Client = new google.auth.OAuth2();
    oAuth2Client.setCredentials({
      access_token: tokenData.accessToken,
      refresh_token: tokenData.refreshToken
    });
    // TODO: Optionally check token expiry and refresh if needed
    return google.drive({ version: 'v3', auth: oAuth2Client });
  } catch (err) {
    throw new Error('Failed to get Google Drive API client: ' + err.message);
  }
}

/**
 * Upload a file to Google Drive for a user
 * @param {string|number} userId
 * @param {object} fileMetadata - { name, mimeType }
 * @param {object} media - { mimeType, body }
 * @returns {object} Uploaded file resource
 */
export async function uploadDriveFile(userId, fileMetadata, media) {
  try {
    const drive = await getDriveApiClient(userId);
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media
    });
    return response.data;
  } catch (err) {
    throw new Error('Failed to upload file to Google Drive: ' + err.message);
  }
}

/**
 * List files in Google Drive for a user
 * @param {string|number} userId
 * @param {object} [queryOptions] - Optional query params (e.g., pageSize, q)
 * @returns {Array} List of files
 */
export async function listDriveFiles(userId, queryOptions = {}) {
  try {
    const drive = await getDriveApiClient(userId);
    const response = await drive.files.list(queryOptions);
    return response.data.files;
  } catch (err) {
    throw new Error('Failed to list Google Drive files: ' + err.message);
  }
}

/**
 * Download a file from Google Drive for a user
 * @param {string|number} userId
 * @param {string} fileId - The ID of the file to download
 * @returns {Buffer} File contents as a Buffer
 */
export async function downloadDriveFile(userId, fileId) {
  try {
    const drive = await getDriveApiClient(userId);
    const response = await drive.files.get({
      fileId,
      alt: 'media'
    }, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
  } catch (err) {
    throw new Error('Failed to download file from Google Drive: ' + err.message);
  }
}
