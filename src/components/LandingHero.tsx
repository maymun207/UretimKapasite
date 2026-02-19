"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Scan, Layers, Cpu, ArrowRight } from "lucide-react";

interface LandingHeroProps {
    onSelect: (type: "batch" | "discrete") => void;
}

export default function LandingHero({ onSelect }: LandingHeroProps) {
    const { t } = useTranslation();

    const features = [
        { type: "batch" as const, icon: Layers, titleKey: "landing.features.batch", descKey: "landing.features.batchDesc", color: "text-ardic-cyan", glow: "hover:shadow-[0_0_25px_rgba(0,209,255,0.15)]" },
        { type: "discrete" as const, icon: Cpu, titleKey: "landing.features.discrete", descKey: "landing.features.discreteDesc", color: "text-blue-400", glow: "hover:shadow-[0_0_25px_rgba(96,165,250,0.15)]" },
    ];

    return (
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            {/* Logo */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative mb-8"
            >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-ardic-blue to-ardic-blue-light flex items-center justify-center shadow-[0_0_50px_rgba(30,58,138,0.5)] ring-1 ring-white/10">
                    <Scan size={36} className="text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-ardic-cyan shadow-[0_0_15px_rgba(0,209,255,0.6)] border-2 border-ardic-dark" />
            </motion.div>

            {/* Title */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
            >
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase font-heading mb-3">
                    <span className="text-white">{t("app.title").split(" ")[0]} </span>
                    <span className="text-gradient-cyan">{t("app.title").split(" ").slice(1).join(" ")}</span>
                </h1>
                <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="h-[1px] w-10 bg-gradient-to-r from-transparent to-ardic-cyan/30" />
                    <p className="text-[10px] font-bold tracking-[0.4em] text-white/30 uppercase">{t("landing.badge")}</p>
                    <div className="h-[1px] w-10 bg-gradient-to-l from-transparent to-ardic-cyan/30" />
                </div>
            </motion.div>

            {/* Headline + Description */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mb-12"
            >
                <h2 className="text-xl md:text-2xl font-bold text-white/80 mb-4">{t("landing.headline")}</h2>
                <p className="text-sm md:text-base text-white/40 max-w-2xl leading-relaxed">{t("landing.description")}</p>
            </motion.div>

            {/* Feature cards */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-12"
            >
                {features.map((f) => (
                    <button
                        key={f.type}
                        onClick={() => onSelect(f.type)}
                        className={`glass-card rounded-xl p-6 text-left hover:translate-y-[-2px] transition-all duration-300 cursor-pointer hover:border-white/15 ${f.glow} group`}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <f.icon size={18} className={f.color} />
                            <span className="text-xs font-bold text-white/70 uppercase tracking-wider">{t(f.titleKey)}</span>
                            <ArrowRight size={14} className="ml-auto text-white/15 group-hover:text-white/40 group-hover:translate-x-1 transition-all" />
                        </div>
                        <p className="text-[11px] text-white/35 leading-relaxed">{t(f.descKey)}</p>
                    </button>
                ))}
            </motion.div>
        </div>
    );
}
