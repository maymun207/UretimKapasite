"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Layers, Cpu, ArrowLeft } from "lucide-react";

interface ProcessTypeSelectorProps {
    onSelect: (type: "batch" | "discrete") => void;
    onBack: () => void;
}

export default function ProcessTypeSelector({ onSelect, onBack }: ProcessTypeSelectorProps) {
    const { t } = useTranslation();

    const types = [
        {
            key: "batch" as const,
            icon: Layers,
            titleKey: "processType.batch",
            descKey: "processType.batchDesc",
            gradient: "from-ardic-cyan/20 to-ardic-blue/10",
            border: "hover:border-ardic-cyan/30",
            iconColor: "text-ardic-cyan",
        },
        {
            key: "discrete" as const,
            icon: Cpu,
            titleKey: "processType.discrete",
            descKey: "processType.discreteDesc",
            gradient: "from-blue-500/20 to-purple-500/10",
            border: "hover:border-blue-400/30",
            iconColor: "text-blue-400",
        },
    ];

    return (
        <div className="max-w-3xl mx-auto w-full">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-10"
            >
                <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase font-heading text-white mb-2">
                    {t("processType.title")}
                </h2>
                <p className="text-sm text-white/40">{t("processType.subtitle")}</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                {types.map((type, i) => (
                    <motion.button
                        key={type.key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: i * 0.15 }}
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelect(type.key)}
                        className={`glass-card rounded-2xl p-8 text-left transition-all duration-300 cursor-pointer ${type.border} group`}
                    >
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${type.gradient} flex items-center justify-center mb-5 border border-white/5`}>
                            <type.icon size={26} className={type.iconColor} />
                        </div>
                        <h3 className="text-lg font-black text-white uppercase tracking-wide mb-3 font-heading">{t(type.titleKey)}</h3>
                        <p className="text-xs text-white/35 leading-relaxed">{t(type.descKey)}</p>
                    </motion.button>
                ))}
            </div>

            <div className="flex justify-center">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors font-bold uppercase tracking-wider"
                >
                    <ArrowLeft size={14} />
                    {t("processType.back")}
                </button>
            </div>
        </div>
    );
}
