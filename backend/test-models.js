require('dotenv').config();
const { GoogleGenAI } = require("@google/genai");

async function checkModels() {
  try {
    const fetch = require('node-fetch');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    console.log(data.models.map(m => m.name).filter(n => n.includes("flash")).join("\n"));
  } catch(e) { console.error(e) }
}
checkModels();
