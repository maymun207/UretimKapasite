import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a senior manufacturing/industrial engineer with 20+ years of experience.
Given an industry type and process type, suggest realistic production parameters.

RULES:
- Return ONLY valid JSON, no markdown fences, no explanation outside the JSON.
- Every numeric value must be a realistic industry average.
- Include a short "reason" string for each value explaining why you chose it.
- Use the exact field keys shown below.

For BATCH processes, return JSON in this shape:
{
  "batchSize": { "value": <number>, "reason": "<string>" },
  "batchTime": { "value": <number in hours>, "reason": "<string>" },
  "downtime": { "value": <number in hours>, "reason": "<string>" },
  "availability": { "value": <0-1 decimal>, "reason": "<string>" },
  "efficiency": { "value": <0-1 decimal>, "reason": "<string>" },
  "yieldRate": { "value": <0-1 decimal>, "reason": "<string>" }
}

For DISCRETE processes, return JSON in this shape:
{
  "cycleTime": { "value": <number in minutes>, "reason": "<string>" },
  "outputRate": { "value": <number units/hour>, "reason": "<string>" },
  "availability": { "value": <0-1 decimal>, "reason": "<string>" },
  "efficiency": { "value": <0-1 decimal>, "reason": "<string>" },
  "yieldRate": { "value": <0-1 decimal>, "reason": "<string>" }
}`;

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === "your_gemini_api_key_here") {
            return NextResponse.json(
                { error: "GEMINI_API_KEY is not configured. Add it to .env.local" },
                { status: 500 }
            );
        }

        const { industry, processType, language } = await req.json();

        if (!industry || !processType) {
            return NextResponse.json(
                { error: "Missing required fields: industry, processType" },
                { status: 400 }
            );
        }

        const ai = new GoogleGenAI({ apiKey });

        const langNote = language === "tr"
            ? "Write the 'reason' fields in Turkish."
            : "Write the 'reason' fields in English.";

        const userPrompt = `Industry: ${industry}
Process type: ${processType}
${langNote}

Suggest realistic production parameters for this industry and process type.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction: SYSTEM_PROMPT,
                temperature: 0.3,
            },
        });

        const text = response.text ?? "";

        // Strip markdown code fences if present
        const cleaned = text.replace(/```(?:json)?\s*/g, "").replace(/```/g, "").trim();

        const suggestions = JSON.parse(cleaned);

        return NextResponse.json({ suggestions });
    } catch (error: unknown) {
        console.error("AI suggest error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
