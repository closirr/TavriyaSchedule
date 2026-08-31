import { useRef, useState, useEffect, useCallback } from 'react';

interface MarqueeProps {
  text: string;
  speed?: number;
}

export default function Marquee({ text, speed = 50 }: MarqueeProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const textSpanRef = useRef<HTMLSpanElement>(null);
  const [textWidth, setTextWidth] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Drag refs (no re-renders)
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const lastTime = useRef(0);
  const velocity = useRef(0);
  const dragOffset = useRef(0);
  const inertiaRef = useRef(0);

  // Single animation state ref — never triggers re-renders
  const offsetRef = useRef(0);
  const animFrameRef = useRef(0);
  const lastTsRef = useRef(0);
  const animRunningRef = useRef(false);

  // Measure actual text width
  useEffect(() => {
    const span = textSpanRef.current;
    if (!span) return;
    const w = span.getBoundingClientRect().width;
    if (w > 0) setTextWidth(w);
  }, [text]);

  // Animation loop — always runs, just checks isPaused
  useEffect(() => {
    lastTsRef.current = performance.now();
    animRunningRef.current = true;

    const tick = (now: number) => {
      const dt = Math.min((now - lastTsRef.current) / 1000, 0.05);
      lastTsRef.current = now;

      if (!isPaused && textWidth > 0) {
        offsetRef.current -= speed * dt;
        // Wrap: when offset goes past -textWidth, reset to 0
        if (offsetRef.current <= -textWidth) {
          offsetRef.current += textWidth;
        }
      }

      if (innerRef.current) {
        innerRef.current.style.transform = `translateX(${offsetRef.current}px)`;
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      animRunningRef.current = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [textWidth, isPaused, speed]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (inertiaRef.current) cancelAnimationFrame(inertiaRef.current);
    inertiaRef.current = 0;
    isDragging.current = true;
    lastX.current = e.clientX;
    lastTime.current = performance.now();
    velocity.current = 0;
    setIsPaused(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const now = performance.now();
    const dx = e.clientX - lastX.current;
    const dt = now - lastTime.current;
    if (dt > 0) velocity.current = dx / (dt / 1000);
    dragOffset.current -= dx;
    lastX.current = e.clientX;
    lastTime.current = now;
    if (innerRef.current) {
      innerRef.current.style.transform = `translateX(${dragOffset.current}px)`;
    }
  }, []);

  const onPointerUp = useCallback(() => {
    isDragging.current = false;
    setIsPaused(false);
    const v = velocity.current;
    if (Math.abs(v) < 5) return;

    let cur = v;
    let lastTs = performance.now();
    const decay = (now: number) => {
      const dt = Math.min((now - lastTs) / 1000, 0.05);
      lastTs = now;
      cur *= Math.pow(0.9, dt * 60);
      if (Math.abs(cur) < 0.5) {
        dragOffset.current = 0;
        if (innerRef.current) innerRef.current.style.transform = '';
        return;
      }
      dragOffset.current -= cur * dt;
      if (innerRef.current) innerRef.current.style.transform = `translateX(${dragOffset.current}px)`;
      inertiaRef.current = requestAnimationFrame(decay);
    };
    inertiaRef.current = requestAnimationFrame(decay);
  }, []);

  if (!text) return null;

  return (
    <div className="w-full overflow-hidden border-b border-amber-200 bg-gradient-to-r from-amber-50/80 to-yellow-50/80">
      <div
        className="overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onMouseEnter={() => { if (!isDragging.current) setIsPaused(true); }}
        onMouseLeave={() => { if (!isDragging.current) setIsPaused(false); }}
        style={{ touchAction: 'pan-y' }}
      >
        <div ref={innerRef} className="flex items-center whitespace-nowrap">
          {/* Single copy — will be duplicated via CSS if needed,
              but we just render it once and measure correctly */}
          <span ref={textSpanRef} className="text-sm font-medium text-amber-900 whitespace-nowrap pr-24">
            {text}
          </span>
          {/* Second copy for seamless loop */}
          <span className="text-sm font-medium text-amber-900 whitespace-nowrap pr-24" aria-hidden="true">
            {text}
          </span>
        </div>
      </div>
    </div>
  );
}
