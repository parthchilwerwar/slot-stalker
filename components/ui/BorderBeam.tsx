'use client';

import { cn } from '@/lib/utils';

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  colorFrom?: string;
  colorTo?: string;
  borderWidth?: number;
  children: React.ReactNode;
}

export function BorderBeam({
  className,
  size = 100,
  duration = 8,
  colorFrom = '#FC5019',
  colorTo = '#FF8A52',
  borderWidth = 1.5,
  children,
}: BorderBeamProps) {
  return (
    <div className={cn('relative', className)}>
      {children}
      {/* Animated beam */}
      <div className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden">
        <div
          className="absolute w-full h-full rounded-xl"
          style={{
            background: `conic-gradient(from calc(var(--beam-angle, 0) * 1deg), transparent 0%, ${colorFrom} 5%, ${colorTo} 10%, transparent 15%)`,
            inset: `-${borderWidth}px`,
            mask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
            maskComposite: 'exclude',
            WebkitMaskComposite: 'xor',
            padding: `${borderWidth}px`,
            animation: `spin ${duration}s linear infinite`,
          }}
        />
      </div>
      <style jsx>{`
        @keyframes spin {
          from { --beam-angle: 0; }
          to { --beam-angle: 360; }
        }
        @property --beam-angle {
          syntax: '<number>';
          inherits: false;
          initial-value: 0;
        }
      `}</style>
    </div>
  );
}
