/**
 * @file page.tsx
 * @description Pagina para inyectar los documentos al rag bot
 * @author SantiagoDev
 * @date 2026-11-13
 * @version 1.0.0
 */

"use client";

import { useState } from "react";

export default function IngestPage() {
  const [status, setStatus] = useState<string>("");
  const [fileName, setFileName] = useState<string>("Choose a file");

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("Uploading your file, please wait...");
    setFileName(file.name);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch('/api/embed', {
        method: "POST",
        body: formData
    })

    const data = await res.json()

    if (res.ok) {
      return setStatus("File uploading ok!!");
    } else {
      return setStatus(`Error: ${data.error || "Algo salió mal"}`);
    }
  };
  return (
    <>
      <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
          <h1>Ingest File to VectorStore</h1>

          <label
            className="bg-gray-900 px-4 py-2 border border-gray-800 rounded-sm"
            htmlFor="file-upload"
          >
            {fileName}
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".pdf,.txt"
            hidden
            onChange={handleUploadFile}
          />
          <p>{status}</p>
        </main>
      </div>
    </>
  );
}
