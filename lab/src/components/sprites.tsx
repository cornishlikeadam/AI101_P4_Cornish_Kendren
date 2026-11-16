import { useEffect, useRef, useState } from 'react';
import { filterCanvas, loadRuntime, svgToImage, type Runtime } from '../lib/runtime';

export function useRuntime() {
  const [rt, setRt] = useState<Runtime | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { loadRuntime().then(setRt, (e) => setErr(String(e.message ?? e))); }, []);
  return { rt, err };
}

export function RuntimeError({ err }: { err: string }) {
  return <div role="alert" className="rounded-lg border border-coral/50 bg-coral/10 p-3 text-[13px]">The game runtime could not be loaded, so previews are unavailable. {err}</div>;
}

export type PreviewMode = 'normal' | 'outline' | 'silhouette';

/** Draw an SVG (or a raster URL) into a canvas at a given CSS height, optionally filtered. */
export function Sprite({ svg, url, height, mode = 'normal', flip, title, className = '', pixelated }: { svg?: string | null; url?: string | null; height: number; mode?: PreviewMode; flip?: boolean; title?: string; className?: string; pixelated?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState<[number, number]>([1, 1]);
  useEffect(() => {
    let live = true;
    const p = svg ? svgToImage(svg) : url ? new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; }) : null;
    p?.then((img) => {
      if (!live || !ref.current) return;
      const dpr = window.devicePixelRatio || 1;
      const ar = (img.naturalWidth || img.width) / (img.naturalHeight || img.height || 1);
      const w = Math.max(1, Math.round(height * ar)), h = Math.max(1, Math.round(height));
      const c = ref.current;
      c.width = Math.max(1, Math.round(w * dpr)); c.height = Math.max(1, Math.round(h * dpr));
      setSize([w, h]);
      const ctx = c.getContext('2d', { willReadFrequently: mode !== 'normal' })!;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.imageSmoothingEnabled = !pixelated;
      if (flip) { ctx.translate(c.width, 0); ctx.scale(-1, 1); }
      ctx.drawImage(img, 0, 0, c.width, c.height);
      filterCanvas(c, mode);
    }).catch(() => {});
    return () => { live = false; };
  }, [svg, url, height, mode, flip, pixelated]);
  return <canvas ref={ref} role="img" aria-label={title ?? 'sprite preview'} title={title} style={{ width: size[0], height: size[1] }} className={`${pixelated ? 'pixelated' : ''} ${className}`} />;
}

export const BACKGROUNDS: Record<string, { label: string; cls: string; color: string | null }> = {
  white: { label: 'White', cls: 'bg-white', color: '#FFFFFF' },
  checker: { label: 'Transparent', cls: 'checker', color: null },
  lawn: { label: 'Lawn', cls: '', color: '#8DBA5A' },
  paving: { label: 'Shell paving', cls: '', color: '#E8D6B0' },
  brick: { label: 'Plaza brick', cls: '', color: '#C9805E' },
  dark: { label: 'Ink', cls: '', color: '#2B1D16' },
};

export function Backdrop({ bg, children, className = '' }: { bg: string; children: React.ReactNode; className?: string }) {
  const b = BACKGROUNDS[bg] ?? BACKGROUNDS.white;
  return <div className={`${b.cls} ${className}`} style={b.color && !b.cls ? { background: b.color } : undefined}>{children}</div>;
}

/** Game constants (HANDOFF.md): zoom 1.0 = 0.4 CSS px per world unit; people are drawn at 0.8 world units per SVG unit. */
export const PX_PER_WORLD = 0.4;
export const PERSON_K = 0.8;
export const gameplayHeight = (svgHeight: number, zoom: number, k = PERSON_K) => svgHeight * k * PX_PER_WORLD * zoom;

/** Render a canvas to a PNG blob. */
export function canvasBlob(c: HTMLCanvasElement) { return new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('toBlob failed'))), 'image/png')); }
