"use client";

import { useEffect, useState } from "react";
import { useShopAuth } from "@/lib/shop-auth";
import { getPushPermissionStatus, subscribeToPush } from "@/lib/push";
import { Bell } from "lucide-react";

export default function CustomerNotificationPrompt() {
  const { shop } = useShopAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!shop) return;

    async function checkPermission() {
      const status = await getPushPermissionStatus();
      if (status !== "granted") {
        setShowPrompt(true);
      } else {
        setShowPrompt(false);
      }
    }

    checkPermission();

    // Check again when window gains focus
    const handleFocus = () => checkPermission();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [shop]);

  if (!shop || !showPrompt) return null;

  const handleEnablePush = async () => {
    setLoading(true);
    await subscribeToPush(shop.id);
    const status = await getPushPermissionStatus();
    if (status === "granted") {
      setShowPrompt(false);
    }
    setLoading(false);
  };

  return (
    <div className="fixed top-3 left-3 right-3 z-[999] animate-slide-down">
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center flex-shrink-0 animate-bounce">
            <Bell size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-green-400 uppercase tracking-wider">નોટિફિકેશન જરૂરી છે 🔔</p>
            <p className="text-sm font-bold text-slate-100">તમારા ઓર્ડરના કન્ફર્મેશન અને લાઈવ અપડેટ માટે નોટિફિકેશન ઓન કરો.</p>
          </div>
        </div>
        <button
          onClick={handleEnablePush}
          disabled={loading}
          className="w-full sm:w-auto bg-green-600 hover:bg-green-700 active:scale-95 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition duration-150 flex items-center justify-center gap-2 whitespace-nowrap shadow-md"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "નોટિફિકેશન ચાલુ કરો"
          )}
        </button>
      </div>
    </div>
  );
}
