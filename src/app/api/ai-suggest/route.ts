import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

/* ── Base prompt: capacity parameters only ── */
const CAPACITY_PROMPT_BATCH = `For BATCH processes, return JSON with these capacity fields:
{
  "batchSize": { "value": <number>, "reason": "<string>" },
  "batchTime": { "value": <number in hours>, "reason": "<string>" },
  "downtime": { "value": <number in hours>, "reason": "<string>" },
  "availability": { "value": <0-1 decimal>, "reason": "<string>" },
  "efficiency": { "value": <0-1 decimal>, "reason": "<string>" },
  "yieldRate": { "value": <0-1 decimal>, "reason": "<string>" }
}`;

const CAPACITY_PROMPT_DISCRETE = `For DISCRETE processes, return JSON with these capacity fields:
{
  "cycleTime": { "value": <number in minutes>, "reason": "<string>" },
  "outputRate": { "value": <number units/hour>, "reason": "<string>" },
  "availability": { "value": <0-1 decimal>, "reason": "<string>" },
  "efficiency": { "value": <0-1 decimal>, "reason": "<string>" },
  "yieldRate": { "value": <0-1 decimal>, "reason": "<string>" }
}`;

/* ── Cost fields — appended when suggestCosts is true ── */
const COST_PROMPT = `

ALSO include these cost fields in the SAME JSON object (all values in USD):
  "rawMaterialCost": { "value": <number in $/batch or $/unit>, "reason": "<string>" },
  "laborCostPerHour": { "value": <number in $/hr>, "reason": "<string>" },
  "energyRate": { "value": <number in $/kWh>, "reason": "<string>" },
  "machinePower": { "value": <number in kW>, "reason": "<string>" },
  "overheadRate": { "value": <0-1 decimal, e.g. 0.15 = 15%>, "reason": "<string>" }

Use realistic market rates for the given country/region. If no country is specified, use global averages.`;

function buildSystemPrompt(processType: string, suggestCosts: boolean): string {
    let prompt = `You are a senior manufacturing/industrial engineer with 20+ years of experience.
Given an industry type, process type, and optionally a country, suggest realistic production parameters.

RULES:
- Return ONLY valid JSON, no markdown fences, no explanation outside the JSON.
- Every numeric value must be a realistic industry average for the given country/region.
- Include a short "reason" string for each value explaining why you chose it.
- Use the exact field keys shown below.

`;
    prompt += processType === "batch" ? CAPACITY_PROMPT_BATCH : CAPACITY_PROMPT_DISCRETE;
    if (suggestCosts) prompt += COST_PROMPT;
    return prompt;
}

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === "your_gemini_api_key_here") {
            return NextResponse.json(
                { error: "GEMINI_API_KEY is not configured. Add it to .env.local" },
                { status: 500 }
            );
        }

        const { industry, processType, language, country, suggestCosts } = await req.json();

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

        const countryNote = country
            ? `Country/Region: ${country}`
            : "Country/Region: Not specified (use global averages)";

        const userPrompt = `Industry: ${industry}
Process type: ${processType}
${countryNote}
${langNote}

Suggest realistic production parameters for this industry and process type.`;

        const systemPrompt = buildSystemPrompt(processType, suggestCosts !== false);

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction: systemPrompt,
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
