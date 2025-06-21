import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper to fetch and convert image to base64
async function fetchImageAsBase64(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
}

// Main function to verify image with Gemini
export const verifyImageWithGemini = async (imageUrl) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `Analyze the image at this URL. Is it a real photo of a disaster scene, such as a flood, fire, or earthquake? Is it likely manipulated or AI-generated? Give a brief assessment.`;

  const base64Image = await fetchImageAsBase64(imageUrl);

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
        ],
      },
    ],
  });

  const responseText = result.response.text().trim();
  return responseText;
};
