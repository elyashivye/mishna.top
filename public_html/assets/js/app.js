// ניווט צד נייד
(function () {
  const sidebar = document.getElementById('sidebar');
  const openBtn = document.getElementById('sidebar-open');
  const closeBtn = document.getElementById('sidebar-close');
  const backdrop = document.getElementById('sidebar-backdrop');

  function openSidebar() {
    sidebar?.classList.remove('translate-x-full');
    backdrop?.classList.remove('hidden');
  }
  function closeSidebar() {
    sidebar?.classList.add('translate-x-full');
    backdrop?.classList.add('hidden');
  }
  openBtn?.addEventListener('click', openSidebar);
  closeBtn?.addEventListener('click', closeSidebar);
  backdrop?.addEventListener('click', closeSidebar);
})();

// מחליף עמוד לימוד (סרגל צד)
(function () {
  const btn = document.getElementById('page-switcher-btn');
  const menu = document.getElementById('page-switcher-menu');
  if (!btn || !menu) return;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('hidden');
  });
  document.addEventListener('click', () => menu.classList.add('hidden'));
})();

// תפריט משתמש נפתח
(function () {
  const btn = document.getElementById('user-menu-btn');
  const menu = document.getElementById('user-menu');
  if (!btn || !menu) return;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('hidden');
  });
  document.addEventListener('click', () => menu.classList.add('hidden'));
})();

// כפתור "שמע" — הקראה בעברית באמצעות Web Speech API
function speakText(text, btnEl) {
  if (!('speechSynthesis' in window)) {
    alert('הדפדפן שלך אינו תומך בהקראה קולית.');
    return;
  }
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
    if (btnEl) btnEl.dataset.playing = 'false';
    return;
  }
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'he-IL';
  utter.rate = 0.85;
  if (btnEl) {
    btnEl.dataset.playing = 'true';
    utter.onend = () => { btnEl.dataset.playing = 'false'; };
  }
  speechSynthesis.speak(utter);
}

// כפתור "שתף"
async function shareMishna(title, text, url) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return;
    } catch (e) { /* בוטל ע"י המשתמש */ return; }
  }
  try {
    await navigator.clipboard.writeText(url);
    alert('הקישור הועתק ללוח.');
  } catch (e) {
    prompt('העתיקו את הקישור:', url);
  }
}

// סימון "סיימתי ללמוד היום" / השלמת משנה — AJAX
async function toggleMishnaComplete(mishnaId, csrfToken, onDone) {
  try {
    const res = await fetch('/api/toggle_progress.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ mishna_id: mishnaId, csrf_token: csrfToken }),
    });
    const data = await res.json();
    if (onDone) onDone(data);
  } catch (e) {
    console.error(e);
  }
}
