import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API route: Gemini AI News & Review Generator
app.post('/api/gemini/news', async (req, res) => {
  try {
    const { prompt, type } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return res.json({
        success: false,
        fallback: true,
        message: 'GEMINI_API_KEY unavailable. Using rule-based generator.'
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are an entertainment news reporter or music critic in South Korea writing for a K-Pop Idol management game called '내맘대로 아이돌 만들기'.
Generate a short, realistic, engaging Korean text (1-3 sentences) based on this event:
Type: ${type || 'NEWS'}
Context: ${prompt}`
            }
          ]
        }
      ]
    });

    const text = response.text || '';
    return res.json({ success: true, text });
  } catch (error: any) {
    console.error('Gemini API Error:', error?.message || error);
    return res.json({ success: false, error: error?.message || 'Gemini API Error' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
