"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ShoppingCart, 
  Key, 
  Home, 
  Menu,
  Download,
  X,
  Sparkles
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: "Trang Chủ", href: "/" },
    { name: "Cửa Hàng", href: "/store" },
    { name: "Lấy Key", href: "/keys" },
    { name: "Tải Xuống", href: "/downloads" },
  ];

  return (
    <>
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl transition-all duration-200">
        <div className="bg-white/70 backdrop-blur-md border-[3px] border-slate-900 rounded-full shadow-[4px_4px_0px_0px_#1E293B] hover:shadow-[2px_2px_0px_0px_#1E293B] hover:translate-y-[2px] px-6 py-3 transition-all duration-200">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 font-black text-xl text-slate-900">
              <div className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center border-2 border-slate-900">
                <img src="/logo.png" alt="GumballZ Hub Logo" className="w-full h-full object-cover" />
              </div>
              <span className="hidden sm:inline">
                GumballZ<span className="text-cyan-500">Hub</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                    pathname === item.href
                      ? "bg-cyan-500 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* CTA Button */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/store"
                className="px-6 py-2.5 bg-cyan-500 text-white font-bold rounded-full border-[3px] border-slate-900 shadow-[3px_3px_0px_0px_#1E293B] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_#1E293B] transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Nạp Ngay
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-md bg-white/70 backdrop-blur-md border-[3px] border-slate-900 rounded-3xl shadow-[6px_6px_0px_0px_#1E293B] md:hidden p-4"
          >
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`px-5 py-3 rounded-2xl text-sm font-bold transition-all ${
                    pathname === item.href
                      ? "bg-cyan-500 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <Link
                href="/store"
                onClick={() => setIsOpen(false)}
                className="px-5 py-3 bg-cyan-500 text-white font-bold rounded-2xl border-[3px] border-slate-900 shadow-[3px_3px_0px_0px_#1E293B] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#1E293B] transition-all text-center mt-2"
              >
                Nạp Ngay
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
