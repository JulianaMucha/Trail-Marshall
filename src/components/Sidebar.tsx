import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TelemetryPoint } from '../types';
import { StatusBadge } from './StatusBadge';

export const Sidebar = ({ points, onSelect }: { points: TelemetryPoint[]; onSelect: (p: TelemetryPoint) => void }) => (
  <section className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5">
    <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
      Road Severity Feed
    </h2>
    <div className="flex-1 overflow-y-auto space-y-2 max-h-[70vh] pr-2 custom-scrollbar">
      <AnimatePresence initial={false}>
        {[...points].reverse().map((p) => (
          <motion.div key={p.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="bg-black/30 p-2 rounded-xl border border-white/5 text-[11px] font-mono cursor-pointer hover:bg-zinc-800"
            onClick={() => onSelect(p)}
          >
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">{new Date(p.timestamp).toLocaleTimeString()}</span>
              <StatusBadge status={p.status} />
            </div>
            <div className="text-zinc-400">VAR: {p.vibration_variance.toFixed(4)}</div>
            <div className="text-zinc-600 truncate">LOC: {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  </section>
);