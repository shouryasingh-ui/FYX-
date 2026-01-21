import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateProductDescription = async (name: string, category: string, price: number): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a premium e-commerce copywriter. Write a sophisticated, 2-sentence product description for a "${name}" (Category: ${category}, Price: ₹${price}). Emphasize quality and lifestyle.`,
    });
    return response.text || "No description generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating description. Please write manually.";
  }
};

export const generateMarketingEmail = async (topic: string, discountCode?: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a short, punchy marketing email for an e-commerce store named 'FYX'. 
      Topic: ${topic}. 
      ${discountCode ? `Include this discount code: ${discountCode}.` : ''} 
      Tone: Exclusive, Hype, Premium. 
      Structure: Subject Line, then Body.`,
    });
    return response.text || "Could not generate email.";
  } catch (error) {
    return "AI Service unavailable.";
  }
};

export const analyzeSalesTrends = async (orderCount: number, revenue: number): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `As an e-commerce business analyst, provide a short 2-sentence summary of store performance given ${orderCount} orders and ₹${revenue} revenue today. Use a professional tone.`,
    });
    return response.text || "Analysis unavailable.";
  } catch (error) {
    return "Keep growing your sales!";
  }
};

export const chatWithCustomer = async (message: string, context: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: {
        systemInstruction: `You are a helpful assistant for FYX, a premium e-commerce store. 
        Context: ${context}. 
        Keep answers under 30 words. Be polite and snappy.`,
      }
    });
    return response.text || "I'm sorry, I didn't understand that.";
  } catch (error) {
    return "Our assistant is currently resting. Please try again later.";
  }
};

export const generateProductImage = async (prompt: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("AI Image Gen Error:", error);
    return null;
  }
};