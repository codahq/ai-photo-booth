import { Router, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { ensureStorageDirs, saveSession, getStorageDir } from '../storage/imageStore';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const OPENAI_MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
const PROVIDER = 'openai';
const OPENAI_IMAGES_EDIT_URL = 'https://api.openai.com/v1/images/edits';

const DEFAULT_PROMPT =
  'Transform this photo to look like it was taken in the 1950s. Convert to black and white or sepia tone. Change the clothing of any people to 1950s style fashion. Place the scene in a 1950s setting with period-appropriate props, furniture, and environment.';

function buildEffectivePrompt(prompt: string): string {
  if (OPENAI_MODEL !== 'dall-e-2') {
    return prompt;
  }
  // dall-e-2 needs extra nudging to produce visible changes
  return `${prompt}\n\nApply a strong, clearly visible transformation to the whole image. Keep the same main subject and composition, but make the style change obvious.`;
}

async function prepareImageForOpenAIEdit(imageBuffer: Buffer): Promise<Buffer> {
  // OpenAI edits expects square PNG input; use contain+pad to avoid cropping/zooming.
  return sharp(imageBuffer)
    .rotate()
    .resize(1024, 1024, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 1 },
      withoutEnlargement: false,
    })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function createFullEditMask(size: number): Promise<Buffer> {
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .toBuffer();
}

async function editImageWithOpenAI(imageBuffer: Buffer, mimeType: string, prompt: string): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured on the backend');
  }

  const formData = new FormData();
  formData.append('model', OPENAI_MODEL);
  formData.append('prompt', prompt);
  formData.append('size', '1024x1024');
  formData.append('image', new Blob([imageBuffer], { type: mimeType }), 'input.png');

  if (OPENAI_MODEL === 'dall-e-2') {
    // dall-e-2 requires response_format and benefits from a full mask to repaint everything
    formData.append('response_format', 'b64_json');
    const fullMask = await createFullEditMask(1024);
    formData.append('mask', new Blob([fullMask], { type: 'image/png' }), 'mask.png');
  }

  const response = await fetch(OPENAI_IMAGES_EDIT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  const payload = (await response.json()) as {
    data?: Array<{ b64_json?: string; url?: string }>;
    error?: { message?: string };
  };

  if (!response.ok) {
    const message = payload.error?.message || `OpenAI request failed with status ${response.status}`;
    throw new Error(message);
  }

  const firstResult = payload.data?.[0];
  if (!firstResult) {
    throw new Error('OpenAI did not return an edited image');
  }

  if (firstResult.b64_json) {
    return Buffer.from(firstResult.b64_json, 'base64');
  }

  if (firstResult.url) {
    const imageResponse = await fetch(firstResult.url);
    if (!imageResponse.ok) {
      throw new Error('OpenAI returned an image URL that could not be downloaded');
    }
    return Buffer.from(await imageResponse.arrayBuffer());
  }

  throw new Error('OpenAI returned an unexpected image response format');
}

router.post('/', upload.single('image'), async (req: Request, res: Response): Promise<void> => {
  const requestStartedAt = Date.now();
  try {
    const startedAt = Date.now();
    ensureStorageDirs();

    if (!req.file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }

    const prompt: string = (req.body.prompt as string) || DEFAULT_PROMPT;
    const sessionId = uuidv4();
    const storageDir = getStorageDir();

    // Save original image
    const originalFilename = `${sessionId}-original.png`;
    const originalPath = path.join(storageDir, 'originals', originalFilename);
    fs.writeFileSync(originalPath, req.file.buffer);

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured on the backend');
    }

    const normalizedPng = await prepareImageForOpenAIEdit(req.file.buffer);

    const effectivePrompt = buildEffectivePrompt(prompt);

    const inferenceStartedAt = Date.now();
    const imageBuffer = await editImageWithOpenAI(
      normalizedPng,
      'image/png',
      effectivePrompt
    );
    const inferenceEndedAt = Date.now();

    // Save transformed image
    const transformedFilename = `${sessionId}-transformed.png`;
    const transformedPath = path.join(storageDir, 'transformed', transformedFilename);
    fs.writeFileSync(transformedPath, imageBuffer);

    const originalUrl = `/storage/originals/${originalFilename}`;
    const transformedUrl = `/storage/transformed/${transformedFilename}`;

    const session = {
      id: sessionId,
      originalUrl,
      transformedUrl,
      prompt,
      createdAt: new Date().toISOString(),
      transform: {
        model: OPENAI_MODEL,
        provider: PROVIDER,
        inputBytes: req.file.buffer.length,
        outputBytes: imageBuffer.length,
        durationsMs: {
          total: Date.now() - startedAt,
          inference: inferenceEndedAt - inferenceStartedAt,
          io: Date.now() - startedAt - (inferenceEndedAt - inferenceStartedAt),
        },
      },
    };

    saveSession(session);

    console.log('Transform timing:', {
      sessionId,
      model: OPENAI_MODEL,
      provider: PROVIDER,
      inputBytes: req.file.buffer.length,
      outputBytes: imageBuffer.length,
      durationsMs: session.transform.durationsMs,
    });

    res.json(session);
  } catch (error: unknown) {
    console.error('Transform error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Failed to transform image',
      details: message,
      elapsedMs: Date.now() - requestStartedAt,
    });
  }
});

export default router;
