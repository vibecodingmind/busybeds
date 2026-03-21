/**
 * BusyBeds SVG Logo — matches the brand logo:
 * house icon (coral) + "busy" (coral) + "beds" (dark teal)
 */
interface Props {
  height?: number;
  className?: string;
}

const CORAL = '#E8395A';
const TEAL  = '#1A3C5E';

export default function Logo({ height = 32, className = '' }: Props) {
  // maintain aspect ratio ~ 4.4:1
  const width = Math.round(height * 4.4);
  const iconH = height;
  const iconW = iconH;

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
      {/* House / home icon */}
      {/* Outer house outline */}
      <path
        d={`M${iconH * 0.12} ${iconH * 0.52}
            L${iconH * 0.5} ${iconH * 0.1}
            L${iconH * 0.88} ${iconH * 0.52}
            L${iconH * 0.88} ${iconH * 0.92}
            Q${iconH * 0.88} ${iconH * 0.96} ${iconH * 0.84} ${iconH * 0.96}
            L${iconH * 0.16} ${iconH * 0.96}
            Q${iconH * 0.12} ${iconH * 0.96} ${iconH * 0.12} ${iconH * 0.92}
            Z`}
        stroke={CORAL}
        strokeWidth={iconH * 0.065}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Circle with checkmark inside house */}
      <circle
        cx={iconH * 0.5}
        cy={iconH * 0.63}
        r={iconH * 0.195}
        stroke={CORAL}
        strokeWidth={iconH * 0.058}
      />
      <polyline
        points={`${iconH * 0.375},${iconH * 0.63} ${iconH * 0.47},${iconH * 0.715} ${iconH * 0.63},${iconH * 0.555}`}
        stroke={CORAL}
        strokeWidth={iconH * 0.058}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* "busy" text in coral */}
      <text
        x={iconW * 1.1}
        y={height * 0.76}
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontWeight="700"
        fontSize={height * 0.72}
        fill={CORAL}
        letterSpacing="-0.5"
      >
        busy
      </text>

      {/* "beds" text in dark teal — positioned right after "busy" */}
      <text
        x={iconW * 1.1 + height * 0.72 * 2.06}
        y={height * 0.76}
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontWeight="700"
        fontSize={height * 0.72}
        fill={TEAL}
        letterSpacing="-0.5"
      >
        beds
      </text>
    </svg>
  );
}
