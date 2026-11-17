/**
 * @file route.ts
 * @description Permite enviar pronpts al un llm de google 
 * @author SantiagoDev
 * @date 2026-11-13
 * @version 1.0.0
 */



import { ChatGoogle } from "@langchain/google";
import { SystemMessage } from "@langchain/core/messages";
import { NextRequest } from "next/server";
import { toBaseMessages, toUIMessageStream } from "@ai-sdk/langchain";
import { createUIMessageStreamResponse, UIMessage } from "ai";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const { messages }: { messages: UIMessage[] } = await request.json();

    const googleApiKey = process.env.GEMINI_API_KEY;
    const llm = new ChatGoogle({
      apiKey: googleApiKey,
      model: "gemini-3.5-flash-lite",
      temperature: 0,
    });

    // Convertir los UIMessages de AI SDK a mensajes base de LangChain
    const baseMessages = await toBaseMessages(messages);

    // Agregar la instrucción del sistema al inicio del historial
    const langchainMessages = [
      new SystemMessage(
        "You are a helpful assistant that translates English to Italian. Translate the user sentence. you have to speak like a cat"      ),
      ...baseMessages,
    ];

    // Generar el stream desde LangChain
    const stream = await llm.stream(langchainMessages);

    // Convertir el stream de LangChain al formato compatible con la UI de AI SDK
    return createUIMessageStreamResponse({
      stream: toUIMessageStream(stream),
    });
  } catch (error) {
    console.error("Error en la ruta del chatbot:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 },
    );
  }
}
