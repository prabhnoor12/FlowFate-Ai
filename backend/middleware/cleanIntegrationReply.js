// backend/middleware/cleanIntegrationReply.js
// Middleware to enforce clean, user-friendly replies for integration connect requests
// Usage: Place before your OpenAI/chat controller in the route chain for integration connect endpoints

/**
 * Detects if the user is asking to connect an integration (Notion, Google, Slack, etc.)
 * @param {string} text
 * @returns {boolean}
 */
export function isIntegrationConnectRequest(text) {
  if (!text || typeof text !== 'string') return false;
  const keywords = [
    'connect notion', 'connect google', 'connect slack', 'connect drive',
    'connect calendar', 'connect todoist', 'connect integration',
    'link notion', 'link google', 'link slack', 'link drive',
    'link calendar', 'link todoist', 'authorize', 'oauth', 'sign in to', 'sign into'
  ];
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

/**
 * Strips metadata, code blocks, and JSON from a bot reply, leaving only user-facing content.
 * @param {string} reply
 * @returns {string}
 */
export function cleanBotReply(reply) {
  if (!reply || typeof reply !== 'string') return '';
  // Remove code blocks
  let cleaned = reply.replace(/```[\s\S]*?```/g, '');
  // Remove lines starting with meta/data/source/info/debug
  cleaned = cleaned.replace(/(^|\n)\s*(Meta:|meta:|data:|source:|sources?:|info:|debug:)[^\n]*\n?/gi, '');
  // Remove JSON objects/arrays
  cleaned = cleaned.replace(/[\{\[].*[\}\]]/gs, '');
  // Convert markdown links [text](url) to HTML <a> tags
  cleaned = cleaned.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" class="text-blue-500 underline">$1</a>');
  // Remove extra blank lines
  cleaned = cleaned.replace(/\n{2,}/g, '\n').trim();
  return cleaned;
}

export function cleanIntegrationReplyMiddleware(req, res, next) {
  // Only apply to chat/OpenAI endpoints with user input
  const userInput = req.body?.prompt || req.body?.input || '';
  if (!isIntegrationConnectRequest(userInput)) return next();

  // Intercept res.send to clean the reply before sending
  const originalSend = res.send;
  res.send = function (body) {
    try {
      let data = body;
      if (typeof body === 'string') {
        data = JSON.parse(body);
      }
      if (data && (data.reply || (data.data && data.data.reply))) {
        if (data.reply) data.reply = cleanBotReply(data.reply);
        if (data.data && data.data.reply) data.data.reply = cleanBotReply(data.data.reply);
      }
      return originalSend.call(this, JSON.stringify(data));
    } catch (e) {
      // Fallback: send original body
      return originalSend.call(this, body);
    }
  };
  next();
}
