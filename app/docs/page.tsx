"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Terminal, Server, Coins, Star, Gift, Code2,
  Copy, Check, ChevronRight, Zap, Shield, ExternalLink,
  Package, ArrowRight, Key, Download
} from "lucide-react";
import Link from "next/link";

// ── Shared code block component ──────────────────────────────
function CodeBlock({ code, lang = "" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative group">
      <pre className="bg-slate-900 text-cyan-300 p-5 rounded-2xl text-sm font-mono overflow-x-auto border-[3px] border-slate-700 shadow-inner leading-relaxed">
        <code>{code}</code>
      </pre>
      <button
        onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        className="absolute top-3 right-3 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-all opacity-0 group-hover:opacity-100"
      >
        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="clay-card p-8 space-y-5">
      <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 border-b-2 border-slate-100 pb-4">
        <div className="w-10 h-10 bg-cyan-100 border-2 border-slate-900 rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_#1E293B]">
          <Icon className="w-5 h-5 text-cyan-600" />
        </div>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Badge({ text, color = "cyan" }: { text: string; color?: string }) {
  const colors: Record<string, string> = {
    cyan: "bg-cyan-100 text-cyan-700 border-cyan-300",
    green: "bg-green-100 text-green-700 border-green-300",
    red: "bg-red-100 text-red-700 border-red-300",
    purple: "bg-purple-100 text-purple-700 border-purple-300",
    yellow: "bg-yellow-100 text-yellow-700 border-yellow-300",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${colors[color] || colors.cyan}`}>
      {text}
    </span>
  );
}

// ── Tab content ──────────────────────────────────────────────
function MinecraftDocs() {
  return (
    <div className="space-y-8">
      {/* Overview */}
      <Section title="Tổng quan" icon={Package}>
        <p className="text-slate-600 leading-relaxed">
          <strong>GumballZPay</strong> là PaperMC plugin tích hợp thanh toán VietQR/SePay cho
          server Minecraft. Người chơi có thể nạp xu in-game thông qua website hoặc lệnh trong game,
          và tự động nhận rank khi tổng tiền nạp đạt ngưỡng.
        </p>
        <div className="grid md:grid-cols-3 gap-4 mt-2">
          {[
            { icon: Coins, label: "Nạp xu in-game", desc: "QR Bank tự động" },
            { icon: Star, label: "Auto-Rank", desc: "Theo mốc tích lũy" },
            { icon: Gift, label: "Gift Code", desc: "Tặng xu giữa người chơi" },
          ].map(({ icon: I, label, desc }) => (
            <div key={label} className="p-4 bg-cyan-50 border-2 border-cyan-200 rounded-2xl text-center">
              <I className="w-8 h-8 text-cyan-600 mx-auto mb-2" />
              <div className="font-black text-slate-900 text-sm">{label}</div>
              <div className="text-xs text-slate-500">{desc}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Requirements */}
      <Section title="Yêu cầu" icon={Shield}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b-2 border-slate-200">
              <th className="text-left py-2 font-black text-slate-700">Phần mềm</th>
              <th className="text-left py-2 font-black text-slate-700">Phiên bản</th>
              <th className="text-left py-2 font-black text-slate-700">Bắt buộc</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {[
                ["PaperMC / Purpur", "1.21.1+", true],
                ["Java", "21+", true],
                ["Vault", "Any", true],
                ["LuckPerms", "5.x", false],
                ["EssentialsX", "Any", false],
              ].map(([sw, ver, req]) => (
                <tr key={sw as string}>
                  <td className="py-2 font-mono font-bold text-slate-900">{sw as string}</td>
                  <td className="py-2 text-slate-600">{ver as string}</td>
                  <td className="py-2"><Badge text={req ? "Bắt buộc" : "Tùy chọn"} color={req ? "red" : "green"} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Installation */}
      <Section title="Cài đặt" icon={Download}>
        <ol className="space-y-4">
          {[
            <>Tải <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-sm">GumballZPay-1.0.0.jar</code> từ <Link href="https://github.com/nughnguyen/gumpayment-plugin/releases" className="text-cyan-600 font-bold hover:underline" target="_blank">GitHub Releases</Link></>,
            <>Bỏ vào thư mục <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-sm">/plugins/</code> của server</>,
            <>Restart server → <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-sm">plugins/GumballZPay/config.yml</code> tự tạo</>,
            <>Chỉnh <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-sm">api.secret</code> trong config.yml</>,
            <>Dùng <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-sm">/gzpay reload</code> để áp dụng</>,
          ].map((step, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span className="w-7 h-7 shrink-0 rounded-full bg-cyan-500 border-2 border-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-[2px_2px_0px_0px_#1E293B]">{i + 1}</span>
              <p className="text-slate-600 pt-0.5 leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Config */}
      <Section title="Cấu hình config.yml" icon={Code2}>
        <CodeBlock lang="yaml" code={`api:
  url: "https://gumballzhub.vercel.app"
  secret: "YOUR_MINECRAFT_API_KEY"  # Phải khớp với Vercel env

payment:
  poll_interval_seconds: 5
  poll_timeout_minutes: 10

packages:
  money_20k:
    name: "§a§l💰 20,000 Xu"
    price_vnd: 20000
    reward_type: money
    reward_value: 20000

auto-rank:
  enabled: true
  ranks:
    - required_total_vnd: 50000
      luckperms_group: "vip"
      display_name: "§e§lVIP"
    - required_total_vnd: 700000
      luckperms_group: "god"
      display_name: "§d§lGOD"`} />
      </Section>

      {/* Commands */}
      <Section title="Lệnh trong game" icon={Terminal}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b-2 border-slate-200">
              <th className="text-left py-2 font-black text-slate-700">Lệnh</th>
              <th className="text-left py-2 font-black text-slate-700">Quyền</th>
              <th className="text-left py-2 font-black text-slate-700">Mô tả</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {[
                ["/store", "use", "Mở GUI cửa hàng"],
                ["/napthe", "use", "Mở GUI / tạo đơn"],
                ["/napthe huy", "use", "Hủy đơn đang chờ"],
                ["/napthe redeem <mã>", "use", "Đổi mã claim / gift code"],
                ["/gzpay reload", "admin", "Reload config"],
                ["/gzpay giftcode <xu>", "admin", "Tạo gift code"],
              ].map(([cmd, perm, desc]) => (
                <tr key={cmd}>
                  <td className="py-2 text-cyan-700 font-bold">{cmd}</td>
                  <td className="py-2"><Badge text={`gumballzpay.${perm}`} color={perm === "admin" ? "red" : "cyan"} /></td>
                  <td className="py-2 font-sans text-slate-600">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Payment flows */}
      <Section title="Luồng thanh toán" icon={Zap}>
        <div className="space-y-4">
          <div>
            <h3 className="font-black text-slate-800 mb-2">🎮 In-game (có server):</h3>
            <CodeBlock code={`/napthe money_20k
 → Tạo đơn → click link → quét QR → thanh toán
 → Plugin tự nhận → +xu vào Vault → kiểm tra auto-rank`} />
          </div>
          <div>
            <h3 className="font-black text-slate-800 mb-2">🌐 Web Store (không cần vào server):</h3>
            <CodeBlock code={`gumballzhub.vercel.app/minecraft/store
 → Nhập tên MC + chọn gói → quét QR → thanh toán
 → Nhận mã claim (VD: MC3X9KZA)
 → Vào game: /napthe redeem MC3X9KZA → nhận xu!`} />
          </div>
          <div>
            <h3 className="font-black text-slate-800 mb-2">🎁 Gift Code (admin → player):</h3>
            <CodeBlock code={`Admin: /gzpay giftcode 50000 Tang ban
 → Hệ thống tạo code GZ3K8MNP
Admin gửi code cho người chơi
Player: /napthe redeem GZ3K8MNP → nhận 50,000 xu!`} />
          </div>
        </div>
      </Section>

      {/* Download */}
      <div className="flex gap-4 flex-wrap">
        <Link href="https://github.com/nughnguyen/gumpayment-plugin/releases" target="_blank"
          className="clay-button flex items-center gap-2">
          <Download className="w-5 h-5" /> Tải Plugin JAR
        </Link>
        <Link href="https://github.com/nughnguyen/gumpayment-plugin" target="_blank"
          className="flex items-center gap-2 px-6 py-3 bg-white border-[3px] border-slate-900 rounded-2xl font-bold shadow-[3px_3px_0px_0px_#1E293B] hover:shadow-[2px_2px_0px_0px_#1E293B] hover:translate-x-px hover:translate-y-px transition-all text-slate-900">
          <ExternalLink className="w-5 h-5" /> GitHub
        </Link>
      </div>
    </div>
  );
}

function RobloxDocs() {
  return (
    <div className="space-y-8">
      <Section title="Tổng quan" icon={Package}>
        <p className="text-slate-600 leading-relaxed">
          <strong>GumballZ UI Library</strong> là thư viện Lua mạnh mẽ cho Roblox scripting, cung cấp
          GUI đẹp, hệ thống key bảo mật, và nhiều tính năng hữu ích cho mọi tựa game.
        </p>
        <div className="grid md:grid-cols-3 gap-4 mt-2">
          {[
            { icon: Shield, label: "Key System", desc: "Bảo mật script" },
            { icon: Zap, label: "UI Library", desc: "Giao diện đẹp" },
            { icon: Code2, label: "Easy API", desc: "Dễ tích hợp" },
          ].map(({ icon: I, label, desc }) => (
            <div key={label} className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-center">
              <I className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <div className="font-black text-slate-900 text-sm">{label}</div>
              <div className="text-xs text-slate-500">{desc}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Lấy Key" icon={Key}>
        <p className="text-slate-600 leading-relaxed mb-4">
          Script yêu cầu key để kích hoạt. Có 2 loại key:
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-5 bg-slate-50 border-[3px] border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_#1E293B]">
            <div className="font-black text-slate-900 mb-2 flex items-center gap-2">
              <Badge text="FREE" color="green" /> Key Miễn phí
            </div>
            <p className="text-sm text-slate-600">Hoàn thành link rút gọn để lấy key. Hết hạn sau 24 giờ.</p>
            <Link href="/keys?type=roblox" className="mt-4 flex items-center gap-2 text-sm font-bold text-cyan-600 hover:underline">
              Lấy Key Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-5 bg-yellow-50 border-[3px] border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_#1E293B]">
            <div className="font-black text-slate-900 mb-2 flex items-center gap-2">
              <Badge text="VIP" color="yellow" /> Key Vĩnh viễn
            </div>
            <p className="text-sm text-slate-600">Mua key VIP → dùng mãi mãi, không cần qua link rút gọn.</p>
            <Link href="/store" className="mt-4 flex items-center gap-2 text-sm font-bold text-yellow-600 hover:underline">
              Mua Key VIP <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </Section>

      <Section title="Sử dụng Script" icon={Terminal}>
        <p className="text-slate-600 mb-4">Dán đoạn code sau vào executor của bạn:</p>
        <CodeBlock lang="lua" code={`-- GumballZ Universal Script
loadstring(game:HttpGet(
  "https://raw.githubusercontent.com/nughnguyen/gumballz/main/loader.lua"
))()`} />
        <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-2xl mt-4">
          <p className="text-sm text-yellow-700 font-bold">
            ⚠️ Yêu cầu executor hỗ trợ <code>HttpGet</code> (Synapse X, KRNL, Fluxus...)
          </p>
        </div>
      </Section>

      <Section title="API Reference" icon={Code2}>
        <div className="space-y-4">
          <CodeBlock lang="lua" code={`-- Khởi tạo
local GZ = loadstring(...)()
local Window = GZ:CreateWindow({
  Name = "My Script",
  Key = "YOUR_KEY_HERE"
})

-- Tạo Tab
local Tab = Window:CreateTab("Main", "home")

-- Thêm Toggle
Tab:CreateToggle({
  Name = "Auto Farm",
  Default = false,
  Callback = function(value)
    -- code của bạn
  end
})

-- Thêm Button
Tab:CreateButton({
  Name = "Execute",
  Callback = function()
    -- code của bạn  
  end
})`} />
        </div>
      </Section>

      <div className="flex gap-4 flex-wrap">
        <Link href="/roblox/docs" className="clay-button flex items-center gap-2">
          <BookOpen className="w-5 h-5" /> Xem docs đầy đủ
        </Link>
        <Link href="/keys?type=roblox" className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white border-[3px] border-slate-900 rounded-2xl font-bold shadow-[3px_3px_0px_0px_#1E293B] hover:shadow-[2px_2px_0px_0px_#1E293B] hover:translate-x-px hover:translate-y-px transition-all">
          <Key className="w-5 h-5" /> Lấy Key Ngay
        </Link>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
const TABS = [
  { id: "minecraft", label: "Minecraft Plugin", icon: Server, color: "green" },
  { id: "roblox", label: "Roblox Script", icon: Terminal, color: "red" },
];

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState("minecraft");

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* BG blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-200 rounded-full blur-[150px] opacity-20" />
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-red-200 rounded-full blur-[150px] opacity-20" />
      </div>

      <main className="relative z-10 pt-28 pb-20 px-6">
        <div className="container mx-auto max-w-5xl">

          {/* Header */}
          <div className="text-center mb-12 space-y-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-100 border-2 border-slate-900 rounded-full font-bold text-cyan-700 text-sm shadow-[3px_3px_0px_0px_#1E293B]">
              <BookOpen className="w-4 h-4" /> Documentation
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-5xl md:text-6xl font-black text-slate-900">
              GumballZ <span className="text-cyan-500">Docs</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-lg text-slate-600 font-medium max-w-xl mx-auto">
              Tài liệu hướng dẫn đầy đủ cho Minecraft Plugin và Roblox Script
            </motion.p>
          </div>

          {/* Tab switcher */}
          <div className="flex justify-center gap-3 mb-10">
            {TABS.map((tab) => (
              <button key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 border-[3px] border-slate-900 transition-all shadow-[3px_3px_0px_0px_#1E293B] hover:shadow-[2px_2px_0px_0px_#1E293B] hover:translate-x-px hover:translate-y-px ${
                  activeTab === tab.id
                    ? tab.id === "minecraft"
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                    : "bg-white text-slate-700"
                }`}>
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div key={activeTab}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {activeTab === "minecraft" ? <MinecraftDocs /> : <RobloxDocs />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
