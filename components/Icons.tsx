type IconProps = { size?: number; color?: string; strokeWidth?: number };

function Svg({ size = 24, color = "currentColor", strokeWidth = 2, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export function LogoMark({ size = 32 }: { size?: number }) {
  const nodes: [number, number][] = [[5, 10], [17, 4], [28, 11], [25, 26], [9, 28]];
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="#E0A33A" strokeWidth={2} strokeLinejoin="round" aria-hidden="true">
      <path d="M5 10 L17 4 L28 11 L25 26 L9 28 Z" />
      {nodes.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={2.2} fill="#082E23" />
      ))}
    </svg>
  );
}

export const Check = (p: IconProps) => <Svg {...p}><path d="M5 12l5 5L20 7" /></Svg>;
export const Lock = (p: IconProps) => <Svg {...p}><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></Svg>;
export const Pen = (p: IconProps) => <Svg {...p}><path d="M14 4l6 6-8 8H6v-6z" /></Svg>;
export const Chain = (p: IconProps) => <Svg {...p}><rect x="3" y="8" width="7" height="8" rx="1" /><rect x="14" y="8" width="7" height="8" rx="1" /><path d="M10 12h4" /></Svg>;
export const Replay = (p: IconProps) => <Svg {...p}><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></Svg>;
export const Shield = (p: IconProps) => <Svg {...p}><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" /></Svg>;
export const Log = (p: IconProps) => <Svg {...p}><path d="M5 4h14v16H5z" /><path d="M9 9h6M9 13h6M9 17h3" /></Svg>;
