/**
 * @file route.ts
 * @description Rag chat bot con db vectorial
 * @author SantiagoDev
 * @date 2026-11-14
 * @version 1.0.0
 */

import { combineDocuments } from "@/lib/combineDocuments";
import { formatConvHistory } from "@/lib/formatConvHistory";
import { retrieval } from "@/lib/retrieval";
import { toUIMessageStream } from "@ai-sdk/langchain";
import { UIMessage } from "@ai-sdk/react";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatGoogle } from "@langchain/google";
import { createUIMessageStreamResponse } from "ai";

export const maxDuration = 30;
export async function POST(request: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await request.json();
    // ===================================================================
    // Extraemos el mensaje aterior del usuario
    // TODO historyMessage funtion para pasarla al final chain
    // ===================================================================

    // ===================================================================
    // extraemos el ultimo mensaje del usuario
    // ===================================================================
    const historyMessage = messages.slice(0, -1);
    const lastUserMessage = messages[messages.length - 1];

    const currentQuestion =
      lastUserMessage?.parts
        ?.filter((part) => part.type === "text")
        .map((part) => (part as { type: "text"; text: string }).text)
        .join("") || "";

    if (!currentQuestion) {
      return Response.json(
        { error: "No se proporcionó un mensaje" },
        { status: 400 },
      );
    }

    const googleApiKey = process.env.GEMINI_API_KEY;
    if (!googleApiKey) throw new Error("Error no google api key");

    const llm = new ChatGoogle({
      apiKey: googleApiKey,
      model: "gemini-3.5-flash-lite",
    });

    const standaloneQuestionTemplate =
      `Dame una pregunta, conviertela a una pregunta independiente.  
      Historial de conversación: {conv_history} 
      question: {question} pregunta independiente`;

      console.log("last/////>>> ", standaloneQuestionTemplate)
    const standaloneQuestionPrompt = PromptTemplate.fromTemplate(
      standaloneQuestionTemplate,
    );
console.log("last/////>prompt>> ", standaloneQuestionPrompt)
    const answerTemplate = `Tu eres un ayudante y enttusiasta bot de sorporte que puede responder
preguntas sobre Óptica Lumina basado en el contexto subministrado. trata de buscar una respuesta
en el contexto y si no conoces la repuesta, di "Lo siento no tengo una respuesta" y 
piden que escriban a help@opticalumina.com para pedir ayuda a soporte.
context: {context} 
question: {question}
Historial de conversación: {conv_history}
answer:
`; // <- {context} se reciben de la tienda de vectores

    const answerPromt = PromptTemplate.fromTemplate(answerTemplate);

    const retrievalChain = standaloneQuestionPrompt
      .pipe(llm)
      .pipe(new StringOutputParser())
      .pipe(retrieval)
      .pipe(combineDocuments);

    const finalChain = RunnableSequence.from([
      {
        context: retrievalChain,
        question: (input: { question: string; conv_history: string }) =>
          input.question,
        conv_history: (input: { question: string; conv_history: string }) =>
          input.conv_history,
      },
      answerPromt,
      llm,
    ]);

    const stream = await finalChain.stream({
      question: currentQuestion,
      conv_history: formatConvHistory(historyMessage),
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream(stream),
    });
  } catch (error) {
    console.log("Error en la ruta de ragbot: ", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 },
    );
  }
}
