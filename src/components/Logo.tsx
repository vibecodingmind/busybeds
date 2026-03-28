/**
 * BusyBeds Logo
 * Uses the real brand SVG files from /public/
 *
 * variant="dark"  → logo-dark.svg  ("beds" in navy, for light/white backgrounds)
 * variant="light" → logo-light.svg ("beds" in white, for dark backgrounds)
 */
import Image from 'next/image';

interface Props {
  height?: number;
  className?: string;
  variant?: 'dark' | 'light';
}

export default function Logo({ height = 32, className = '', variant = 'dark' }: Props) {
  // Aspect ratio of the SVG viewBox: 340 × 80 = 4.25:1
  const width = Math.round(height * 4.25);
  const src = variant === 'light' ? '/logo-light.svg' : '/logo-dark.svg';

  return (
    <Image
      src={src}
      alt="BusyBeds"
      width={width}
      height={height}
      className={className}
      priority
    />
  );
}
