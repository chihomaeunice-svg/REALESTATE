export function Logo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="#131f4d" />
      <path
        d="M20 8.5L31 17.5V29.5C31 30.3284 30.3284 31 29.5 31H10.5C9.67157 31 9 30.3284 9 29.5V17.5L20 8.5Z"
        fill="url(#logo-house)"
      />
      <rect x="15.2" y="18.4" width="4" height="4" rx="0.8" fill="#fbbf24" />
      <rect x="20.8" y="18.4" width="4" height="4" rx="0.8" fill="#fbbf24" />
      <rect x="15.2" y="23.6" width="4" height="4" rx="0.8" fill="#fbbf24" />
      <rect x="20.8" y="23.6" width="4" height="4" rx="0.8" fill="#fbbf24" />
      <path
        d="M6 33.5C9 31.5 13 31.5 16 33.5C19 35.5 23 35.5 26 33.5C29 31.5 33 31.5 36 33.5"
        stroke="#60a5fa"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="logo-house" x1="9" y1="8.5" x2="31" y2="31" gradientUnits="userSpaceOnUse">
          <stop stopColor="#60a5fa" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
      </defs>
    </svg>
  );
}
