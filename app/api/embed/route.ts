/**
 * @file route.ts
 * @description Permite hacer el embeding de los archivos .pdf y .txt en supabase con google
 * @author SantiagoDev
 * @date 2026-11-13
 * @version 1.0.0
 */



import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Document } from "langchain";
import { createClient } from "@supabase/supabase-js";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";

export async function POST(request: Request) {
  const sbApiKey = process.env.SUPABASE_API_KEY;
  if (!sbApiKey) throw new Error("Expected env var SUPABASE_API_KEY");

  const sbUrl = process.env.SUPABASE_URL_LC_CHATBOT;
  if (!sbUrl) throw new Error("Expected env var SUPABASE_URL_LC_CHATBOT");

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) throw new Error("Expected env var GEMINI_API_KEY");
  try {
    const formData = await request.formData();

    const file = (formData.get("file") as File) || null;

    if (!file) {
      return Response.json(
        { error: "No se proporcionó ningún archivo." },
        { status: 400 },
      );
    }

    let docs: Document[] = [];

    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      const loader = new PDFLoader(file);
      docs = await loader.load();
    } else if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      const text = await file.text();

      docs = [
        new Document({
          pageContent: text,
          metadata: { source: file.name },
        }),
      ];
    } else {
      return Response.json(
        {
          error: "Formato no soportado",
        },
        { status: 400 },
      );
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      separators: ["\n\n", "\n", " ", ""],
      chunkOverlap: 50,
    });

    const chunks = await splitter.splitDocuments(docs);

    console.log("Archivo recibido:", file.name, "Tamaño:", file.size);

    const client = createClient(sbUrl, sbApiKey);

    const embedding = new GoogleGenerativeAIEmbeddings({
      model: "gemini-embedding-001",
      outputDimensionality: 768,
      apiKey: geminiApiKey,
    });
    console.log("Probando conexión con embeddings de Gemini...");
    const testVector = await embedding.embedQuery("Prueba");
    console.log("Conexión exitosa. Dimensión:", testVector.length);
    // Puedes ajustar la cantidad de fragmentos a subir si lo necesitas
    console.info(`Subiendo fragmentos a la tabla 'documents' en Supabase...`);

    await SupabaseVectorStore.fromDocuments(chunks, embedding, {
      client,
      tableName: "documents",
    });

    return Response.json({
      message: "Archivo subido correctamente al VectorStorage",
      fileName: file.name,
    });
  } catch (error) {
    console.error("Error en la ruta del ingest:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 },
    );
  }
}
