"use client";

import { useState, useEffect } from "react";
import { Save, Lock, Layout, RefreshCw } from "lucide-react";

export default function ModConfigAdmin() {
  const [secret, setSecret] = useState("");
  const [adminName, setAdminName] = useState("");
  const [configName, setConfigName] = useState("LQM Default");
  const [configData, setConfigData] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);

  // Parse config string for preview
  useEffect(() => {
    if (!configData) {
      setPreview([]);
      return;
    }
    const items = configData.split(";").map(str => {
      const parts = str.split("|");
      return {
        name: parts[0],
        offset: parts[1],
        bytes: parts[2]
      };
    }).filter(item => item.name && item.offset);
    setPreview(items);
  }, [configData]);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mod-config?config_name=${encodeURIComponent(configName)}`);
      const data = await res.json();
      if (data.success) {
        setConfigData(data.data);
      } else {
        alert("Config not found, you can create new one.");
        setConfigData(""); 
      }
    } catch (e) {
      alert("Error fetching config");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!secret) return alert("Enter Admin Secret");
    setLoading(true);
    try {
      const res = await fetch("/api/mod-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret,
          admin_name: adminName,
          config_name: configName,
          config_data: configData
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Saved successfully!");
      } else {
        alert("Error: " + data.error);
      }
    } catch (e) {
      alert("Error saving");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-white">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Layout className="text-blue-500" /> Mod Config Admin
          </h1>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Config Name</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 w-full focus:border-blue-500 outline-none" 
                />
                <button 
                  onClick={fetchConfig}
                  className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg"
                  title="Load Config"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Admin Secret</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="gumballzAdminSecret123"
                  className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 w-full focus:border-blue-500 outline-none pl-10" 
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Your Admin Name</label>
                <input 
                  type="text" 
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g. GumballZ_Modder"
                  className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 w-full focus:border-blue-500 outline-none" 
                />
             </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">
              Config Data String <span className="text-xs text-slate-500">(Name|Offset|HexBytes;...)</span>
            </label>
            <textarea 
              value={configData}
              onChange={(e) => setConfigData(e.target.value)}
              rows={6}
              className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 w-full focus:border-blue-500 outline-none font-mono text-sm"
            />
          </div>

          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Save className="w-5 h-5" /> Save Configuration
          </button>
        </div>

        {/* Live Preview */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-green-500" /> Parsed Features Preview
          </h3>
          {preview.length === 0 ? (
            <p className="text-slate-500 italic">No valid features parsed.</p>
          ) : (
            <div className="grid gap-3">
              {preview.map((item, idx) => (
                <div key={idx} className="bg-slate-900/50 p-3 rounded-lg flex items-center justify-between border border-slate-700/50">
                   <div>
                     <div className="font-bold text-blue-400">{item.name}</div>
                     <div className="text-xs text-slate-500 font-mono">Offset: {item.offset}</div>
                   </div>
                   <div className="font-mono text-xs bg-slate-950 px-2 py-1 rounded text-orange-400">
                     {item.bytes}
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
