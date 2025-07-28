// Google Calendar API client setup
import { google } from 'googleapis';
import { getIntegrationToken, refreshIntegrationToken, storeIntegrationToken } from '../services/integrationService.js';



/**
 * Get a Google Calendar API client for a user
 * Handles missing tokens and prepares OAuth2 client
 * @param {string|number} userId
 * @returns {google.calendar_v3.Calendar}
 */
export async function getCalendarApiClient(userId) {
  try {
    let tokenData = await getIntegrationToken(userId, 'calendar');
    if (!tokenData || !tokenData.accessToken) {
      throw new Error('Google Calendar not connected');
    }
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oAuth2Client.setCredentials({
      access_token: tokenData.accessToken,
      refresh_token: tokenData.refreshToken
    });
    // Optionally handle token refresh here
    return google.calendar({ version: 'v3', auth: oAuth2Client });
  } catch (err) {
    throw new Error('Failed to get Google Calendar API client: ' + err.message);
  }
}

/**
 * Create a Google Calendar event for a user
 * @param {string|number} userId
 * @param {object} eventData - Google Calendar event resource
 * @returns {object} Created event
 */
export async function createCalendarEvent(userId, eventData) {
  try {
    const calendar = await getCalendarApiClient(userId);
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: eventData
    });
    return response.data;
  } catch (err) {
    throw new Error('Failed to create calendar event: ' + err.message);
  }
}
