/** One request at a time, paused while hidden/offline, with bounded failure backoff. */
export function foregroundRefresh<T>({
  load,
  isActive,
  onData,
  onError,
}: {
  load: (signal: AbortSignal) => Promise<T>;
  isActive: () => boolean;
  onData: (data: T) => void;
  /** Return false when access is revoked; only a new authenticated mount may resume. */
  onError: (error: unknown) => boolean;
}) {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running = false;
  let stopped = false;
  let failures = 0;

  function clearTimer() {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  }

  async function refresh() {
    clearTimer();
    if (stopped || running || !isActive()) return;
    running = true;
    try {
      const data = await load(controller.signal);
      if (stopped) return;
      failures = 0;
      onData(data);
    } catch (error) {
      if (stopped) return;
      failures = Math.min(failures + 1, 4);
      if (!onError(error)) stopped = true;
    } finally {
      running = false;
      if (!stopped && isActive()) {
        timer = setTimeout(() => void refresh(), Math.min(30_000 * 2 ** failures, 300_000));
      }
    }
  }

  return {
    refresh,
    stop() {
      stopped = true;
      clearTimer();
      controller.abort();
    },
  };
}
