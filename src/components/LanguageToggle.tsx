"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export default function LanguageToggle() {
    const { i18n } = useTranslation();
    const currentLang = i18n.language;

    const toggleLang = () => {
        i18n.changeLanguage(currentLang === "en" ? "tr" : "en");
    };

    return (
        <button
            onClick={toggleLang}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-ardic-cyan/30 hover:bg-white/8 transition-all duration-300 group"
            aria-label="Toggle language"
        >
            <Globe size={14} className="text-white/40 group-hover:text-ardic-cyan transition-colors" />
            <span className="text-xs font-black tracking-[0.15em] text-white/50 group-hover:text-white/80 transition-colors">
                {currentLang === "en" ? "TR" : "EN"}
            </span>
        </button>
    );
}
