
    // --- Notion API Functions ---
    function notionCreatePage() {
      appendMessage('Creating a new Notion page...', 'system');
      fetch('https://flowfate-ai.onrender.com/api/notion/create-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
        .then(response => {
          if (!response.ok) throw new Error('API error');
          return response.json();
        })
        .then(data => {
          if (data && data.url) {
            appendMessage(`✅ Notion page created: <a href="${data.url}" target="_blank" class="text-blue-500 underline">Open Page</a>`, 'system');
          } else {
            appendMessage('⚠️ Notion page created, but no URL returned.', 'system');
          }
        })
        .catch(() => appendMessage('❌ Failed to create Notion page.', 'system'));
    }

    function notionQueryDatabase(queryText) {
      appendMessage('Querying Notion database...', 'system');
      fetch('https://flowfate-ai.onrender.com/api/notion/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText })
      })
        .then(response => {
          if (!response.ok) throw new Error('API error');
          return response.json();
        })
        .then(data => {
          if (data && data.results && data.results.length > 0) {
            let html = '<ul class="list-disc ml-6">';
            data.results.forEach(item => {
              html += `<li>${item}</li>`;
            });
            html += '</ul>';
            appendMessage(html, 'system');
          } else {
            appendMessage('No results found in Notion database.', 'system');
          }
        })
        .catch(() => appendMessage('❌ Failed to query Notion database.', 'system'));
    }

    function notionCreateTaskOrReminder(text) {
      appendMessage('Creating Notion task/reminder...', 'system');
      fetch('https://flowfate-ai.onrender.com/api/notion/create-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
        .then(response => {
          if (!response.ok) throw new Error('API error');
          return response.json();
        })
        .then(data => {
          if (data && data.url) {
            appendMessage(`✅ Notion task/reminder created: <a href="${data.url}" target="_blank" class="text-blue-500 underline">Open Task</a>`, 'system');
          } else {
            appendMessage('⚠️ Notion task/reminder created, but no URL returned.', 'system');
          }
        })
        .catch(() => appendMessage('❌ Failed to create Notion task/reminder.', 'system'));
    }

    function notionShowRecentFeed() {
      appendMessage('Fetching recent Notion updates...', 'system');
      fetch('https://flowfate-ai.onrender.com/api/notion/recent', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
        .then(response => {
          if (!response.ok) throw new Error('API error');
          return response.json();
        })
        .then(data => {
          if (data && data.updates && data.updates.length > 0) {
            let html = '<div class="text-left"><b>Recent Notion Updates:</b><ul class="list-disc ml-6">';
            data.updates.forEach(item => {
              html += `<li><a href="${item.url}" target="_blank" class="text-blue-500 underline">${item.title || 'Untitled'}</a> <span class="text-xs text-gray-400">${item.time || ''}</span></li>`;
            });
            html += '</ul></div>';
            appendMessage(html, 'system');
          } else {
            appendMessage('No recent Notion updates found.', 'system');
          }
        })
        .catch(() => appendMessage('❌ Failed to fetch Notion updates.', 'system'));
    }

    function notionUnfurlLinks(msgDiv) {
      // Improved regex: match Notion URLs with more flexibility (including /, ?, =, &, %, #, .)
      const notionUrlRegex = /https?:\/\/(www\.)?notion\.so\/[\w\-\/?=&#%\.]+/g;
      const links = msgDiv.innerHTML.match(notionUrlRegex);
      if (links) {
        links.forEach(url => {
          fetch('https://flowfate-ai.onrender.com/api/notion/unfurl', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
          })
            .then(response => {
              if (!response.ok) return;
              return response.json();
            })
            .then(data => {
              if (data && data.title) {
                const preview = document.createElement('div');
                preview.className = 'bg-gray-50 border border-gray-200 rounded p-2 mt-1 text-xs text-left';
                preview.innerHTML = `<b>${data.title}</b><br>${data.snippet || ''}`;
                const linkEls = msgDiv.querySelectorAll('a');
                linkEls.forEach(a => {
                  if (a.href.startsWith(url)) {
                    a.parentNode.insertBefore(preview, a.nextSibling);
                  }
                });
              }
            })
            .catch(() => {});
        });
      }
    }

    // --- Chat UI and Utility Functions ---
    function saveChatHistory() {
      try {
        const chatBox = document.getElementById('chatBox');
        const messages = Array.from(chatBox.querySelectorAll('.message')).map(msg => ({
          html: msg.outerHTML
        }));
        localStorage.setItem('flowfate_chat_history', JSON.stringify(messages));
      } catch (e) {
        // Optionally, show a warning to the user or log the error
        // console.warn('Could not save chat history:', e);
      }
    }

    function loadChatHistory() {
      try {
        const chatBox = document.getElementById('chatBox');
        const history = localStorage.getItem('flowfate_chat_history');
        if (history) {
          chatBox.innerHTML = '';
          const messages = JSON.parse(history);
          messages.forEach(m => {
            const temp = document.createElement('div');
            temp.innerHTML = m.html;
            chatBox.appendChild(temp.firstChild);
          });
        }
      } catch (e) {
        // Optionally, show a warning to the user or log the error
        // console.warn('Could not load chat history:', e);
      }
    }

    function showTypingIndicator(show) {
      const typing = document.getElementById('typingIndicator');
      if (typing) typing.classList.toggle('hidden', !show);
    }

    function updateChatBgIconVisibility() {
      const chatBox = document.getElementById('chatBox');
      const chatBgIcon = document.getElementById('chatBgIcon');
      const emptyChatMsg = document.getElementById('emptyChatMsg');
      if (!chatBox || !chatBgIcon || !emptyChatMsg) return;
      if (chatBox.children.length === 1 && chatBox.contains(emptyChatMsg)) {
        chatBgIcon.style.opacity = '0.4';
        chatBgIcon.style.pointerEvents = 'none';
      } else {
        chatBgIcon.style.opacity = '0';
        chatBgIcon.style.pointerEvents = 'none';
      }
    }

    function appendMessage(text, sender = 'user') {
      const chatBox = document.getElementById('chatBox');
      const emptyChatMsg = document.getElementById('emptyChatMsg');
      if (emptyChatMsg && emptyChatMsg.parentNode === chatBox) {
        chatBox.removeChild(emptyChatMsg);
      }
      const msg = document.createElement('div');
      let bgClass = '';
      let alignClass = '';
      if (sender === 'user') {
        bgClass = 'bg-green-100 text-gray-900';
        alignClass = 'self-end';
      } else if (sender === 'bot') {
        bgClass = 'bg-white text-gray-900 border border-gray-200';
        alignClass = 'self-start';
      } else if (sender === 'system') {
        bgClass = 'bg-yellow-50 text-yellow-800 border border-yellow-200';
        alignClass = 'self-center';
      }
      msg.className = `${alignClass} message ${sender} ${bgClass} text-sm p-2 my-1 rounded-xl max-w-xs shadow break-words`;
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Sanitize text to prevent XSS
      function escapeHTML(str) {
        return str.replace(/[&<>"']/g, function(tag) {
          const charsToReplace = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
          };
          return charsToReplace[tag] || tag;
        });
      }
      let safeText = text;
      // Only escape for user and system, allow bot to render HTML (links, etc.)
      if (sender === 'user' || sender === 'system') {
        safeText = escapeHTML(text);
      }
      // For bot, convert markdown links to HTML links before rendering
      if (sender === 'bot' || sender === 'system') {
        safeText = safeText.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" class="text-blue-500 underline">$1</a>');
      }
      msg.innerHTML = `<div>${safeText}</div><div class="text-xs text-right opacity-60">${time}</div>`;
      chatBox.appendChild(msg);
      if (sender === 'user' || sender === 'bot') {
        setTimeout(() => notionUnfurlLinks(msg), 0);
      }
      // Always scroll to bottom after new message
      setTimeout(scrollChatToBottom, 0);
      saveChatHistory();
      updateChatBgIconVisibility();
    }

    function scrollChatToBottom() {
      const chatBox = document.getElementById('chatBox');
      if (chatBox && window.autoScrollEnabled) {
        chatBox.scrollTop = chatBox.scrollHeight;
      }
    }

    // --- Event Handlers ---
    function handleUserInput() {
      const input = document.getElementById('userInput');
      const value = input.value.trim();
      if (value !== "") {
        if (value.toLowerCase().startsWith('/notion-query')) {
          const queryText = value.replace('/notion-query', '').trim();
          if (queryText) {
            notionQueryDatabase(queryText);
          } else {
            appendMessage('Please provide a query after /notion-query', 'system');
          }
        } else if (value.toLowerCase().startsWith('/notion-feed')) {
          notionShowRecentFeed();
        } else if (value.toLowerCase().startsWith('/notion-task')) {
          const taskText = value.replace('/notion-task', '').trim();
          if (taskText) {
            notionCreateTaskOrReminder(taskText);
          } else {
            appendMessage('Please provide a task/reminder after /notion-task', 'system');
          }
        } else if (value.toLowerCase().startsWith('/remind')) {
          const taskText = value.replace('/remind', '').trim();
          if (taskText) {
            notionCreateTaskOrReminder(taskText);
          } else {
            appendMessage('Please provide a reminder after /remind', 'system');
          }
        } else {
          sendMessage(value);
        }
        input.value = "";
      }
    }

    function handleFileInputChange() {
      const fileInput = document.getElementById('fileInput');
      if (!fileInput) return;
      try {
        const chatBox = document.getElementById('chatBox');
        const emptyChatMsg = document.getElementById('emptyChatMsg');
        const file = fileInput.files && fileInput.files[0];
        if (file && chatBox) {
          if (emptyChatMsg && emptyChatMsg.parentNode === chatBox) {
            chatBox.removeChild(emptyChatMsg);
          }
          // Escape file name to prevent XSS
          function escapeHTML(str) {
            return str.replace(/[&<>"']/g, function(tag) {
              const charsToReplace = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
              };
              return charsToReplace[tag] || tag;
            });
          }
          const safeFileName = escapeHTML(file.name);
          const fileMessage = document.createElement('div');
          fileMessage.className = 'self-end message file bg-blue-100 p-2 rounded my-2 max-w-xs';
          fileMessage.innerHTML = `📎 <strong>${safeFileName}</strong> (${Math.round(file.size / 1024)} KB)`;
          chatBox.appendChild(fileMessage);
          scrollChatToBottom();
        }
      } catch (e) {}
    }

    function handleAutoScrollToggle() {
      const autoScrollOnCircle = document.getElementById('autoScrollOnCircle');
      const autoScrollOnCheck = document.getElementById('autoScrollOnCheck');
      window.autoScrollEnabled = !window.autoScrollEnabled;
      if (window.autoScrollEnabled) {
        autoScrollOnCircle.setAttribute('fill', '#22c55e');
        autoScrollOnCheck.setAttribute('stroke', '#fff');
      } else {
        autoScrollOnCircle.setAttribute('fill', '#ef4444');
        autoScrollOnCheck.setAttribute('stroke', '#fff');
      }
    }

    function handleClearChat() {
      const chatBox = document.getElementById('chatBox');
      const emptyChatMsg = document.getElementById('emptyChatMsg');
      if (chatBox) {
        chatBox.innerHTML = '';
        if (emptyChatMsg) {
          chatBox.appendChild(emptyChatMsg);
        }
        updateChatBgIconVisibility();
        localStorage.removeItem('flowfate_chat_history');
      }
    }

    // --- Profile Dropdown ---
    function setupProfileDropdown() {
      const profileBtn = document.getElementById('profileBtn');
      const profileDropdown = document.getElementById('profileDropdown');
      let dropdownOpen = false;
      if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          dropdownOpen = !dropdownOpen;
          profileDropdown.classList.toggle('hidden', !dropdownOpen);
          profileBtn.setAttribute('aria-expanded', dropdownOpen);
        });
        document.addEventListener('click', (e) => {
          if (dropdownOpen && !profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.add('hidden');
            dropdownOpen = false;
            profileBtn.setAttribute('aria-expanded', 'false');
          }
        });
      }
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          window.location.href = 'login.html';
        });
      }
    }

    async function sendMessage(text) {
  if (!text.trim()) return;

  appendMessage(text, 'user');
  showTypingIndicator(true);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  // Send messages to chat
  try {
    const response = await fetch('https://flowfate-ai.onrender.com/api/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: text }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = extractReply(data);

    if (reply) {
      appendMessage(reply, 'bot');
    } else {
      appendMessage('⚠️ No response from AI.', 'system');
    }
  } catch (err) {
    console.error('SendMessage Error:', err);
    appendMessage(`❌ ${err.name === 'AbortError' ? 'Request timed out.' : err.message}`, 'system');
  } finally {
    showTypingIndicator(false);
  }
}

function extractReply(data) {
  if (data?.reply) return data.reply;
  if (data?.data?.reply) return data.data.reply;

  if (Array.isArray(data)) {
    for (let i = data.length - 1; i >= 0; i--) {
      const item = data[i];
      if (item.type === 'message' && item.role === 'assistant' && Array.isArray(item.content)) {
        for (const c of item.content) {
          if (c.type === 'output_text' && c.text) {
            return c.text;
          }
        }
      }
    }
  }
  return null;
}


    // --- Initialization ---
    function setupEventListeners() {
      const createNotionPageBtn = document.getElementById('createNotionPageBtn');
      if (createNotionPageBtn) {
        createNotionPageBtn.addEventListener('click', notionCreatePage);
      }
      const showNotionFeedBtn = document.getElementById('showNotionFeedBtn');
      if (showNotionFeedBtn) {
        showNotionFeedBtn.addEventListener('click', notionShowRecentFeed);
      }
      const fileInput = document.getElementById('fileInput');
      if (fileInput) {
        fileInput.addEventListener('change', handleFileInputChange);
      }
      const autoScrollToggle = document.getElementById('autoScrollToggle');
      if (autoScrollToggle) {
        autoScrollToggle.addEventListener('click', handleAutoScrollToggle);
      }
      const clearChatBtn = document.getElementById('clearChatBtn');
      if (clearChatBtn) {
        clearChatBtn.addEventListener('click', handleClearChat);
      }
      // Removed redundant Enter key handler; form onsubmit already handles input
    }

    window.autoScrollEnabled = true;

    window.addEventListener('DOMContentLoaded', () => {
      try {
        setupProfileDropdown();
        setupEventListeners();
        loadChatHistory();
        updateChatBgIconVisibility();
      } catch (e) {}
    });






