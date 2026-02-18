"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Scan, Layers, Cpu, AlertTriangle, Languages, ArrowRight } from "lucide-react";

interface LandingHeroProps {
    onStart: () => void;
}

export default function LandingHero({ onStart }: LandingHeroProps) {
    const { t } = useTranslation();

    const features = [
        { icon: Layers, titleKey: "landing.features.batch", descKey: "landing.features.batchDesc", color: "text-ardic-cyan" },
        { icon: Cpu, titleKey: "landing.features.discrete", descKey: "landing.features.discreteDesc", color: "text-blue-400" },
        { icon: AlertTriangle, titleKey: "landing.features.bottleneck", descKey: "landing.features.bottleneckDesc", color: "text-amber-400" },
        { icon: Languages, titleKey: "landing.features.bilingual", descKey: "landing.features.bilingualDesc", color: "text-purple-400" },
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
                {features.map((f, i) => (
                    <div key={i} className="glass-card rounded-xl p-5 text-left hover:translate-y-[-2px] transition-all duration-300">
                        <div className="flex items-center gap-3 mb-2">
                            <f.icon size={18} className={f.color} />
                            <span className="text-xs font-bold text-white/70 uppercase tracking-wider">{t(f.titleKey)}</span>
                        </div>
                        <p className="text-[11px] text-white/35 leading-relaxed">{t(f.descKey)}</p>
                    </div>
                ))}
            </motion.div>

            {/* CTA */}
            <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={onStart}
                className="btn-glow bg-gradient-to-r from-ardic-cyan to-ardic-blue-light text-white px-10 py-4 rounded-xl text-sm font-black uppercase tracking-[0.2em] hover:shadow-[0_0_40px_rgba(0,209,255,0.3)] transition-all duration-300 flex items-center gap-3 group"
            >
                {t("landing.cta")}
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
        </div>
    );
}
