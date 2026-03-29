interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  sub?: string;
  accent?: boolean;
}

export function StatCard({ label, value, icon, sub, accent }: StatCardProps) {
  return (
    <div className={`rounded-xl p-4 border ${accent ? 'border-red-800 bg-red-950/20' : 'border-[#2a1a2a] bg-[#1a1a24]'}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className="text-lg">{icon}</span>}
        <span className="text-xs text-[#a89ab0] uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${accent ? 'text-red-400' : 'text-[#e8d5e8]'}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-[#6b5b6b] mt-1">{sub}</div>}
    </div>
  );
}
