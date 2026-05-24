import React from "react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={`flex w-full py-2 md:py-4 ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[90%] md:max-w-[80%] rounded-lg p-3 md:p-4 text-sm md:text-base ${
          isUser
            ? "bg-blue-600 text-white rounded-br-none"
            : "bg-gray-100 text-gray-900 rounded-bl-none border border-gray-200"
        }`}
      >
        <div className="font-semibold text-xs mb-1 opacity-75">
          {isUser ? "You" : "KUAVA AI"}
        </div>
        <div className="whitespace-pre-wrap">{content}</div>
      </div>
    </div>
  );
}