import React, { useState } from "react";

interface ChatInputProps {
  onSendMessage: (prompt: string) => void;
  isDisabled: boolean;
}

export default function ChatInput({ onSendMessage, isDisabled }: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isDisabled) {
      onSendMessage(input);
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isDisabled) {
        onSendMessage(input);
        setInput("");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full p-3 md:p-4 bg-white border-t border-gray-200">
      <div className="max-w-4xl mx-auto flex gap-2 md:gap-4">
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          placeholder="Ask about specs..."
          className="flex-grow p-3 md:p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 resize-none text-sm md:text-base"
          style={{ minHeight: "48px", maxHeight: "120px" }}
        />
        <button
          type="submit"
          disabled={!input.trim() || isDisabled}
          className="px-4 md:px-6 py-3 md:py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors text-sm md:text-base shrink-0"
        >
          Send
        </button>
      </div>
    </form>
  );
}