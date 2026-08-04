import 'dotenv/config';
import express, { Request } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import logger from './utils/logger';
import { ActivityBatchSchema, ScreenshotUploadSchema } from 'shared';
import { authenticateToken } from './middleware/auth';
import { extractTextFromImage } from './services/ocr';
import { analyzeImage } from './services/vision';
import fs from 'fs';
import path from 'path';

const app = express();
export const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Security Middlewares
app.use(helmet());
app.use(cors());
app.use('/uploads', express.static(uploadsDir)); // Serve uploaded images

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 200, 
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok', db: 'connected' });
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

// Activity Endpoint
app.post('/activity', authenticateToken, async (req: Request | any, res) => {
  try {
    const sessionId = req.sessionId;
    const validation = ActivityBatchSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid data', details: validation.error });
    }

    const activities = validation.data;
    await prisma.activity.createMany({
      data: activities.map(act => ({
        sessionId,
        type: act.type,
        url: act.url,
        title: act.title,
        timestamp: act.timestamp,
        x: act.x,
        y: act.y,
        elementTag: act.elementTag,
        text: act.text,
        scrollPosition: act.scrollPosition,
        pageHeight: act.pageHeight,
        viewportHeight: act.viewportHeight,
        keyCount: act.keyCount,
        typingSpeed: act.typingSpeed,
        focusedElement: act.focusedElement,
      }))
    });

    res.status(200).json({ status: 'success' });
  } catch (error) {
    logger.error('Activity upload error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Screenshot Endpoint
app.post('/screenshot', authenticateToken, async (req: Request | any, res) => {
  try {
    const sessionId = req.sessionId;
    const validation = ScreenshotUploadSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid data', details: validation.error });
    }

    const { screenshotBase64, url, title, timestamp } = validation.data;
    
    // Save image to disk
    const base64Data = screenshotBase64.replace(/^data:image\/\w+;base64,/, "");
    const fileName = `${sessionId}-${timestamp}.png`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, base64Data, 'base64');

    // Save to DB
    const screenshot = await prisma.screenshot.create({
      data: {
        sessionId,
        url,
        title,
        timestamp,
        imagePath: `/uploads/${fileName}`
      }
    });

    // Run OCR and Vision asynchronously so we don't block the extension response
    processScreenshot(screenshot.id, screenshotBase64);

    res.status(200).json({ status: 'success', id: screenshot.id });
  } catch (error) {
    logger.error('Screenshot upload error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function processScreenshot(screenshotId: string, base64Image: string) {
  try {
    const ocrPromise = extractTextFromImage(base64Image);
    const visionPromise = analyzeImage(base64Image);

    const [ocrText, visionData] = await Promise.all([ocrPromise, visionPromise]);

    await prisma.$transaction([
      prisma.oCRResult.create({
        data: {
          screenshotId,
          text: ocrText
        }
      }),
      prisma.visionAnalysis.create({
        data: {
          screenshotId,
          summary: visionData.summary,
          visibleUI: visionData.visibleUI,
          detectedApp: visionData.detectedApp
        }
      })
    ]);
    logger.info(`Processed screenshot ${screenshotId} with AI`);
  } catch (error) {
    logger.error(`Error processing screenshot ${screenshotId}`, error);
  }
}

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
