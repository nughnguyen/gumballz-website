"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
    CreditCard, 
    Gamepad2, 
    Info, 
    ArrowRight, 
    CheckCircle2, 
    Coins, 
    Search,
    User,
    ShieldCheck,
    Wallet
} from "lucide-react";
import Link from "next/link";

// Define Packages
const PACKAGES = [
  { value: 10000, label: "10.000 VNĐ", bonus: "100.000 Coinz", hot: false },
  { value: 20000, label: "20.000 VNĐ", bonus: "200.000 Coinz", hot: false },
  { value: 50000, label: "50.000 VNĐ", bonus: "500k + 50k Bonus", hot: true },
  { value: 100000, label: "100.000 VNĐ", bonus: "1M + 200k Bonus", hot: true },
  { value: 200000, label: "200.000 VNĐ", bonus: "2M + 500k Bonus", hot: false },
  { value: 500000, label: "500.000 VNĐ", bonus: "5M + 2M Bonus", hot: false },
];

const DEFAULT_DEV_ID = "561443914062757908";

export default function Home() {
  const router = useRouter();
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [discordId, setDiscordId] = useState("");
  const [showGuide, setShowGuide] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Helper to handle package selection
  const handleSelectPackage = (val: number) => {
    setSelectedPackage(val);
    setCustomAmount(""); 
  };

  const handleDonate = async () => {
    const amount = selectedPackage || (customAmount ? parseInt(customAmount) : 0);
    if (!amount || amount < 1000) {
        alert("Vui lòng nhập số tiền tối thiểu 1.000 VNĐ");
        return;
    }
    
    setIsCreating(true);
    
    // Use entered ID or default dev ID
    const finalId = discordId.trim() || DEFAULT_DEV_ID; 

    // Generate a simple unique transaction content
    // Format: "GUMZ" + Discord ID. But this is not unique. 
    // User requested "content is GUMZ+ID".
    // We will use GUMZ + ID as the content visible to user.
    // The backend `create-transaction` will create a PENDING transaction with this content.
    // We will poll specifically that PENDING transaction's ID to see if it becomes SUCCESS.
    const uniqueCode = "GUMZ" + finalId;

    try {
        // Create transaction in Supabase
        const res = await fetch("/api/create-transaction", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                amount,
                userId: finalId,
                content: uniqueCode,
                method: "VIETQR"
            })
        });

        const data = await res.json();
        
        if (!data.success) {
            console.error("Failed to create transaction:", data.error);
            alert("Có lỗi xảy ra khi tạo giao dịch. Vui lòng thử lại.");
            setIsCreating(false);
            return;
        }

        const expiryTimestamp = Date.now() + 10 * 60 * 1000;

        const params = new URLSearchParams({
            amount: amount.toString(),
            content: uniqueCode,
            userId: finalId,
            method: "VIETQR", 
            expiry: expiryTimestamp.toString(), 
            txId: data.id // Pass the DB ID for polling
        });

        router.push("/payment?" + params.toString());
    } catch (error) {
        console.error("Error creating transaction:", error);
        alert("Có lỗi kết nối. Vui lòng thử lại.");
        setIsCreating(false);
    }
  };

  const currentAmount = selectedPackage || (customAmount ? parseInt(customAmount) : 0);

  return (
    <div className="min-h-screen bg-[#F0F2F5] font-sans text-slate-800 pb-20">
        {/* Banner - Clean Design - Updated */}
        <div className="bg-[#0f172a] py-20 border-b border-slate-800">
            <div className="max-w-6xl mx-auto px-4 flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800/50 border border-slate-700 rounded-full text-blue-400 text-xs font-medium mb-6"
                >
                    <ShieldCheck className="w-3 h-3" /> Hệ thống nạp tự động 24/7
                </motion.div>
                
                <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight text-white mb-6">
                    Trung Tâm <span className="text-blue-500">Nạp Coinz</span>
                </h1>
                
                <p className="text-slate-400 text-lg md:text-xl font-normal max-w-2xl leading-relaxed">
                    Nạp Coinz nhanh chóng, an toàn và nhận nhiều ưu đãi hấp dẫn để trải nghiệm thế giới GumballZ trọn vẹn.
                </p>
            </div>
        </div>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 py-12 pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Column: ID Input & Info */}
                <div className="lg:col-span-4 space-y-6">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                               Thông tin tài khoản
                            </h2>
                            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">1</span>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-slate-700 mb-2 block">Nhập Discord ID</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={discordId}
                                        onChange={(e) => setDiscordId(e.target.value)}
                                        placeholder="Ví dụ: 561443..."
                                        className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-sm text-slate-800 font-medium"
                                    />
                                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                </div>
                                <button 
                                    onClick={() => setShowGuide(true)}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-3 flex items-center gap-1 hover:underline"
                                >
                                    <Info className="w-3 h-3" /> Hướng dẫn lấy ID
                                </button>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    <strong className="text-slate-700">Lưu ý:</strong> Coinz sẽ được chuyển tự động vào ID này sau khi thanh toán thành công.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Support Box */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-2">Bạn cần hỗ trợ?</h3>
                        <p className="text-sm text-slate-500 mb-4">Liên hệ với đội ngũ CSKH của chúng tôi nếu bạn gặp sự cố trong quá trình nạp.</p>
                        <Link href="/contact" className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors block text-center">
                            Liên hệ ngay
                        </Link>
                    </div>
                </div>

                {/* Right Column: Packages */}
                <div className="lg:col-span-8 space-y-6">
                    <motion.div
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ delay: 0.1 }}
                         className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                               Chọn gói nạp
                            </h2>
                            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">2</span>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            {PACKAGES.map((pkg) => (
                                <div 
                                    key={pkg.value}
                                    onClick={() => handleSelectPackage(pkg.value)}
                                    className={`relative cursor-pointer group rounded-xl border-2 p-5 transition-all duration-200 ${
                                        selectedPackage === pkg.value
                                        ? "border-blue-600 bg-blue-50/50"
                                        : "border-slate-100 bg-white hover:border-slate-300 hover:shadow-sm"
                                    }`}
                                >
                                    {pkg.hot && (
                                        <div className="absolute -top-3 -right-2 bg-rose-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm z-10">
                                            HOT
                                        </div>
                                    )}
                                    {selectedPackage === pkg.value && (
                                        <div className="absolute top-3 right-3 text-blue-600">
                                            <CheckCircle2 className="w-5 h-5 fill-blue-100" />
                                        </div>
                                    )}
                                    
                                    <div className="flex flex-col items-center text-center space-y-3 pt-1">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${selectedPackage === pkg.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                                            <Coins className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900 text-lg tracking-tight">
                                                {formatCurrency(pkg.value)}
                                            </div>
                                            <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded inline-block mt-2">
                                                +{pkg.bonus}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Custom Amount */}
                        <div className="mt-8 pt-8 border-t border-slate-100 dashed">
                             <div className="flex flex-col md:flex-row md:items-center gap-4">
                                <div className="flex-1">
                                    <label className="text-sm font-semibold text-slate-700 mb-2 block">Hoặc nhập số tiền tùy ý (VNĐ)</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={customAmount ? parseInt(customAmount).toLocaleString('vi-VN') : ''}
                                            onChange={(e) => {
                                                const raw = e.target.value.replace(/[^0-9]/g, '');
                                                setCustomAmount(raw);
                                                if (raw) setSelectedPackage(null);
                                            }}
                                            placeholder="Tối thiểu 10.000đ"
                                            className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-bold text-slate-800 transition-all"
                                        />
                                        <Wallet className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    </div>
                                </div>
                                {customAmount && (
                                    <div className="md:w-1/3 bg-blue-50 rounded-xl p-4 border border-blue-100 flex flex-col justify-center">
                                        <div className="text-xs text-blue-600 mb-1 font-medium uppercase tracking-wide">Nhận được</div>
                                        <div className="font-bold text-xl text-blue-700">
                                            ≈ {formatCurrency(parseInt(customAmount) * 10)} Coinz
                                        </div>
                                    </div>
                                )}
                             </div>
                        </div>

                    </motion.div>

                    {/* Pay Button */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 sticky bottom-4 md:static z-30"
                    >
                         <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="text-center md:text-left w-full">
                                <div className="text-sm text-slate-500 font-medium mb-1">Tổng thanh toán</div>
                                <div className="text-3xl font-black text-slate-900 tracking-tight">
                                    {formatCurrency(currentAmount)}
                                </div>
                            </div>
                            <button
                                onClick={handleDonate}
                                disabled={!currentAmount || isCreating}
                                className={`w-full md:w-auto px-10 py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
                                    currentAmount && !isCreating
                                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transform active:scale-[0.98]" 
                                    : "bg-slate-100 text-slate-300 cursor-not-allowed"
                                }`}
                            >
                                {isCreating ? (
                                    <>Đang xử lý...</>
                                ) : (
                                    <>Thanh toán ngay <ArrowRight className="w-5 h-5" /></>
                                )}
                            </button>
                         </div>
                    </motion.div>
                </div>
            </div>
        </main>

        {/* Guide Modal */}
        <AnimatePresence>
            {showGuide && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm" 
                    onClick={() => setShowGuide(false)}
                >
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white p-6 rounded-2xl max-w-lg w-full shadow-2xl relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button 
                            onClick={() => setShowGuide(false)} 
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                             ✕
                        </button>
                        <h3 className="text-2xl font-bold mb-6 text-slate-800">Cách lấy Discord User ID</h3>
                        <div className="space-y-4 text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <p className="flex gap-3">
                                <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">1</span>
                                <span>Vào phần <strong>Cài đặt người dùng (User Settings)</strong> trên Discord.</span>
                            </p>
                            <p className="flex gap-3">
                                <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">2</span>
                                <span>Chọn mục <strong>Nâng cao (Advanced)</strong> trong danh sách bên trái.</span>
                            </p>
                            <p className="flex gap-3">
                                <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">3</span>
                                <span>Bật chế độ <strong>Chế độ nhà phát triển (Developer Mode)</strong>.</span>
                            </p>
                            <p className="flex gap-3">
                                <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">4</span>
                                <span>Ấn chuột phải vào Avatar của bạn hoặc tên bạn, chọn <strong>Sao chép ID người dùng (Copy User ID)</strong>.</span>
                            </p>
                        </div>
                        <button 
                            onClick={() => setShowGuide(false)} 
                            className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors text-white shadow-lg shadow-blue-600/20"
                        >
                            Đã hiểu
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    </div>
  );
}

function formatCurrency(val: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
}
