
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

// Define validation schema for request
const requestSchema = z.object({
    prompt: z.string().min(1, "Prompt cannot be empty")
});




export async function POST(request: Request) {
    try {
        // Check if Vertex AI client was initialized properly


        // Parse and validate request body
        const body = await request.json().catch(() => ({}));
        const result = requestSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: "Invalid request", details: result.error.format() },
                { status: 400 }
            );
        }

        const { prompt } = result.data;

        // Generate response from AI

        const response = await generateObject({
            model: google("gemini-2.5-pro"),
            prompt: `give the threejs code with smooth animation visualisation for the topic ${prompt}`,
            system: `you are a expert in threejs and animation visualisation, by your code students can understand the topic better
            it must be working in the browser with zero errors and dont include any other text in the code
            dont include any info about the code in the explanation
            `,
            schema: z.object({
                explanation: z.string().describe('A brief explanation of what the visualization demonstrates and dont ever include threejs in the explanation and dont ever include the code in the explanation '),
                code: z.string().describe('Complete HTML code with embedded CSS and JavaScript')
            }),
            maxTokens: 100000,

        });

        return NextResponse.json({
            explanation: response.object.explanation,
            code: response.object.code
        });
    } catch (error) {
        console.error("Error processing request:", error);

        return NextResponse.json(
            {
                error: "Failed to generate code",
                message: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}