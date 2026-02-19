"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "../i18n";
import { useTranslation } from "react-i18next";

import LanguageToggle from "@/components/LanguageToggle";
import LandingHero from "@/components/LandingHero";
import BatchForm from "@/components/BatchForm";
import DiscreteForm from "@/components/DiscreteForm";
import ResultsPanel from "@/components/ResultsPanel";

import {
    BatchInputs,
    DiscreteInputs,
    CostInputs,
    CostResults,
    CapacityResults,
    calculateBatchCapacity,
    calculateDiscreteCapacity,
    calculateBatchCost,
    calculateDiscreteCost,
} from "@/lib/calculations";

import { Scan } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   Step indicator — shows progress through the wizard
   ═══════════════════════════════════════════════════════════════ */
type Step = "landing" | "form" | "results";

const STEP_ORDER: Step[] = ["form", "results"];

function StepIndicator({ current }: { current: Step }) {
    const { t } = useTranslation();
    if (current === "landing") return null;

    const labels = [t("step.parameters"), t("step.results")];
    const currentIdx = STEP_ORDER.indexOf(current);

    return (
        <div className="flex items-center justify-center gap-2 mb-10">
            {STEP_ORDER.map((step, i) => {
                const isActive = i === currentIdx;
                const isDone = i < currentIdx;
                return (
                    <div key={step} className="contents">
                        {i > 0 && (
                            <div className={`w-8 h-[1px] ${isDone ? "bg-ardic-cyan/40" : "bg-white/8"} transition-colors duration-500`} />
                        )}
                        <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black transition-all duration-500 ${isActive
                                ? "bg-ardic-cyan/20 border border-ardic-cyan/40 text-ardic-cyan shadow-[0_0_15px_rgba(0,209,255,0.15)]"
                                : isDone
                                    ? "bg-ardic-cyan/10 border border-ardic-cyan/20 text-ardic-cyan/60"
                                    : "bg-white/3 border border-white/8 text-white/20"
                                }`}>
                                {isDone ? "✓" : i + 1}
                            </div>
                            <span className={`text-[9px] font-bold uppercase tracking-[0.15em] hidden sm:inline transition-colors duration-500 ${isActive ? "text-white/50" : isDone ? "text-white/25" : "text-white/10"
                                }`}>
                                {labels[i]}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════════ */
export default function Home() {
    const { t } = useTranslation();
    const [step, setStep] = useState<Step>("landing");
    const [processType, setProcessType] = useState<"batch" | "discrete">("batch");
    const [results, setResults] = useState<CapacityResults | null>(null);
    const [costResults, setCostResults] = useState<CostResults | null>(null);
    const [country, setCountry] = useState<string>("");

    // Detect user country on mount via browser geolocation
    useEffect(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const { latitude, longitude } = pos.coords;
                    const res = await fetch(
                        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
                    );
                    const data = await res.json();
                    if (data.countryName) setCountry(data.countryName);
                } catch {
                    // silently ignore geocoding errors
                }
            },
            () => { /* user denied — that's OK, AI will use global averages */ }
        );
    }, []);

    const handleBatchCalculate = (inputs: BatchInputs) => {
        setResults(calculateBatchCapacity(inputs));
        setCostResults(null);
        setStep("results");
    };

    const handleDiscreteCalculate = (inputs: DiscreteInputs) => {
        setResults(calculateDiscreteCapacity(inputs));
        setCostResults(null);
        setStep("results");
    };

    const handleBatchCostCalculate = (inputs: BatchInputs, costInputs: CostInputs) => {
        setResults(calculateBatchCapacity(inputs));
        setCostResults(calculateBatchCost(inputs, costInputs));
        setStep("results");
    };

    const handleDiscreteCostCalculate = (inputs: DiscreteInputs, costInputs: CostInputs) => {
        setResults(calculateDiscreteCapacity(inputs));
        setCostResults(calculateDiscreteCost(inputs, costInputs));
        setStep("results");
    };

    const handleReset = () => {
        setStep("landing");
        setResults(null);
        setCostResults(null);
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-ardic-dark">
            {/* Ambient background */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-ardic-blue/5 rounded-full blur-[128px]" />
                <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-900/5 rounded-full blur-[128px]" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iLjAzIi8+PC9zdmc+')] opacity-60" />
            </div>

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between px-6 md:px-10 py-5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ardic-blue to-ardic-blue-light flex items-center justify-center ring-1 ring-white/10 shadow-lg">
                        <Scan size={14} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-xs font-black tracking-[0.12em] uppercase text-white/70 font-heading">
                            {t("app.title")}
                        </h1>
                        <p className="text-[8px] font-bold tracking-[0.3em] uppercase text-white/15">{t("app.subtitle")}</p>
                    </div>
                </div>
                <LanguageToggle />
            </header>

            {/* Step indicator */}
            <div className="relative z-10 mt-4">
                <StepIndicator current={step} />
            </div>

            {/* Main content */}
            <main className="relative z-10 px-4 md:px-10 pb-20">
                <AnimatePresence mode="wait">
                    {step === "landing" && (
                        <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                            <LandingHero onSelect={(type) => {
                                setProcessType(type);
                                setStep("form");
                            }} />
                        </motion.div>
                    )}

                    {step === "form" && processType === "batch" && (
                        <motion.div key="batchForm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                            <BatchForm onCalculate={handleBatchCalculate} onCostCalculate={handleBatchCostCalculate} country={country} onBack={() => setStep("landing")} />
                        </motion.div>
                    )}

                    {step === "form" && processType === "discrete" && (
                        <motion.div key="discreteForm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                            <DiscreteForm onCalculate={handleDiscreteCalculate} onCostCalculate={handleDiscreteCostCalculate} country={country} onBack={() => setStep("landing")} />
                        </motion.div>
                    )}

                    {step === "results" && results && (
                        <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                            <ResultsPanel
                                results={results}
                                processType={processType}
                                costResults={costResults}
                                onBack={() => setStep("form")}
                                onReset={handleReset}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Footer */}
            <footer className="relative z-10 text-center pb-8">
                <p className="text-[9px] text-white/10 font-bold tracking-[0.3em] uppercase">
                    ARDIC Distributed Intelligence Unit © 2025
                </p>
            </footer>
        </div>
    );
}
