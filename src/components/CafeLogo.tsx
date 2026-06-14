// Inline coffee-cup logo badge — espresso disc with a gold cup + steam.
// Replaces the missing /logo-badge.png; scales crisply at any size.
export function CafeLogo({ size = 38, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      role="img"
      aria-label="Odoo Cafe"
    >
      <circle cx="20" cy="20" r="20" fill="#2A1008" />
      <g stroke="#FFBC0D" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* steam */}
        <path d="M16.5 9.5c-1 1.6.8 2.6 0 4.2" />
        <path d="M20 9c-1 1.6.8 2.6 0 4.2" />
        <path d="M23.5 9.5c-1 1.6.8 2.6 0 4.2" />
        {/* cup body */}
        <path d="M12.5 17.5h15l-1.2 9.2a2.4 2.4 0 0 1-2.38 2.1h-7.84a2.4 2.4 0 0 1-2.38-2.1z" />
        {/* handle */}
        <path d="M27.6 19.4h1.5a3 3 0 0 1 0 6h-2.1" />
        {/* saucer */}
        <path d="M11 31.5h18" />
      </g>
    </svg>
  );
}
