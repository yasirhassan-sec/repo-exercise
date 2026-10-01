type IconProps = { size?: number; color?: string; strokeWidth?: number };

function Svg({ size = 24, color = "currentColor", strokeWidth = 2, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

export function LogoMark({ size = 32 }: { size?: number }) {
  const nodes: [number, number][] = [[5, 10], [17, 4], [28, 11], [25, 26], [9, 28]];
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="#E0A33A" strokeWidth={2} strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M5 10 L17 4 L28 11 L25 26 L9 28 Z" />
      {nodes.map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={2.2} fill="#082E23" />)}
    </svg>
  );
}

export const Check = (p: IconProps) => <Svg {...p}><path d="M5 12l5 5L20 7" /></Svg>;
export const Lock = (p: IconProps) => <Svg {...p}><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></Svg>;
export const Pen = (p: IconProps) => <Svg {...p}><path d="M14 4l6 6-8 8H6v-6z" /></Svg>;
export const Chain = (p: IconProps) => <Svg {...p}><rect x="3" y="8" width="7" height="8" rx="1" /><rect x="14" y="8" width="7" height="8" rx="1" /><path d="M10 12h4" /></Svg>;
export const Shield = (p: IconProps) => <Svg {...p}><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" /></Svg>;
export const Users = (p: IconProps) => <Svg {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.5 3.3-5.5 6.5-5.5s5.7 2 6.5 5.5" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18.5 14.8c1.7.8 2.7 2.6 3 5.2" /></Svg>;
export const Phone = (p: IconProps) => <Svg {...p}><rect x="7" y="2.5" width="10" height="19" rx="2" /><path d="M11 18h2" /></Svg>;
export const Log = (p: IconProps) => <Svg {...p}><path d="M5 4h14v16H5z" /><path d="M9 9h6M9 13h6M9 17h3" /></Svg>;
export const Arrow = (p: IconProps) => <Svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>;
export const Doc = (p: IconProps) => <Svg {...p}><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4M9 12h6M9 16h6" /></Svg>;
export const Search = (p: IconProps) => <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></Svg>;
export const Route = (p: IconProps) => <Svg {...p}><circle cx="6" cy="18" r="2" /><circle cx="18" cy="6" r="2" /><path d="M8 18h6a4 4 0 0 0 0-8h-4a4 4 0 0 1 0-8h6" /></Svg>;
export const Transfer = (p: IconProps) => <Svg {...p}><path d="M4 8h14l-4-4M20 16H6l4 4" /></Svg>;
