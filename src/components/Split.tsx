import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Drag-to-resize split layout. Persists size in localStorage (per `id`),
 * double-click the handle to reset to default. Min/max in percent.
 */
interface SplitProps {
  id: string;
  direction: 'horizontal' | 'vertical';
  first: React.ReactNode;
  second: React.ReactNode;
  /** Initial size of the first pane, 0..1 */
  defaultRatio?: number;
  minRatio?: number;
  maxRatio?: number;
  className?: string;
}

export function Split({
  id,
  direction,
  first,
  second,
  defaultRatio = 0.5,
  minRatio = 0.18,
  maxRatio = 0.82,
  className = '',
}: SplitProps) {
  const storageKey = `lld-arena:split:${id}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState<number>(() => {
    if (typeof window === 'undefined') return defaultRatio;
    const raw = localStorage.getItem(storageKey);
    const v = raw ? Number(raw) : NaN;
    return Number.isFinite(v) ? Math.min(maxRatio, Math.max(minRatio, v)) : defaultRatio;
  });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, String(ratio));
    } catch {
      /* ignore */
    }
  }, [ratio, storageKey]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDragging(true);
    },
    [],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const next =
        direction === 'horizontal'
          ? (e.clientX - rect.left) / rect.width
          : (e.clientY - rect.top) / rect.height;
      setRatio(Math.max(minRatio, Math.min(maxRatio, next)));
    },
    [dragging, direction, minRatio, maxRatio],
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    setDragging(false);
  }, []);

  const onDoubleClick = useCallback(() => setRatio(defaultRatio), [defaultRatio]);

  // disable selection while dragging
  useEffect(() => {
    if (!dragging) return;
    const prev = document.body.style.userSelect;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
    return () => {
      document.body.style.userSelect = prev;
      document.body.style.cursor = '';
    };
  }, [dragging, direction]);

  const firstStyle =
    direction === 'horizontal'
      ? { width: `${ratio * 100}%` }
      : { height: `${ratio * 100}%` };
  const secondStyle =
    direction === 'horizontal'
      ? { width: `${(1 - ratio) * 100}%` }
      : { height: `${(1 - ratio) * 100}%` };

  return (
    <div
      ref={containerRef}
      className={`flex min-h-0 min-w-0 ${
        direction === 'horizontal' ? 'flex-row' : 'flex-col'
      } ${className}`}
    >
      <div
        className="min-h-0 min-w-0 overflow-hidden"
        style={firstStyle}
      >
        {first}
      </div>
      <SplitHandle
        direction={direction}
        active={dragging}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onDoubleClick={onDoubleClick}
      />
      <div
        className="min-h-0 min-w-0 overflow-hidden"
        style={secondStyle}
      >
        {second}
      </div>
    </div>
  );
}

function SplitHandle({
  direction,
  active,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onDoubleClick,
}: {
  direction: 'horizontal' | 'vertical';
  active: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onDoubleClick: () => void;
}) {
  const baseLine =
    direction === 'horizontal'
      ? 'w-1.5 cursor-col-resize hover:w-1.5'
      : 'h-1.5 cursor-row-resize';
  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={onDoubleClick}
      role="separator"
      aria-orientation={direction === 'horizontal' ? 'vertical' : 'horizontal'}
      title="Drag to resize · double-click to reset"
      className={[
        'group relative shrink-0 transition-colors',
        baseLine,
        active ? 'bg-accent/70' : 'bg-bg-border hover:bg-accent/40',
      ].join(' ')}
    >
      {/* grip dots */}
      <div
        className={[
          'absolute inset-0 grid place-items-center pointer-events-none',
          direction === 'horizontal' ? 'flex-col' : 'flex-row',
        ].join(' ')}
      >
        <div
          className={[
            'flex gap-0.5 transition-opacity',
            direction === 'horizontal' ? 'flex-col' : 'flex-row',
            active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          ].join(' ')}
        >
          <span className="w-0.5 h-0.5 rounded-full bg-white" />
          <span className="w-0.5 h-0.5 rounded-full bg-white" />
          <span className="w-0.5 h-0.5 rounded-full bg-white" />
          <span className="w-0.5 h-0.5 rounded-full bg-white" />
        </div>
      </div>
    </div>
  );
}
