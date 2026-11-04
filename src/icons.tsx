export type IconName =
  | "arrow"
  | "back"
  | "bolt"
  | "book"
  | "calendar"
  | "check"
  | "clock"
  | "home"
  | "graph"
  | "layers"
  | "logout"
  | "parent"
  | "play"
  | "refresh"
  | "spark"
  | "student"
  | "target"
  | "trophy";

const paths: Record<IconName, React.ReactNode> = {
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  back: <path d="M19 12H5m5-5-5 5 5 5" />,
  bolt: <path d="m13 2-8 11h7l-1 9 8-12h-7l1-8Z" />,
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" />
      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4m8-4v4M3 10h18" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  refresh: (
    <>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10M9 20v-6h6v6" />
    </>
  ),
  graph: (
    <>
      <path d="M4 20V10m6 10V4m6 16v-7m4 7H2" />
      <path d="m4 7 5-4 6 6 5-5" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
    </>
  ),
  logout: <path d="M10 5H5v14h5m5-4 4-3-4-3m4 3H9" />,
  parent: (
    <>
      <circle cx="9" cy="7" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3 20c.5-4 2.5-6 6-6s5.5 2 6 6M15 14c3.5 0 5.5 1.8 6 5" />
    </>
  ),
  play: <path d="m9 7 8 5-8 5V7Z" />,
  spark: (
    <>
      <path d="m12 2 1.3 4.2L17.5 8l-4.2 1.8L12 14l-1.3-4.2L6.5 8l4.2-1.8L12 2Z" />
      <path d="m19 14 .7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7L19 14Z" />
    </>
  ),
  student: (
    <>
      <path d="m3 9 9-5 9 5-9 5-9-5Z" />
      <path d="M7 12v4c3 2.5 7 2.5 10 0v-4M21 9v6" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
      <path d="M8 6H4v1a4 4 0 0 0 4 4m8-5h4v1a4 4 0 0 1-4 4M12 13v4m-4 4h8m-6-4h4" />
    </>
  ),
};

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
        {paths[name]}
      </g>
    </svg>
  );
}
