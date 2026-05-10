import { useEffect, useState } from "react";

/** Wait for persisted zustand storage to hydrate before reading secured values (e.g. admin token). */
export function usePersistHydrated(store) {
  const [ready, setReady] = useState(() =>
    typeof store.persist?.hasHydrated === "function" ? store.persist.hasHydrated() : true,
  );

  useEffect(() => {
    if (!store.persist?.onFinishHydration) {
      setReady(true);
      return undefined;
    }
    const done = () => setReady(true);
    const unsub = store.persist.onFinishHydration(done);
    if (store.persist?.hasHydrated?.()) done();
    return unsub;
  }, [store]);

  return ready;
}
