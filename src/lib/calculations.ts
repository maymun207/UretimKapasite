/* ═══════════════════════════════════════════════════════════════
   Manufacturing Capacity Calculations — Pure Functions
   ═══════════════════════════════════════════════════════════════ */

export interface BottleneckStep {
    name: string;
    capacity: number; // units per hour
}

export interface BatchInputs {
    lines: number;         // n — parallel lines
    shifts: number;        // Sw — shifts per day
    hoursPerShift: number; // Hsh
    batchSize: number;     // Q — units per batch
    batchTime: number;     // Tb — hours per batch
    downtime: number;      // hours of downtime between batches
    availability: number;  // A (0–1)
    efficiency: number;    // E (0–1)
    yieldRate: number;     // (0–1)
    workingDaysPerWeek: number; // 5, 6, or 7
    steps: BottleneckStep[];
}

export interface DiscreteInputs {
    lines: number;
    shifts: number;
    hoursPerShift: number;
    cycleTime: number;     // Tc — minutes per unit (0 if Rp given)
    outputRate: number;    // Rp — units per hour (0 if Tc given)
    availability: number;
    efficiency: number;
    yieldRate: number;
    workingDaysPerWeek: number;
    stations: BottleneckStep[];
}

export interface CapacityResults {
    theoreticalMax: number;      // per day
    effectiveCapacity: number;   // per day
    actualOutput: number;        // per day
    utilization: number;         // percentage
    bottleneckStep: BottleneckStep | null;
    workingDaysPerWeek: number;
    weekly: { theoretical: number; effective: number; actual: number };
    monthly: { theoretical: number; effective: number; actual: number };
    yearly: { theoretical: number; effective: number; actual: number };
}

/* ── Cost Calculation Types ───────────────────────────────────── */

export interface CostInputs {
    rawMaterialCost: number;   // ₺ per batch (batch) or per unit (discrete)
    laborCostPerHour: number;  // $/hr
    workersPerShift: number;   // headcount per shift
    energyRate: number;        // $/kWh
    machinePower: number;      // kW
    overheadRate: number;      // decimal (0.15 = 15%)
    industryExtra: number;     // industry-specific cost value
}

export interface CostResults {
    unitCost: number;
    materialCostPerUnit: number;
    laborCostPerUnit: number;
    energyCostPerUnit: number;
    overheadPerUnit: number;
    industryCostPerUnit: number;
    totalDailyCost: number;
}

/** Industry-specific extra field definitions */
export const INDUSTRY_EXTRA_FIELDS: Record<string, { labelKey: string; unit: string }> = {
    chemical: { labelKey: "cost.extra.wasteDisposal", unit: "$/batch" },
    paint: { labelKey: "cost.extra.wasteDisposal", unit: "$/batch" },
    food: { labelKey: "cost.extra.coldStorage", unit: "$/hr" },
    pharma: { labelKey: "cost.extra.qcCompliance", unit: "$/batch" },
    ceramic: { labelKey: "cost.extra.kilnFurnace", unit: "$/hr" },
    glass: { labelKey: "cost.extra.kilnFurnace", unit: "$/hr" },
    automotive: { labelKey: "cost.extra.tooling", unit: "$/unit" },
    metal: { labelKey: "cost.extra.tooling", unit: "$/unit" },
    electronics: { labelKey: "cost.extra.componentBOM", unit: "$/unit" },
    plastic: { labelKey: "cost.extra.moldAmortization", unit: "$/unit" },
    textile: { labelKey: "cost.extra.cuttingWaste", unit: "%" },
    packaging: { labelKey: "cost.extra.printSetup", unit: "$/run" },
};

function expandPeriods(daily: { theoretical: number; effective: number; actual: number }, workingDaysPerWeek: number) {
    const daysPerMonth = workingDaysPerWeek * 4.33;  // average weeks/month
    const daysPerYear = workingDaysPerWeek * 52;
    return {
        weekly: {
            theoretical: daily.theoretical * workingDaysPerWeek,
            effective: daily.effective * workingDaysPerWeek,
            actual: daily.actual * workingDaysPerWeek,
        },
        monthly: {
            theoretical: daily.theoretical * daysPerMonth,
            effective: daily.effective * daysPerMonth,
            actual: daily.actual * daysPerMonth,
        },
        yearly: {
            theoretical: daily.theoretical * daysPerYear,
            effective: daily.effective * daysPerYear,
            actual: daily.actual * daysPerYear,
        },
    };
}

/**
 * Batch Process:
 * PC_max = n × Sw × Hsh × (Q / (Tb + downtime))
 */
export function calculateBatchCapacity(inputs: BatchInputs): CapacityResults {
    const { lines, shifts, hoursPerShift, batchSize, batchTime, downtime, availability, efficiency, yieldRate, workingDaysPerWeek, steps } = inputs;

    const effectiveBatchTime = batchTime + downtime;
    const batchesPerLinePerDay = effectiveBatchTime > 0 ? (shifts * hoursPerShift) / effectiveBatchTime : 0;
    const theoreticalMax = lines * batchesPerLinePerDay * batchSize;

    const bottleneckStep = findBottleneck(steps);

    let cappedTheoretical = theoreticalMax;
    if (bottleneckStep) {
        const bottleneckDaily = bottleneckStep.capacity * shifts * hoursPerShift * lines;
        cappedTheoretical = Math.min(theoreticalMax, bottleneckDaily);
    }

    const effectiveCapacity = cappedTheoretical * availability * efficiency;
    const actualOutput = effectiveCapacity * yieldRate;
    const utilization = theoreticalMax > 0 ? (actualOutput / theoreticalMax) * 100 : 0;

    const periods = expandPeriods({ theoretical: theoreticalMax, effective: effectiveCapacity, actual: actualOutput }, workingDaysPerWeek);

    return { theoreticalMax, effectiveCapacity, actualOutput, utilization, bottleneckStep, workingDaysPerWeek, ...periods };
}

/**
 * Discrete / Continuous Process:
 * Rp = 1/Tc (if cycle time given, converting minutes to hours)
 * PC_max = n × Sw × Hsh × Rp
 */
export function calculateDiscreteCapacity(inputs: DiscreteInputs): CapacityResults {
    const { lines, shifts, hoursPerShift, cycleTime, outputRate, availability, efficiency, yieldRate, workingDaysPerWeek, stations } = inputs;

    let rp = outputRate;
    if (cycleTime > 0) {
        rp = 60 / cycleTime;
    }

    const theoreticalMax = lines * shifts * hoursPerShift * rp;

    const bottleneckStep = findBottleneck(stations);

    let cappedTheoretical = theoreticalMax;
    if (bottleneckStep) {
        const bottleneckDaily = bottleneckStep.capacity * shifts * hoursPerShift * lines;
        cappedTheoretical = Math.min(theoreticalMax, bottleneckDaily);
    }

    const effectiveCapacity = cappedTheoretical * availability * efficiency;
    const actualOutput = effectiveCapacity * yieldRate;
    const utilization = theoreticalMax > 0 ? (actualOutput / theoreticalMax) * 100 : 0;

    const periods = expandPeriods({ theoretical: theoreticalMax, effective: effectiveCapacity, actual: actualOutput }, workingDaysPerWeek);

    return { theoreticalMax, effectiveCapacity, actualOutput, utilization, bottleneckStep, workingDaysPerWeek, ...periods };
}

/**
 * Finds the step/station with the minimum capacity (the bottleneck).
 */
export function findBottleneck(steps: BottleneckStep[]): BottleneckStep | null {
    const valid = steps.filter((s) => s.name.trim() !== "" && s.capacity > 0);
    if (valid.length === 0) return null;
    return valid.reduce((min, step) => (step.capacity < min.capacity ? step : min), valid[0]);
}

/**
 * Export results as CSV string
 */
export function exportToCSV(results: CapacityResults, processType: string): string {
    const rows = [
        ["Metric", "Daily", "Weekly", "Monthly", "Yearly"],
        ["Process Type", processType, "", "", ""],
        ["Theoretical Max", results.theoreticalMax.toFixed(2), results.weekly.theoretical.toFixed(2), results.monthly.theoretical.toFixed(2), results.yearly.theoretical.toFixed(2)],
        ["Effective Capacity", results.effectiveCapacity.toFixed(2), results.weekly.effective.toFixed(2), results.monthly.effective.toFixed(2), results.yearly.effective.toFixed(2)],
        ["Actual Output", results.actualOutput.toFixed(2), results.weekly.actual.toFixed(2), results.monthly.actual.toFixed(2), results.yearly.actual.toFixed(2)],
        ["Utilization (%)", results.utilization.toFixed(2), "", "", ""],
        ["Working Days/Week", String(results.workingDaysPerWeek), "", "", ""],
        ["Bottleneck", results.bottleneckStep?.name ?? "N/A", "", "", ""],
    ];
    return rows.map((r) => r.join(",")).join("\n");
}

/* ── Cost Calculations ───────────────────────────────────────── */

export function calculateBatchCost(batch: BatchInputs, cost: CostInputs): CostResults {
    const capacity = calculateBatchCapacity(batch);
    const dailyOutput = capacity.actualOutput;
    if (dailyOutput <= 0) return zeroCost();

    const dailyHours = batch.shifts * batch.hoursPerShift;
    const batchesPerDay = dailyOutput / batch.batchSize;

    const materialCostPerUnit = cost.rawMaterialCost / batch.batchSize;
    const laborCostPerUnit = (cost.laborCostPerHour * cost.workersPerShift * dailyHours) / dailyOutput;
    const energyCostPerUnit = (cost.energyRate * cost.machinePower * dailyHours) / (1000 * dailyOutput) * 1000;
    const industryCostPerUnit = computeIndustryCost(cost.industryExtra, batchesPerDay, dailyOutput, dailyHours);

    const directCost = materialCostPerUnit + laborCostPerUnit + energyCostPerUnit + industryCostPerUnit;
    const overheadPerUnit = directCost * cost.overheadRate;
    const unitCost = directCost + overheadPerUnit;

    return {
        unitCost,
        materialCostPerUnit,
        laborCostPerUnit,
        energyCostPerUnit,
        overheadPerUnit,
        industryCostPerUnit,
        totalDailyCost: unitCost * dailyOutput,
    };
}

export function calculateDiscreteCost(discrete: DiscreteInputs, cost: CostInputs): CostResults {
    const capacity = calculateDiscreteCapacity(discrete);
    const dailyOutput = capacity.actualOutput;
    if (dailyOutput <= 0) return zeroCost();

    const dailyHours = discrete.shifts * discrete.hoursPerShift;

    const materialCostPerUnit = cost.rawMaterialCost;
    const laborCostPerUnit = (cost.laborCostPerHour * cost.workersPerShift * dailyHours) / dailyOutput;
    const energyCostPerUnit = (cost.energyRate * cost.machinePower * dailyHours) / (1000 * dailyOutput) * 1000;
    const industryCostPerUnit = cost.industryExtra; // per-unit for discrete industries

    const directCost = materialCostPerUnit + laborCostPerUnit + energyCostPerUnit + industryCostPerUnit;
    const overheadPerUnit = directCost * cost.overheadRate;
    const unitCost = directCost + overheadPerUnit;

    return {
        unitCost,
        materialCostPerUnit,
        laborCostPerUnit,
        energyCostPerUnit,
        overheadPerUnit,
        industryCostPerUnit,
        totalDailyCost: unitCost * dailyOutput,
    };
}

function computeIndustryCost(extraValue: number, batchesPerDay: number, dailyOutput: number, _dailyHours: number): number {
    if (!extraValue || dailyOutput <= 0) return 0;
    // Industry extra is per-batch cost spread across output
    return (extraValue * batchesPerDay) / dailyOutput;
}

function zeroCost(): CostResults {
    return { unitCost: 0, materialCostPerUnit: 0, laborCostPerUnit: 0, energyCostPerUnit: 0, overheadPerUnit: 0, industryCostPerUnit: 0, totalDailyCost: 0 };
}
