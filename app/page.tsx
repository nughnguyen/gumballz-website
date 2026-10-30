import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Bolt, Box, KeyRound, LifeBuoy, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import KeyLookup from "./components/KeyLookup";
import FeaturedProducts from "./components/FeaturedProducts";

const categories=[
  {label:"TOOL / DIGITAL GOODS",title:"Công cụ số",copy:"Tool, script và tiện ích được mô tả rõ ràng.",href:"/store?category=tool",tone:"bg-[#00d9f5]",icon:Box,mark:"01"},
  {label:"LICENSE / ACCESS",title:"Key bản quyền",copy:"Chọn thời hạn, mua và kiểm tra key trong vài bước.",href:"/keys",tone:"bg-[#ff3d93]",icon:KeyRound,mark:"02"},
  {label:"DISCORD / MINECRAFT",title:"Nạp dịch vụ",copy:"Nạp Coiz Discord bằng ID hoặc xu Minecraft bằng tên người chơi.",href:"/store/coiz",tone:"bg-[#50f080]",icon:WalletCards,mark:"03"},
];

export default function HomePage(){
  return <main className="min-h-screen overflow-hidden bg-[#fffdf5] text-[#111217]">
    <section className="relative border-b-[3px] border-black bg-[#ffe600] px-5 pb-16 pt-32 md:px-10 md:pb-24 md:pt-40">
      <div aria-hidden="true" className="pointer-events-none absolute -right-12 top-24 hidden size-80 rotate-12 border-[3px] border-black bg-[#00d9f5] shadow-[12px_12px_0_#111217] lg:block"><div className="grid h-full place-items-center"><div className="grid size-40 rotate-[-12deg] place-items-center border-[3px] border-black bg-white shadow-[8px_8px_0_#111217]"><Sparkles size={74} strokeWidth={2.5}/></div></div></div>
      <div className="relative mx-auto max-w-7xl">
        <p className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-2 text-[11px] font-black tracking-[.15em] shadow-[3px_3px_0_#111217]"><span className="size-2.5 bg-[#ff3d93]"/> GUMBALLZ HUB <span className="text-slate-400">/</span> DIGITAL GOODS</p>
        <h1 className="mt-7 max-w-4xl text-balance text-5xl font-black uppercase leading-[.95] tracking-[-.06em] sm:text-6xl md:text-8xl">Đồ số xịn.<br/><span className="inline-block border-b-[6px] border-black">Giao nhanh.</span></h1>
        <p className="mt-6 max-w-2xl text-pretty text-base font-semibold leading-7 md:text-lg">Tìm tool, key bản quyền và Coiz tại một nơi. Chọn sản phẩm, xem rõ giá và trạng thái trước khi mua.</p>
        <div className="mt-8 flex flex-wrap gap-4"><Link href="/store" className="neo-button">MỞ CỬA HÀNG <ArrowRight size={18}/></Link><Link href="/keys" className="neo-button-secondary">TRA CỨU KEY <KeyRound size={17}/></Link></div>
        <div className="mt-12 flex items-center gap-3 text-xs font-black tracking-[.15em]"><ArrowDownRight size={17}/> CHỌN MỤC ĐỂ BẮT ĐẦU <span className="h-[3px] w-12 bg-black"/></div>
      </div>
    </section>

    <section className="px-5 py-16 md:px-10 md:py-20"><div className="mx-auto max-w-7xl"><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black tracking-[.18em]">GUMBALLZ / SHOP BY TYPE</p><h2 className="mt-2 text-3xl font-black uppercase tracking-tight sm:text-4xl">Chọn danh mục</h2></div><span className="border-2 border-black bg-[#50f080] px-3 py-2 text-xs font-black shadow-[3px_3px_0_#111217]">03 DANH MỤC</span></div>
      <div className="grid gap-5 md:grid-cols-3">{categories.map(({label,title,copy,href,tone,icon:Icon,mark})=><Link key={mark} href={href} className="neo-card group flex min-h-[250px] flex-col p-6 hover:-translate-y-1"><div className="flex items-start justify-between"><span className={`grid size-14 place-items-center border-[3px] border-black ${tone} shadow-[4px_4px_0_#111217]`}><Icon size={25} strokeWidth={2.4}/></span><span className="font-mono text-sm font-black">{mark}</span></div><p className="mt-7 text-[10px] font-black tracking-[.17em]">{label}</p><h3 className="mt-2 text-2xl font-black">{title}</h3><p className="mt-2 text-sm font-medium leading-6 text-slate-700">{copy}</p><span className="mt-auto flex items-center gap-2 pt-6 text-sm font-black">Xem danh mục <ArrowUpRight size={16}/></span></Link>)}</div>
    </div></section>

    <section className="border-y-[3px] border-black bg-[#dffbff] px-5 py-14 md:px-10 md:py-16"><div className="mx-auto grid max-w-7xl items-start gap-9 lg:grid-cols-[.7fr_1.3fr]"><div><p className="text-xs font-black tracking-[.18em]">GUMBALLZ / QUICK CHECK</p><h2 className="mt-3 text-3xl font-black uppercase sm:text-4xl">Key của bạn<br/>vẫn còn hạn?</h2><p className="mt-4 max-w-sm text-sm font-semibold leading-6">Dán key để xem trạng thái, loại giấy phép và thời gian còn hiệu lực.</p><Link href="/docs?article=key-activation" className="mt-5 inline-flex items-center gap-2 text-sm font-black underline decoration-[3px] underline-offset-4">Hướng dẫn kích hoạt <ArrowUpRight size={16}/></Link></div><KeyLookup/></div></section>

    <section className="px-5 py-16 md:px-10 md:py-20"><div className="mx-auto max-w-7xl"><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black tracking-[.18em]">FEATURED / HAND-PICKED</p><h2 className="mt-2 text-3xl font-black uppercase tracking-tight sm:text-4xl">Sản phẩm nổi bật</h2></div><Link href="/store" className="inline-flex items-center gap-2 text-sm font-black underline decoration-[3px] underline-offset-4">Tất cả sản phẩm <ArrowRight size={16}/></Link></div><FeaturedProducts/></div></section>

    <section className="px-5 pb-16 md:px-10 md:pb-20"><div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-3"><div className="flex items-center gap-3 border-2 border-black bg-white p-4 shadow-[4px_4px_0_#111217]"><ShieldCheck/><div><p className="font-black">Thanh toán rõ ràng</p><p className="text-xs text-slate-600">Giá và mã đơn được hiển thị trước khi chuyển khoản.</p></div></div><div className="flex items-center gap-3 border-2 border-black bg-white p-4 shadow-[4px_4px_0_#111217]"><Bolt/><div><p className="font-black">Nhận hàng nhanh</p><p className="text-xs text-slate-600">Theo dõi trạng thái đơn trong tài khoản.</p></div></div><div className="flex items-center gap-3 border-2 border-black bg-white p-4 shadow-[4px_4px_0_#111217]"><LifeBuoy/><div><p className="font-black">Hướng dẫn sẵn có</p><p className="text-xs text-slate-600">Tài liệu và hỗ trợ luôn gần sản phẩm.</p></div></div></div></section>
    <div className="mx-auto flex max-w-7xl items-center justify-between border-t-[3px] border-black px-5 py-5 text-xs font-black md:px-10"><span>GUMBALLZ HUB / DIGITAL MARKET</span><Link href="/docs" className="inline-flex items-center gap-1">DOCS <ArrowUpRight size={14}/></Link></div>
  </main>;
}
