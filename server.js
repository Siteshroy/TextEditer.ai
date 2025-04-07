import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const token = process.env.API_KEY;
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// Serve static files from the public folders
app.use(express.static(path.join(__dirname, "public/pages")));
app.use("/styles", express.static(path.join(__dirname, "public/styles")));
app.use("/scripts", express.static(path.join(__dirname, "public/scripts")));
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

// API endpoint to handle text rewriting requests
app.post("/api/rewrite", async (req, res) => {
  try {
    const { text, tone, level, features } = req.body;
    const prompt = `Rewrite the following text with a ${tone} tone and ${level} level of modification. Consider these features: ${features.join(
      ", "
    )}.
Original text: "${text}"`;

    const client = ModelClient(
      "https://models.inference.ai.azure.com",
      new AzureKeyCredential(token)
    );

    const response = await client.path("/chat/completions").post({
      body: {
        messages: [
          { role: "system", content: "You are a text rewriting assistant." },
          { role: "user", content: prompt },
        ],
        model: "Mistral-small",
        temperature: 0.8,
        max_tokens: 2048,
        top_p: 0.1,
      },
    });

    if (isUnexpected(response)) {
      throw response.body.error;
    }

    let rewrittenText = response.body.choices[0].message.content.trim();
    rewrittenText =
      rewrittenText.charAt(0) == `"`
        ? rewrittenText.replace(/^.|.$/g, "")
        : rewrittenText;
    res.json({ success: true, rewrittenText });
  } catch (error) {
    console.error("Error in /api/rewrite:", error);
    res.status(500).json({
      success: false,
      error: "An error occurred while rewriting text.",
    });
  }
});

app.post("/api", () => {
  console.log("inside api");
});

// API endpoint to handle text summarizing
app.post("/api/summarize", async (req, res) => {
  try {
    const { text, summaryLength } = req.body;
    const prompt = `Summarize the following text with ${summaryLength} word count \n The paragraph is: ${text}`;

    const client = ModelClient(
      "https://models.inference.ai.azure.com",
      new AzureKeyCredential(token)
    );

    // Call the model API endpoint
    const response = await client.path("/chat/completions").post({
      body: {
        messages: [
          { role: "system", content: "You are a text Summarizing assistant." },
          { role: "user", content: prompt },
        ],
        model: "Mistral-small",
        temperature: 0.8,
        max_tokens: 2048,
        top_p: 0.1,
      },
    });

    if (isUnexpected(response)) {
      throw response.body.error;
    }

    let summarizeText = response.body.choices[0].message.content.trim();
    summarizeText =
      summarizeText.charAt(0) == `"`
        ? summarizeText.replace(/^.|.$/g, "")
        : summarizeText;

    res.json({ success: true, summarizeText });
  } catch (error) {
    console.error("Error in /api/summarize:", error);
    res.status(500).json({
      success: false,
      error: "An error occurred while summarizing file.",
    });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
