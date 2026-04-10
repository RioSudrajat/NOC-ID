"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronRight, ChevronLeft, Bot, User, Send, Sparkles } from "lucide-react";

export function GlobalCopilotSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [messages, setMessages] = useState<{role: "assistant"|"user", text: string}[]>([
    { role: "assistant", text: "Halo! Saya NOC Copilot. Tanyakan apa saja seputar data on-chain, status kendaraan, atau prediksi maintenance." }
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isCollapsed && endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isCollapsed]);

  useEffect(() => {
    const handleOpen = () => setIsCollapsed(false);
    window.addEventListener("open-copilot", handleOpen, { passive: true });
    return () => window.removeEventListener("open-copilot", handleOpen);
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        text: `Menganalisis permintaan Anda... Berdasarkan data *on-chain* terbaru, semuanya beroperasi dalam batas normal. Ada hal spesifik yang ingin dicek?` 
      }]);
    }, 1000);
  };

  return (
    <aside
      className={`hidden md:flex flex-col min-h-screen border-l relative transition-all duration-300 ease-in-out shrink-0 z-40 ${isCollapsed ? 'w-16 items-center cursor-pointer hover:bg-white/5' : 'w-80 sm:w-96'}`}
      style={{ background: "var(--solana-dark-2)", borderColor: "rgba(94, 234, 212,0.4)", boxShadow: "-2px 0 20px rgba(0,0,0,0.4)" }}
      onClick={() => { if (isCollapsed) setIsCollapsed(false) }}
    >
      <button 
        onClick={(e) => { e.stopPropagation(); setIsCollapsed(!isCollapsed); }}
        className="absolute -left-3 top-8 rounded-full p-1.5 text-white z-10 transition-transform hover:scale-110 shadow-lg cursor-pointer"
        style={{ background: "var(--solana-purple)" }}
      >
        {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {isCollapsed ? (
        <div className="flex flex-col items-center gap-4 pt-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center glow-btn shrink-0">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div className="mt-8 flex items-center justify-center h-32">
            <span className="text-sm font-bold tracking-widest whitespace-nowrap" style={{ color: "var(--solana-text-muted)", transform: "rotate(-90deg)" }}>
              AI COPILOT
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full w-full">
          {/* Header */}
          <div className="p-6 border-b flex items-center gap-3" style={{ borderColor: "rgba(94, 234, 212,0.1)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center glow-btn shrink-0">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg flex items-center gap-2">NOC Copilot <Sparkles className="w-4 h-4 text-yellow-400" /></h2>
              <p className="text-xs" style={{ color: "var(--solana-text-muted)" }}>Global AI Assistant</p>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-teal-600/20 text-teal-400" : "bg-teal-500/20 text-teal-400"}`}>
                  {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div 
                  className={`p-3 rounded-2xl text-sm max-w-[85%] ${
                    msg.role === "user" 
                      ? "rounded-tr-sm bg-teal-600/20 border border-teal-500/30" 
                      : "rounded-tl-sm bg-black/40 border border-white/10"
                  }`}
                >
                  <p dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t" style={{ borderColor: "rgba(94, 234, 212,0.1)" }}>
            <div className="relative flex items-center">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask Copilot..."
                className="w-full border outline-none rounded-xl py-3 pl-4 pr-12 text-sm transition-all focus:border-teal-500"
                style={{ background: "rgba(20,20,40,0.5)", borderColor: "rgba(255,255,255,0.1)" }}
              />
              <button 
                onClick={handleSend}
                className="absolute right-2 p-2 rounded-lg text-white hover:opacity-80 transition-opacity cursor-pointer glow-btn"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
