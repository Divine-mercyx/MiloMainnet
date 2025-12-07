// Frontend audio transcription handler
/**
 * Transcribe audio using AI
 * @param {Object} models - Initialized AI models
 * @param {string} audioBase64 - Base64 encoded audio data
 * @param {string} mimeType - Audio MIME type
 * @param {string} language - Language for transcription
 * @returns {Promise<Object>} Transcription result
 */
export async function transcribeAudio(models, audioBase64, mimeType, language = "en") {
    if (!models || !models.transcribeModel) {
        throw new Error("Transcribe model not initialized");
    }
    
    if (!audioBase64 || !mimeType) {
        throw new Error("Missing audio data or MIME type");
    }
    
    try {
        // Validate base64 data
        Buffer.from(audioBase64, 'base64');
    } catch {
        throw new Error("Invalid base64 audio data");
    }

    try {
        // Initial transcription
        const initialResult = await models.transcribeModel.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            inlineData: {
                                mimeType,
                                data: audioBase64,
                            },
                        },
                        {
                            text: `Transcribe this audio accurately. in this language ${language}`,
                        },
                    ],
                },
            ]
        });

        const initialResponse = await initialResult.response;
        let transcription = (await initialResponse.text()).trim();

        // Refinement prompt
        const refinementPrompt = `
You are a blockchain assistant helping correct voice transcriptions. 
The user is likely talking about cryptocurrency transactions.

Original transcription: "${transcription}"

Please correct any misheard cryptocurrency terms and apply blockchain context:

CRYPTO CORRECTIONS:
- "sweet", "swit", "suite" → "SUI"
- "you ess dee see" → "USDC" 
- "bit coin" → "Bitcoin"
- "etherium" → "Ethereum"

TRANSACTION CONTEXT:
- If it sounds like a transaction command, ensure numbers and crypto names are correct
- "send five sweet" → "send 5 SUI"
- "swap ten suite" → "swap 10 SUI"

Keep the original language and intent, but fix cryptocurrency terminology.

Corrected transcription:
`;

        // Refinement
        const refinementResult = await models.transcribeModel.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [{ text: refinementPrompt }],
                },
            ]
        });

        const refinementResponse = await refinementResult.response;
        transcription = (await refinementResponse.text()).trim();

        transcription = transcription.replace(/^Corrected transcription:\s*/i, '');

        return { transcription };
    } catch (error) {
        console.error("Transcription error:", error);
        throw new Error("Failed to transcribe audio");
    }
}