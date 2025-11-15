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

// get all voices
app.get("/voices", async (req, res) => {
  try {
    const response = await fetch("https://api.elevenlabs.io/v2/voices", {
      method: "GET",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
      },
    });

    if (!response.ok) {
      console.log(await response.text());
      return res.status(500).send("Error fetching voices");
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});
// outputs the speech
app.post("/api/elevens", async (req, res) => {
  try {
    const VOICE_ID = "21m00Tcm4TlvDq8ikWAM";
    const body = {
      text: req.body.text,
      model_id: "eleven_multilingual_v2",
      output_format: "mp3_44100_128",
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

// Start server
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
