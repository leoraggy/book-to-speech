// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// OpenAI client (v6+)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Health check
app.get('/', (req, res) => {
  res.send('book-to-speech server is running ✅');
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res
        .status(400)
        .json({ error: 'message is required in the request body' });
    }

    // Call Chat Completions API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // or another chat model you have access to
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant for a book-to-speech app. Keep responses concise.',
        },
        { role: 'user', content: message },
      ],
    });

    const reply = completion.choices[0]?.message?.content ?? '';

    res.json({ reply });
  } catch (err) {
    console.error('Error calling OpenAI:', err);
    res
      .status(500)
      .json({ error: 'Something went wrong while calling the ChatGPT API.' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
