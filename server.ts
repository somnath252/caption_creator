import express from "express";
import multer from "multer";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import os from "os";

let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not set. API calls will fail.");
    }
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

const storage = multer.diskStorage({
  destination: os.tmpdir(),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp4';
    cb(null, `${file.fieldname}-${Date.now()}${ext}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 60 * 1024 * 1024 } // 60MB limit
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Serve uploads so frontend can play the video locally
  app.use("/uploads", express.static(os.tmpdir()));

  app.post("/api/generate-captions", upload.single("video"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No video file provided" });
      }

      console.log("Uploaded file:", req.file);

      // Upload to Gemini
      console.log("Uploading to Gemini...");
      const ai = getAI();
      const uploadResult = await ai.files.upload({
        file: req.file.path,
        config: {
          mimeType: req.file.mimetype,
        },
      });

      console.log("Uploaded to Gemini. Waiting for file to be active...");

      let fileState = await ai.files.get({ name: uploadResult.name });
      while (fileState.state === "PROCESSING") {
        console.log(`File is ${fileState.state}, waiting...`);
        await new Promise((resolve) => setTimeout(resolve, 3000));
        fileState = await ai.files.get({ name: uploadResult.name });
      }

      if (fileState.state === "FAILED") {
        throw new Error("Video processing failed.");
      }

      console.log("File is active. Generating content...");

      // Call Gemini for captioning
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            fileData: {
              fileUri: uploadResult.uri,
              mimeType: uploadResult.mimeType,
            },
          },
          {
            text: `You are an expert video editor. Analyze this short-form video. Produce highly synchronized, word-level kinetic typography captions.
1. Break the spoken audio into short display chunks (max 4 words per chunk).
2. For each chunk, estimate the 'startMs' and 'endMs' timestamps in milliseconds.
3. Suggest one relevant emoji for the chunk (if applicable, else omit or empty string).
4. For each word within the chunk, list it exactly. Identify "power words" or "money words" (e.g., scale, grow, dollars, free) and tag them with color '#FFFF00' or '#00FF7F'.
Return the exact JSON matching the provided schema.`,
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                startMs: { type: Type.INTEGER, description: "Start time of chunk in milliseconds" },
                endMs: { type: Type.INTEGER, description: "End time of chunk in milliseconds" },
                emoji: { type: Type.STRING, description: "Suggested emoji for the chunk" },
                words: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      word: { type: Type.STRING },
                      color: { type: Type.STRING, description: "Hex color code `#FFFFFF` for normal, `#FFFF00` or `#00FF7F` for highlights" },
                    },
                    required: ["word", "color"],
                  },
                },
              },
              required: ["startMs", "endMs", "words"],
            },
          },
        },
      });

      const jsonStr = response.text || "[]";
      let captions = [];
      try {
        captions = JSON.parse(jsonStr);
      } catch (err) {
        console.error("Failed to parse JSON response:", err);
      }

      // Return local video url and generated captions
      const videoUrl = "/uploads/" + path.basename(req.file.path);
      res.json({ videoUrl, captions });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled Global Error:", err);
    res.status(500).json({ error: String(err) });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
