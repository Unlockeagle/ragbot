import { UIMessage } from "@ai-sdk/react";

function formatConvHistory(messages: UIMessage[]): string {
  return messages
    .map((msg) => {
      const text =
        msg.parts
          ?.filter((part) => part.type === "text")
          .map((part) => (part as { type: "text"; text: string }).text)
          .join("") || "";
      const role = msg.role === "user" ? "Human" : "Assistant";
      return `${role}: ${text}`;
    })
    .join("\n");
}

export { formatConvHistory };
