"use client"; // Tells Next.js this file runs in the browser, allowing us to use state

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";

// Define the shape of our memory
type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatInterface() {
  // --- STATE MANAGEMENT ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false); // Helps disable the input while waiting

  // --- ACTIONS ---
  const handleClearChat = () => {
    setMessages([]);
  };

const handleSendMessage = async (prompt: string) => {
    // 1. Update UI with User Message
    const userMessage: Message = { role: "user", content: prompt };
    setMessages((prev) => [...prev, userMessage]);
    setIsProcessing(true);

    // 2. Prepare Placeholder for AI
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      // 3. Prepare the Data Package
      const formData = new FormData();
      formData.append("prompt", prompt); // TODO: Please add more granular fields in the form data otherwise just send raw bytes or string
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      // 4. Call our Next.js Bridge
      const response = await fetch("/api/chat", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Backend connection failed");

      // 5. READ THE STREAM
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;

          // Update the last message (the AI's) in real-time
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1].content = fullContent;
            return updated;
          });
        }
      }
    } catch (error) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].content = "⚠️ Error: Could not reach the AI agent.";
        return updated;
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // --- RENDER ---
  return (
    <div className="flex h-screen w-full bg-white font-sans text-gray-900">
      <Sidebar onClearChat={handleClearChat} onFileSelect={setSelectedFile} />

      {/* Main Chat Area — takes full width on mobile */}
      <div className="flex flex-col flex-grow h-full relative w-full md:w-auto">

        
        {/* Chat History Container */}
        <div className="flex-grow overflow-y-auto p-4 md:p-6 pt-16 md:pt-6 scroll-smooth">
          <div className="max-w-4xl mx-auto flex flex-col gap-2">
            
            {messages.length === 0 && (
              <div className="text-center text-gray-400 mt-20">
                Send a message to start engineering...
              </div>
            )}

            {messages.map((msg, index) => (
              <ChatMessage key={index} role={msg.role} content={msg.content} />
            ))}

          </div>
        </div>

        {/* Input Bar pinned to the bottom */}
        <ChatInput onSendMessage={handleSendMessage} isDisabled={isProcessing} />
        
      </div>
    </div>
  );
}