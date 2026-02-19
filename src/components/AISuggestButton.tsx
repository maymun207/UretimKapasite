"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Check, Loader2, AlertCircle } from "lucide-react";

export interface AISuggestion {
    value: number;
    reason: string;
}

export type AISuggestions = Record<string, AISuggestion>;

interface AISuggestButtonProps {
    industry: string;
    processType: "batch" | "discrete";
    country?: string;
    onApply: (suggestions: AISuggestions) => void;
}

export default function AISuggestButton({ industry, processType, country, onApply }: AISuggestButtonProps) {
    const { t, i18n } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<AISuggestions | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showPanel, setShowPanel] = useState(false);

    const fetchSuggestions = async () => {
        if (!industry) {
            setError(t("ai.selectIndustryFirst"));
            setShowPanel(true);
            return;
        }

        setLoading(true);
        setError(null);
        setSuggestions(null);
        setShowPanel(true);

        try {
            const res = await fetch("/api/ai-suggest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    industry,
                    processType,
                    language: i18n.language,
                    country: country || undefined,
                    suggestCosts: true,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Unknown error");
                return;
            }

            setSuggestions(data.suggestions);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Network error");
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        if (suggestions) {
            onApply(suggestions);
            setShowPanel(false);
        }
    };

    /* ── Field label map ─── */
    const fieldLabels: Record<string, string> = {
        batchSize: t("form.batch.batchSize"),
        batchTime: t("form.batch.batchTime"),
        downtime: t("form.batch.downtime"),
        cycleTime: t("form.discrete.cycleTime"),
        outputRate: t("form.discrete.outputRate"),
        availability: t("form.common.availability"),
        efficiency: t("form.common.efficiency"),
        yieldRate: t("form.common.yieldRate"),
        rawMaterialCost: t("cost.rawMaterial"),
        laborCostPerHour: t("cost.laborCost"),
        energyRate: t("cost.energyRate"),
        machinePower: t("cost.machinePower"),
        overheadRate: t("cost.overhead"),
    };

    return (
        <div className="relative">
            {/* Trigger button */}
            <button
                type="button"
                onClick={fetchSuggestions}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider
                           bg-gradient-to-r from-purple-500/20 to-ardic-cyan/20 border border-purple-400/20
                           text-purple-300 hover:text-white hover:border-purple-400/40
                           hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]
                           transition-all duration-300 disabled:opacity-50"
            >
                {loading ? (
                    <Loader2 size={14} className="animate-spin" />
                ) : (
                    <Sparkles size={14} />
                )}
                {t("ai.suggest")}
            </button>

            {/* Suggestion Panel */}
            <AnimatePresence>
                {showPanel && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-full mt-3 w-[380px] max-h-[500px] overflow-y-auto
                                   rounded-2xl bg-ardic-surface/95 backdrop-blur-xl border border-white/10
                                   shadow-2xl shadow-black/40 z-50"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <Sparkles size={14} className="text-purple-400" />
                                <span className="text-xs font-black uppercase tracking-wider text-white/70">
                                    {t("ai.panelTitle")}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPanel(false)}
                                className="text-white/30 hover:text-white/60 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            {/* Loading */}
                            {loading && (
                                <div className="flex flex-col items-center justify-center py-8 gap-3">
                                    <Loader2 size={24} className="animate-spin text-purple-400" />
                                    <p className="text-xs text-white/40">{t("ai.thinking")}</p>
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="flex items-start gap-3 py-4">
                                    <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
                                    <p className="text-xs text-red-300/80">{error}</p>
                                </div>
                            )}

                            {/* Suggestions */}
                            {suggestions && !loading && (
                                <div className="space-y-3">
                                    {Object.entries(suggestions).map(([key, suggestion]) => (
                                        <div
                                            key={key}
                                            className="rounded-xl bg-white/[0.03] border border-white/5 p-3"
                                        >
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                                                    {fieldLabels[key] || key}
                                                </span>
                                                <span className="text-sm font-black text-ardic-cyan">
                                                    {suggestion.value}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-white/30 leading-relaxed">
                                                {suggestion.reason}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer: Accept or Dismiss */}
                        {suggestions && !loading && (
                            <div className="p-4 border-t border-white/5 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => { setSuggestions(null); setShowPanel(false); }}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                                               rounded-xl bg-white/5 border border-white/10
                                               text-white/40 text-[11px] font-black uppercase tracking-wider
                                               hover:text-white/70 hover:border-white/20
                                               transition-all duration-300"
                                >
                                    <X size={14} />
                                    {t("ai.dismiss")}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleApply}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                                               rounded-xl bg-gradient-to-r from-purple-500 to-ardic-cyan
                                               text-white text-[11px] font-black uppercase tracking-wider
                                               hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]
                                               transition-all duration-300"
                                >
                                    <Check size={14} />
                                    {t("ai.applyAll")}
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
