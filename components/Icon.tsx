/**
 * אייקוני SVG פשוטים (line icons), בנויים מצורות בסיסיות בלבד כדי להימנע
 * מנתיבי path מורכבים שעלולים להיות שגויים.
 */
const PATHS: Record<string, string> = {
  home: '<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9a1 1 0 0 0 1 1h3.5v-5.5h3V20H17a1 1 0 0 0 1-1v-9"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>',
  book: '<path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5a1.5 1.5 0 0 0 1.5-1.5v-13Z"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 5H4a3 3 0 0 0 3 4M17 5h3a3 3 0 0 1-3 4"/><path d="M12 14v3M9 20h6M9.5 17h5l.5 3H9l.5-3Z"/>',
  calendar: '<rect x="4" y="5.5" width="16" height="15" rx="1.5"/><path d="M4 10h16M8 3v4M16 3v4"/>',
  heart: '<path d="M12 20.5s-7.5-4.6-9.7-9.2C1 8.2 2.5 5 6 5c2 0 3.3 1 4 2.2A4.6 4.6 0 0 1 14 5c3.5 0 5 3.2 3.7 6.3C15.5 15.9 12 20.5 12 20.5Z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.2M12 18.8V21M21 12h-2.2M5.2 12H3M18 6l-1.5 1.5M7.5 16.5 6 18M18 18l-1.5-1.5M7.5 7.5 6 6"/>',
  candle: '<path d="M12 3c1 1.2 1.6 2 1.6 2.9A1.6 1.6 0 0 1 12 7.5a1.6 1.6 0 0 1-1.6-1.6C10.4 5 11 4.2 12 3Z"/><rect x="10" y="9" width="4" height="11" rx="0.6"/><path d="M7 20h10"/>',
  share: '<circle cx="18" cy="5" r="2.2"/><circle cx="6" cy="12" r="2.2"/><circle cx="18" cy="19" r="2.2"/><path d="M7.8 10.8 16.2 6.2M7.8 13.2l8.4 4.6"/>',
  volume: '<path d="M4 9.5v5h3.5L13 19V5L7.5 9.5H4Z"/><path d="M17 9a4 4 0 0 1 0 6M19.3 6.7a7.5 7.5 0 0 1 0 10.6"/>',
  check: '<path d="M5 12.5 9.5 17 19 7.5"/>',
  "chevron-start": '<path d="M15 5l-7 7 7 7"/>',
  "chevron-end": '<path d="M9 5l7 7-7 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  user: '<circle cx="12" cy="8" r="3.3"/><path d="M5 20c1-3.5 4-5.5 7-5.5s6 2 7 5.5"/>',
  logout: '<path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M15 16l4-4-4-4M19 12H9"/>',
  flame: '<path d="M12 3s5 4.5 5 9a5 5 0 0 1-10 0c0-1 .4-2 1-3 .3 1 1 1.6 1.6 1.6C9 8 9 5.5 12 3Z"/>',
  star: '<path d="M12 3.5l2.4 5 5.4.6-4 3.8 1 5.4-4.8-2.7-4.8 2.7 1-5.4-4-3.8 5.4-.6L12 3.5Z"/>',
  edit: '<path d="M4 20h4L18.5 9.5a2 2 0 0 0-4-4L4 16v4Z"/><path d="M13 6.5 17.5 11"/>',
  trash: '<path d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M7 7l1 13h8l1-13"/>',
  lock: '<rect x="5" y="10.5" width="14" height="9" rx="1.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="1.5"/><path d="M4 6.5l8 6.5 8-6.5"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-5-5"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 20c.7-3 3-5 6-5s5.3 2 6 5"/><circle cx="17" cy="9" r="2.3"/><path d="M15.5 12.3c2.3.3 4 1.9 4.5 4.2"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
};

export function Icon({ name, className = "w-5 h-5" }: { name: string; className?: string }) {
  const inner = PATHS[name] ?? '<circle cx="12" cy="12" r="8"/>';
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}
