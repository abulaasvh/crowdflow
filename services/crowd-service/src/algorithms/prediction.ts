/**
 * Queue Wait Time Prediction
 *
 * Uses Exponential Smoothing (Holt's method) for 15-minute ahead prediction.
 *
 * Holt's Double Exponential Smoothing:
 * ─────────────────────────────────────
 * Level:   L_t = α * y_t + (1 - α) * (L_{t-1} + T_{t-1})
 * Trend:   T_t = β * (L_t - L_{t-1}) + (1 - β) * T_{t-1}
 * Forecast: F_{t+h} = L_t + h * T_t
 *
 * Parameters:
 *   α = 0.3 (smoothing for level — moderately responsive)
 *   β = 0.1 (smoothing for trend — conservative, avoids overshoot)
 *   h = 30 (forecast horizon: 15 minutes at 2 readings/minute)
 */

interface PredictionResult {
  /** Predicted wait time in minutes, 15 minutes ahead */
  predicted: number;
  /** 90% confidence interval [lower, upper] in minutes */
  confidence: [number, number];
}

/**
 * Predict queue wait time 15 minutes into the future.
 *
 * @param history - Array of past queue lengths (most recent last)
 * @param serviceRate - People served per minute at this queue
 * @returns Predicted wait time and confidence interval
 */
export function predictQueueWait(
  history: number[],
  serviceRate: number,
): PredictionResult {
  // Need at least 3 data points for meaningful prediction
  if (history.length < 3) {
    const current = history.length > 0 ? history[history.length - 1]! : 0;
    const waitMinutes = serviceRate > 0 ? current / serviceRate : 0;
    return {
      predicted: Math.round(waitMinutes * 10) / 10,
      confidence: [
        Math.max(0, waitMinutes * 0.5),
        waitMinutes * 1.5,
      ] as [number, number],
    };
  }

  // ─── Holt's Double Exponential Smoothing ──────────────────────
  const alpha = 0.3; // Level smoothing
  const beta = 0.1;  // Trend smoothing
  const horizon = 30; // Forecast 30 readings ahead (15 min at 2/min)

  // Initialize level and trend
  let level = history[0]!;
  let trend = (history[1]! - history[0]!) || 0;

  // Apply smoothing through historical data
  for (let i = 1; i < history.length; i++) {
    const prevLevel = level;
    level = alpha * history[i]! + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }

  // Forecast: L_t + h * T_t
  const forecastQueueLength = Math.max(0, level + horizon * trend);
  const forecastWait =
    serviceRate > 0 ? forecastQueueLength / serviceRate : 0;

  // ─── Confidence Interval ──────────────────────────────────────
  // Calculate residual standard error from last few predictions
  const residuals: number[] = [];
  let rLevel = history[0]!;
  let rTrend = (history[1]! - history[0]!) || 0;

  for (let i = 1; i < history.length; i++) {
    const predicted = rLevel + rTrend;
    residuals.push(history[i]! - predicted);
    const prevLevel = rLevel;
    rLevel = alpha * history[i]! + (1 - alpha) * (rLevel + rTrend);
    rTrend = beta * (rLevel - prevLevel) + (1 - beta) * rTrend;
  }

  const mse =
    residuals.length > 0
      ? residuals.reduce((sum, r) => sum + r * r, 0) / residuals.length
      : forecastQueueLength * 0.1;
  const rmse = Math.sqrt(mse);

  // 90% confidence: ±1.645 * RMSE * sqrt(horizon)
  const marginOfError =
    (1.645 * rmse * Math.sqrt(horizon)) / (serviceRate || 1);

  return {
    predicted: Math.round(Math.max(0, forecastWait) * 10) / 10,
    confidence: [
      Math.round(Math.max(0, forecastWait - marginOfError) * 10) / 10,
      Math.round(Math.max(0, forecastWait + marginOfError) * 10) / 10,
    ],
  };
}

/**
 * Simple Moving Average for short-term smoothing.
 * Used as a simpler alternative when data is sparse.
 *
 * @param data - Array of values
 * @param window - Window size
 * @returns Smoothed value
 */
export function simpleMovingAverage(data: number[], window: number): number {
  if (data.length === 0) return 0;
  const slice = data.slice(-window);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}
