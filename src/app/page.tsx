"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Droplet,
    Clock,
    Settings,
    TrendingUp,
    Activity,
    Calendar,
    Layers,
    ShieldCheck,
    Gauge,
    Factory,
    HelpCircle,
    Shapes,
    Scan,
    LucideIcon,
    ChevronRight,
    Send,
    Mail,
    Beaker,
    Timer,
    Percent,
    Zap,
    BarChart3,
    ArrowRight
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/* ═══════════════════════════════════════════════════════════════
   Animated Counter
   ═══════════════════════════════════════════════════════════════ */

const ArdicCounter = ({ value, decimals = 0 }: { value: number; decimals?: number }) => {
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        let start = display;
        const end = value;
        const duration = 1200;
        const startTime = performance.now();

        const animate = (time: number) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            setDisplay(start + (end - start) * ease);
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [value]);

    return (
        <span className="tabular-nums">
            {display.toLocaleString("tr-TR", {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
            })}
        </span>
    );
};

/* ═══════════════════════════════════════════════════════════════
   Tooltip
   ═══════════════════════════════════════════════════════════════ */

const ArdicInfo = ({ children, title }: { children: string; title: string }) => (
    <div className="group relative inline-flex items-center">
        <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center cursor-help hover:border-ardic-cyan/40 hover:bg-ardic-cyan/5 transition-all">
            <HelpCircle size={11} className="text-white/30 group-hover:text-ardic-cyan transition-colors" />
        </div>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-5 rounded-2xl bg-ardic-surface border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100 pointer-events-none z-50 origin-bottom shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]">
            <div className="text-[9px] font-black text-ardic-cyan uppercase tracking-[0.3em] mb-1.5">{title}</div>
            <div className="text-[11px] text-white/60 leading-relaxed">{children}</div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-ardic-surface" />
        </div>
    </div>
);

/* ═══════════════════════════════════════════════════════════════
   Premium Slider Component
   ═══════════════════════════════════════════════════════════════ */

const PremiumSlider = ({
    label,
    value,
    onChange,
    unit,
    min,
    max,
    step = 1,
    help,
    helpTitle,
    icon: Icon,
    color = "cyan",
}: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    unit: string;
    min: number;
    max: number;
    step?: number;
    help: string;
    helpTitle: string;
    icon: LucideIcon;
    color?: "cyan" | "blue" | "purple";
}) => {
    const percentage = ((value - min) / (max - min)) * 100;

    const colorMap = {
        cyan: {
            iconBg: "bg-ardic-cyan/10",
            iconText: "text-ardic-cyan",
            valueBg: "bg-ardic-cyan/10 border-ardic-cyan/20 text-ardic-cyan",
            barColor: "from-ardic-cyan/60 to-ardic-cyan/20",
        },
        blue: {
            iconBg: "bg-ardic-blue/20",
            iconText: "text-blue-400",
            valueBg: "bg-blue-500/10 border-blue-500/20 text-blue-400",
            barColor: "from-blue-500/60 to-blue-500/20",
        },
        purple: {
            iconBg: "bg-purple-500/10",
            iconText: "text-purple-400",
            valueBg: "bg-purple-500/10 border-purple-500/20 text-purple-400",
            barColor: "from-purple-500/60 to-purple-500/20",
        },
    };

    const c = colorMap[color];

    return (
        <div className="glass-card rounded-2xl p-6 group hover:translate-y-[-2px] transition-all duration-300">
            {/* Label Row */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center transition-all", c.iconBg)}>
                        <Icon size={18} className={cn(c.iconText)} />
                    </div>
                    <div>
                        <span className="text-xs font-bold text-white/60 uppercase tracking-[0.15em]">{label}</span>
                    </div>
                </div>
                <ArdicInfo title={helpTitle}>{help}</ArdicInfo>
            </div>

            {/* Value Badge */}
            <div className="flex items-center justify-center mb-5">
                <div className={cn("px-5 py-2 rounded-xl border text-xl font-black tabular-nums tracking-tight", c.valueBg)}>
                    {value.toLocaleString("tr-TR")}
                    <span className="text-xs font-semibold ml-1.5 opacity-50">{unit}</span>
                </div>
            </div>

            {/* Progress Bar Visual */}
            <div className="relative h-1.5 rounded-full bg-white/5 mb-2 overflow-hidden">
                <motion.div
                    className={cn("absolute inset-y-0 left-0 rounded-full bg-gradient-to-r", c.barColor)}
                    initial={false}
                    animate={{ width: `${percentage}%` }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            </div>

            {/* Range Input */}
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
                className="w-full"
            />

            {/* Min/Max Labels */}
            <div className="flex justify-between text-[9px] text-white/20 font-bold mt-1 tabular-nums tracking-wider">
                <span>{min.toLocaleString("tr-TR")}</span>
                <span>{max.toLocaleString("tr-TR")}</span>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════
   Result Card
   ═══════════════════════════════════════════════════════════════ */

const ResultCard = ({
    label,
    value,
    unit,
    icon: Icon,
    focused = false,
    decimals = 0,
}: {
    label: string;
    value: number;
    unit: string;
    icon: LucideIcon;
    focused?: boolean;
    decimals?: number;
}) => (
    <motion.div
        layout
        className={cn(
            "relative overflow-hidden rounded-2xl border transition-all duration-500",
            focused
                ? "glass-card-glow gradient-border result-halo p-10 md:p-14"
                : "glass-card p-7"
        )}
    >
        {/* Subtle top accent line */}
        {focused && (
            <div className="absolute top-0 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-ardic-cyan/40 to-transparent" />
        )}

        <div className={cn("flex items-center gap-2 mb-4", focused ? "justify-center" : "")}>
            <Icon
                size={focused ? 16 : 14}
                className={focused ? "text-ardic-cyan/50" : "text-white/20"}
            />
            <span
                className={cn(
                    "font-black uppercase tracking-[0.2em]",
                    focused ? "text-[11px] text-white/50" : "text-[10px] text-white/30"
                )}
            >
                {label}
            </span>
        </div>

        <div className={cn("flex items-baseline gap-2", focused ? "justify-center" : "")}>
            <span
                className={cn(
                    "font-black tracking-tighter tabular-nums font-heading",
                    focused
                        ? "text-5xl sm:text-6xl md:text-7xl text-gradient-cyan"
                        : "text-3xl md:text-4xl text-white"
                )}
            >
                <ArdicCounter value={value} decimals={decimals} />
            </span>
            <span
                className={cn(
                    "font-bold uppercase tracking-wider",
                    focused ? "text-base text-ardic-cyan/30" : "text-[10px] text-white/15"
                )}
            >
                {unit}
            </span>
        </div>

        {/* Status indicator for focused */}
        {focused && (
            <div className="flex items-center justify-center gap-2 mt-6">
                <div className="pulse-dot" />
                <span className="text-[9px] font-bold text-white/25 uppercase tracking-[0.3em]">Canlı Hesaplama</span>
            </div>
        )}
    </motion.div>
);

/* ═══════════════════════════════════════════════════════════════
   Supporting Parameter Mini Card
   ═══════════════════════════════════════════════════════════════ */

const MiniParam = ({
    label,
    value,
    unit,
    max,
    min = 1,
    step = 1,
    onChange,
    icon: Icon,
}: {
    label: string;
    value: number;
    unit: string;
    max: number;
    min?: number;
    step?: number;
    onChange: (v: number) => void;
    icon: LucideIcon;
}) => (
    <div className="glass-card rounded-xl p-4 group hover:border-white/10 transition-all duration-300">
        <div className="flex items-center gap-2 mb-3">
            <Icon size={12} className="text-white/20 group-hover:text-ardic-cyan/50 transition-colors" />
            <span className="text-[9px] font-black uppercase text-white/30 tracking-[0.2em] group-hover:text-white/50 transition-colors">
                {label}
            </span>
        </div>
        <div className="flex items-baseline gap-1 mb-3">
            <span className="text-lg font-black text-white/80 tabular-nums">{value}</span>
            <span className="text-[8px] font-bold text-white/20 uppercase">{unit}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
            className="w-full slider-subtle"
        />
    </div>
);

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function ArdicSentinelDashboard() {
    // --- States ---
    const [tankVolume, setTankVolume] = useState(3000);
    const [fillRate, setFillRate] = useState(85);
    const [processTime, setProcessTime] = useState(150);
    const [logisticsTime, setLogisticsTime] = useState(45);
    const [cleaningTime, setCleaningTime] = useState(60);
    const [shiftsPerDay, setShiftsPerDay] = useState(3);
    const [hoursPerShift, setHoursPerShift] = useState(8);
    const [plannedDowntime, setPlannedDowntime] = useState(1.5);
    const [oeeTarget, setOeeTarget] = useState(85);
    const [email, setEmail] = useState("");

    // --- Logic ---
    const results = useMemo(() => {
        const batchSize = tankVolume * (fillRate / 100);
        const cycleTime = processTime + logisticsTime + cleaningTime;
        const availableMin = (shiftsPerDay * hoursPerShift - plannedDowntime) * 60;
        const maxBatches = cycleTime > 0 ? Math.floor((availableMin / cycleTime) * 10) / 10 : 0;
        const theoreticalCap = maxBatches * batchSize;
        const realCap = theoreticalCap * (oeeTarget / 100);

        return { batchSize, cycleTime, availableMin, maxBatches, theoreticalCap, realCap };
    }, [tankVolume, fillRate, processTime, logisticsTime, cleaningTime, shiftsPerDay, hoursPerShift, plannedDowntime, oeeTarget]);

    const stagger = {
        container: { hidden: {}, show: { transition: { staggerChildren: 0.1 } } },
        item: { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } },
    };

    return (
        <div className="relative min-h-screen bg-ardic-dark text-white ardic-mesh-bg">
            {/* Background Layers */}
            <div className="noise-overlay fixed inset-0 z-0" />
            <div className="ambient-orb ambient-orb-1" />
            <div className="ambient-orb ambient-orb-2" />
            <div className="ambient-orb ambient-orb-3" />

            {/* ─── HEADER ───────────────────────────────────── */}
            <header className="relative z-10 px-6 pt-12 pb-6">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-5xl mx-auto flex flex-col items-center gap-5 text-center"
                >
                    {/* Logo Badge */}
                    <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-ardic-blue to-ardic-blue-light flex items-center justify-center shadow-[0_0_40px_rgba(30,58,138,0.5)] ring-1 ring-white/10">
                            <Scan size={30} className="text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-ardic-cyan shadow-[0_0_12px_rgba(0,209,255,0.6)] border-2 border-ardic-dark" />
                    </div>

                    {/* Title */}
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase font-heading">
                            <span className="text-white">ARDIC </span>
                            <span className="text-gradient-cyan">SENTINEL</span>
                        </h1>
                        <div className="flex items-center justify-center gap-3 mt-3">
                            <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-ardic-cyan/30" />
                            <p className="text-[10px] font-bold tracking-[0.5em] text-white/30 uppercase">
                                Capacity Intelligence Model 5.0
                            </p>
                            <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-ardic-cyan/30" />
                        </div>
                    </div>
                </motion.div>
            </header>

            {/* Decorative Line */}
            <div className="gradient-line w-full max-w-3xl mx-auto mb-10" />

            {/* ─── MAIN CONTENT ─────────────────────────────── */}
            <main className="relative z-10 max-w-5xl mx-auto px-6 pb-20">
                {/* ── Primary Sliders ── */}
                <motion.div
                    variants={stagger.container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10"
                >
                    <motion.div variants={stagger.item}>
                        <PremiumSlider
                            label="Reaktör Hacmi"
                            value={tankVolume}
                            onChange={setTankVolume}
                            unit="L"
                            min={500}
                            max={10000}
                            step={250}
                            helpTitle="Kapasite"
                            help="Üretim biriminin toplam brüt geometrik hacmidir."
                            icon={Layers}
                            color="cyan"
                        />
                    </motion.div>
                    <motion.div variants={stagger.item}>
                        <PremiumSlider
                            label="Dolum Oranı"
                            value={fillRate}
                            onChange={setFillRate}
                            unit="%"
                            min={50}
                            max={98}
                            helpTitle="Operasyon"
                            help="Taşma payı hariç gerçek dolum yüzdesidir."
                            icon={Gauge}
                            color="blue"
                        />
                    </motion.div>
                    <motion.div variants={stagger.item}>
                        <PremiumSlider
                            label="Süreç Zamanı"
                            value={processTime}
                            onChange={setProcessTime}
                            unit="dk"
                            min={30}
                            max={480}
                            step={5}
                            helpTitle="Proses"
                            help="Sadece üretim işlemi için gereken süredir."
                            icon={Clock}
                            color="purple"
                        />
                    </motion.div>
                </motion.div>

                {/* ── Results Section ── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                >
                    {/* Section Label */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/5" />
                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/3 border border-white/5">
                            <BarChart3 size={12} className="text-ardic-cyan/50" />
                            <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">
                                Hesaplama Sonuçları
                            </span>
                        </div>
                        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/5" />
                    </div>

                    {/* Secondary Results */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                        <ResultCard label="Net Batch Boyutu" value={results.batchSize} unit="Litre" icon={Droplet} />
                        <ResultCard label="Döngü Süresi" value={results.cycleTime} unit="Dakika" icon={Timer} />
                    </div>

                    {/* Hero Result */}
                    <div className="mb-14">
                        <ResultCard
                            focused
                            label="Günlük Toplam Gerçek Kapasite"
                            value={results.realCap}
                            unit="Litre / Gün"
                            icon={TrendingUp}
                        />
                    </div>
                </motion.div>

                {/* ── Supporting Parameters ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                >
                    {/* Section Label */}
                    <div className="flex items-center gap-3 mb-5">
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/5" />
                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/3 border border-white/5">
                            <Settings size={12} className="text-white/20" />
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">
                                Operasyonel Parametreler
                            </span>
                        </div>
                        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/5" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-14">
                        <MiniParam label="Vardiya" value={shiftsPerDay} unit="Adet" max={4} onChange={setShiftsPerDay} icon={Calendar} />
                        <MiniParam label="Vardiya Süresi" value={hoursPerShift} unit="Saat" max={12} onChange={setHoursPerShift} icon={Clock} />
                        <MiniParam label="Planlı Duruş" value={plannedDowntime} unit="Saat" max={8} step={0.5} onChange={setPlannedDowntime} icon={Activity} />
                        <MiniParam label="OEE Hedefi" value={oeeTarget} unit="%" max={100} onChange={setOeeTarget} icon={ShieldCheck} />
                    </div>
                </motion.div>

                {/* ── Lead Gen / Email CTA ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="glass-card-glow gradient-border rounded-3xl p-8 md:p-12 flex flex-col items-center text-center"
                >
                    {/* Accent Line Top */}
                    <div className="absolute top-0 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-ardic-cyan/30 to-transparent" />

                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-ardic-cyan/15 to-ardic-blue/15 border border-ardic-cyan/10 flex items-center justify-center mb-6">
                        <Mail size={22} className="text-ardic-cyan/70" />
                    </div>

                    <h3 className="text-2xl font-black uppercase tracking-tight mb-2 font-heading">
                        Analiz Raporunu Alın
                    </h3>
                    <p className="text-sm text-white/40 mb-8 max-w-md leading-relaxed">
                        Detaylı verimlilik simülasyonunu ve iyileştirme önerilerini içeren tam raporu e-postanıza gönderelim.
                    </p>

                    <div className="w-full max-w-lg flex flex-col sm:flex-row gap-3">
                        <input
                            type="email"
                            placeholder="E-posta adresiniz"
                            value={email}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                            className="flex-1 bg-black/30 border border-white/8 rounded-xl px-6 py-4 text-sm text-white placeholder:text-white/20 focus:border-ardic-cyan/40 focus:bg-black/50 focus:shadow-[0_0_30px_rgba(0,209,255,0.05)] outline-none transition-all duration-300"
                        />
                        <button className="btn-glow bg-gradient-to-r from-ardic-cyan to-ardic-blue-light text-white px-8 py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] hover:shadow-[0_0_30px_rgba(0,209,255,0.3)] transition-all duration-300 flex items-center justify-center gap-2.5 group">
                            GÖNDER
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    <p className="text-[8px] text-white/15 mt-6 uppercase tracking-[0.3em]">
                        * Sonuçlarınız Sentinel AI motoru tarafından doğrulanacaktır
                    </p>
                </motion.div>
            </main>

            {/* ─── FOOTER ───────────────────────────────────── */}
            <footer className="relative z-10 mt-10 pb-12">
                <div className="gradient-line w-full max-w-3xl mx-auto mb-8" />
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/3 border border-white/5 flex items-center justify-center">
                        <Factory size={18} className="text-white/15" />
                    </div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-white/15">
                        Ardic Distributed Intelligence Unit
                    </p>
                    <p className="text-[8px] text-white/8 tracking-widest">
                        © 2026 — Capacity Intelligence Platform
                    </p>
                </div>
            </footer>
        </div>
    );
}
