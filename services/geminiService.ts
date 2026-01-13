
import { GoogleGenAI, Type } from "@google/genai";
import { DepartmentMismatch } from "../types";

export interface SummaryResult {
  executiveSummary: string;
  trendAnalysis: string;
  actions: string[];
}

export interface MasterAuditSummary {
  whatsappMessage: string;
}

export const summarizeOperations = async (
  currentData: DepartmentMismatch[],
  previousSummary?: string
): Promise<SummaryResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const model = 'gemini-3-flash-preview';
  
  const prompt = `
    You are an AI Executive Auditor for the owner of SWISS Pharmaceutical.
    Analyze the pharmaceutical sales data provided.
    
    CONSTRAINTS:
    - The summary must be readable in under 5 minutes.
    - Focus exclusively on 'Sales' department performance.
    - Identify gaps between 'Plan' and 'Actual'.
    
    GOAL:
    1. Executive Brief: A concise 2-3 sentence overview of the current status.
    2. Trend Analysis: Identify if performance is improving or declining.
    3. Board Directives: 3-4 specific, high-impact action items for management.
    
    Data:
    ${JSON.stringify(currentData.filter(d => d.department === 'Sales'), null, 2)}
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: { type: Type.STRING },
            trendAnalysis: { type: Type.STRING },
            actions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["executiveSummary", "trendAnalysis", "actions"]
        }
      }
    });

    const text = response.text || "{}";
    return JSON.parse(text) as SummaryResult;
  } catch (error) {
    console.error("Gemini Service Error:", error);
    return {
      executiveSummary: "Performance brief unavailable. Check 'Sales' tab data in source files.",
      trendAnalysis: "Insufficient trend data.",
      actions: ["Verify Sales sheet formatting", "Ensure Target/Actual columns are populated"]
    };
  }
};

export const generateMasterAuditSummary = async (data: DepartmentMismatch[]): Promise<MasterAuditSummary> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const model = 'gemini-3-flash-preview';

  const prompt = `
    Summarize sales performance gaps for a high-priority WhatsApp message to the Board.
    Keep it extremely concise and readable in 30 seconds.
    Data: ${JSON.stringify(data.filter(d => d.department === 'Sales' && d.status !== 'on-track'))}
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            whatsappMessage: { type: Type.STRING }
          },
          required: ["whatsappMessage"]
        }
      }
    });
    const text = response.text || "{}";
    return JSON.parse(text) as MasterAuditSummary;
  } catch (error) {
    return { whatsappMessage: "Board Alert: Sales audit ready for review in the command portal." };
  }
};
