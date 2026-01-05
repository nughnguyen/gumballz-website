"use client";

import { useState } from "react";
import { Search, Loader2, CheckCircle2, XCircle, Clock, Package } from "lucide-react";
import { motion } from "framer-motion";

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setResult(null);
    setError("");

    try {
        const query = searchTerm.trim().includes("GUMZ") ? `content=${searchTerm.trim()}` : `id=${searchTerm.trim()}`;
        const res = await fetch(`/api/check-transaction?${query}`);
        const data = await res.json();
        
        if (data.success) {
            setResult({
                status: "success",
                message: "Giao dịch đã được ghi nhận thành công.",
                code: searchTerm
            });
        } else {
            setError("Không tìm thấy giao dịch hoặc giao dịch chưa thành công.");
        }
    } catch (err) {
        setError("Có lỗi xảy ra khi tra cứu.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F5] pt-28 pb-20 px-6">
        <div className="max-w-2xl mx-auto space-y-8">
            {/* Search Card */}
            <div className="clay-card p-8">
                <div className="text-center space-y-3 mb-8">
                    <div className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-cyan-100 border-[3px] border-slate-900 rounded-full shadow-[3px_3px_0px_0px_#1E293B] font-bold text-sm">
                        <Package className="w-4 h-4 text-cyan-600" />
                        <span className="text-slate-900">Tra Cứu Nhanh</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900">
                        Tra Cứu <span className="text-cyan-500">Giao Dịch</span>
                    </h1>
                    <p className="text-slate-600 font-medium">
                        Nhập mã đơn hàng (GUMZ...) hoặc ID giao dịch để kiểm tra trạng thái
                    </p>
                </div>

                <form onSubmit={handleSearch} className="relative">
                    <div className="relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="VD: GUMZ465 hoặc 123456789"
                            className="w-full pl-12 pr-32 py-4 bg-white border-[3px] border-slate-900 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none font-mono font-bold text-slate-900 shadow-[3px_3px_0px_0px_#1E293B] transition-all"
                        />
                        <Search className="w-5 h-5 text-cyan-500 absolute left-4 top-1/2 -translate-y-1/2" />
                        <button 
                            type="submit"
                            disabled={loading || !searchTerm}
                            className="absolute right-2 top-2 bottom-2 px-6 bg-cyan-500 border-[3px] border-slate-900 text-white rounded-lg font-black text-sm shadow-[2px_2px_0px_0px_#1E293B] hover:shadow-[1px_1px_0px_0px_#1E293B] hover:translate-x-px hover:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Đang tìm...
                                </>
                            ) : (
                                "Kiểm tra"
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Results */}
            {result && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="clay-card p-8 bg-gradient-to-br from-green-50 to-white"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-green-100 border-[3px] border-slate-900 rounded-full flex items-center justify-center shrink-0 shadow-[3px_3px_0px_0px_#1E293B]">
                            <CheckCircle2 className="w-7 h-7 text-green-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-black text-slate-900 text-xl mb-2">Giao dịch thành công!</h3>
                            <p className="text-slate-700 font-medium mb-3">{result.message}</p>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border-[3px] border-slate-900 rounded-lg shadow-[2px_2px_0px_0px_#1E293B]">
                                <span className="text-xs font-bold text-slate-600">Mã tham chiếu:</span>
                                <span className="font-mono font-black text-cyan-500">{result.code}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {error && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="clay-card p-8 bg-gradient-to-br from-red-50 to-white"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-red-100 border-[3px] border-slate-900 rounded-full flex items-center justify-center shrink-0 shadow-[3px_3px_0px_0px_#1E293B]">
                             <XCircle className="w-7 h-7 text-red-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-black text-slate-900 text-xl mb-2">Không tìm thấy</h3>
                            <p className="text-slate-700 font-medium">{error}</p>
                            <p className="text-slate-500 text-sm mt-2">Vui lòng kiểm tra lại mã giao dịch hoặc liên hệ hỗ trợ</p>
                        </div>
                    </div>
                </motion.div>
            )}
            
            <div className="flex items-center justify-center gap-2 text-slate-500 text-sm font-medium">
                <Clock className="w-4 h-4 text-cyan-500" />
                <span>Dữ liệu được cập nhật theo thời gian thực</span>
            </div>
        </div>
    </div>
  );
}
