
import { GoogleGenAI, Type } from "@google/genai";
import { DataFile, AnalysisResult } from "../types";

const MODEL_NAME = "gemini-3-flash-preview";

export const analyzeDataWithGemini = async (
  query: string, 
  files: DataFile[]
): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const dataContext = files.map(f => {
    // Send a sample of the data to help the AI understand the schema and values
    const sample = f.rows.slice(0, 10);
    return `
      File: ${f.name}
      Headers: ${f.headers.join(', ')}
      Row Count: ${f.rowCount}
      Metadata: ${JSON.stringify(f.metadata)}
      Sample Data (JSON): ${JSON.stringify(sample)}
    `;
  }).join('\n---\n');

  const systemInstruction = `
    You are O'GradysCore AI, a world-class Data Analyst specializing in cleaning and interpreting UltiSales Legacy POS systems.
    Your task is to analyze multiple messy dataframes provided in the context and answer the user query with professional precision.
    
    CRITICAL INSTRUCTIONS:
    1. If the user asks for trends, top items, or comparisons, you MUST provide 'chartData' and 'chartType'.
    2. 'chartData' is an array of objects. Each object MUST have exactly two properties: 'label' (string) and 'value' (number).
    3. Use 'columns' to describe what 'label' and 'value' represent (e.g., ["Product", "Sales Amount"]).
    4. If multiple files are provided (e.g., Sales and Inventory), relate them by shared keys like 'Product Code' or 'Item Code'.
    5. Provide a textual 'summary' and clear 'reasoning' explaining how you interpreted the messy legacy data.
    6. Respond ONLY in valid JSON format.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `
      User Question: ${query}
      
      Data Context:
      ${dataContext}
    `,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          reasoning: { type: Type.STRING },
          chartType: { type: Type.STRING, enum: ['line', 'bar', 'pie', 'area'] },
          columns: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Friendly names for the data points, e.g., ['Item', 'Total Sold']"
          },
          chartData: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING, description: "The x-axis category or date" },
                value: { type: Type.NUMBER, description: "The numerical metric value" }
              },
              required: ["label", "value"]
            }
          }
        },
        required: ["summary", "reasoning"]
      }
    }
  });

  try {
    const text = response.text || '{}';
    const result = JSON.parse(text);
    return result as AnalysisResult;
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("O'GradysCore was unable to interpret that query. Please refine your question or check your file structures.");
  }
};
