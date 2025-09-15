// Servidor simples para testar o Render
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || process.env.SERVER_PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());

// Rota básica
app.get('/', (req, res) => {
  res.json({ 
    status: 'online',
    message: 'Evolution API - Escola Jupiara',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Mock endpoint para teste
app.post('/message/sendText/:instance', (req, res) => {
  const { instance } = req.params;
  const { number, text } = req.body;
  
  console.log(`Mock sending message to ${number}: ${text}`);
  
  res.json({
    success: true,
    message: 'Message sent (mock)',
    instance,
    number,
    text
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});