/**
 * BusyBeds SVG Logo
 *
 * variant="dark"  → "beds" in dark teal  (use on light/white backgrounds)
 * variant="light" → "beds" in white      (use on dark/colored backgrounds)
 *
 * The icon (house + circle-check) is always rose/coral.
 */
interface Props {
  height?: number;
  className?: string;
  /** "dark" = teal beds text (default, for light navbar/pages)
   *  "light" = white beds text (for dark headers or splash screens) */
  variant?: 'dark' | 'light';
}

const CORAL = '#E8395A';
const TEAL  = '#0D3D5E';
const WHITE = '#FFFFFF';

export default function Logo({ height = 32, className = '', variant = 'dark' }: Props) {
  const bedsColor = variant === 'light' ? WHITE : TEAL;

  // Maintain ~4.4:1 aspect ratio
  const width  = Math.round(height * 4.4);
  const iconSz = height;          // icon occupies a square of this size
  const textX  = iconSz * 1.08;  // text starts just after icon
  const textY  = height * 0.775; // baseline

  // Font metrics: at fontSize = height*0.72, each char is ~0.44em wide
  // "busy" = 4 chars ≈ 4 * height * 0.72 * 0.44
  const fontSize  = height * 0.72;
  const busyWidth = fontSize * 1.83; // measured approx

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="BusyBeds"
      role="img"
    >
      {/* ── House outline ───────────────────────────────────────── */}
      {/* Left wall + floor (bottom-left rounded corner) */}
      <path
        d={[
          `M ${iconSz * 0.12} ${iconSz * 0.52}`,   // top of left wall
          `L ${iconSz * 0.12} ${iconSz * 0.875}`,   // down left wall
          `Q ${iconSz * 0.12} ${iconSz * 0.96} ${iconSz * 0.21} ${iconSz * 0.96}`, // bottom-left curve
          `L ${iconSz * 0.47} ${iconSz * 0.96}`,    // bottom to just before circle
        ].join(' ')}
        stroke={CORAL}
        strokeWidth={iconSz * 0.068}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right wall + floor (bottom-right rounded corner) */}
      <path
        d={[
          `M ${iconSz * 0.88} ${iconSz * 0.52}`,   // top of right wall
          `L ${iconSz * 0.88} ${iconSz * 0.875}`,
          `Q ${iconSz * 0.88} ${iconSz * 0.96} ${iconSz * 0.79} ${iconSz * 0.96}`,
          `L ${iconSz * 0.57} ${iconSz * 0.96}`,
        ].join(' ')}
        stroke={CORAL}
        strokeWidth={iconSz * 0.068}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Roof — left slope */}
      <path
        d={`M ${iconSz * 0.10} ${iconSz * 0.54} L ${iconSz * 0.5} ${iconSz * 0.10}`}
        stroke={CORAL}
        strokeWidth={iconSz * 0.068}
        strokeLinecap="round"
      />
      {/* Roof — right slope (stops short of peak for the open-top look) */}
      <path
        d={`M ${iconSz * 0.90} ${iconSz * 0.54} L ${iconSz * 0.5} ${iconSz * 0.10}`}
        stroke={CORAL}
        strokeWidth={iconSz * 0.068}
        strokeLinecap="round"
      />

      {/* ── Circle with checkmark (centered in house body) ──────── */}
      <circle
        cx={iconSz * 0.5}
        cy={iconSz * 0.635}
        r={iconSz * 0.20}
        stroke={CORAL}
        strokeWidth={iconSz * 0.062}
      />
      <polyline
        points={[
          `${iconSz * 0.372},${iconSz * 0.635}`,
          `${iconSz * 0.466},${iconSz * 0.720}`,
          `${iconSz * 0.635},${iconSz * 0.555}`,
        ].join(' ')}
        stroke={CORAL}
        strokeWidth={iconSz * 0.062}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ── "busy" in coral ─────────────────────────────────────── */}
      <text
        x={textX}
        y={textY}
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontWeight="800"
        fontSize={fontSize}
        fill={CORAL}
        letterSpacing="-0.4"
      >
        busy
      </text>

      {/* ── "beds" in teal or white depending on variant ────────── */}
      <text
        x={textX + busyWidth}
        y={textY}
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontWeight="800"
        fontSize={fontSize}
        fill={bedsColor}
        letterSpacing="-0.4"
      >
        beds
      </text>
    </svg>
  );
}
