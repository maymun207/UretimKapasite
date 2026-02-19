"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip as RechartsTooltip, LabelList,
} from "recharts";
import {
    TrendingUp, Gauge, Package, Percent, AlertTriangle, FileDown, FileSpreadsheet, RotateCcw, ArrowLeft,
    Calendar, DollarSign, Layers, Zap, Users, Building2, Factory,
} from "lucide-react";
import { CapacityResults, CostResults, exportToCSV } from "@/lib/calculations";

interface ResultsPanelProps {
    results: CapacityResults;
    processType: "batch" | "discrete";
    costResults?: CostResults | null;
    onBack: () => void;
    onReset: () => void;
}

/* ── Period Tabs ─────────────────────────────────────────────── */
type Period = "day" | "week" | "month" | "year";

function getPeriodValues(results: CapacityResults, period: Period) {
    switch (period) {
        case "day":
            return { theoretical: results.theoreticalMax, effective: results.effectiveCapacity, actual: results.actualOutput };
        case "week":
            return results.weekly;
        case "month":
            return results.monthly;
        case "year":
            return results.yearly;
    }
}

/* ── Metric Card ─────────────────────────────────────────────── */
const MetricCard = ({
    label, desc, value, unit, icon: Icon, color, large = false,
}: {
    label: string; desc: string; value: number; unit: string; icon: any; color: string; large?: boolean;
}) => (
    <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`glass-card rounded-2xl ${large ? "glass-card-glow gradient-border p-8 md:p-10" : "p-6"}`}
    >
        <div className={`flex items-center gap-2 mb-3 ${large ? "justify-center" : ""}`}>
            <Icon size={large ? 16 : 14} className={color} />
            <span className={`font-black uppercase tracking-[0.15em] ${large ? "text-[11px] text-white/50" : "text-[10px] text-white/30"}`}>
                {label}
            </span>
        </div>
        <div className={`flex items-baseline gap-2 ${large ? "justify-center mb-2" : ""}`}>
            <span className={`font-black tabular-nums tracking-tighter font-heading ${large ? "text-4xl sm:text-5xl md:text-6xl text-gradient-cyan" : "text-2xl md:text-3xl text-white"}`}>
                {value.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}
            </span>
            <span className={`font-bold uppercase tracking-wider ${large ? "text-sm text-ardic-cyan/30" : "text-[9px] text-white/15"}`}>
                {unit}
            </span>
        </div>
        <p className={`text-[10px] text-white/25 mt-2 ${large ? "text-center" : ""}`}>{desc}</p>
    </motion.div>
);

/* ── Results Panel ───────────────────────────────────────────── */
export default function ResultsPanel({ results, processType, costResults, onBack, onReset }: ResultsPanelProps) {
    const { t } = useTranslation();
    const [period, setPeriod] = useState<Period>("day");

    const periods: { key: Period; label: string }[] = [
        { key: "day", label: t("results.periods.day") },
        { key: "week", label: t("results.periods.week") },
        { key: "month", label: t("results.periods.month") },
        { key: "year", label: t("results.periods.year") },
    ];

    const pv = getPeriodValues(results, period);

    // Chart data for the selected period
    const chartData = [
        { name: t("results.chart.theoretical"), value: Math.round(pv.theoretical), fill: "#00D1FF" },
        { name: t("results.chart.effective"), value: Math.round(pv.effective), fill: "#2563EB" },
        { name: t("results.chart.actual"), value: Math.round(pv.actual), fill: "#7C3AED" },
    ];

    const colors = ["#00D1FF", "#2563EB", "#7C3AED"];

    const periodUnit = t(`results.units.${period}`);

    // CSV download
    const handleCSV = () => {
        const csv = exportToCSV(results, processType);
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "capacity_results.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    // PDF download
    const handlePDF = async () => {
        const { jsPDF } = await import("jspdf");
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Manufacturing Capacity Report", 20, 20);
        doc.setFontSize(11);
        doc.text(`Process Type: ${processType === "batch" ? "Batch" : "Discrete"}`, 20, 35);
        doc.text(`Working Days/Week: ${results.workingDaysPerWeek}`, 20, 45);
        doc.setFontSize(10);
        let y = 60;
        const periodLabels = ["Daily", "Weekly", "Monthly", "Yearly"];
        const periodData = [
            { theoretical: results.theoreticalMax, effective: results.effectiveCapacity, actual: results.actualOutput },
            results.weekly, results.monthly, results.yearly,
        ];
        periodLabels.forEach((label, i) => {
            doc.setFontSize(12);
            doc.text(`${label}:`, 20, y); y += 8;
            doc.setFontSize(10);
            doc.text(`  Theoretical Max: ${periodData[i].theoretical.toLocaleString("en-US", { maximumFractionDigits: 1 })} units`, 20, y); y += 7;
            doc.text(`  Effective Capacity: ${periodData[i].effective.toLocaleString("en-US", { maximumFractionDigits: 1 })} units`, 20, y); y += 7;
            doc.text(`  Actual Output: ${periodData[i].actual.toLocaleString("en-US", { maximumFractionDigits: 1 })} units`, 20, y); y += 10;
        });
        doc.text(`Utilization: ${results.utilization.toFixed(1)}%`, 20, y); y += 10;
        if (results.bottleneckStep) {
            doc.text(`Bottleneck: ${results.bottleneckStep.name} (${results.bottleneckStep.capacity} units/hr)`, 20, y);
        }
        doc.setFontSize(8);
        doc.text("Generated by ARDIC SENTINEL — Capacity Intelligence Model", 20, 280);
        doc.save("capacity_report.pdf");
    };

    return (
        <div className="max-w-4xl mx-auto w-full">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-10"
            >
                <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase font-heading text-white mb-2">
                    {t("results.title")}
                </h2>
                <p className="text-sm text-white/40">{t("results.subtitle")}</p>
            </motion.div>

            {/* Period Tabs */}
            <div className="flex items-center justify-center gap-2 mb-8">
                <Calendar size={14} className="text-white/20 mr-1" />
                {periods.map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setPeriod(key)}
                        className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300
                            ${period === key
                                ? "bg-gradient-to-r from-ardic-cyan/20 to-ardic-blue-light/20 border border-ardic-cyan/30 text-ardic-cyan shadow-[0_0_15px_rgba(0,209,255,0.1)]"
                                : "bg-white/[0.03] border border-white/5 text-white/30 hover:text-white/50 hover:border-white/10"
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Hero metric — Utilization */}
            <div className="mb-8">
                <MetricCard
                    large
                    label={t("results.utilization")}
                    desc={t("results.utilizationDesc")}
                    value={results.utilization}
                    unit="%"
                    icon={Percent}
                    color="text-ardic-cyan/50"
                />
            </div>

            {/* Three metrics grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
                <MetricCard
                    label={t("results.theoretical")}
                    desc={t("results.theoreticalDesc")}
                    value={pv.theoretical}
                    unit={periodUnit}
                    icon={TrendingUp}
                    color="text-[#00D1FF]/50"
                />
                <MetricCard
                    label={t("results.effective")}
                    desc={t("results.effectiveDesc")}
                    value={pv.effective}
                    unit={periodUnit}
                    icon={Gauge}
                    color="text-blue-400/50"
                />
                <MetricCard
                    label={t("results.actual")}
                    desc={t("results.actualDesc")}
                    value={pv.actual}
                    unit={periodUnit}
                    icon={Package}
                    color="text-purple-400/50"
                />
            </div>

            {/* Bar Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="glass-card rounded-2xl p-6 md:p-8 mb-8"
            >
                <h3 className="text-xs font-black text-white/30 uppercase tracking-[0.2em] mb-6 text-center">
                    {t("results.chart.title")}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis
                            dataKey="name"
                            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: 700 }}
                            axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }}
                            axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                            tickLine={false}
                        />
                        <RechartsTooltip
                            contentStyle={{
                                backgroundColor: "#0B1120",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "12px",
                                color: "#fff",
                                fontSize: 12,
                            }}
                        />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={60}>
                            {chartData.map((_, i) => (
                                <Cell key={i} fill={colors[i]} fillOpacity={0.8} />
                            ))}
                            <LabelList
                                dataKey="value"
                                position="top"
                                fill="rgba(255,255,255,0.4)"
                                fontSize={11}
                                fontWeight={700}
                                formatter={(v) => v != null ? Number(v).toLocaleString("tr-TR") : ""}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </motion.div>

            {/* Bottleneck card */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="glass-card rounded-2xl p-6 mb-10"
            >
                <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={14} className="text-amber-400/50" />
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em]">{t("results.bottleneck")}</span>
                </div>
                {results.bottleneckStep ? (
                    <div>
                        <p className="text-lg font-black text-amber-400/80">{results.bottleneckStep.name}</p>
                        <p className="text-xs text-white/30 mt-1">
                            {t("results.bottleneckCapacity")}: <span className="text-white/60 font-bold">{results.bottleneckStep.capacity} units/hr</span>
                        </p>
                        <p className="text-[10px] text-white/20 mt-2">{t("results.bottleneckDesc")}</p>
                    </div>
                ) : (
                    <p className="text-xs text-white/20 italic">{t("results.noBottleneck")}</p>
                )}
            </motion.div>

            {/* Cost Breakdown Section */}
            {costResults && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.35 }}
                    className="mb-10"
                >
                    <h3 className="text-xs font-black text-emerald-400/60 uppercase tracking-[0.2em] mb-5 text-center">
                        {t("cost.results.title")}
                    </h3>

                    {/* Large unit cost card */}
                    <div className="glass-card glass-card-glow gradient-border rounded-2xl p-8 md:p-10 mb-6 text-center border-emerald-500/20">
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <DollarSign size={16} className="text-emerald-400" />
                            <span className="text-[11px] font-black text-white/50 uppercase tracking-[0.15em]">
                                {t("cost.results.unitCost")}
                            </span>
                        </div>
                        <p className="text-4xl md:text-5xl font-black text-emerald-400 tracking-tight tabular-nums">
                            {t("cost.results.currency")}{costResults.unitCost.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-white/25 mt-2 uppercase tracking-wide">{t("cost.results.unitCostDesc")}</p>
                    </div>

                    {/* Breakdown grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                        <div className="glass-card rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <Layers size={12} className="text-blue-400/60" />
                                <span className="text-[9px] font-black text-white/30 uppercase tracking-wider">{t("cost.results.material")}</span>
                            </div>
                            <p className="text-lg font-black text-white/80 tabular-nums">{t("cost.results.currency")}{costResults.materialCostPerUnit.toFixed(2)}</p>
                            <p className="text-[9px] text-white/20 mt-1">{t("cost.results.materialDesc")}</p>
                        </div>
                        <div className="glass-card rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <Users size={12} className="text-purple-400/60" />
                                <span className="text-[9px] font-black text-white/30 uppercase tracking-wider">{t("cost.results.labor")}</span>
                            </div>
                            <p className="text-lg font-black text-white/80 tabular-nums">{t("cost.results.currency")}{costResults.laborCostPerUnit.toFixed(2)}</p>
                            <p className="text-[9px] text-white/20 mt-1">{t("cost.results.laborDesc")}</p>
                        </div>
                        <div className="glass-card rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <Zap size={12} className="text-yellow-400/60" />
                                <span className="text-[9px] font-black text-white/30 uppercase tracking-wider">{t("cost.results.energy")}</span>
                            </div>
                            <p className="text-lg font-black text-white/80 tabular-nums">{t("cost.results.currency")}{costResults.energyCostPerUnit.toFixed(2)}</p>
                            <p className="text-[9px] text-white/20 mt-1">{t("cost.results.energyDesc")}</p>
                        </div>
                        <div className="glass-card rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <Building2 size={12} className="text-rose-400/60" />
                                <span className="text-[9px] font-black text-white/30 uppercase tracking-wider">{t("cost.results.overhead")}</span>
                            </div>
                            <p className="text-lg font-black text-white/80 tabular-nums">{t("cost.results.currency")}{costResults.overheadPerUnit.toFixed(2)}</p>
                            <p className="text-[9px] text-white/20 mt-1">{t("cost.results.overheadDesc")}</p>
                        </div>
                        {costResults.industryCostPerUnit > 0 && (
                            <div className="glass-card rounded-2xl p-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <Factory size={12} className="text-orange-400/60" />
                                    <span className="text-[9px] font-black text-white/30 uppercase tracking-wider">{t("cost.results.industry")}</span>
                                </div>
                                <p className="text-lg font-black text-white/80 tabular-nums">{t("cost.results.currency")}{costResults.industryCostPerUnit.toFixed(2)}</p>
                                <p className="text-[9px] text-white/20 mt-1">{t("cost.results.industryDesc")}</p>
                            </div>
                        )}
                    </div>

                    {/* Daily total */}
                    <div className="glass-card rounded-2xl p-6 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <TrendingUp size={14} className="text-emerald-400/50" />
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em]">{t("cost.results.dailyTotal")}</span>
                        </div>
                        <p className="text-2xl font-black text-emerald-400/80 tabular-nums">
                            {t("cost.results.currency")}{costResults.totalDailyCost.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-[9px] text-white/20 mt-1">{t("cost.results.dailyTotalDesc")}</p>
                    </div>
                </motion.div>
            )}

            {/* Actions */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row items-center justify-between gap-4"
            >
                <button onClick={onBack} className="flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors font-bold uppercase tracking-wider">
                    <ArrowLeft size={14} /> {t("results.back")}
                </button>
                <div className="flex items-center gap-3">
                    <button onClick={handleCSV} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/8 text-xs font-bold text-white/40 hover:text-white/70 hover:border-white/15 transition-all uppercase tracking-wider">
                        <FileSpreadsheet size={14} /> {t("results.downloadCSV")}
                    </button>
                    <button onClick={handlePDF} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/8 text-xs font-bold text-white/40 hover:text-white/70 hover:border-white/15 transition-all uppercase tracking-wider">
                        <FileDown size={14} /> {t("results.downloadPDF")}
                    </button>
                    <button onClick={onReset} className="btn-glow bg-gradient-to-r from-ardic-cyan to-ardic-blue-light text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all duration-300 flex items-center gap-2">
                        <RotateCcw size={14} /> {t("results.newCalculation")}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
