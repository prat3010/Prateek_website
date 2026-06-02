import React from 'react';

interface SectionSkeletonProps {
  height?: string;
}

export default function SectionSkeleton({ height = '400px' }: SectionSkeletonProps) {
  return (
    <div className="section-skeleton" style={{ height }}>
      <div 
        className="font-headline text-stroke" 
        style={{ 
          fontSize: '1.8rem', 
          color: 'var(--pop-yellow)', 
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}
      >
        LOADING DATA CORE...
      </div>
    </div>
  );
}
