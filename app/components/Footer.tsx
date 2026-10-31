import Link from "next/link";
import { ArrowUpRight, Mail, MessageCircle } from "lucide-react";
import Image from "next/image";
import { SiteStats } from "./SiteStats";

export function Footer(){
  return <footer className="border-t-[3px] border-black bg-[#fffdf5]">
    <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-[1.4fr_.7fr_.9fr] md:px-10">
      <div><Link href="/" className="inline-flex items-center gap-3"><span className="relative grid size-11 place-items-center overflow-hidden border-[3px] border-black bg-[#7FE7D6] shadow-[3px_3px_0_#111217]"><Image src="/logo.png" alt="GumballZ Hub" fill sizes="44px" className="object-cover"/></span><span translate="no" className="text-xl font-black">GumballZ<span className="text-[#087d92]">Hub</span></span></Link><p className="mt-4 max-w-sm text-sm font-medium leading-6 text-slate-700">Cửa hàng công cụ số, key và Coiz cho cộng đồng GumballZ. Xem giá, theo dõi đơn và tìm hướng dẫn tại một nơi.</p></div>
      <div><h2 className="text-sm font-black uppercase tracking-widest">Khám phá</h2><ul className="mt-4 space-y-3 text-sm font-bold"><li><Link href="/store" className="hover:underline">Cửa hàng</Link></li><li><Link href="/store/coiz" className="hover:underline">Nạp dịch vụ</Link></li><li><Link href="/keys" className="hover:underline">Quản lý key</Link></li><li><Link href="/docs" className="hover:underline">Tài liệu</Link></li></ul></div>
      <div><h2 className="text-sm font-black uppercase tracking-widest">Hỗ trợ</h2><ul className="mt-4 space-y-3 text-sm font-bold"><li><Link href="/contact" className="inline-flex items-center gap-2 hover:underline"><MessageCircle size={16}/> Liên hệ hỗ trợ <ArrowUpRight size={14}/></Link></li><li><a href="mailto:contact.gumballz@gmail.com" className="inline-flex items-center gap-2 hover:underline"><Mail size={16}/> contact.gumballz@gmail.com</a></li><li><Link href="/privacy" className="hover:underline">Chính sách bảo mật</Link></li><li><Link href="/terms" className="hover:underline">Điều khoản dịch vụ</Link></li></ul></div>
    </div>
    <div className="border-t-2 border-black bg-[#7FE7D6] px-5 py-4 text-xs font-black md:px-10"><div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3"><span>© {new Date().getFullYear()} GUMBALLZ HUB</span><SiteStats/></div></div>
  </footer>;
}
