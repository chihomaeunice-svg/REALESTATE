import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

const CHECK_INTERVAL_MS = 5 * 60 * 1000;

export function UpdateBanner() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    async function checkVersion() {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return;
        const { buildId } = await res.json();
        if (buildId && buildId !== __BUILD_ID__) setUpdateAvailable(true);
      } catch {
        // Offline or version.json not present (e.g. local dev) — ignore.
      }
    }
    const interval = setInterval(checkVersion, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  if (!updateAvailable) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4">
      <div className="flex items-center gap-3 rounded-xl bg-ink-900 px-4 py-3 text-sm text-white shadow-xl">
        <span>A new version of Nyumba Yangu is available.</span>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 font-semibold transition hover:bg-brand-700"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>
    </div>
  );
}
