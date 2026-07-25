import { getColor } from '@/data/colors';

/** 低饱和色块「照片」：像一本平装的色彩小书 */
export default function PhotoArt({
  colorId,
  seed,
  className = '',
}: {
  colorId: string;
  seed: number;
  className?: string;
}) {
  const c = getColor(colorId);
  const a = 165 + ((seed * 13) % 30);
  return (
    <div
      className={`overflow-hidden ${className.includes('absolute') ? '' : 'relative'} ${className}`}
      style={{
        background: `linear-gradient(${a}deg, ${c.hex} 0%, ${c.soft} 85%)`,
      }}
    >
      {/* 书脊 */}
      <div className="absolute inset-y-0 left-0 w-[6%] bg-black/[0.045]" />
      {/* 细腻噪点 */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.05] mix-blend-multiply">
        <filter id={`n${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#n${seed})`} />
      </svg>
      {/* 柔光 */}
      <div
        className="absolute rounded-full opacity-40 blur-2xl"
        style={{
          width: '70%',
          height: '50%',
          right: '-15%',
          top: '-10%',
          background: 'radial-gradient(circle, #ffffff, transparent 70%)',
        }}
      />
    </div>
  );
}
