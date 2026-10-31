"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Key, CheckCircle2, Copy, Download, AlertCircle } from "lucide-react";

function ClaimKeyContent() {
  const searchParams = useSearchParams();
  const [key, setKey] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const keyParam = searchParams.get("key");
    if (keyParam) {
      setKey(keyParam);
    } else {
      setError("Không tìm thấy key trong URL");
    }
  }, [searchParams]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAsText = () => {
    const blob = new Blob([key], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gumballz-key.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        {error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Lỗi</h1>
            <p className="text-red-200">{error}</p>
          </div>
        ) : (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 md:p-12 backdrop-blur-xl">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-black text-white text-center mb-3">
              Key Premium Của Bạn
            </h1>
            <p className="text-slate-400 text-center mb-8">
              Cảm ơn bạn đã mua key premium! Sao chép key bên dưới để sử dụng.
            </p>

            {/* Key Display */}
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Key className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                  Premium Key
                </span>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                <code className="text-sm md:text-base font-mono text-blue-300 break-all leading-relaxed">
                  {key}
                </code>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Đã sao chép!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      Sao chép Key
                    </>
                  )}
                </button>
                <button
                  onClick={downloadAsText}
                  className="py-3 px-6 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Tải xuống
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-400" />
                Hướng dẫn sử dụng
              </h3>
              <ol className="space-y-2 text-sm text-slate-300 list-decimal list-inside">
                <li>Mở game và khởi động Mod Menu</li>
                <li>Nhập key vừa sao chép vào form login</li>
                <li>Tận hưởng các tính năng premium</li>
              </ol>
            </div>

            {/* Warning */}
            <div className="mt-6 bg-[#3BA7F2]/10 border border-[#3BA7F2]/20 rounded-xl p-4">
              <p className="text-xs text-[#3BA7F2]/80 leading-relaxed">
                ⚠️ <strong>Lưu ý:</strong> Vui lòng lưu key này cẩn thận. Nếu mất key, bạn sẽ không thể khôi phục.
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function ClaimKeyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500/20 border-t-blue-500"></div>
      </div>
    }>
      <ClaimKeyContent />
    </Suspense>
  );
}
