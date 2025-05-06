'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

interface CountCardProps {
  label: string;
  value: number;
  suffix?: string;
}

export function CountCard({ label, value, suffix = '' }: CountCardProps) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      const duration = 2000; // 2 seconds
      const steps = 60;
      const increment = value / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <div ref={ref} className="p-6 bg-black/50 backdrop-blur-sm rounded-xl border-2 border-white/20">
      <div className="text-4xl font-bold text-white mb-2">
        {count}{suffix}
      </div>
      <div className="text-gray-300">{label}</div>
    </div>
  );
} 