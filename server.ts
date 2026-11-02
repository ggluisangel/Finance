import express from 'express';
import { handleAgentRequest } from './src/server/agentHandler.ts';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '5mb' }));

// API Route for AI Finance Agent
app.post('/api/agent', async (req, res) => {
  try {
    const result = await handleAgentRequest(req.body);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Error in /api/agent:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Error procesando el mensaje con la IA."
    });
  }
});

// Serve static assets in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
