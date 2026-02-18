"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeft, HelpCircle, Plus, Trash2, Calculator } from "lucide-react";
import { DiscreteInputs, BottleneckStep } from "@/lib/calculations";
import AISuggestButton, { AISuggestions } from "./AISuggestButton";

/* ── Industry keys (must match en.json / tr.json) ────────────── */
const INDUSTRIES = [
    "chemical", "ceramic", "paint", "food", "pharma", "automotive",
    "plastic", "packaging", "textile", "metal", "electronics", "glass",
];

/* ── Tooltip ─────────────────────────────────────────────────── */
const Tooltip = ({ text }: { text: string }) => (
    <div className="group relative inline-flex items-center ml-1.5">
        <div className="w-4 h-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-center cursor-help hover:border-ardic-cyan/40 transition-all">
            <HelpCircle size={10} className="text-white/30 group-hover:text-ardic-cyan transition-colors" />
        </div>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 rounded-xl bg-ardic-surface border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-200 scale-95 group-hover:scale-100 pointer-events-none z-50 shadow-xl">
            <p className="text-[10px] text-white/60 leading-relaxed">{text}</p>
        </div>
    </div>
);

/* ── Number Input Field ──────────────────────────────────────── */
const NumberField = ({
    label, tooltip, unit, value, onChange, min = 0, max, step = 1,
}: {
    label: string; tooltip: string; unit?: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number;
}) => (
    <div>
        <label className="flex items-center text-xs font-bold text-white/50 uppercase tracking-wider mb-2">
            {label}
            <Tooltip text={tooltip} />
        </label>
        <div className="relative">
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                min={min}
                max={max}
                step={step}
                className="w-full bg-black/30 border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-ardic-cyan/40 focus:bg-black/50 outline-none transition-all duration-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            {unit && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/20 uppercase">{unit}</span>
            )}
        </div>
    </div>
);

/* ── Discrete Form ───────────────────────────────────────────── */
interface DiscreteFormProps {
    onCalculate: (inputs: DiscreteInputs) => void;
    onBack: () => void;
}

export default function DiscreteForm({ onCalculate, onBack }: DiscreteFormProps) {
    const { t } = useTranslation();

    // Industry for AI
    const [industry, setIndustry] = useState("");

    // Common
    const [lines, setLines] = useState(1);
    const [shifts, setShifts] = useState(3);
    const [hoursPerShift, setHoursPerShift] = useState(8);
    const [availability, setAvailability] = useState(0.9);
    const [efficiency, setEfficiency] = useState(0.85);
    const [yieldRate, setYieldRate] = useState(0.95);

    // Discrete-specific
    const [cycleTime, setCycleTime] = useState(2);
    const [outputRate, setOutputRate] = useState(0);

    // Bottleneck stations
    const [stations, setStations] = useState<BottleneckStep[]>([]);

    const addStation = () => setStations([...stations, { name: "", capacity: 0 }]);
    const removeStation = (i: number) => setStations(stations.filter((_, idx) => idx !== i));
    const updateStation = (i: number, field: keyof BottleneckStep, val: string | number) => {
        const updated = [...stations];
        if (field === "name") updated[i].name = val as string;
        else updated[i].capacity = Number(val);
        setStations(updated);
    };

    const handleAISuggestions = (suggestions: AISuggestions) => {
        if (suggestions.cycleTime) setCycleTime(suggestions.cycleTime.value);
        if (suggestions.outputRate) setOutputRate(suggestions.outputRate.value);
        if (suggestions.availability) setAvailability(suggestions.availability.value);
        if (suggestions.efficiency) setEfficiency(suggestions.efficiency.value);
        if (suggestions.yieldRate) setYieldRate(suggestions.yieldRate.value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCalculate({ lines, shifts, hoursPerShift, cycleTime, outputRate, availability, efficiency, yieldRate, stations });
    };

    return (
        <motion.form
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            onSubmit={handleSubmit}
            className="max-w-3xl mx-auto w-full"
        >
            {/* Header */}
            <div className="text-center mb-8">
                <h2 className="text-2xl font-black tracking-tight uppercase font-heading text-white mb-2">{t("form.discreteTitle")}</h2>
                <p className="text-sm text-white/40">{t("form.subtitle")}</p>
            </div>

            {/* Industry selector + AI button */}
            <div className="glass-card rounded-2xl p-6 md:p-8 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                    <div className="flex-1 w-full">
                        <label className="flex items-center text-xs font-bold text-white/50 uppercase tracking-wider mb-2">
                            {t("ai.industryLabel")}
                        </label>
                        <select
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            className="w-full bg-black/30 border border-white/8 rounded-xl px-4 py-3 text-sm text-white focus:border-ardic-cyan/40 focus:bg-black/50 outline-none transition-all duration-300 appearance-none cursor-pointer"
                        >
                            <option value="" className="bg-ardic-surface">{t("ai.industryPlaceholder")}</option>
                            {INDUSTRIES.map((key) => (
                                <option key={key} value={key} className="bg-ardic-surface">
                                    {t(`industries.${key}`)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <AISuggestButton
                        industry={industry ? t(`industries.${industry}`) : ""}
                        processType="discrete"
                        onApply={handleAISuggestions}
                    />
                </div>
            </div>

            {/* Common parameters */}
            <div className="glass-card rounded-2xl p-6 md:p-8 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <NumberField label={t("form.common.lines")} tooltip={t("form.common.linesTooltip")} value={lines} onChange={setLines} min={1} />
                    <NumberField label={t("form.common.shifts")} tooltip={t("form.common.shiftsTooltip")} value={shifts} onChange={setShifts} min={1} max={4} />
                    <NumberField label={t("form.common.hoursPerShift")} tooltip={t("form.common.hoursTooltip")} value={hoursPerShift} onChange={setHoursPerShift} min={1} max={12} unit="hr" />
                </div>
            </div>

            {/* Discrete parameters */}
            <div className="glass-card rounded-2xl p-6 md:p-8 mb-6">
                <h3 className="text-xs font-black text-blue-400/60 uppercase tracking-[0.2em] mb-5">{t("form.discrete.sectionTitle")}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <NumberField label={t("form.discrete.cycleTime")} tooltip={t("form.discrete.cycleTimeTooltip")} value={cycleTime} onChange={setCycleTime} min={0} step={0.1} unit={t("form.discrete.cycleTimeUnit")} />
                    <NumberField label={t("form.discrete.outputRate")} tooltip={t("form.discrete.outputRateTooltip")} value={outputRate} onChange={setOutputRate} min={0} step={0.1} unit={t("form.discrete.outputRateUnit")} />
                </div>
            </div>

            {/* OEE factors */}
            <div className="glass-card rounded-2xl p-6 md:p-8 mb-6">
                <h3 className="text-xs font-black text-purple-400/60 uppercase tracking-[0.2em] mb-5">OEE</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <NumberField label={t("form.common.availability")} tooltip={t("form.common.availabilityTooltip")} value={availability} onChange={setAvailability} min={0} max={1} step={0.01} />
                    <NumberField label={t("form.common.efficiency")} tooltip={t("form.common.efficiencyTooltip")} value={efficiency} onChange={setEfficiency} min={0} max={1} step={0.01} />
                    <NumberField label={t("form.common.yieldRate")} tooltip={t("form.common.yieldTooltip")} value={yieldRate} onChange={setYieldRate} min={0} max={1} step={0.01} />
                </div>
            </div>

            {/* Bottleneck stations */}
            <div className="glass-card rounded-2xl p-6 md:p-8 mb-8">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-xs font-black text-amber-400/60 uppercase tracking-[0.2em]">{t("form.discrete.bottleneckTitle")}</h3>
                    <button type="button" onClick={addStation} className="flex items-center gap-1.5 text-[10px] font-bold text-white/30 hover:text-ardic-cyan/70 transition-colors uppercase tracking-wider">
                        <Plus size={12} /> {t("form.discrete.addStation")}
                    </button>
                </div>
                {stations.length === 0 && (
                    <p className="text-xs text-white/20 italic text-center py-4">{t("results.noBottleneck")}</p>
                )}
                {stations.map((station, i) => (
                    <div key={i} className="flex items-center gap-3 mb-3">
                        <input
                            type="text"
                            placeholder={t("form.discrete.stationName")}
                            value={station.name}
                            onChange={(e) => updateStation(i, "name", e.target.value)}
                            className="flex-1 bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/15 focus:border-ardic-cyan/30 outline-none transition-all"
                        />
                        <input
                            type="number"
                            placeholder={t("form.discrete.stationCapacity")}
                            value={station.capacity || ""}
                            onChange={(e) => updateStation(i, "capacity", e.target.value)}
                            className="w-32 bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/15 focus:border-ardic-cyan/30 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button type="button" onClick={() => removeStation(i)} className="text-white/20 hover:text-red-400 transition-colors">
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
                <button type="button" onClick={onBack} className="flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors font-bold uppercase tracking-wider">
                    <ArrowLeft size={14} /> {t("form.back")}
                </button>
                <button type="submit" className="btn-glow bg-gradient-to-r from-ardic-cyan to-ardic-blue-light text-white px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-[0.2em] hover:shadow-[0_0_30px_rgba(0,209,255,0.3)] transition-all duration-300 flex items-center gap-2.5 group">
                    <Calculator size={14} />
                    {t("form.calculate")}
                </button>
            </div>
        </motion.form>
    );
}
