import { createWorker } from 'tesseract.js';
import logger from '../utils/logger';

export async function extractTextFromImage(base64Image: string): Promise<string> {
  try {
    // Tesseract expects base64 data to have the data URI scheme attached or just a buffer
    // Actually, Tesseract can take a base64 string directly if formatted correctly, or a Buffer.
    // Let's assume the client sends `data:image/png;base64,...`
    const worker = await createWorker('eng');
    
    // Tesseract.js recognizes data URI strings
    const ret = await worker.recognize(base64Image);
    const text = ret.data.text;
    await worker.terminate();
    return text.trim();
  } catch (error) {
    logger.error('OCR Error', error);
    return '';
  }
}
