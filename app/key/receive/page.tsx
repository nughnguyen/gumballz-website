"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Key, Check, Copy, AlertTriangle, ShieldCheck } from "lucide-react";

export default function ReceiveKeyPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyData, setKeyData] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Link không hợp lệ! Thiếu Token xác thực.");
      setLoading(false);
      return;
    }

    // Call API to claim key
    const verifyToken = async () => {
      try {
        const res = await fetch("/api/keys/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token })
        });
        const data = await res.json();

        if (data.success) {
          setKeyData(data.key);
        } else {
          setError(data.error || "Không thể lấy key.");
        }
      } catch (err) {
        setError("Lỗi kết nối đến server.");
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const copyToClipboard = () => {
    if (keyData) {
      navigator.clipboard.writeText(keyData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
         <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2rem] p-8 shadow-2xl border border-slate-200 text-center"
         >
            {loading ? (
                <div className="py-12">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-700">Đang xác thực Token...</h2>
                    <p className="text-slate-400 text-sm mt-2">Vui lòng đợi trong giây lát</p>
                </div>
            ) : error ? (
                <div className="py-8">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-10 h-10 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2">Xác Thực Thất Bại</h2>
                    <p className="text-red-500 font-medium mb-8 bg-red-50 p-3 rounded-xl border border-red-100">
                        {error}
                    </p>
                    <button onClick={() => router.push('/keys')} className="px-6 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors">
                        Quay lại trang Key
                    </button>
                </div>
            ) : (
                <div className="py-4">
                     <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2">Lấy Key Thành Công!</h2>
                    <p className="text-slate-500 mb-8">Đây là key kích hoạt của bạn cho ngày hôm nay.</p>

                    <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 mb-8 relative group">
                        <p className="font-mono text-xl font-bold text-blue-600 break-all">{keyData}</p>
                        <button onClick={copyToClipboard} className="absolute top-2 right-2 p-2 rounded-lg hover:bg-white transition-colors">
                            {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-slate-400" />}
                        </button>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button onClick={copyToClipboard} className="w-full py-4 rounded-xl bg-blue-600 text-white font-black text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
                            {copied ? "ĐÃ COPY KEY" : "COPY KEY"}
                        </button>
                        <button onClick={() => router.push('/keys')} className="w-full py-3 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition-colors">
                            Quay lại trang chủ
                        </button>
                    </div>
                </div>
            )}
         </motion.div>
         
         <p className="text-center text-slate-400 text-xs mt-8 font-medium">
            Protected by GumballZ Security System
         </p>
      </div>
    </div>
  );
}
