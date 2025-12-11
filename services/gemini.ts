import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Slide } from "../types";

// Helper to init AI
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Generates the presentation structure (outline, text, prompts)
 */
export const generatePresentationStructure = async (
  topic: string,
  fileData?: { data: string; mimeType: string }
): Promise<Slide[]> => {
  const ai = getAiClient();

  const systemInstruction = `You are a world-class presentation designer. 
  Create a compelling PowerPoint presentation structure based on the user's input.
  
  Rules:
  1. Create 5 to 8 slides.
  2. Slide 1 must be a Title Slide.
  3. Include a variety of layouts.
  4. For each slide, write a highly descriptive 'imagePrompt' that could be used by an AI image generator to create a professional illustration, diagram, or photo relevant to the slide's content. Specifically ask for "diagram of..." or "infographic about..." if the concept is technical.
  5. Content should be bullet points, concise and punchy.
  6. Speaker notes should be conversational and formatted for speech (e.g., no bullet points in notes, just sentences).
  `;

  const promptText = `Create a presentation about: ${topic}.`;

  const parts: any[] = [{ text: promptText }];
  
  if (fileData) {
    parts.push({
      inlineData: {
        data: fileData.data,
        mimeType: fileData.mimeType,
      },
    });
    parts.push({ text: "Use the attached file as the primary source material." });
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      parts: parts,
    },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            layout: { 
              type: Type.STRING, 
              enum: ['title', 'content_right', 'content_left', 'diagram_center'] 
            },
            content: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            speakerNotes: { type: Type.STRING },
            imagePrompt: { type: Type.STRING, description: "A detailed prompt for generating a visual (image/diagram) for this slide." }
          },
          required: ["title", "layout", "content", "speakerNotes", "imagePrompt"]
        }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");

  try {
    const slidesRaw = JSON.parse(text);
    // Add IDs
    return slidesRaw.map((s: any, i: number) => ({ ...s, id: i + 1 }));
  } catch (e) {
    console.error("Failed to parse JSON", text);
    throw new Error("Failed to generate valid presentation structure.");
  }
};

/**
 * Generates an image for a single slide using Gemini Image model
 */
export const generateSlideImage = async (prompt: string): Promise<string> => {
  const ai = getAiClient();
  const model = "gemini-2.5-flash-image"; 
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [{ text: prompt }]
      },
    });

    for (const candidate of response.candidates || []) {
        for (const part of candidate.content.parts) {
            if (part.inlineData && part.inlineData.data) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
    
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Image gen error", error);
    return `https://picsum.photos/800/600?random=${Math.random()}`;
  }
};

/**
 * Generates speech audio for the given text using Gemini TTS
 * Returns the base64 encoded PCM data.
 */
export const generateSpeech = async (text: string): Promise<string> => {
  const ai = getAiClient();
  const model = "gemini-2.5-flash-preview-tts";

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data generated");
    
    return base64Audio;
  } catch (error) {
    console.error("TTS Generation Error", error);
    throw new Error("Failed to generate speech");
  }
};
