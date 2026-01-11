
export interface DataPoint {
    inputDuration: number; // x
    rtt: number;           // y
}

export interface PredictionModel {
    processingRate: number; // m (slope)
    fixedOverhead: number;  // c (intercept)
    safetyMargin: number;   // 2 * standard deviation
    confidence: number;     // 0-1 based on sample size and variance
}

// Default fallback values if no history exists
// Assume 300ms overhead and processing at 0.5x realtime speed
const DEFAULT_MODEL: PredictionModel = {
    processingRate: 0.5,
    fixedOverhead: 300,
    safetyMargin: 200,
    confidence: 0
};

export function calculateRegressionModel(history: DataPoint[]): PredictionModel {
    // Need at least 3 points for a rudimentary trend
    if (history.length < 3) return DEFAULT_MODEL;

    const n = history.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    for (const p of history) {
        sumX += p.inputDuration;
        sumY += p.rtt;
        sumXY += p.inputDuration * p.rtt;
        sumX2 += p.inputDuration * p.inputDuration;
    }

    const denominator = (n * sumX2) - (sumX * sumX);
    
    // If denominator is 0 (all inputs identical length), fallback to average
    if (denominator === 0) return DEFAULT_MODEL;

    // Calculate Slope (m) and Intercept (c)
    // y = mx + c
    const m = ((n * sumXY) - (sumX * sumY)) / denominator;
    const c = (sumY - (m * sumX)) / n;

    // Calculate Variance / Standard Deviation (Safety Margin)
    let sumSquaredResiduals = 0;
    for (const p of history) {
        const predictedY = (m * p.inputDuration) + c;
        const residual = p.rtt - predictedY;
        sumSquaredResiduals += residual * residual;
    }

    const variance = sumSquaredResiduals / n;
    const stdDev = Math.sqrt(variance);

    // Sanity checks to prevent wild values
    // Processing rate shouldn't be negative (time travel) or absurdly high (>5x)
    const clampedM = Math.max(0.1, Math.min(m, 5.0));
    // Overhead shouldn't be negative
    const clampedC = Math.max(0, c);

    return {
        processingRate: clampedM,
        fixedOverhead: clampedC,
        safetyMargin: stdDev * 2, // 2-sigma (95% confidence coverage)
        confidence: Math.min(n / 10, 1.0) // 10 samples = full confidence
    };
}

export function predictWaitTime(inputDurationMs: number, model: PredictionModel): number {
    const rawPrediction = (inputDurationMs * model.processingRate) + model.fixedOverhead;
    return rawPrediction + model.safetyMargin;
}
