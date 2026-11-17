/**
 * @file combineDocuments.ts
 * @description combinar los documentos para obtener un solo string
 * @author Santiago
 * @date 2026-11-11
 * @version 1.0.0
 */

import { Document } from "langchain";

// ===================================================================
// combinar los documentos para obtener un solo string mapeando todo
// antes de unirlo a la answerTemplate
// ===================================================================

export function combineDocuments(docs: Document[]) {
  return docs.map((doc) => doc.pageContent).join("\n\n");
}