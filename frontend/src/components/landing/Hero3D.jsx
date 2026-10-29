import { lazy, Suspense, useEffect, useRef, useState } from 'react';

// The three.js chunk (~250 KB gzipped) is downloaded only here, and only after the page has painted.
const FarmScene = lazy(() => import('./FarmScene'));

const canUseWebGL = () => {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
};

/**
 * Hero visual: a static poster first (instant, no layout shift), then the live 3D farm fades in.
 * Stays on the poster for reduced-motion users, data-saver mode, very low-end devices and no WebGL.
 * Phones get a lighter scene (no shadows, fewer props, lower pixel ratio).
 */
export default function Hero3D() {
  const box = useRef(null);
  const scrollRef = useRef(0);
  const [mode, setMode] = useState(null); // null = poster only, 'lite' | 'full'
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = navigator.connection?.saveData;
    const lowEnd = (navigator.hardwareConcurrency || 8) <= 2 || (navigator.deviceMemory && navigator.deviceMemory <= 2);
    if (reduce || saveData || lowEnd || !canUseWebGL()) return undefined;
    const small = window.matchMedia('(max-width: 767px), (pointer: coarse)').matches;
    const start = () => setMode(small ? 'lite' : 'full');
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(start, { timeout: 1200 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(start, 400);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const onScroll = () => { scrollRef.current = Math.min(1.5, window.scrollY / Math.max(1, window.innerHeight)); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!box.current || !('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '80px' });
    io.observe(box.current);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={box} className="relative w-full h-full" data-hero-3d={mode || 'poster'} data-ready={ready ? 'true' : 'false'}>
      <img
        src="/landing/hero-poster.webp"
        alt=""
        width="900"
        height="880"
        fetchPriority="high"
        decoding="async"
        className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-700 ${ready ? 'opacity-0' : 'opacity-100'}`}
      />
      {mode && (
        <div className={`absolute inset-0 transition-opacity duration-700 ${ready ? 'opacity-100' : 'opacity-0'}`}>
          <Suspense fallback={null}>
            <FarmScene lite={mode === 'lite'} paused={!visible} scrollRef={scrollRef} onReady={() => setReady(true)} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
