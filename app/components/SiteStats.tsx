"use client";

import { useEffect, useState } from "react";

type Stats = { online: number; visits: number };

export function SiteStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let visitorId = sessionStorage.getItem("gz-visit-id");
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      sessionStorage.setItem("gz-visit-id", visitorId);
    }

    let active = true;
    const update = async () => {
      try {
        const response = await fetch("/api/site-stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitorId }),
          cache: "no-store",
        });
        const data = await response.json();
        if (active && data.success) setStats({ online: data.online, visits: data.visits });
      } catch { /* Keep the latest available counts when analytics is unavailable. */ }
    };

    void update();
    const timer = window.setInterval(() => void update(), 60_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  return <span className="inline-flex flex-wrap gap-x-4 gap-y-1" aria-live="polite">
    <span><span className="mr-1 inline-block size-2 rounded-full bg-green-700"/>Đang online: {stats ? new Intl.NumberFormat("vi-VN").format(stats.online) : "—"}</span>
    <span>Tổng lượt truy cập: {stats ? new Intl.NumberFormat("vi-VN").format(stats.visits) : "—"}</span>
  </span>;
}
