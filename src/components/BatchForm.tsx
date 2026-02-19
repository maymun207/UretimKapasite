"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeft, HelpCircle, Plus, Trash2, Calculator, DollarSign } from "lucide-react";
import { BatchInputs, BottleneckStep, CostInputs, INDUSTRY_EXTRA_FIELDS } from "@/lib/calculations";
import AISuggestButton, { AISuggestions } from "./AISuggestButton";

/* ── Industry keys (must match en.json / tr.json) ────────────── */
const INDUSTRIES = [
    "chemical", "ceramic", "paint", "food", "pharma", "glass",
];

/* ── Tooltip ─────────────────────────────────────────────────── */
const Tooltip = ({ text }: { text: string }) => (
    <div className="group relative inline-flex items-center ml-1.5">
        <div className="w-4 h-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-center cursor-help hover:border-ardic-cyan/40 transition-all">
            <HelpCircle size={10} className="text-white/30 group-hover:text-ardic-cyan transition-colors" />
        </div>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 rounded-xl bg-ardic-surface border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-200 scale-95 group-hover:scale-100 pointer-events-none z-50 shadow-xl">
            <p className="text-[10px] text-white/60 leading-relaxed">{text}</p>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-6 border-transparent border-t-ardic-surface" />
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

/* ── Batch Form ──────────────────────────────────────────────── */
interface BatchFormProps {
    onCalculate: (inputs: BatchInputs) => void;
    onCostCalculate: (inputs: BatchInputs, costInputs: CostInputs) => void;
    country?: string;
    onBack: () => void;
}

export default function BatchForm({ onCalculate, onCostCalculate, country, onBack }: BatchFormProps) {
    const { t } = useTranslation();

    // Industry for AI
    const [industry, setIndustry] = useState("");

    // Common
    const [lines, setLines] = useState(1);
    const [shifts, setShifts] = useState(3);
    const [hoursPerShift, setHoursPerShift] = useState(8);
    const [workingDaysPerWeek, setWorkingDaysPerWeek] = useState(5);
    const [availability, setAvailability] = useState(0.9);
    const [efficiency, setEfficiency] = useState(0.85);
    const [yieldRate, setYieldRate] = useState(0.95);

    // Batch-specific
    const [batchSize, setBatchSize] = useState(1000);
    const [batchTime, setBatchTime] = useState(4);
    const [downtime, setDowntime] = useState(0.5);

    // Cost parameters
    const [rawMaterialCost, setRawMaterialCost] = useState(50);
    const [laborCostPerHour, setLaborCostPerHour] = useState(150);
    const [workersPerShift, setWorkersPerShift] = useState(4);
    const [energyRate, setEnergyRate] = useState(3.5);
    const [machinePower, setMachinePower] = useState(25);
    const [overheadRate, setOverheadRate] = useState(0.15);
    const [industryExtra, setIndustryExtra] = useState(0);

    // Bottleneck steps
    const [steps, setSteps] = useState<BottleneckStep[]>([]);

    const addStep = () => setSteps([...steps, { name: "", capacity: 0 }]);
    const removeStep = (i: number) => setSteps(steps.filter((_, idx) => idx !== i));
    const updateStep = (i: number, field: keyof BottleneckStep, val: string | number) => {
        const updated = [...steps];
        if (field === "name") updated[i].name = val as string;
        else updated[i].capacity = Number(val);
        setSteps(updated);
    };

    const handleAISuggestions = (suggestions: AISuggestions) => {
        if (suggestions.batchSize) setBatchSize(suggestions.batchSize.value);
        if (suggestions.batchTime) setBatchTime(suggestions.batchTime.value);
        if (suggestions.downtime) setDowntime(suggestions.downtime.value);
        if (suggestions.availability) setAvailability(suggestions.availability.value);
        if (suggestions.efficiency) setEfficiency(suggestions.efficiency.value);
        if (suggestions.yieldRate) setYieldRate(suggestions.yieldRate.value);
        // Cost fields
        if (suggestions.rawMaterialCost) setRawMaterialCost(suggestions.rawMaterialCost.value);
        if (suggestions.laborCostPerHour) setLaborCostPerHour(suggestions.laborCostPerHour.value);
        if (suggestions.energyRate) setEnergyRate(suggestions.energyRate.value);
        if (suggestions.machinePower) setMachinePower(suggestions.machinePower.value);
        if (suggestions.overheadRate) setOverheadRate(suggestions.overheadRate.value);
    };

    const getCapacityInputs = (): BatchInputs => ({
        lines, shifts, hoursPerShift, batchSize, batchTime, downtime, availability, efficiency, yieldRate, workingDaysPerWeek, steps,
    });

    const getCostInputs = (): CostInputs => ({
        rawMaterialCost, laborCostPerHour, workersPerShift, energyRate, machinePower, overheadRate, industryExtra,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCalculate(getCapacityInputs());
    };

    const handleCostSubmit = () => {
        onCostCalculate(getCapacityInputs(), getCostInputs());
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
                <h2 className="text-2xl font-black tracking-tight uppercase font-heading text-white mb-2">{t("form.batchTitle")}</h2>
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
                        processType="batch"
                        country={country}
                        onApply={handleAISuggestions}
                    />
                </div>
            </div>

            {/* Common parameters */}
            <div className="glass-card rounded-2xl p-6 md:p-8 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <NumberField label={t("form.common.lines")} tooltip={t("form.common.linesTooltip")} value={lines} onChange={setLines} min={1} />
                    <NumberField label={t("form.common.shifts")} tooltip={t("form.common.shiftsTooltip")} value={shifts} onChange={setShifts} min={1} max={4} />
                    <NumberField label={t("form.common.hoursPerShift")} tooltip={t("form.common.hoursTooltip")} value={hoursPerShift} onChange={setHoursPerShift} min={1} max={12} unit="hr" />
                    <NumberField label={t("form.common.workingDays")} tooltip={t("form.common.workingDaysTooltip")} value={workingDaysPerWeek} onChange={setWorkingDaysPerWeek} min={1} max={7} unit={t("form.common.workingDaysUnit")} />
                </div>
            </div>

            {/* Batch parameters */}
            <div className="glass-card rounded-2xl p-6 md:p-8 mb-6">
                <h3 className="text-xs font-black text-ardic-cyan/60 uppercase tracking-[0.2em] mb-5">{t("form.batch.sectionTitle")}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <NumberField label={t("form.batch.batchSize")} tooltip={t("form.batch.batchSizeTooltip")} value={batchSize} onChange={setBatchSize} min={1} unit={t("form.batch.batchSizeUnit")} />
                    <NumberField label={t("form.batch.batchTime")} tooltip={t("form.batch.batchTimeTooltip")} value={batchTime} onChange={setBatchTime} min={0.1} step={0.1} unit={t("form.batch.batchTimeUnit")} />
                    <NumberField label={t("form.batch.downtime")} tooltip={t("form.batch.downtimeTooltip")} value={downtime} onChange={setDowntime} min={0} step={0.1} unit={t("form.batch.downtimeUnit")} />
                </div>
            </div>

            {/* OEE factors */}
            <div className="glass-card rounded-2xl p-6 md:p-8 mb-6">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-xs font-black text-purple-400/60 uppercase tracking-[0.2em]">OEE</h3>
                    <span className="text-sm font-black tabular-nums text-purple-400">
                        {(availability * efficiency * yieldRate * 100).toFixed(1)}%
                    </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <NumberField label={t("form.common.availability")} tooltip={t("form.common.availabilityTooltip")} value={availability} onChange={setAvailability} min={0} max={1} step={0.01} />
                    <NumberField label={t("form.common.efficiency")} tooltip={t("form.common.efficiencyTooltip")} value={efficiency} onChange={setEfficiency} min={0} max={1} step={0.01} />
                    <NumberField label={t("form.common.yieldRate")} tooltip={t("form.common.yieldTooltip")} value={yieldRate} onChange={setYieldRate} min={0} max={1} step={0.01} />
                </div>
            </div>

            {/* Cost Parameters */}
            <div className="glass-card rounded-2xl p-6 md:p-8 mb-6">
                <h3 className="text-xs font-black text-emerald-400/60 uppercase tracking-[0.2em] mb-5">{t("cost.sectionTitle")}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <NumberField label={t("cost.rawMaterial")} tooltip={t("cost.rawMaterialTooltipBatch")} value={rawMaterialCost} onChange={setRawMaterialCost} min={0} step={1} unit={t("cost.rawMaterialUnitBatch")} />
                    <NumberField label={t("cost.laborCost")} tooltip={t("cost.laborCostTooltip")} value={laborCostPerHour} onChange={setLaborCostPerHour} min={0} step={1} unit={t("cost.laborCostUnit")} />
                    <NumberField label={t("cost.workers")} tooltip={t("cost.workersTooltip")} value={workersPerShift} onChange={setWorkersPerShift} min={1} step={1} />
                    <NumberField label={t("cost.energyRate")} tooltip={t("cost.energyRateTooltip")} value={energyRate} onChange={setEnergyRate} min={0} step={0.1} unit={t("cost.energyRateUnit")} />
                    <NumberField label={t("cost.machinePower")} tooltip={t("cost.machinePowerTooltip")} value={machinePower} onChange={setMachinePower} min={0} step={1} unit={t("cost.machinePowerUnit")} />
                    <NumberField label={t("cost.overheadRate")} tooltip={t("cost.overheadRateTooltip")} value={overheadRate} onChange={setOverheadRate} min={0} max={1} step={0.01} unit={t("cost.overheadRateUnit")} />
                </div>
                {industry && INDUSTRY_EXTRA_FIELDS[industry] && (
                    <div className="mt-5 pt-5 border-t border-white/5">
                        <div className="max-w-xs">
                            <NumberField
                                label={t(INDUSTRY_EXTRA_FIELDS[industry].labelKey)}
                                tooltip={t(INDUSTRY_EXTRA_FIELDS[industry].labelKey)}
                                value={industryExtra}
                                onChange={setIndustryExtra}
                                min={0}
                                step={0.1}
                                unit={INDUSTRY_EXTRA_FIELDS[industry].unit}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Bottleneck steps */}
            <div className="glass-card rounded-2xl p-6 md:p-8 mb-8">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-xs font-black text-amber-400/60 uppercase tracking-[0.2em]">{t("form.batch.bottleneckTitle")}</h3>
                    <button type="button" onClick={addStep} className="flex items-center gap-1.5 text-[10px] font-bold text-white/30 hover:text-ardic-cyan/70 transition-colors uppercase tracking-wider">
                        <Plus size={12} /> {t("form.batch.addStep")}
                    </button>
                </div>
                {steps.length === 0 && (
                    <p className="text-xs text-white/20 italic text-center py-4">{t("results.noBottleneck")}</p>
                )}
                {steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-3 mb-3">
                        <input
                            type="text"
                            placeholder={t("form.batch.stepName")}
                            value={step.name}
                            onChange={(e) => updateStep(i, "name", e.target.value)}
                            className="flex-1 bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/15 focus:border-ardic-cyan/30 outline-none transition-all"
                        />
                        <input
                            type="number"
                            placeholder={t("form.batch.stepCapacity")}
                            value={step.capacity || ""}
                            onChange={(e) => updateStep(i, "capacity", e.target.value)}
                            className="w-32 bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/15 focus:border-ardic-cyan/30 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button type="button" onClick={() => removeStep(i)} className="text-white/20 hover:text-red-400 transition-colors">
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
                <div className="flex items-center gap-3">
                    <button type="submit" className="btn-glow bg-gradient-to-r from-ardic-cyan to-ardic-blue-light text-white px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-[0.15em] hover:shadow-[0_0_30px_rgba(0,209,255,0.3)] transition-all duration-300 flex items-center gap-2 group">
                        <Calculator size={14} />
                        {t("form.calculate")}
                    </button>
                    <button type="button" onClick={handleCostSubmit} className="btn-glow bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-[0.15em] hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all duration-300 flex items-center gap-2 group">
                        <DollarSign size={14} />
                        {t("form.calculateCost")}
                    </button>
                </div>
            </div>
        </motion.form>
    );
}
