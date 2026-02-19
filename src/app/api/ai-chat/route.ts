import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import {
    AGENT_MODEL,
    AGENT_GENERATION_CONFIG,
    buildSystemInstruction,
    type AgentContext,
} from "@/lib/agentConfig";

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === "your_gemini_api_key_here") {
            return NextResponse.json(
                { error: "GEMINI_API_KEY is not configured. Add it to .env.local" },
                { status: 500 }
            );
        }

        const { messages, language, context } = await req.json();

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json(
                { error: "Missing or invalid messages array." },
                { status: 400 }
            );
        }

        const ai = new GoogleGenAI({ apiKey });

        /* Build the full system instruction from agentConfig.ts */
        const systemInstruction = buildSystemInstruction(
            language ?? "en",
            (context ?? {}) as AgentContext
        );

        /* Convert frontend message format to Gemini contents format */
        const contents = messages.map((m: { role: string; text: string }) => ({
            role: m.role,
            parts: [{ text: m.text }],
        }));

        /* Stream the response for a real-time typing experience */
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const response = await ai.models.generateContentStream({
                        model: AGENT_MODEL,
                        contents,
                        config: {
                            systemInstruction,
                            ...AGENT_GENERATION_CONFIG,
                        },
                    });

                    for await (const chunk of response) {
                        const text = chunk.text ?? "";
                        if (text) {
                            controller.enqueue(new TextEncoder().encode(text));
                        }
                    }
                    controller.close();
                } catch (err) {
                    const message = err instanceof Error ? err.message : "Unknown streaming error";
                    controller.enqueue(new TextEncoder().encode(`__ERROR__:${message}`));
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Transfer-Encoding": "chunked",
                "X-Content-Type-Options": "nosniff",
            },
        });
    } catch (error: unknown) {
        console.error("AI chat error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
