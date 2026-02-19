"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bot,
    X,
    Send,
    Trash2,
    Loader2,
    Sparkles,
    ChevronDown,
} from "lucide-react";
import type { CapacityResults, CostResults } from "@/lib/calculations";

/* ─── Types ─── */
interface Message {
    id: string;
    role: "user" | "model";
    text: string;
    isStreaming?: boolean;
}

interface ChatContext {
    industry?: string;
    processType?: "batch" | "discrete";
    country?: string;
    results?: CapacityResults | null;
    costResults?: CostResults | null;
}

interface AIChatProps {
    context?: ChatContext;
}

/* ─── Helpers ─── */
function uid() {
    return Math.random().toString(36).slice(2, 9);
}

/* Render assistant text — convert **bold** and line breaks */
function renderText(text: string) {
    return text.split("\n").map((line, i) => {
        // Bold: **text**
        const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
            p.startsWith("**") && p.endsWith("**") ? (
                <strong key={j} className="text-white/90 font-bold">
                    {p.slice(2, -2)}
                </strong>
            ) : (
                p
            )
        );
        return (
            <span key={i}>
                {parts}
                {i < text.split("\n").length - 1 && <br />}
            </span>
        );
    });
}

/* ─── Main Component ─── */
export default function AIChat({ context }: AIChatProps) {
    const { t, i18n } = useTranslation();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Suggestions from i18n (may be array or string)
    const rawSuggestions = t("chat.suggestions", { returnObjects: true });
    const suggestions: string[] = Array.isArray(rawSuggestions)
        ? (rawSuggestions as string[])
        : [];

    /* Auto-scroll to bottom */
    const scrollToBottom = useCallback((smooth = true) => {
        bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    }, []);

    useEffect(() => {
        if (open) {
            setTimeout(() => scrollToBottom(false), 50);
            inputRef.current?.focus();
        }
    }, [open, scrollToBottom]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    /* Show scroll-to-bottom button when user scrolls up */
    const handleScroll = () => {
        const el = listRef.current;
        if (!el) return;
        const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        setShowScrollBtn(distFromBottom > 120);
    };

    /* Send message */
    const sendMessage = useCallback(
        async (text: string) => {
            const trimmed = text.trim();
            if (!trimmed || isLoading) return;

            const userMsg: Message = { id: uid(), role: "user", text: trimmed };
            const assistantId = uid();
            const assistantMsg: Message = {
                id: assistantId,
                role: "model",
                text: "",
                isStreaming: true,
            };

            setMessages((prev) => [...prev, userMsg, assistantMsg]);
            setInput("");
            setIsLoading(true);

            /* Build history for API (all previous messages + new user msg) */
            const history = [
                ...messages.map((m) => ({ role: m.role, text: m.text })),
                { role: "user", text: trimmed },
            ];

            try {
                const res = await fetch("/api/ai-chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        messages: history,
                        language: i18n.language,
                        context: context ?? {},
                    }),
                });

                if (!res.ok || !res.body) {
                    throw new Error("Request failed");
                }

                /* Stream the response */
                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let accumulated = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });

                    // Check for error marker
                    if (chunk.startsWith("__ERROR__:")) {
                        accumulated = chunk.replace("__ERROR__:", "");
                        break;
                    }
                    accumulated += chunk;

                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === assistantId
                                ? { ...m, text: accumulated, isStreaming: true }
                                : m
                        )
                    );
                }

                /* Finalize */
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === assistantId
                            ? { ...m, text: accumulated || t("chat.errorMessage"), isStreaming: false }
                            : m
                    )
                );
            } catch {
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === assistantId
                            ? { ...m, text: t("chat.errorMessage"), isStreaming: false }
                            : m
                    )
                );
            } finally {
                setIsLoading(false);
            }
        },
        [messages, isLoading, i18n.language, context, t]
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    const clearChat = () => {
        setMessages([]);
        setInput("");
    };

    return (
        <>
            {/* ── Floating trigger button ── */}
            <motion.button
                type="button"
                onClick={() => setOpen((o) => !o)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl
                           bg-gradient-to-br from-purple-600 to-ardic-cyan
                           flex items-center justify-center
                           shadow-[0_0_30px_rgba(0,209,255,0.25)]
                           hover:shadow-[0_0_40px_rgba(0,209,255,0.4)]
                           transition-shadow duration-300"
                aria-label="Open AI Chat"
            >
                <AnimatePresence mode="wait">
                    {open ? (
                        <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                            <X size={22} className="text-white" />
                        </motion.div>
                    ) : (
                        <motion.div key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                            <Bot size={22} className="text-white" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Pulse ring when closed */}
                {!open && (
                    <span className="absolute inset-0 rounded-2xl animate-ping bg-ardic-cyan/20 pointer-events-none" />
                )}
            </motion.button>

            {/* ── Chat panel ── */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-24px)]
                                   rounded-2xl overflow-hidden
                                   bg-ardic-surface/95 backdrop-blur-xl
                                   border border-white/10
                                   shadow-2xl shadow-black/60
                                   flex flex-col"
                        style={{ height: "520px" }}
                    >
                        {/* ── Header ── */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-ardic-cyan flex items-center justify-center">
                                    <Bot size={14} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-wider text-white/80">
                                        {t("chat.title")}
                                    </p>
                                    <p className="text-[9px] font-bold tracking-widest text-white/25 uppercase flex items-center gap-1">
                                        <Sparkles size={8} className="text-purple-400" />
                                        {t("chat.subtitle")}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {messages.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={clearChat}
                                        title={t("chat.clear")}
                                        className="p-1.5 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/5 transition-colors"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="p-1.5 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/5 transition-colors"
                                >
                                    <X size={13} />
                                </button>
                            </div>
                        </div>

                        {/* ── Context pill (when context is available) ── */}
                        {context?.industry && (
                            <div className="px-4 py-2 border-b border-white/5 shrink-0">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-ardic-cyan/60" />
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/30">
                                        {context.processType === "batch" ? "Batch" : "Discrete"} · {context.industry}
                                        {context.country ? ` · ${context.country}` : ""}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* ── Message list ── */}
                        <div
                            ref={listRef}
                            onScroll={handleScroll}
                            className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin"
                        >
                            {/* Empty state: suggestions */}
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full gap-4 pb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-ardic-cyan/20 border border-white/10 flex items-center justify-center">
                                        <Bot size={22} className="text-ardic-cyan/60" />
                                    </div>
                                    <p className="text-[10px] text-white/25 font-bold uppercase tracking-wider text-center px-6">
                                        {t("chat.placeholder")}
                                    </p>
                                    <div className="w-full space-y-2">
                                        {suggestions.map((s, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => sendMessage(s)}
                                                className="w-full text-left px-3 py-2 rounded-xl
                                                           bg-white/[0.03] border border-white/5
                                                           text-[11px] text-white/40 font-medium
                                                           hover:bg-white/[0.06] hover:text-white/60 hover:border-white/10
                                                           transition-all duration-200"
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Messages */}
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    {msg.role === "model" && (
                                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500/30 to-ardic-cyan/30 border border-white/10 flex items-center justify-center mr-2 mt-0.5 shrink-0">
                                            <Bot size={12} className="text-ardic-cyan/80" />
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[80%] rounded-xl px-3 py-2.5 text-[12px] leading-relaxed
                                            ${msg.role === "user"
                                                ? "bg-gradient-to-br from-purple-500/25 to-ardic-cyan/25 border border-purple-400/20 text-white/80 rounded-tr-sm"
                                                : "bg-white/[0.04] border border-white/5 text-white/65 rounded-tl-sm"
                                            }`}
                                    >
                                        {msg.role === "model" ? (
                                            <>
                                                {renderText(msg.text)}
                                                {msg.isStreaming && (
                                                    <span className="inline-block w-1 h-3 ml-0.5 bg-ardic-cyan/60 animate-pulse rounded-sm align-middle" />
                                                )}
                                            </>
                                        ) : (
                                            msg.text
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Thinking indicator */}
                            {isLoading && messages[messages.length - 1]?.text === "" && (
                                <div className="flex items-center gap-2 pl-8">
                                    <Loader2 size={12} className="animate-spin text-purple-400" />
                                    <span className="text-[10px] text-white/25">{t("chat.thinking")}</span>
                                </div>
                            )}

                            <div ref={bottomRef} />
                        </div>

                        {/* Scroll to bottom button */}
                        <AnimatePresence>
                            {showScrollBtn && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    type="button"
                                    onClick={() => scrollToBottom()}
                                    className="absolute bottom-20 right-4 w-7 h-7 rounded-full
                                               bg-ardic-surface border border-white/10
                                               flex items-center justify-center
                                               text-white/40 hover:text-white/70
                                               shadow-lg transition-colors"
                                >
                                    <ChevronDown size={14} />
                                </motion.button>
                            )}
                        </AnimatePresence>

                        {/* ── Input area ── */}
                        <form
                            onSubmit={handleSubmit}
                            className="shrink-0 px-3 py-3 border-t border-white/5 flex items-end gap-2"
                        >
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={t("chat.placeholder")}
                                rows={1}
                                disabled={isLoading}
                                className="flex-1 resize-none bg-white/[0.04] border border-white/8 rounded-xl
                                           px-3 py-2.5 text-[12px] text-white/70 placeholder:text-white/20
                                           focus:outline-none focus:border-ardic-cyan/30 focus:bg-white/[0.06]
                                           transition-all duration-200 max-h-28 scrollbar-thin
                                           disabled:opacity-40"
                                style={{ lineHeight: "1.4" }}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                                           bg-gradient-to-br from-purple-500 to-ardic-cyan
                                           text-white disabled:opacity-30 disabled:cursor-not-allowed
                                           hover:shadow-[0_0_15px_rgba(0,209,255,0.3)]
                                           transition-all duration-200"
                                aria-label={t("chat.send")}
                            >
                                {isLoading ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <Send size={14} />
                                )}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
