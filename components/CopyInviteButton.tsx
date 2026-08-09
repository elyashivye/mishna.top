"use client";

import { useState } from "react";
import { Icon } from "./Icon";

export function CopyInviteButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      prompt("העתיקו את הקישור:", link);
    }
  }

  return (
    <button type="button" onClick={handleClick} className="btn-pill bg-navy text-white">
      <Icon name="share" className="w-4 h-4" /> {copied ? "הקישור הועתק!" : "העתקת קישור הזמנה"}
    </button>
  );
}
