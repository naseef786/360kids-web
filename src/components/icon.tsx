import type React from "react";
export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 9v12h5v-7h4v7h5V9" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    heart: (
      <path d="M20.8 4.9a5.5 5.5 0 0 0-7.8 0L12 6l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.3a5.5 5.5 0 0 0 0-7.8Z" />
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4m10-4v4M3 11h18m-13 5h3" />
      </>
    ),
    person: (
      <>
        <circle cx="12" cy="7" r="4" />
        <path d="M4 22v-3a8 8 0 0 1 16 0v3Z" />
      </>
    ),
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    pin: (
      <>
        <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
        <circle cx="12" cy="10" r="2" />
      </>
    ),
    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3h.01" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    Sports: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3v18M6 5c8 4 8 10 0 14m12-14c-8 4-8 10 0 14" />
      </>
    ),
    Arts: (
      <>
        <path d="M12 3a9 9 0 0 0 0 18c3 0 3-2 2-3s0-3 2-3h2c6 0 5-12-6-12Z" />
        <path d="M8 8h.01M14 7h.01M6 13h.01M18 10h.01" />
      </>
    ),
    Music: (
      <>
        <path d="M9 18V5l12-2v13M9 8l12-2" />
        <ellipse cx="6" cy="18" rx="3" ry="3" />
        <ellipse cx="18" cy="16" rx="3" ry="3" />
      </>
    ),
    Learning: (
      <>
        <path d="M12 5v16M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2Z" />
      </>
    ),
    Outdoors: (
      <>
        <path d="m8 3-5 7h3l-4 6h5v5h2v-5h5l-4-6h3L8 3Zm10 2-3 5h2l-3 5h3v6h2v-6h3l-3-5h2l-3-5Z" />
      </>
    ),
  };
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name] ?? paths.home}
    </svg>
  );
}
