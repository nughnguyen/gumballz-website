import Link from "next/link";
import Image from "next/image";
import { Gamepad2, Facebook, Twitter, Instagram, Mail, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          
          {/* Brand */}
          <div className="col-span-1 md:col-span-2 space-y-4">
             <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 relative rounded-lg overflow-hidden shadow-sm">
                  <Image 
                    src="/logo.png" 
                    alt="Logo" 
                    fill 
                    className="object-cover"
                  />
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  GumballZ
                </span>
              </Link>
              <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
                Hệ thống nạp Coinz tự động dành cho cộng đồng Discord GumballZ. 
                Nhanh chóng, an toàn và hỗ trợ 24/7.
              </p>
              <div className="flex gap-4 pt-2">
                  <SocialLink icon={Facebook} href="#" />
                  <SocialLink icon={MessageCircle} href="#" />
                  <SocialLink icon={Instagram} href="#" />
              </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
             <h3 className="font-semibold text-slate-900 mb-4">Liên kết</h3>
             <ul className="space-y-3 text-sm text-slate-600">
                <li><Link href="/" className="hover:text-blue-600 transition-colors">Trang chủ</Link></li>
                <li><Link href="/history" className="hover:text-blue-600 transition-colors">Tra cứu đơn hàng</Link></li>
                <li><Link href="/contact" className="hover:text-blue-600 transition-colors">Liên hệ hỗ trợ</Link></li>
                <li><Link href="/terms" className="hover:text-blue-600 transition-colors">Điều khoản dịch vụ</Link></li>
             </ul>
          </div>

          {/* Contact Info */}
          <div className="col-span-1">
             <h3 className="font-semibold text-slate-900 mb-4">Hỗ trợ</h3>
             <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-3">
                   <Mail className="w-5 h-5 text-slate-400 shrink-0" />
                   <span>nugh@gmail.com</span>
                </li>
             </ul>
          </div>
        </div>

        <div className="border-t border-slate-100 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-xs">
                © 2025 GumballZ Payment. All rights reserved.
            </p>
            <div className="text-slate-400 text-xs flex gap-6">
                <Link href="/privacy" className="hover:text-slate-600">Bảo mật</Link>
                <Link href="/terms" className="hover:text-slate-600">Điều khoản</Link>
            </div>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ icon: Icon, href }: { icon: any, href: string }) {
    return (
        <a href={href} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all">
            <Icon className="w-4 h-4" />
        </a>
    )
}
