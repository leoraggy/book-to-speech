// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

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
app.get("/", (req, res) => {
  res.send("book-to-speech server is running ✅");
});

// outputs the speech
app.post("/api/elevens", async (req, res) => {
  try {
    const VOICE_ID = req.body.voice_id;
    const textToSpeak = req.body.text;
    const narrationSpeed = req.body.speed;

    if (!VOICE_ID || !textToSpeak) {
      return res
        .status(400)
        .send("Missing required parameters: voice_id and text.");
    }
    const body = {
      text: textToSpeak,
      model_id: "eleven_multilingual_v2",
      output_format: "mp3_44100_128",
      voice_settings: {
        speed: narrationSpeed,
      },
    };

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );
    if (!response.ok) {
      const errMessage = await response.text();
      console.error(errMessage);
      return res.status(500).send("Error from ElevenLabs");
    }

    const mp3Buffer = Buffer.from(await response.arrayBuffer());

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Disposition": "attachment; filename=output.mp3",
    });

    res.send(mp3Buffer);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

//test
app.post("/api/test", async (req, res) => {
  try {
    console.log({ testResponse: req.body });
    res.send({ response: "sent" });
  } catch (err) {}
});

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res
        .status(400)
        .json({ error: "message is required in the request body" });
    }

    // Call Chat Completions API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // or another chat model you have access to
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant for a book-to-speech app. Keep responses concise.",
        },
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices[0]?.message?.content ?? "";

    res.json({ reply });
  } catch (err) {
    console.error("Error calling OpenAI:", err);
    res
      .status(500)
      .json({ error: "Something went wrong while calling the ChatGPT API." });
  }
});

// POST /api/format-text
// Body: { "text": "original book paragraph..." }
app.post("/api/format-text", async (req, res) => {
  try {
    const { text } = req.body;
    console.log({ testResponseFromFormat: req.body });

    if (!text || typeof text !== "string") {
      return res
        .status(400)
        .json({ error: "text (string) is required in the request body" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // or whatever model you're using
      temperature: 0.2, // low = more deterministic/consistent
      messages: [
        {
          role: "system",
          content: [
            "You are an assistant that annotates text for audiobook narration.",
            "Your job is to INSERT emotional/voice directions in square brackets like [sarcastically], [whispers], [softly], [excited], [giggles], etc.",
            "IMPORTANT RULES:",
            "1. Do NOT change any of the original words, spelling, or punctuation.",
            "2. Do NOT remove any words.",
            "3. Do NOT add new narrative words or sentences. The ONLY new text you are allowed to add is bracketed directions like [whispers], [sarcastically], [narrator, gently], etc.",
            "4. Keep the original text in the same order.",
            "5. You may insert bracketed directions between sentences or inside sentences, where it makes sense for performance.",
            "6. Do NOT summarize or explain. Just return the annotated text.",
          ].join(" "),
        },
        {
          role: "user",
          content: [
            "Example of the style (this is just an example, do not repeat it):",
            "",
            "In the ancient land of Eldoria, where skies shimmered and forests, whispered secrets to the wind, lived a dragon named Zephyros. [sarcastically] Not the “burn it all down” kind... [giggles] but he was gentle, wise, with eyes like old stars. [whispers] Even the birds fell silent when he passed.",
            "",
            "Now annotate the following text by ONLY inserting bracketed emotional/voice directions. Do NOT change any existing words or punctuation:",
            "---",
            text,
            "---",
          ].join("\n"),
        },
      ],
    });

    const annotated = completion.choices[0]?.message?.content?.trim() ?? "";

    res.json({ annotatedText: annotated });
  } catch (err) {
    console.error("Error calling OpenAI:", err);
    res.status(500).json({
      error: "Something went wrong while annotating text with the ChatGPT API.",
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
