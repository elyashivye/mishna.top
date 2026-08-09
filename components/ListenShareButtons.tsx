"use client";

import { Icon } from "./Icon";

let speaking = false;

function speakText(text: string) {
  if (!("speechSynthesis" in window)) {
    alert("הדפדפן שלך אינו תומך בהקראה קולית.");
    return;
  }
  if (speaking) {
    window.speechSynthesis.cancel();
    speaking = false;
    return;
  }
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "he-IL";
  utter.rate = 0.85;
  speaking = true;
  utter.onend = () => {
    speaking = false;
  };
  window.speechSynthesis.speak(utter);
}

async function shareText(title: string, text: string, url: string) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return;
    } catch {
      return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    alert("הקישור הועתק ללוח.");
  } catch {
    prompt("העתיקו את הקישור:", url);
  }
}

export function ListenShareButtons({ text, shareUrl }: { text: string; shareUrl: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3 mt-4">
      <button
        type="button"
        className="btn-pill bg-cream-dark text-navy hover:bg-gold/30"
        onClick={() => speakText(text)}
      >
        <Icon name="volume" className="w-4 h-4" /> שמע
      </button>
      <button
        type="button"
        className="btn-pill bg-cream-dark text-navy hover:bg-gold/30"
        onClick={() => shareText("משנה של נשמה", text, shareUrl)}
      >
        <Icon name="share" className="w-4 h-4" /> שתף
      </button>
    </div>
  );
}
