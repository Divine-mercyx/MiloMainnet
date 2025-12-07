import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top', className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const updatePosition = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const gap = 8; // Gap between trigger and tooltip

        let top = 0;
        let left = 0;

        switch (position) {
            case 'top':
                top = rect.top - gap;
                left = rect.left + (rect.width / 2);
                break;
            case 'bottom':
                top = rect.bottom + gap;
                left = rect.left + (rect.width / 2);
                break;
            case 'left':
                top = rect.top + (rect.height / 2);
                left = rect.left - gap;
                break;
            case 'right':
                top = rect.top + (rect.height / 2);
                left = rect.right + gap;
                break;
        }
        setCoords({ top, left });
      };

      updatePosition();
      // Update on scroll or resize to keep attached
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);

      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isVisible, position]);

  const transformClass = {
      top: '-translate-x-1/2 -translate-y-full',
      bottom: '-translate-x-1/2',
      left: '-translate-x-full -translate-y-1/2',
      right: '-translate-y-1/2'
  };

  return (
    <>
      <div 
        ref={triggerRef}
        className={`inline-flex ${className}`}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && createPortal(
        <div 
            className={`fixed z-[9999] px-3 py-1.5 text-xs font-medium text-white bg-slate-800 rounded-lg shadow-xl pointer-events-none transition-opacity duration-200 whitespace-nowrap transform ${transformClass[position]}`}
            style={{ 
                top: coords.top, 
                left: coords.left,
            }}
        >
          {content}
        </div>,
        document.body
      )}
    </>
  );
};
