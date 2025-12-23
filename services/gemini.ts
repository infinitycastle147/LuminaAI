
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Slide, GenerationMode } from "../types";

const MODELS = {
  STRUCTURE: "gemini-3-flash-preview",
  IMAGE: "gemini-2.5-flash-image",
  SPEECH: "gemini-2.5-flash-preview-tts",
} as const;

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

export const generatePresentationStructure = async (
  topic: string,
  fileData?: { data: string; mimeType: string },
  mode: GenerationMode = 'create'
): Promise<Slide[]> => {
  const ai = getAiClient();
  const isConvert = mode === 'convert';

  const systemInstruction = `You are a high-fidelity presentation converter.
  
  TASK:
  ${isConvert 
    ? "MODE: CONVERT. You are an extraction engine. Parse the attached document. For EVERY slide you find, extract the Title and Bullet points EXACTLY as they appear. Do not summarize. Do not innovate. Then, write a professional 3-4 sentence 'speakerNotes' for that slide's narration. Map each slide to the JSON schema." 
    : "MODE: CREATE. Brainstorm and design a NEW 7-slide presentation based on the topic. Use 'title' layout for the first slide and varied layouts for the rest."
  }

  Rules:
  1. Slide Source: Mark every slide with source: '${isConvert ? 'extracted' : 'generated'}'.
  2. Formatting: Layouts available: 'title', 'content_right', 'content_left', 'diagram_center'.
  3. Image Prompts: Even for converted slides, generate an 'imagePrompt' describing the slide's visual theme (though it might be skipped).
  4. Narrator: Speaker notes should be conversational and fluid for text-to-speech.
  `;

  const response = await ai.models.generateContent({
    model: MODELS.STRUCTURE,
    contents: { 
      parts: [
        { text: `Process this as ${mode.toUpperCase()} request. ${topic ? `Context: ${topic}` : ''}` },
        ...(fileData ? [{ inlineData: fileData }] : [])
      ] 
    },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      temperature: isConvert ? 0.0 : 0.4,
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            layout: { type: Type.STRING, enum: ['title', 'content_right', 'content_left', 'diagram_center'] },
            content: { type: Type.ARRAY, items: { type: Type.STRING } },
            speakerNotes: { type: Type.STRING },
            imagePrompt: { type: Type.STRING },
            source: { type: Type.STRING }
          },
          required: ["title", "layout", "content", "speakerNotes", "imagePrompt", "source"]
        }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from structure model");
  return JSON.parse(text).map((s: any, i: number) => ({ ...s, id: i + 1 }));
};

export const generateSlideImage = async (prompt: string): Promise<string> => {
  const ai = getAiClient();
  const fallbacks = [
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=1200"
  ];

  try {
    const response = await ai.models.generateContent({
      model: MODELS.IMAGE,
      contents: { parts: [{ text: `${prompt}. Corporate style, clean, white background.` }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });

    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part?.inlineData?.data) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    throw new Error("No image data");
  } catch (error: any) {
    const isQuota = error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED');
    console.warn(isQuota ? "Quota limit reached - Using fallback visual." : `Image Error: ${error.message}`);
    return fallbacks[prompt.length % fallbacks.length];
  }
};

export const generateSpeech = async (text: string): Promise<string> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: MODELS.SPEECH,
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
    },
  });
  const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!data) throw new Error("Speech synthesis failed");
  return data;
};
