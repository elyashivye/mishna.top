"use client";

import { useState } from "react";

export function PaceFields() {
  const [pace, setPace] = useState<"year" | "six_years" | "custom">("year");

  const option = (value: "year" | "six_years" | "custom", label: string) => (
    <label className="border-2 rounded-xl p-3 text-center cursor-pointer has-[:checked]:border-gold has-[:checked]:bg-gold/5 border-gray-200">
      <input type="radio" name="pace" value={value} checked={pace === value} onChange={() => setPace(value)} />{" "}
      <span className="font-semibold text-navy text-sm block mt-1">{label}</span>
    </label>
  );

  return (
    <div className="border-t border-gray-100 pt-5">
      <h2 className="font-bold text-navy mb-3">קצב לסיום הש&quot;ס</h2>
      <div className="grid sm:grid-cols-3 gap-3">
        {option("year", "שנה")}
        {option("six_years", "6 שנים")}
        {option("custom", "מותאם אישית")}
      </div>
      {pace === "custom" && (
        <div className="mt-3">
          <label className="block text-sm text-ink/70 mb-1">תאריך יעד לסיום</label>
          <input
            type="date"
            name="custom_end_date"
            className="rounded-lg border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>
      )}
    </div>
  );
}
