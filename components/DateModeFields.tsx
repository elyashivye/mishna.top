"use client";

import { useState } from "react";
import { HEBREW_MONTH_ORDER, hebrewMonthNameHe } from "@/lib/hebrew-date";
import { gematriya } from "@hebcal/core";

export function DateModeFields() {
  const [mode, setMode] = useState<"" | "gregorian" | "hebrew">("");

  return (
    <div>
      <label className="block text-sm text-ink/70 mb-2">תאריך פטירה (אופציונלי)</label>
      <div className="flex gap-3 mb-3 flex-wrap">
        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="radio"
            name="date_input_mode"
            value=""
            checked={mode === ""}
            onChange={() => setMode("")}
          />{" "}
          ללא תאריך
        </label>
        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="radio"
            name="date_input_mode"
            value="gregorian"
            checked={mode === "gregorian"}
            onChange={() => setMode("gregorian")}
          />{" "}
          יש לי תאריך לועזי
        </label>
        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="radio"
            name="date_input_mode"
            value="hebrew"
            checked={mode === "hebrew"}
            onChange={() => setMode("hebrew")}
          />{" "}
          יש לי רק תאריך עברי
        </label>
      </div>

      {mode === "gregorian" && (
        <div>
          <input
            type="date"
            name="passing_date_gregorian"
            className="rounded-lg border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold"
          />
          <p className="text-xs text-ink/50 mt-1">התאריך העברי המקביל יחושב אוטומטית ויוצג בעמוד.</p>
        </div>
      )}

      {mode === "hebrew" && (
        <div className="flex gap-2 items-center">
          <select
            name="passing_hebrew_day"
            className="rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold"
          >
            <option value="">יום</option>
            {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {gematriya(d)} ({d})
              </option>
            ))}
          </select>
          <select
            name="passing_hebrew_month"
            className="rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold"
          >
            <option value="">חודש</option>
            {HEBREW_MONTH_ORDER.map((m) => (
              <option key={m} value={m}>
                {hebrewMonthNameHe(m)}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
