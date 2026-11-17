/**
 * @file ChatComponent.tsx
 * @description Interfaz para enviar pronts a un llm a traves de la /api/chatbot
 * @author SantiagoDev
 * @date 2026-11-13
 * @version 1.0.0
 */

"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useRef, useState } from "react";

// Componente para el efecto de máquina de escribir suave
function TypewriterText({
  text,
  speed = 20,
  onUpdate,
}: {
  text: string;
  speed?: number;
  onUpdate?: () => void;
}) {
  const [displayedLength, setDisplayedLength] = useState(0);

  useEffect(() => {
    if (displayedLength >= text.length) return;

    // Si el texto llega muy rápido, avanza más caracteres por tick para no retrasarse demasiado
    const diff = text.length - displayedLength;
    const step = diff > 40 ? 3 : diff > 20 ? 2 : 1;

    const timeout = setTimeout(() => {
      setDisplayedLength((prev) => Math.min(prev + step, text.length));
    }, speed);

    return () => clearTimeout(timeout);
  }, [text, speed, displayedLength]);

  useEffect(() => {
    onUpdate?.();
  }, [displayedLength, onUpdate]);

  return <span>{text.slice(0, displayedLength)}</span>;
}

export default function ChatComponent() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ragbot", // Apunta a tu ruta de LangChain + Gemini
    }),
  });

  const isWorking = status !== "ready";
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior,
      });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }
  }, []);

  const handleTypewriterUpdate = useCallback(() => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    // Si el usuario está cerca del final, mantenemos el scroll abajo automáticamente
    const isNearBottom = scrollHeight - scrollTop - clientHeight <= 100;

    if (isNearBottom) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages, isWorking, scrollToBottom]);

  const sendPrompt = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const input = e.currentTarget.elements.namedItem(
      "message",
    ) as HTMLInputElement;

    const text = input.value.trim();
    if (!text || isWorking) return;

    sendMessage({ text });
    input.value = "";
  };

  return (
    <div className="flex flex-col justify-between min-h-96 w-full max-w-xl mx-auto gap-4 p-4">
      {/* Lista de mensajes */}
      <div
        ref={messagesContainerRef}
        className="flex flex-col gap-2 min-h-40 h-96 max-h-96 overflow-auto [scrollbar-width:none]
      [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {messages.map((m, index) => {
          // Solo animamos el último mensaje del asistente que está respondiendo
          const isLastMessage = index === messages.length - 1;

          return (
            <div
              key={m.id}
              className={`p-2 rounded text-sm ${
                m.role === "user"
                  ? "bg-blue-900/40 text-blue-200 self-end"
                  : "bg-gray-800 text-gray-200 self-start"
              }`}
            >
              <strong className="block text-xs opacity-60 mb-1">
                {m.role === "user" ? "Tú" : "Lumina bot"}
              </strong>

              {m.parts.map((part, i) =>
                part.type === "text" ? (
                  m.role === "assistant" && isLastMessage ? (
                    <TypewriterText
                      key={i}
                      text={part.text}
                      speed={25}
                      onUpdate={handleTypewriterUpdate}
                    />
                  ) : (
                    <span key={i}>{part.text}</span>
                  )
                ) : null,
              )}
            </div>
          );
        })}
        <p className="text-sm opacity-30 animate-pulse">
          {isWorking ? "Working..." : ""}
        </p>
        <div ref={messagesEndRef} />
      </div>

      {/* Formulario */}
      <form
        className="flex flex-col w-full gap-2 px-4 py-2"
        onSubmit={sendPrompt}
      >
        <div className="flex gap-2">
          <input
            id="message"
            name="message"
            className="flex-1 text-sm bg-gray-950 border px-4 py-2 rounded-full border-gray-700 text-white focus:outline-none"
            type="text"
            placeholder="✨ Pregunta algo al asistente de Óptica Lumina."
            disabled={isWorking}
          />
          <button
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-full transition-colors"
            type="submit"
            disabled={isWorking}
          >
            {isWorking ? "..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
