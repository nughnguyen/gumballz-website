import Link from "next/link";
import Image from "next/image";
import { Gamepad2, Facebook, Twitter, Instagram, Mail, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          
          {/* Brand */}
          <div className="col-span-1 md:col-span-2 space-y-4">
             <Link href="/" className="flex items-center gap-3">
                <div className="w-12 h-12 relative border-[3px] border-slate-900 rounded-full overflow-hidden">
                  <Image 
                    src="/logo.png" 
                    alt="GumballZ Hub Logo" 
                    fill 
                    className="object-cover"
                  />
                </div>
                <span className="text-2xl font-black tracking-tight text-slate-900">
                  GumballZ<span className="text-cyan-500">Hub</span>
                </span>
              </Link>
              <p className="text-slate-600 font-medium text-sm leading-relaxed max-w-sm">
                Hệ sinh thái toàn diện cho game thủ: Mod Menu an toàn, Discord Bot đa năng, 
                và hệ thống thanh toán tự động. Nhanh chóng, bảo mật và hỗ trợ 24/7.
              </p>
              <div className="flex gap-3 pt-2">
                  <SocialLink icon={Facebook} href="#" />
                  <SocialLink icon={MessageCircle} href="#" />
                  <SocialLink icon={Instagram} href="#" />
              </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
             <h3 className="font-black text-slate-900 mb-4 text-lg">Liên kết</h3>
             <ul className="space-y-3 text-sm text-slate-700 font-medium">
                <li><Link href="/" className="hover:text-cyan-500 transition-colors">Trang chủ</Link></li>
                <li><Link href="/store" className="hover:text-cyan-500 transition-colors">Cửa hàng</Link></li>
                <li><Link href="/history" className="hover:text-cyan-500 transition-colors">Tra cứu đơn hàng</Link></li>
                <li><Link href="/contact" className="hover:text-cyan-500 transition-colors">Liên hệ hỗ trợ</Link></li>
                <li><Link href="/terms" className="hover:text-cyan-500 transition-colors">Điều khoản dịch vụ</Link></li>
             </ul>
          </div>

          {/* Contact Info */}
          <div className="col-span-1">
             <h3 className="font-black text-slate-900 mb-4 text-lg">Hỗ trợ</h3>
             <ul className="space-y-3 text-sm text-slate-700 font-medium">
                <li className="flex items-start gap-3">
                   <Mail className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
                   <span>contact.gumballz@gmail.com</span>
                </li>
                <li className="flex items-start gap-3">
                   <MessageCircle className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
                   <span>Discord: GumballZ Server</span>
                </li>
             </ul>
          </div>
        </div>

        <div className="border-t-[2px] border-slate-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm font-medium">
                © 2025 GumballZ Hub. All rights reserved.<br />
                <div className="text-slate-500 text-sm font-medium text-center">Powered by <span className="text-cyan-500">NGUYEN QUOC HUNG</span>.</div>
            </p>
            <div className="text-slate-500 text-sm font-medium flex gap-6">
                <Link href="/privacy" className="hover:text-cyan-500 transition-colors">Bảo mật</Link>
                <Link href="/terms" className="hover:text-cyan-500 transition-colors">Điều khoản</Link>
            </div>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ icon: Icon, href }: { icon: any, href: string }) {
    return (
        <a 
          href={href} 
          className="w-10 h-10 rounded-full bg-slate-100 border-[2px] border-slate-900 shadow-[2px_2px_0px_0px_#1E293B] flex items-center justify-center text-slate-900 hover:bg-cyan-500 hover:text-white hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#1E293B] transition-all"
        >
            <Icon className="w-5 h-5" />
        </a>
    )
}

