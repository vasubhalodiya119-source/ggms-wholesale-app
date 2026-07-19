"use client";

import { useEffect, useState } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { supabase } from "@/lib/supabase";

export default function ForceUpdatePrompt() {
  const [updateRequired, setUpdateRequired] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");

  useEffect(() => {
    async function checkVersion() {
      // Only check on native mobile apps
      if (!Capacitor.isNativePlatform()) return;

      try {
        const info = await App.getInfo();
        const currentBuild = parseInt(info.build, 10) || 1;

        // Fetch settings from Supabase
        const { data, error } = await supabase
          .from("app_settings")
          .select("value")
          .in("key", ["android_version", "app_version"])
          .limit(1);

        if (error || !data || data.length === 0) {
          console.error("Failed to fetch app version settings:", error);
          return;
        }

        let rawVal = data[0].value;
        if (typeof rawVal === "string") {
          try {
            rawVal = JSON.parse(rawVal);
          } catch (e) {
            console.error("JSON parse error on version settings:", e);
          }
        }

        const settings = rawVal as any;
        if (!settings) return;

        const minVersion = parseInt(String(settings.min_version || settings.minVersion || 0), 10);
        const url = settings.download_url || settings.app_download_url || "https://ggms-wholesale-app.vercel.app/GGMS-Wholesale.apk";

        if (minVersion > 0 && currentBuild < minVersion) {
          setDownloadUrl(url);
          setUpdateRequired(true);
        }
      } catch (err) {
        console.error("Error checking app version:", err);
      }
    }

    checkVersion();
  }, []);

  if (!updateRequired) return null;

  const handleUpdate = async () => {
    if (downloadUrl) {
      await Browser.open({ url: downloadUrl });
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-900/95 flex flex-col items-center justify-center p-6 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center space-y-6">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border-4 border-green-50">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
             <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">એપ અપડેટ કરો</h2>
          <p className="text-gray-600 text-sm">
            તમારી એપનું વર્ઝન જૂનું છે. નવી સુવિધાઓનો ઉપયોગ કરવા માટે અને આગળ વધવા માટે કૃપા કરીને એપ અપડેટ કરો.
          </p>
        </div>
        
        <button 
          onClick={handleUpdate}
          className="block w-full py-3.5 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors shadow-md text-lg"
        >
          અપડેટ ડાઉનલોડ કરો
        </button>
      </div>
    </div>
  );
}
