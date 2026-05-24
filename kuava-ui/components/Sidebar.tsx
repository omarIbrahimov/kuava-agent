import React, { useState } from "react";

interface SidebarProps {
  onClearChat: () => void;
  onFileSelect: (file: File | null) => void;
}

export default function Sidebar({ onClearChat, onFileSelect }: SidebarProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFileName(file ? file.name : null);
    onFileSelect(file);
  };

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-gray-200 rounded-lg shadow-sm"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50
          w-72 bg-gray-50 border-r border-gray-200 h-screen p-6 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:relative md:translate-x-0 md:w-80 md:z-auto
        `}
      >
        {/* Close button (mobile only) */}
        <button
          className="md:hidden absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
          onClick={() => setIsOpen(false)}
        >
          ✕
        </button>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-2">⚙️ KUAVA AI</h2>
          <p className="text-xs text-gray-500">
            Powered by Gemma 4 & Internal Notion Specs (Secured via Tailscale)
          </p>
        </div>

        <div className="mb-8 flex-grow">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Attachment Dropzone</h3>
          <p className="text-xs text-gray-500 mb-4">Upload image spec sheets or schematics here.</p>
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50">
            <div className="flex flex-col items-center justify-center pt-5 pb-6 px-2 text-center">
              <span className="text-sm text-gray-500 break-all">
                {fileName ? fileName : "Click to upload (PNG, JPG)"}
              </span>
            </div>
            <input
              type="file"
              className="hidden"
              accept=".png, .jpg, .jpeg"
              onChange={handleFileChange}
            />
          </label>
        </div>

        <button
          onClick={() => { onClearChat(); setIsOpen(false); }}
          className="w-full py-2 px-4 bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 transition-colors text-sm font-semibold"
        >
          Clear Chat History
        </button>
      </div>
    </>
  );
}