"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Bot, Send, User, Sparkles } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface CopilotChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  partName?: string;
}

export function CopilotChatPanel({ isOpen, onClose, partName }: CopilotChatPanelProps) {
  const [messages, setMessages] = useState<{role: "assistant"|"user", text: string}[]>([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  // Initialize generic chat when a new part is selected
  useEffect(() => {
    if (isOpen && partName) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages([
        { 
          role: "assistant", 
          text: `Halo! Saya NOC Copilot. Saya melihat Anda sedang menginspeksi **${partName}**. Berdasarkan riwayat on-chain dan prediksi AI, komponen ini memiliki sedikit risiko keausan. Ada yang ingin Anda tanyakan tentang prosedur servis atau pengecekan?` 
        }
      ]);
    }
  }, [isOpen, partName]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    
    // Mock response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        text: `Memeriksa manual servis pabrikan untuk ${partName}... Disarankan untuk mengecek ketebalan komponen dan jangan lupa menggunakan part OEM yang terverifikasi saat penggantian.` 
      }]);
    }, 1000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile (optional) */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            style={{ backdropFilter: "blur(4px)" }}
          />

          {/* Slide-over panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full md:w-96 flex flex-col shadow-2xl"
            style={{ 
              background: "rgba(14,14,26,0.95)", 
              borderLeft: "1px solid rgba(94, 234, 212,0.3)",
              backdropFilter: "blur(20px)"
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "rgba(94, 234, 212,0.2)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center glow-btn">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold flex items-center gap-2">NOC Copilot <Sparkles className="w-3 h-3 text-yellow-400" /></h3>
                  <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>Context: {partName || "Vehicle"}</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 rounded-lg transition-colors hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" style={{ color: "var(--solana-text-muted)" }} />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-teal-600/20 text-teal-400" : "bg-teal-500/20 text-teal-400"}`}>
                    {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div 
                    className={`p-3 rounded-2xl text-sm max-w-[80%] ${
                      msg.role === "user" 
                        ? "rounded-tr-sm bg-teal-600/20 border border-teal-500/30" 
                        : "rounded-tl-sm bg-black/40 border border-white/10"
                    }`}
                  >
                    {/* Minimal markdown-like bold processing */}
                    <p dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t" style={{ borderColor: "rgba(94, 234, 212,0.2)" }}>
              <div className="relative flex items-center">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask about this part..."
                  className="w-full bg-black/50 border outline-none rounded-xl py-3 pl-4 pr-12 text-sm transition-colors focus:border-teal-500"
                  style={{ borderColor: "rgba(255,255,255,0.1)" }}
                />
                <button 
                  onClick={handleSend}
                  className="absolute right-2 p-2 rounded-lg bg-teal-600/30 text-teal-400 hover:bg-teal-600/50 transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-center mt-2 opacity-50">Copilot uses on-chain data and AI predictions.</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
