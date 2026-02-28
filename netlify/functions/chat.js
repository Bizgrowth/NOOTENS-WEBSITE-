const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const body = JSON.parse(event.body);
        const { message, history = [], isLeadCapture = false, leadData = null } = body;

        // Auto-extract lead data from conversation history (Emulating Make-Expert logic)
        let extractedLead = { email: null, name: null, challenge: null };

        const allUserMessages = history
            .filter(m => m.role === 'user')
            .map(m => m.content)
            .join(' ') + ' ' + message;

        // Simple extraction patterns
        const emailMatch = allUserMessages.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
        const namePatterns = [
            /(?:my name is|i'm|i am|this is|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
            /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+here/im,
        ];

        if (emailMatch) {
            extractedLead.email = emailMatch[0];
        }

        for (const pattern of namePatterns) {
            const match = allUserMessages.match(pattern);
            if (match) {
                extractedLead.name = match[1];
                break;
            }
        }

        extractedLead.challenge = allUserMessages.slice(0, 500); // Extract context

        // Make.com Webhook Integration for Lead Capture
        // Trigger if frontend flagged it OR if we newly found an email
        if ((isLeadCapture && leadData) || extractedLead.email) {
            const finalLeadData = {
                name: extractedLead.name || (leadData ? leadData.name : ''),
                email: extractedLead.email || (leadData ? leadData.email : ''),
                challenge: extractedLead.challenge || (leadData ? (leadData.challenge || leadData.message) : ''),
                source: 'patties-ai-chat-widget',
                capturedAt: new Date().toISOString(),
                conversationLength: history.length + 1
            };

            const makeWebhookUrl = process.env.MAKE_WEBHOOK_URL;
            if (makeWebhookUrl && makeWebhookUrl.trim() !== '') {
                try {
                    // Send data to Make.com asynchronously (don't block)
                    fetch(makeWebhookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(finalLeadData)
                    }).catch(err => console.error('Make.com Async Webhook Error:', err));

                    console.log('✅ Lead sent to Make.com webhook');
                } catch (webhookError) {
                    console.error('Make.com Webhook Exception:', webhookError);
                }
            } else {
                console.log('ℹ️  MAKE_WEBHOOK_URL not set — lead captured but not sent.', finalLeadData);
            }
        }

        // Standard Chat - Anthropic API Integration
        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY || '', // We need this in Netlify
        });

        if (!process.env.ANTHROPIC_API_KEY) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: "Anthropic API key is not configured." })
            };
        }

        // 1. Read Knowledge Base
        const kbPath = path.join(__dirname, '../../knowledge_base.md');
        let systemPrompt = "You are Pattie's AI Operations Consultant. Your role is to represent Pattie's brand, answer questions about Northeast Florida coastal real estate, and explain how Pattie uses cutting-edge 2026 AI strategies.";

        try {
            if (fs.existsSync(kbPath)) {
                systemPrompt = fs.readFileSync(kbPath, 'utf8');
            } else {
                console.warn("Knowledge base not found at:", kbPath);
            }
        } catch (kbError) {
            console.error("Error reading knowledge base:", kbError);
        }

        // Combine history and current message for Anthropic API
        const conversationHistory = history.map(msg => ({
            role: msg.role === 'ai' ? 'assistant' : 'user',
            content: msg.content
        }));
        conversationHistory.push({ role: 'user', content: message });

        // 2. Format Messages for Anthropic API
        // Claude expects system instructions separately from user/assistant turns.
        const apiMessages = conversationHistory.map(msg => ({
            role: msg.role === 'ai' ? 'assistant' : 'user',
            content: msg.content
        }));

        // 3. Call Anthropic API
        const response = await anthropic.messages.create({
            model: 'claude-3-7-sonnet-20250219',
            max_tokens: 1024,
            system: systemPrompt,
            messages: apiMessages
        });

        const reply = response.content[0].text;

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reply })
        };

    } catch (error) {
        console.error('Error in chat function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to process request', details: error.message })
        };
    }
};
