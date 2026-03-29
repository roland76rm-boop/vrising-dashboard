interface ProgressBarProps {
  value: number;   // 0–100
  label?: string;
  color?: string;
  showPercent?: boolean;
  height?: string;
}

export function ProgressBar({ value, label, color = '#DC143C', showPercent = true, height = 'h-2' }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between mb-1">
          {label && <span className="text-xs text-[#a89ab0]">{label}</span>}
          {showPercent && <span className="text-xs text-[#6b5b6b]">{pct.toFixed(0)}%</span>}
        </div>
      )}
      <div className={`w-full ${height} bg-[#1a1a24] rounded-full overflow-hidden`}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
