/**
 * @file retrieval.ts
 * @description Recuperardor del vector storage
 * @author SantiagoDev
 * @date 2026-11-14
 * @version 1.0.0
 */

import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { createClient } from "@supabase/supabase-js";

const googleApiKey = process.env.GEMINI_API_KEY;
if (!googleApiKey) throw new Error("Error no google api key");

const sbApiKey = process.env.SUPABASE_API_KEY;
if (!sbApiKey) throw new Error("Expected env var SUPABASE_API_KEY");

const sbUrl = process.env.SUPABASE_URL_LC_CHATBOT;
if (!sbUrl) throw new Error("Expected env var SUPABASE_URL_LC_CHATBOT");

const embedding = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001",
  outputDimensionality: 768,
  apiKey: googleApiKey,
});

const client = createClient(sbUrl, sbApiKey);

const vectorStorage = new SupabaseVectorStore(embedding, {
  client,
  tableName: "documents",
  queryName: "match_documents",
});

const retrieval = vectorStorage.asRetriever();

export { retrieval };
