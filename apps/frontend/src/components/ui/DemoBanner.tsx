import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Demo Banner Component
 *
 * Displays a persistent, non-dismissible banner when demo mode is active.
 * Ensures demo data is unmistakable from real data.
 */
export default function DemoBanner() {
  return (
    <div className="fixed top-0 left-0 right-0 bg-amber-500 border-b-4 border-amber-600 z-50">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-900" />
        <span className="font-bold text-amber-900 text-sm uppercase tracking-wider">
          DEMO DATA — NOT REAL
        </span>
        <span className="text-amber-800 text-xs">
          (This is demonstration data only - not from production systems)
        </span>
      </div>
    </div>
  );
}
