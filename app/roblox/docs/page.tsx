"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Terminal, 
  Copy, 
  Check, 
  ChevronRight, 
  Layout, 
  ToggleLeft, 
  MousePointer2, 
  Type 
} from "lucide-react";

const CodeBlock = ({ code, language = "lua" }: { code: string, language?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-xl bg-slate-900 border-[3px] border-slate-900 overflow-hidden my-6 shadow-[4px_4px_0px_0px_#94A3B8]">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <button 
          onClick={handleCopy}
          className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "COPIED" : "COPY CODE"}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="font-mono text-sm text-cyan-300">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("getting-started");

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-20">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex gap-12">
          
          {/* Sidebar Navigation */}
          <div className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-32 space-y-8">
              <div>
                <h3 className="font-black text-slate-900 mb-4 px-2 uppercase text-sm tracking-wider">Getting Started</h3>
                <nav className="space-y-1">
                  <button onClick={() => scrollTo("intro")} className={`w-full text-left px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeSection === "intro" ? "bg-cyan-100 text-cyan-700 border-2 border-cyan-200" : "text-slate-600 hover:bg-slate-200"}`}>Introduction</button>
                  <button onClick={() => scrollTo("setup")} className={`w-full text-left px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeSection === "setup" ? "bg-cyan-100 text-cyan-700 border-2 border-cyan-200" : "text-slate-600 hover:bg-slate-200"}`}>Installation</button>
                </nav>
              </div>
              
              <div>
                <h3 className="font-black text-slate-900 mb-4 px-2 uppercase text-sm tracking-wider">Components</h3>
                <nav className="space-y-1">
                  <button onClick={() => scrollTo("window")} className={`w-full text-left px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeSection === "window" ? "bg-cyan-100 text-cyan-700 border-2 border-cyan-200" : "text-slate-600 hover:bg-slate-200"}`}>Window</button>
                  <button onClick={() => scrollTo("tabs")} className={`w-full text-left px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeSection === "tabs" ? "bg-cyan-100 text-cyan-700 border-2 border-cyan-200" : "text-slate-600 hover:bg-slate-200"}`}>Tabs & Sections</button>
                  <button onClick={() => scrollTo("elements")} className={`w-full text-left px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeSection === "elements" ? "bg-cyan-100 text-cyan-700 border-2 border-cyan-200" : "text-slate-600 hover:bg-slate-200"}`}>UI Elements</button>
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Intro */}
            <section id="intro" className="mb-16">
              <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-blue-100 border-2 border-slate-900 rounded-full font-bold text-blue-700 text-sm shadow-[3px_3px_0px_0px_#1E293B]">
                <Terminal className="w-4 h-4" />
                <span>Documentation v1.0.0</span>
              </div>
              <h1 className="text-5xl font-black text-slate-900 mb-6">GumballZ Library</h1>
              <p className="text-xl text-slate-600 leading-relaxed font-medium">
                Thư viện UI hiện đại, mượt mà và dễ sử dụng nhất cho Roblox Scripters. 
                Hỗ trợ đầy đủ các tính năng nâng cao, key system tích hợp và khả năng tùy biến vô hạn.
              </p>
            </section>

            {/* Setup */}
            <section id="setup" className="mb-16">
              <div className="clay-card p-8 bg-white border-l-8 border-l-cyan-500">
                <h2 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-3">
                  <Layout className="w-6 h-6 text-cyan-500" />
                  Installation
                </h2>
                <p className="text-slate-600 mb-4 font-medium">
                  Load thư viện trực tiếp từ source để luôn nhận được bản cập nhật mới nhất:
                </p>
                <CodeBlock code={`local GumballZ = loadstring(game:HttpGet("https://raw.githubusercontent.com/nughnguyen/GumballZ-UI-Library/refs/heads/main/GUI/GumballZ-UI-Lib.lua"))()`} />
              </div>
            </section>

            {/* Window */}
            <section id="window" className="mb-16">
              <h2 className="text-3xl font-black text-slate-900 mb-8 pb-4 border-b-2 border-slate-200">Creating a Window</h2>
              <p className="text-slate-600 mb-6 font-medium">
                Khởi tạo window chính với các cấu hình cơ bản và hệ thống Key System.
              </p>

              <div className="space-y-6">
                 <CodeBlock code={`local Window = GumballZ.new({
    Name = "Tên Script Của Bạn",
    Expire = "never", -- Thời gian hết hạn key (nếu có)
    KeySettings = {
        Title = "Key System",
        Subtitle = "Nhập key để tiếp tục",
        Note = "Join Discord để lấy key!",
        FileName = "MyScriptKey", -- Tên file lưu key
        SaveKey = true, -- Tự động lưu key
        GrabKeyFromSite = false, -- Lấy key từ URL
        Key = {"KEY-123", "KEY-456"}, -- Danh sách key hợp lệ
        URL = "https://gumballzhub.vercel.app/keys" -- Link copy khi bấm nút
    }
})`} />
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-100 rounded-xl border-2 border-slate-200">
                        <span className="font-bold text-slate-900 block mb-1">Name</span>
                        <span className="text-sm text-slate-600">Tên hiển thị trên tiêu đề UI.</span>
                    </div>
                    <div className="p-4 bg-slate-100 rounded-xl border-2 border-slate-200">
                        <span className="font-bold text-slate-900 block mb-1">KeySettings</span>
                        <span className="text-sm text-slate-600">Cấu hình hệ thống key bảo mật.</span>
                    </div>
                </div>
              </div>
            </section>

             {/* Tabs & Sections */}
             <section id="tabs" className="mb-16">
              <h2 className="text-3xl font-black text-slate-900 mb-8 pb-4 border-b-2 border-slate-200">Menu & Sections</h2>
              <p className="text-slate-600 mb-6 font-medium">
                Tổ chức các chức năng thành các Tab (Menu) và chia nhỏ thành các Section.
              </p>

              <CodeBlock code={`-- Tạo Tab mới
local Home = Window:AddMenu({
    Name = "Home",
    Icon = "home" -- Icon từ Lucide (home, user, settings, etc.)
})

-- Tạo Section bên trái
local MainSection = Home:AddSection({
    Position = 'left', -- 'left', 'center', 'right'
    Name = "Main Features",
    Height = 5 -- Chiều cao tương đối
})`} />
            </section>

            {/* UI Elements */}
            <section id="elements" className="mb-16">
              <h2 className="text-3xl font-black text-slate-900 mb-8 pb-4 border-b-2 border-slate-200">UI Elements</h2>
              
              <div className="space-y-12">
                {/* Divider */}
                <div>
                   <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Type className="w-5 h-5 text-purple-500" />
                    Divider
                   </h3>
                   <p className="text-slate-600 mb-4 text-sm font-medium">Đường kẻ phân cách các nhóm chức năng.</p>
                   <CodeBlock code={`Section:AddDivider("SETTINGS")`} />
                </div>

                {/* Paragraph */}
                <div>
                   <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Type className="w-5 h-5 text-purple-500" />
                    Paragraph
                   </h3>
                   <p className="text-slate-600 mb-4 text-sm font-medium">Hiển thị đoạn văn bản thông báo hoặc hướng dẫn.</p>
                   <CodeBlock code={`Section:AddParagraph({
    Title = "Thông Báo",
    Content = "Phiên bản script hiện tại đang là beta."
})`} />
                </div>

                {/* Toggle */}
                <div>
                   <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <ToggleLeft className="w-5 h-5 text-purple-500" />
                    Toggle
                   </h3>
                   <p className="text-slate-600 mb-4 text-sm font-medium">Công tắc bật/tắt chức năng.</p>
                   <CodeBlock code={`Section:AddToggle({
    Name = "Auto Farm",
    Default = false,
    Callback = function(Value)
        print("Auto Farm is now:", Value)
    end
})`} />
                </div>

                {/* Slider */}
                <div>
                   <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <MousePointer2 className="w-5 h-5 text-purple-500" />
                    Slider
                   </h3>
                   <p className="text-slate-600 mb-4 text-sm font-medium">Thanh trượt điều chỉnh giá trị.</p>
                   <CodeBlock code={`Section:AddSlider({
    Name = "WalkSpeed",
    Default = 16,
    Min = 16,
    Max = 100,
    Round = 1, -- Số chữ số thập phân
    Type = " spd", -- Đơn vị hiển thị sau số
    Callback = function(Value)
        game.Players.LocalPlayer.Character.Humanoid.WalkSpeed = Value
    end
})`} />
                </div>

                {/* Button */}
                <div>
                   <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <MousePointer2 className="w-5 h-5 text-purple-500" />
                    Button
                   </h3>
                   <p className="text-slate-600 mb-4 text-sm font-medium">Nút bấm thực hiện hành động.</p>
                   <CodeBlock code={`Section:AddButton({
    Name = "Kill All",
    Callback = function()
        print("Killed everyone!")
    end
})`} />
                </div>

                {/* Dropdown */}
                <div>
                   <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <ChevronRight className="w-5 h-5 text-purple-500" />
                    Dropdown
                   </h3>
                   <p className="text-slate-600 mb-4 text-sm font-medium">Danh sách lựa chọn.</p>
                   <CodeBlock code={`Section:AddDropdown({
    Name = "Weapon",
    Default = "Rifle",
    Values = {"Rifle", "Pistol", "Knife"},
    Multi = false, -- Chọn nhiều hay không
    Callback = function(Value)
        print("Selected:", Value)
    end
})`} />
                </div>

                {/* ColorPicker */}
                <div>
                   <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <MousePointer2 className="w-5 h-5 text-purple-500" />
                    ColorPicker
                   </h3>
                   <p className="text-slate-600 mb-4 text-sm font-medium">Bộ chọn màu sắc.</p>
                   <CodeBlock code={`Section:AddColorPicker({
    Name = "Accent Color",
    Default = Color3.fromRGB(255, 0, 0),
    Callback = function(Color)
        print("New Color:", Color)
    end
})`} />
                </div>

                {/* Keybind */}
                <div>
                   <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <MousePointer2 className="w-5 h-5 text-purple-500" />
                    Keybind
                   </h3>
                   <p className="text-slate-600 mb-4 text-sm font-medium">Phím tắt kích hoạt chức năng.</p>
                   <CodeBlock code={`Section:AddKeybind({
    Name = "Toggle Menu",
    Default = Enum.KeyCode.RightControl,
    Callback = function()
        print("Key Pressed!")
    end
})`} />
                </div>

                {/* PlayerView */}
                <div>
                   <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <MousePointer2 className="w-5 h-5 text-purple-500" />
                    PlayerView
                   </h3>
                   <p className="text-slate-600 mb-4 text-sm font-medium">Hiển thị nhân vật của người chơi trong UI.</p>
                   <CodeBlock code={`Section:AddPlayerView({
    Height = 200 -- Chiều cao của khung nhìn
})`} />
                </div>

                {/* Nested Elements */}
                <div>
                   <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Layout className="w-5 h-5 text-purple-500" />
                    Nested Elements (Option)
                   </h3>
                   <p className="text-slate-600 mb-4 text-sm font-medium">Lồng ghép các element vào trong một element khác (thường là Toggle).</p>
                   <CodeBlock code={`-- Tạo Toggle có Option = true
local Toggle = Section:AddToggle({
    Name = "ESP Master",
    Default = false,
    Option = true -- Cho phép lồng ghép
})

-- Thêm ColorPicker vào bên trong Toggle
Toggle.Option:AddColorPicker({
    Name = "ESP Color",
    Default = Color3.fromRGB(255, 0, 0)
})

-- Thêm Keybind vào bên trong Toggle
Toggle.Option:AddKeybind({
    Name = "Quick Toggle",
    Default = Enum.KeyCode.E
})`} />
                </div>

              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
