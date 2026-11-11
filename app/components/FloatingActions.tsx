"use client";

import { useEffect, useState } from "react";
import { ArrowUp, MessageCircle } from "lucide-react";

export default function FloatingActions() {
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const updateProgress = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const next = scrollable > 0 ? Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100)) : 0;
      setProgress(next);
      setShowTop(window.scrollY > 160);
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  const circumference = 2 * Math.PI * 21;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-center gap-3">
      <button
        type="button"
        aria-label={`Cuộn lên đầu trang, đã cuộn ${Math.round(progress)}%`}
        title={`Tiến độ cuộn: ${Math.round(progress)}%`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`relative grid size-12 place-items-center rounded-full border-2 border-black bg-white text-[#111217] shadow-[3px_3px_0_#111217] transition-all hover:-translate-y-0.5 hover:bg-[#E8F6FF] ${showTop ? "opacity-100" : "pointer-events-none translate-y-2 opacity-0"}`}
        tabIndex={showTop ? 0 : -1}
      >
        <svg className="pointer-events-none absolute -inset-[3px] size-[54px] -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
          <circle cx="24" cy="24" r="21" fill="none" stroke="#3BA7F2" strokeWidth="3" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress / 100)} strokeLinecap="round" />
        </svg>
        <ArrowUp size={19} strokeWidth={2.8} />
      </button>
      <a
        href="/contact"
        aria-label="Chat Zalo với admin"
        title="Chat Zalo với admin"
        className="grid size-12 place-items-center rounded-full border-2 border-black bg-[#7FE7D6] text-[#111217] shadow-[3px_3px_0_#111217] transition-transform hover:-translate-y-0.5 hover:bg-[#65d6c5]"
      >
        <MessageCircle size={21} strokeWidth={2.7} />
      </a>
    </div>
  );
}
