"use client";

import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/hooks/use-socket";
import { useAuthStore } from "@/stores/auth.store";

interface ChatMsg {
  id: string;
  username: string;
  message: string;
  likes: number;
  createdAt: string;
}

function avatarColor(name: string) {
  const colors = [
    "#e74c3c","#e67e22","#f39c12","#2ecc71",
    "#1abc9c","#3498db","#9b59b6","#e91e63",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function ChatPanel({ onlineCount = 0 }: { onlineCount?: number }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated } = useAuthStore();
  const { socketRef } = useSocket();

  const scrollBottom = (smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const onHistory = (history: ChatMsg[]) => {
      setMessages(history);
      setTimeout(() => scrollBottom(false), 100);
    };

    const onMessage = (msg: ChatMsg) => {
      setMessages((prev) => [...prev.slice(-199), msg]);
      setTimeout(() => scrollBottom(), 50);
    };

    const onLiked = ({ messageId, likes }: { messageId: string; likes: number }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, likes } : m))
      );
    };

    socket.on("chat:history", onHistory);
    socket.on("chat:message", onMessage);
    socket.on("chat:liked", onLiked);

    return () => {
      socket.off("chat:history", onHistory);
      socket.off("chat:message", onMessage);
      socket.off("chat:liked", onLiked);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketRef.current]);

  const sendMessage = () => {
    const socket = socketRef.current;
    if (!input.trim() || !socket || !user || sending) return;
    setSending(true);
    socket.emit("chat:send", { userId: user.id, message: input.trim() });
    setInput("");
    setTimeout(() => setSending(false), 2100);
  };

  const handleLike = (msgId: string) => {
    socketRef.current?.emit("chat:like", { messageId: msgId });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="bg-[#0d1b2a]/60 rounded-xl border border-[#1b3a4b] flex flex-col h-[calc(100vh-8rem)] overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-[#1b3a4b] flex items-center gap-2 bg-[#0a1628]/50">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-white text-sm font-semibold">Live Chat</span>
        {onlineCount > 0 && (
          <span className="ml-auto text-[11px] text-gray-500">
            {onlineCount.toLocaleString()} online
          </span>
        )}
      </div>

      {/* Message feed */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-2">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600 text-xs text-center">No messages yet. Be the first!</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className="flex items-start gap-2 py-1.5 hover:bg-[#1a2332]/30 px-1 rounded-lg transition-colors group"
          >
            {/* Avatar */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white mt-0.5"
              style={{ background: avatarColor(msg.username) }}
            >
              {msg.username[0]?.toUpperCase()}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[12px] font-semibold text-emerald-400">
                  {msg.username}
                </span>
                <span className="text-[10px] text-gray-600">
                  {new Date(msg.createdAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </span>
              </div>
              <p className="text-[12px] text-gray-300 break-words leading-relaxed">
                {msg.message}
              </p>
            </div>

            {/* Like button — show on hover */}
            <button
              onClick={() => handleLike(msg.id)}
              className="flex items-center gap-1 ml-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            >
              <span className="text-[11px] hover:text-amber-400 text-gray-500 transition-colors">👍</span>
              {msg.likes > 0 && (
                <span className="text-[10px] text-amber-400 font-medium">{msg.likes}</span>
              )}
            </button>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-[#1b3a4b] bg-[#0a1628]/50">
        {isAuthenticated ? (
          <>
            <div className="flex items-center gap-2 px-3 pt-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Send message"
                maxLength={500}
                className="flex-1 bg-[#1a2332] border border-[#2a3a4d] rounded-lg px-3 py-2
                  text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50
                  focus:ring-1 focus:ring-emerald-500/20 transition-colors"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30
                  flex items-center justify-center text-emerald-400 hover:bg-emerald-500/30
                  transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0 text-lg"
              >
                ↑
              </button>
            </div>
            <div className="flex items-center gap-3 px-3 py-2 text-xs text-gray-600">
              <span>😀 GIF</span>
              <span>🌧 Rain</span>
              <span className="ml-auto">{input.length}/500</span>
            </div>
          </>
        ) : (
          <div className="px-3 py-3 text-center text-xs text-gray-600">
            Login to join the chat
          </div>
        )}
      </div>
    </div>
  );
}
