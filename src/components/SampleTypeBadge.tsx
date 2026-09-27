import React from 'react';
import { getSampleTypeTone } from '../types/sample';

interface SampleTypeBadgeProps {
  sampleType?: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const SampleTypeBadge: React.FC<SampleTypeBadgeProps> = ({
  sampleType,
  size = 'sm',
  className = '',
}) => {
  if (!sampleType || !sampleType.trim()) return null;

  const tone = getSampleTypeTone(sampleType);

  const sizeClasses =
    size === 'xs'
      ? 'text-[9px] px-1.5 py-0.2 gap-1'
      : size === 'md'
      ? 'text-xs px-2.5 py-0.5 gap-1.5'
      : 'text-[10px] px-2 py-0.5 gap-1';

  const dotSizeClasses =
    size === 'xs' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : 'w-1.5 h-1.5';

  return (
    <span
      className={`inline-flex items-center font-bold rounded-md border transition-all ${sizeClasses} ${tone.badgeClass} ${className}`}
    >
      <span className={`rounded-full shrink-0 ${dotSizeClasses} ${tone.dotClass}`}></span>
      <span>{sampleType}</span>
    </span>
  );
};
