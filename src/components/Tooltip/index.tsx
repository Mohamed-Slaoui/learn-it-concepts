import { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  color?: string;
}

/** Lightweight inline tooltip — hover to show, mouse-leave to dismiss. */
export function Tooltip({ content, children, color = '#2563eb' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(true);
  };

  const hide = () => {
    timerRef.current = setTimeout(() => setVisible(false), 80);
  };

  return (
    <span className="relative inline-block">
      <span
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="cursor-help underline decoration-dashed underline-offset-2"
        style={{ textDecorationColor: color, color }}
      >
        {children}
      </span>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.14 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none"
            style={{ minWidth: 160, maxWidth: 220 }}
          >
            <div
              className="text-white text-[11px] leading-[1.45] rounded-lg px-2.5 py-2 shadow-lg"
              style={{ background: '#1e293b' }}
            >
              {content}
              {/* caret */}
              <div
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-1.5 overflow-hidden"
              >
                <div className="w-2 h-2 bg-slate-800 rotate-45 translate-y-[-50%] mx-auto" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
