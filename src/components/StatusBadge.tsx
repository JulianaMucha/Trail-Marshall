import { ShieldCheck, ShieldAlert } from 'lucide-react';

export const StatusBadge = ({ status }: { status: 'Good' | 'Bad' }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
    status === 'Good' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
  }`}>
    {status === 'Good' ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
    {status}
  </span>
);