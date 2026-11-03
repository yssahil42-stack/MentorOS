import React, { useState } from 'react';
import { cn } from '../../utils/cn';

export type CameraPreset = 'standard' | 'floating' | 'isometric' | 'cinematic';

interface Spatial3DCanvasProps {
  children: React.ReactNode;
  title?: string;
  defaultMode?: '2d' | '3d';
  defaultPreset?: CameraPreset;
  className?: string;
}

export function Spatial3DCanvas({
  children,
  defaultMode = '2d',
  className,
}: Spatial3DCanvasProps) {
  const [mode] = useState<'2d' | '3d'>(defaultMode);

  return (
    <div className={cn('relative w-full', className)}>
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}
