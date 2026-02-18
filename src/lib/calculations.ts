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
    stations: BottleneckStep[];
}

export interface CapacityResults {
    theoreticalMax: number;
    effectiveCapacity: number;
    actualOutput: number;
    utilization: number;        // percentage
    bottleneckStep: BottleneckStep | null;
}

/**
 * Batch Process:
 * PC_max = n × Sw × Hsh × (Q / (Tb + downtime))
 */
export function calculateBatchCapacity(inputs: BatchInputs): CapacityResults {
    const { lines, shifts, hoursPerShift, batchSize, batchTime, downtime, availability, efficiency, yieldRate, steps } = inputs;

    const effectiveBatchTime = batchTime + downtime;
    const batchesPerLinePerDay = effectiveBatchTime > 0 ? (shifts * hoursPerShift) / effectiveBatchTime : 0;
    const theoreticalMax = lines * batchesPerLinePerDay * batchSize;

    const bottleneckStep = findBottleneck(steps);

    // If bottleneck exists, cap theoretical max at bottleneck throughput
    let cappedTheoretical = theoreticalMax;
    if (bottleneckStep) {
        const bottleneckDaily = bottleneckStep.capacity * shifts * hoursPerShift * lines;
        cappedTheoretical = Math.min(theoreticalMax, bottleneckDaily);
    }

    const effectiveCapacity = cappedTheoretical * availability * efficiency;
    const actualOutput = effectiveCapacity * yieldRate;
    const utilization = theoreticalMax > 0 ? (actualOutput / theoreticalMax) * 100 : 0;

    return { theoreticalMax, effectiveCapacity, actualOutput, utilization, bottleneckStep };
}

/**
 * Discrete / Continuous Process:
 * Rp = 1/Tc (if cycle time given, converting minutes to hours)
 * PC_max = n × Sw × Hsh × Rp
 */
export function calculateDiscreteCapacity(inputs: DiscreteInputs): CapacityResults {
    const { lines, shifts, hoursPerShift, cycleTime, outputRate, availability, efficiency, yieldRate, stations } = inputs;

    // Derive Rp
    let rp = outputRate;
    if (cycleTime > 0) {
        rp = 60 / cycleTime; // convert minutes/unit → units/hour
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

    return { theoreticalMax, effectiveCapacity, actualOutput, utilization, bottleneckStep };
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
        ["Metric", "Value"],
        ["Process Type", processType],
        ["Theoretical Max Capacity", results.theoreticalMax.toFixed(2)],
        ["Effective Capacity", results.effectiveCapacity.toFixed(2)],
        ["Actual Saleable Output", results.actualOutput.toFixed(2)],
        ["Capacity Utilization (%)", results.utilization.toFixed(2)],
        ["Bottleneck Step", results.bottleneckStep?.name ?? "N/A"],
        ["Bottleneck Capacity (units/hr)", results.bottleneckStep?.capacity?.toFixed(2) ?? "N/A"],
    ];
    return rows.map((r) => r.join(",")).join("\n");
}
