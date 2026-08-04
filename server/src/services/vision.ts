import OpenAI from 'openai';
import logger from '../utils/logger';

// Initialize with a placeholder key if none is provided for safety
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key',
});

export async function analyzeImage(base64Image: string) {
  if (process.env.OPENAI_API_KEY === 'dummy_key' || !process.env.OPENAI_API_KEY) {
    logger.warn('OpenAI API key is missing or dummy. Skipping vision analysis.');
    return {
      summary: 'Vision API disabled due to missing key',
      visibleUI: 'N/A',
      detectedApp: 'N/A'
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this browser screenshot. Provide a brief summary of the page, the main visible UI elements, and the detected application/website name if obvious. Return as a JSON object with keys: summary, visibleUI, detectedApp." },
            {
              type: "image_url",
              image_url: {
                url: base64Image, // expects data URI
                detail: "low"
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      return JSON.parse(content) as { summary: string, visibleUI: string, detectedApp: string };
    }
  } catch (error) {
    logger.error('Vision API Error', error);
  }

  return {
    summary: 'Error during vision analysis',
    visibleUI: 'Error',
    detectedApp: 'Error'
  };
}
