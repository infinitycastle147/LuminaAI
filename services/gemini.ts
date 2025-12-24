
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Slide, GenerationMode, SlideSource } from "../types";

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

/**
 * Strips Markdown code blocks and cleans the string for JSON parsing.
 */
const sanitizeJsonResponse = (text: string): string => {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
};

export const generatePresentationStructure = async (
  topic: string,
  fileData?: { data: string; mimeType: string },
  mode: GenerationMode = 'create'
): Promise<Slide[]> => {
  const ai = getAiClient();
  const isConvert = mode === 'convert';

  const systemInstruction = isConvert ? `
You are a Lossless Document-to-Audio Synchronizer.
The user has provided a file that WILL be used as the visual source.

### Your Goal
Read the document and generate EXACT narration scripts (speakerNotes) and structural metadata for each slide. 
You are NOT redesigning the slides. You are NOT summarizing them.

### Extraction Rules
1. Match the exact slide count and order.
2. For each slide, extract the Title and main bullets EXACTLY as written.
3. For each slide, write a conversational 'speakerNotes' script that narrates exactly what is on that slide.
4. Layout mapping: Choose the layout that best describes where the text is located (title, content_left, etc.)

Accuracy is paramount. If you see Slide 1 has "Introduction", the JSON slide 1 title must be "Introduction".
` : `
You are a world-class research assistant and presentation designer.
MODE: CREATE. 

### Your Goal
Use Google Search to find up-to-date facts, statistics, recent news, and accurate details about the requested topic. 
Generate a new 7-slide deck that is highly informative and visually engaging.

### Content Rules
1. Slide 1 must be 'title'.
2. Use Google Search data to ensure all technical claims or current events are accurate.
3. Provide descriptive imagePrompts for the AI image generator.
4. Mark source as 'generated'.
5. Always output valid JSON matching the schema.
`;

  const response = await ai.models.generateContent({
    model: MODELS.STRUCTURE,
    contents: { 
      parts: [
        { text: isConvert ? "Sync narration for this document." : `Topic: ${topic}` },
        ...(fileData ? [{ inlineData: fileData }] : [])
      ] 
    },
    config: {
      systemInstruction,
      tools: isConvert ? [] : [{ googleSearch: {} }],
      responseMimeType: "application/json",
      temperature: isConvert ? 0.0 : 0.7,
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
  if (!text) throw new Error("Document analysis failed.");
  
  // Extract grounding sources if available
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  const webSources: SlideSource[] = [];
  if (groundingChunks) {
    for (const chunk of groundingChunks) {
      if (chunk.web) {
        webSources.push({
          uri: chunk.web.uri,
          title: chunk.web.title
        });
      }
    }
  }

  try {
    const cleanJson = sanitizeJsonResponse(text);
    const slides: any[] = JSON.parse(cleanJson);
    
    return slides.map((s: any, i: number) => ({ 
      ...s, 
      id: i + 1,
      // Distribute web sources to the relevant slides or just include them on all generated slides if relevant
      sources: webSources.length > 0 ? webSources : undefined
    }));
  } catch (err) {
    console.error("JSON Parse Error:", text);
    throw new Error("The AI returned an invalid data format. Please try again.");
  }
};

export const generateSlideImage = async (prompt: string): Promise<string> => {
  const ai = getAiClient();
  const fallbacks = [
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200"
  ];
  try {
    const response = await ai.models.generateContent({
      model: MODELS.IMAGE,
      contents: { parts: [{ text: `${prompt}. Corporate style.` }] },
      config: { 
        imageConfig: { aspectRatio: "16:9" },
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part?.inlineData?.data) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    return fallbacks[0];
  } catch (e) {
    return fallbacks[0];
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
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};
