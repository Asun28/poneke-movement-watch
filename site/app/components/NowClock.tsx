"use client";

import { useEffect, useState } from "react";

function formatNow(date: Date) {
  return new Intl.DateTimeFormat("en-NZ", {
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Pacific/Auckland",
    hour12: false,
  }).format(date);
}

export default function NowClock() {
  const [label, setLabel] = useState("Wellington time");
  useEffect(() => {
    const update = () => setLabel(formatNow(new Date()));
    update();
    const interval = window.setInterval(update, 30_000);
    return () => window.clearInterval(interval);
  }, []);
  return <time>{label} NZST</time>;
}
