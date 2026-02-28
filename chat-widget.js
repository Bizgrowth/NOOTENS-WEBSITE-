// chat-widget.js - Logic for floating AI Chatbot

document.addEventListener('DOMContentLoaded', () => {
    const chatBtn = document.getElementById('ai-chat-btn');
    const chatPanel = document.getElementById('ai-chat-panel');
    const closeBtn = document.getElementById('ai-chat-close');
    const expandBtn = document.getElementById('ai-chat-expand');
    const sendBtn = document.getElementById('chat-send');
    const chatInput = document.getElementById('chat-input');
    const messagesContainer = document.getElementById('chat-messages');

    let isExpanded = false;

    // Toggle Chat Panel
    chatBtn.addEventListener('click', () => {
        chatPanel.classList.toggle('hidden');
        if (!chatPanel.classList.contains('hidden')) {
            chatInput.focus();
        }
    });

    closeBtn.addEventListener('click', () => {
        chatPanel.classList.add('hidden');
    });

    // Toggle Expanded (Dedicated) Mode
    expandBtn.addEventListener('click', () => {
        isExpanded = !isExpanded;
        if (isExpanded) {
            chatPanel.classList.add('expanded');
            expandBtn.innerHTML = '<i class="ph ph-arrows-in-simple"></i>';
            expandBtn.title = 'Minimize';

            // Add backdrop if needed, but keeping it floating over page is usually better
        } else {
            chatPanel.classList.remove('expanded');
            expandBtn.innerHTML = '<i class="ph ph-arrows-out-simple"></i>';
            expandBtn.title = 'Expand';
        }
    });

    // Handle Sending Messages
    let messageHistory = [];

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        // 1. Add User Message UI
        appendMessage(text, 'user');
        chatInput.value = '';

        // Add to history
        messageHistory.push({ role: 'user', content: text });

        // Check if message contains an email map (simple regex)
        const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/;
        const hasEmail = emailRegex.test(text);

        // 2. Add Typing Indicator UI
        const typingId = showTypingIndicator();

        // 3. Call Backend Serverless Function
        try {
            const response = await fetch('/.netlify/functions/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: text,
                    history: messageHistory.slice(-10), // Send last 10 messages for context
                    isLeadCapture: hasEmail,
                    leadData: hasEmail ? { email: text.match(emailRegex)[0], message: text } : null
                })
            });

            removeTypingIndicator(typingId);

            if (!response.ok) {
                console.error("Server Error:", response.status);
                appendMessage("I'm sorry, my servers are currently unavailable. Please try again later.", 'ai');
                return;
            }

            const data = await response.json();

            if (data.reply) {
                appendMessage(data.reply, 'ai');
                messageHistory.push({ role: 'ai', content: data.reply });
            } else if (data.error) {
                appendMessage("Sorry, I encountered an internal error. Tell Pattie my chips are acting up!", 'ai');
            }

        } catch (error) {
            removeTypingIndicator(typingId);
            console.error('Fetch error:', error);
            appendMessage("I'm having trouble connecting right now. Let me know if you need to reach Pattie directly!", 'ai');
        }
    }

    sendBtn.addEventListener('click', sendMessage);

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Helper Functions
    function appendMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}-message`;
        msgDiv.innerHTML = `<div class="message-content">${escapeHTML(text)}</div>`;
        messagesContainer.appendChild(msgDiv);
        scrollToBottom();
    }

    function showTypingIndicator() {
        const id = 'typing-' + Date.now();
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.id = id;
        typingDiv.innerHTML = `<span></span><span></span><span></span>`;
        messagesContainer.appendChild(typingDiv);
        scrollToBottom();
        return id;
    }

    function removeTypingIndicator(id) {
        const indicator = document.getElementById(id);
        if (indicator) {
            indicator.remove();
        }
    }

    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g,
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }
});
