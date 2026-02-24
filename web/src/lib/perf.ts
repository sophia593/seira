/**
 * Lightweight performance timing utilities.
 * All output goes to server console via [perf] prefix for easy grepping.
 */

/** Wrap an async function and log its execution time. */
export async function timed<T>(label: string, fn: () => PromiseLike<T>): Promise<T> {
  const start = performance.now()
  const result = await fn()
  const ms = (performance.now() - start).toFixed(1)
  console.log(`[perf] ${label} — ${ms}ms`)
  return result
}

/** Start a manual timer. Call .end() to log elapsed time and return ms. */
export function startTimer(label: string) {
  const start = performance.now()
  return {
    end: () => {
      const ms = (performance.now() - start).toFixed(1)
      console.log(`[perf] ${label} — ${ms}ms`)
      return parseFloat(ms)
    },
  }
}
