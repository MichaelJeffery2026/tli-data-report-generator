import logger from "../utils/logger.js";

export async function tamuAIFetch(messages) {
    const response = await fetch (`https://chat-api.tamu.ai/api/chat/completions`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.TAMU_CHAT_AI_API_TOKEN}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "protected.gpt-5",
            stream: false,
            messages
        })
    });
    if (!response.ok) {
        let message = "Unknown tamu.chat.ai error";
        try {
            const json = await response.json();
            message = json?.detail?.msg || message;
        } catch {
            // If body isn't JSON, keep the default message
        }

        const err = new Error(message);
        err.status = response.status;
        logger.error(`tamuAIFetch failed: ${err.message}`, { status: response.status });
        throw err;
    }
    return response.json();
}

export async function callTAMUAI(messages) {
    const response = await tamuAIFetch(messages);

    const message = response.choices[0].message.content;

    const inputTokens = response.usage.prompt_tokens;
    const inputRate = 0.00000125;
    const outputTokens = response.usage.completion_tokens  
    const outputRate = 0.00001;

    const cost = inputTokens * inputRate + outputRate * outputTokens;

    return {
        message,
        tokens: {
            inputTokens,
            outputTokens
        },
        cost
    }
}