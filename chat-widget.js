// chat-widget.js - Logic for floating AI Chatbot + In-Chat Contact Form

document.addEventListener('DOMContentLoaded', () => {
    const chatBtn = document.getElementById('ai-chat-btn');
    const chatPanel = document.getElementById('ai-chat-panel');
    const closeBtn = document.getElementById('ai-chat-close');
    const expandBtn = document.getElementById('ai-chat-expand');
    const sendBtn = document.getElementById('chat-send');
    const chatInput = document.getElementById('chat-input');
    const messagesContainer = document.getElementById('chat-messages');
    const connectBtn = document.getElementById('ai-chat-connect');

    // Form elements
    const chatView = document.getElementById('chat-view');
    const formView = document.getElementById('chat-form-view');
    const contactForm = document.getElementById('chat-contact-form');
    const formSuccess = document.getElementById('form-success');
    const formBackBtn = document.getElementById('form-back-btn');

    let isExpanded = false;

    // ─── Toggle Chat Panel ────────────────────────────────────────────────────
    chatBtn.addEventListener('click', () => {
        chatPanel.classList.toggle('hidden');
        if (!chatPanel.classList.contains('hidden')) {
            chatInput.focus();
        }
    });

    closeBtn.addEventListener('click', () => {
        chatPanel.classList.add('hidden');
    });

    // ─── Expand / Minimize ───────────────────────────────────────────────────
    expandBtn.addEventListener('click', () => {
        isExpanded = !isExpanded;
        if (isExpanded) {
            chatPanel.classList.add('expanded');
            expandBtn.innerHTML = '<i class="ph ph-arrows-in-simple"></i>';
            expandBtn.title = 'Minimize';
        } else {
            chatPanel.classList.remove('expanded');
            expandBtn.innerHTML = '<i class="ph ph-arrows-out-simple"></i>';
            expandBtn.title = 'Expand';
        }
    });

    // ─── Connect Button: Show in-chat form ───────────────────────────────────
    connectBtn.addEventListener('click', () => {
        chatView.style.display = 'none';
        formView.style.display = 'flex';
        // Reset form state
        contactForm.style.display = 'flex';
        formSuccess.style.display = 'none';
        document.getElementById('form-name').value = '';
        document.getElementById('form-email').value = '';
        document.getElementById('form-phone').value = '';
    });

    // ─── Back Button: Return to chat ─────────────────────────────────────────
    formBackBtn.addEventListener('click', () => {
        formView.style.display = 'none';
        chatView.style.display = 'flex';
    });

    // ─── Contact Form Submission ──────────────────────────────────────────────
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('form-name').value.trim();
        const email = document.getElementById('form-email').value.trim();
        const phone = document.getElementById('form-phone').value.trim();
        const submitBtn = contactForm.querySelector('.form-submit-btn');

        if (!email) return;

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        try {
            const response = await fetch('/.netlify/functions/lead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, phone })
            });

            if (response.ok) {
                // Show success screen
                contactForm.style.display = 'none';
                formSuccess.style.display = 'flex';

                // After 3s, return to chat with a confirmation message
                setTimeout(() => {
                    formView.style.display = 'none';
                    chatView.style.display = 'flex';
                    appendMessage(
                        `Thanks ${name || 'there'}! 🎉 Pattie will reach out to you at ${email} shortly. In the meantime, feel free to keep asking me anything!`,
                        'ai'
                    );
                }, 3000);
            } else {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send to Pattie →';
                appendMessage("Sorry, there was an issue submitting your info. Please try again!", 'ai');
                formView.style.display = 'none';
                chatView.style.display = 'flex';
            }
        } catch (err) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send to Pattie →';
            console.error('Form submission error:', err);
            appendMessage("I'm having trouble connecting right now. Please try again!", 'ai');
            formView.style.display = 'none';
            chatView.style.display = 'flex';
        }
    });

    // ─── Chat Messaging ───────────────────────────────────────────────────────
    let messageHistory = [];

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        appendMessage(text, 'user');
        chatInput.value = '';

        messageHistory.push({ role: 'user', content: text });

        // Check for email so backend knows to trigger lead capture
        const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/;
        const hasEmail = emailRegex.test(text);

        const typingId = showTypingIndicator();

        try {
            const response = await fetch('/.netlify/functions/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    history: messageHistory.slice(-10),
                    isLeadCapture: hasEmail,
                    leadData: hasEmail ? { email: text.match(emailRegex)[0], message: text } : null
                })
            });

            removeTypingIndicator(typingId);

            if (!response.ok) {
                console.error('Server Error:', response.status);
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
        if (e.key === 'Enter') sendMessage();
    });

    // ─── Helper Functions ─────────────────────────────────────────────────────
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
        if (indicator) indicator.remove();
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
