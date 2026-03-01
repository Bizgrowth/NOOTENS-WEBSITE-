// lead.js - Dedicated Netlify function for contact form submissions
// This is called when the user submits the in-chat contact form.
// It bypasses the AI and fires directly to the Make.com webhook.

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { name, email, phone } = JSON.parse(event.body);

        if (!email) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Email is required.' })
            };
        }

        const leadData = {
            name: name || 'Not provided',
            email: email,
            phone: phone || 'Not provided',
            challenge: 'Submitted via in-chat contact form — direct form submission.',
            source: 'patties-chat-contact-form',
            capturedAt: new Date().toISOString()
        };

        const makeWebhookUrl = process.env.MAKE_WEBHOOK_URL;

        if (makeWebhookUrl && makeWebhookUrl.trim() !== '') {
            const webhookResponse = await fetch(makeWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(leadData)
            });
            console.log('✅ Form lead sent to Make.com. Status:', webhookResponse.status);
        } else {
            console.log('ℹ️  MAKE_WEBHOOK_URL not set. Lead data:', leadData);
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: true })
        };

    } catch (error) {
        console.error('Error in lead function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to submit lead.', details: error.message })
        };
    }
};
