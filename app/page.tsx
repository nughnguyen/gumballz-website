"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Gamepad2, Info, ArrowRight, CheckCircle2, Coins } from "lucide-react";

// Define Packages
const PACKAGES = [
  { value: 10000, label: "10.000 VNĐ", bonus: "100.000 Coinz" },
  { value: 20000, label: "20.000 VNĐ", bonus: "200.000 Coinz" },
  { value: 50000, label: "50.000 VNĐ", bonus: "500.000 + 50k Coinz" },
  { value: 100000, label: "100.000 VNĐ", bonus: "1M + 200k Coinz" },
  { value: 200000, label: "200.000 VNĐ", bonus: "2M + 500k Coinz" },
  { value: 500000, label: "500.000 VNĐ", bonus: "5M + 2M Coinz" },
];

const DEFAULT_DEV_ID = "561443914062757908";

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"coinz" | "other">("coinz");
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [discordId, setDiscordId] = useState("");
  const [showGuide, setShowGuide] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Helper to handle package selection
  const handleSelectPackage = (val: number) => {
    setSelectedPackage(val);
    setCustomAmount(""); // Clear custom amount if package selected
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
    // Format: "NAP" + 6 random digits (Matches webhook logic which prefers 6-digit codes)
    const uniqueCode = "NAP" + Math.floor(100000 + Math.random() * 900000);

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

        // Calculate absolute expiry time (10 minutes from now)
        // Pass timestamp in milliseconds
        const expiryTimestamp = Date.now() + 10 * 60 * 1000;

        const params = new URLSearchParams({
            amount: amount.toString(),
            content: uniqueCode,
            userId: finalId,
            method: "VIETQR", 
            expiry: expiryTimestamp.toString(), 
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
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 font-sans flex flex-col items-center relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-96 bg-linear-to-b from-blue-900/20 to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-64 bg-linear-to-t from-black via-neutral-900/10 to-transparent pointer-events-none" />
        
        <main className="w-full max-w-4xl z-10 p-6 flex flex-col items-center mt-10 md:mt-20">
            {/* Header */}
            <header className="mb-12 text-center space-y-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-block"
                >
                  <h1 className="text-5xl md:text-7xl font-extrabold bg-clip-text text-transparent bg-linear-to-r from-blue-400 via-indigo-400 to-purple-400 tracking-tighter pb-2">
                      Cổng Thanh Toán
                  </h1>
                </motion.div>
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-neutral-400 text-lg max-w-xl mx-auto font-medium"
                >
                    Hệ thống nạp tự động an toàn, nhanh chóng và bảo mật.
                </motion.p>
            </header>

            {/* Tab Selection */}
            <div className="flex p-1 bg-neutral-900/80 backdrop-blur-md rounded-2xl border border-neutral-800 mb-10 shadow-2xl w-full max-w-md">
                <TabButton 
                    active={activeTab === "coinz"} 
                    onClick={() => setActiveTab("coinz")}
                    icon={<CreditCard className="w-4 h-4" />}
                >
                    Nạp Coinz
                </TabButton>
                <TabButton 
                    active={activeTab === "other"} 
                    onClick={() => setActiveTab("other")}
                    icon={<Gamepad2 className="w-4 h-4" />}
                >
                    Ứng dụng khác
                </TabButton>
            </div>

            {/* Main Content Area */}
            <AnimatePresence mode="wait">
                {activeTab === "coinz" ? (
                    <motion.div 
                        key="coinz"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="w-full space-y-8"
                    >
                        {/* Package Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {PACKAGES.map((pkg, idx) => (
                                <motion.button
                                    key={pkg.value}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => handleSelectPackage(pkg.value)}
                                    className={`relative group p-6 rounded-2xl border transition-all duration-300 text-left hover:-translate-y-1 ${
                                        selectedPackage === pkg.value 
                                        ? "bg-blue-600/10 border-blue-500 shadow-[0_0_30px_-10px_rgba(59,130,246,0.5)]" 
                                        : "bg-neutral-900/50 border-neutral-800 hover:border-neutral-600 hover:bg-neutral-800"
                                    }`}
                                >
                                    {selectedPackage === pkg.value && (
                                        <div className="absolute top-3 right-3 text-blue-500">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                    )}
                                    <div className="text-2xl font-bold text-white mb-2">
                                        {formatCurrency(pkg.value)}
                                    </div>
                                    <div className={`text-sm font-medium ${selectedPackage === pkg.value ? "text-blue-200" : "text-neutral-400 group-hover:text-neutral-300"}`}>
                                        {pkg.bonus}
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                        
                        {/* Custom Amount Input */}
                         <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="bg-neutral-900/30 border border-neutral-800 rounded-2xl p-4 flex items-center gap-4 hover:border-neutral-700 transition-colors"
                        >
                            <div className="bg-neutral-800 p-3 rounded-xl">
                                <Coins className="w-6 h-6 text-yellow-500" />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-neutral-500 font-medium block mb-1 uppercase tracking-wide">
                                    Hoặc nhập số tiền tùy ý
                                </label>
                                <input
                                    type="text"
                                    value={customAmount ? parseInt(customAmount).toLocaleString('vi-VN') : ''}
                                    onChange={(e) => {
                                        // Handle raw value change
                                        const raw = e.target.value.replace(/[^0-9]/g, '');
                                        setCustomAmount(raw);
                                        if (raw) setSelectedPackage(null);
                                    }}
                                    placeholder="Ví dụ: 50.000"
                                    className="w-full bg-transparent text-xl font-bold text-white placeholder:text-neutral-600 outline-none"
                                />
                            </div>
                            {customAmount && (
                                <div className="text-right">
                                    <div className="text-xs text-neutral-500">Quy đổi ước tính</div>
                                    <div className="text-blue-400 font-bold">
                                        ≈ {formatCurrency(parseInt(customAmount) * 10)} Coinz
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        {/* Input Section */}
                        <motion.div 
                          className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl backdrop-blur-sm"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium text-neutral-300 ml-1">
                                        Nhập ID Discord của bạn
                                    </label>
                                    <button 
                                        onClick={() => setShowGuide(true)}
                                        className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 transition-colors hover:underline"
                                    >
                                        <Info className="w-3 h-3" />
                                        Làm sao để lấy ID?
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={discordId}
                                    onChange={(e) => setDiscordId(e.target.value)}
                                    placeholder={`Mặc định (Dev ID): ${DEFAULT_DEV_ID}`}
                                    className="w-full bg-black/50 border border-neutral-700 text-white rounded-xl px-4 py-4 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder:text-neutral-600 font-mono"
                                />
                                <p className="text-xs text-neutral-500 ml-1">
                                    *Nếu để trống, Coinz sẽ được chuyển vào tài khoản của Developer.
                                </p>
                            </div>

                            <button
                                onClick={handleDonate}
                                disabled={!currentAmount || isCreating}
                                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                                    currentAmount && !isCreating
                                    ? "bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/20 transform active:scale-[0.98]" 
                                    : "bg-neutral-800 text-neutral-600 cursor-not-allowed"
                                }`}
                            >
                                {isCreating ? (
                                    <>Đang tạo giao dịch...</>
                                ) : (
                                    <>Tiếp tục thanh toán <ArrowRight className="w-5 h-5" /></>
                                )}
                            </button>
                        </motion.div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="other"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full h-64 flex flex-col items-center justify-center text-center bg-neutral-900/30 rounded-2xl border border-neutral-800 border-dashed"
                    >
                        <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                            <Gamepad2 className="w-8 h-8 text-neutral-500" />
                        </div>
                        <h3 className="text-xl font-bold text-neutral-300">Tính năng đang phát triển</h3>
                        <p className="text-neutral-500 mt-2">Vui lòng quay lại sau.</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="w-full py-6 text-center text-neutral-600 text-sm mt-auto z-10 border-t border-neutral-900/50 bg-black/20 backdrop-blur-sm">
            &copy; 2024 NughBot Payment Gateway. All rights reserved.
        </footer>

        {/* Guide Modal */}
        <AnimatePresence>
            {showGuide && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm" 
                    onClick={() => setShowGuide(false)}
                >
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl max-w-lg w-full shadow-2xl relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button 
                            onClick={() => setShowGuide(false)} 
                            className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                        <h3 className="text-2xl font-bold mb-6 text-white">Cách lấy Discord User ID</h3>
                        <div className="space-y-4 text-sm text-neutral-300 leading-relaxed bg-neutral-950/50 p-4 rounded-xl border border-neutral-800/50">
                            <p className="flex gap-3">
                                <span className="shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">1</span>
                                <span>Vào phần <strong>Cài đặt người dùng (User Settings)</strong> trên Discord.</span>
                            </p>
                            <p className="flex gap-3">
                                <span className="shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">2</span>
                                <span>Chọn mục <strong>Nâng cao (Advanced)</strong> trong danh sách bên trái.</span>
                            </p>
                            <p className="flex gap-3">
                                <span className="shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">3</span>
                                <span>Bật chế độ <strong>Chế độ nhà phát triển (Developer Mode)</strong>.</span>
                            </p>
                            <p className="flex gap-3">
                                <span className="shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">4</span>
                                <span>Ấn chuột phải vào Avatar của bạn hoặc tên bạn, chọn <strong>Sao chép ID người dùng (Copy User ID)</strong>.</span>
                            </p>
                            <p className="pt-2 text-xs text-neutral-500 italic border-t border-neutral-800 mt-2">
                                *Hoặc bạn có thể dùng lệnh /id trong server để bot lấy giúp bạn.
                            </p>
                        </div>
                        <button 
                            onClick={() => setShowGuide(false)} 
                            className="mt-6 w-full py-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl font-medium transition-colors text-white"
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

function TabButton({ children, active, onClick, icon }: { children: React.ReactNode, active: boolean, onClick: () => void, icon?: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-semibold transition-all duration-300 ${
                active ? "bg-neutral-800 text-white shadow-lg shadow-black/20" : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
            }`}
        >
            {icon}
            {children}
        </button>
    );
}

function formatCurrency(val: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
}
