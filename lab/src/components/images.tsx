import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { ImageRef } from '../types';
import { getBlob, putBlob } from '../lib/db';
import { uid, now } from '../lib/util';
import { snapshot, evidenceUrl } from '../seed/snapshot';
import { Button, Modal, toast } from './ui';

// Object URLs for stored blobs, created once per id.
const urlCache = new Map<string, Promise<string | null>>();
export function blobUrl(id: string): Promise<string | null> {
  let p = urlCache.get(id);
  if (!p) { p = getBlob(id).then((b) => (b ? URL.createObjectURL(b.blob) : null)).catch(() => null); urlCache.set(id, p); }
  return p;
}
export async function refUrl(ref: ImageRef | null | undefined): Promise<string | null> {
  if (!ref) return null;
  return ref.kind === 'evidence' ? evidenceUrl(ref.url) : blobUrl(ref.id);
}
export function useImageUrl(ref: ImageRef | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  const key = ref ? (ref.kind === 'blob' ? ref.id : ref.path) : '';
  useEffect(() => { let live = true; refUrl(ref).then((u) => live && setUrl(u)); return () => { live = false; }; }, [key]); // eslint-disable-line
  return url;
}
export function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = url; });
}

export function refLabel(ref: ImageRef | null | undefined) {
  if (!ref) return 'none';
  return ref.kind === 'evidence' ? ref.path.replace(/^vibe-coding\//, '') : ref.name ?? 'uploaded file';
}

export function Img({ refx, alt, className = '', fit = 'contain' }: { refx: ImageRef | null | undefined; alt: string; className?: string; fit?: 'contain' | 'cover' }) {
  const url = useImageUrl(refx);
  if (!refx) return <div className={`flex items-center justify-center bg-sand text-[12px] text-muted ${className}`}>No image</div>;
  if (!url) return <div className={`animate-pulse bg-sand ${className}`} />;
  return <img src={url} alt={alt} className={`${fit === 'cover' ? 'object-cover' : 'object-contain'} ${className}`} />;
}

/** Store a File in IndexedDB and return a reference to it. */
export async function storeFile(f: File | Blob, name?: string): Promise<ImageRef> {
  const id = uid('blob');
  const n = name ?? (f as File).name ?? 'pasted image';
  await putBlob({ id, name: n, type: f.type, size: f.size, at: now(), blob: f });
  return { kind: 'blob', id, name: n };
}

const IMAGE_TYPES = /^image\/(png|jpe?g|webp|gif|svg\+xml|avif)$/;

/** Drag-and-drop, paste or browse. Accepts images; other file types are refused with a message. */
export function ImageDrop({ onAdd, label = 'Drop an image, paste, or browse', multiple, compact, accept = 'image/*' }: { onAdd(refs: ImageRef[], files: File[]): void; label?: string; multiple?: boolean; compact?: boolean; accept?: string }) {
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  async function take(files: File[]) {
    const ok = files.filter((f) => accept === 'image/*' ? IMAGE_TYPES.test(f.type) : true);
    if (ok.length < files.length) toast(`${files.length - ok.length} file(s) skipped: not an image`);
    if (!ok.length) return;
    const refs = await Promise.all((multiple ? ok : ok.slice(0, 1)).map((f) => storeFile(f)));
    onAdd(refs, ok);
  }
  return (
    <div
      tabIndex={0}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); take([...e.dataTransfer.files]); }}
      onPaste={(e) => { const f = [...e.clipboardData.files]; if (f.length) { e.preventDefault(); take(f); } }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.current?.click(); } }}
      onClick={() => input.current?.click()}
      role="button"
      aria-label={label}
      className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-center transition ${compact ? 'px-3 py-3' : 'px-4 py-6'} ${over ? 'border-terracotta bg-terracotta/5' : 'border-line hover:border-cocoa/40'}`}>
      <span className="text-[13px] font-medium">{label}</span>
      <span className="text-[11.5px] text-muted">Stored in this browser only (IndexedDB). Record the source and rights for anything you did not make.</span>
      <input ref={input} type="file" hidden accept={accept} multiple={multiple} onChange={(e) => { take([...(e.target.files ?? [])]); e.target.value = ''; }} />
    </div>
  );
}

/** Pick one of the real screenshots in vibe-coding/build-record/. */
export function EvidencePicker({ open, onClose, onPick, title = 'Repository screenshots' }: { open: boolean; onClose(): void; onPick(ref: ImageRef): void; title?: string }) {
  const groups = new Map<string, NonNullable<typeof snapshot.evidence>>();
  for (const e of snapshot.evidence ?? []) (groups.get(e.folder) || groups.set(e.folder, []).get(e.folder)!).push(e);
  return (
    <Modal open={open} onClose={onClose} title={title} wide>
      {!snapshot.evidence?.length && <p className="text-[13px] text-muted">No screenshots were found in the repository snapshot.</p>}
      {[...groups].map(([folder, list]) => (
        <div key={folder} className="mb-4">
          <h3 className="mb-2 font-mono text-[12px] text-muted">build-record/…/{folder}/</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {list.map((e) => (
              <button key={e.path} className="group overflow-hidden rounded border border-line text-left hover:border-cocoa" onClick={() => { onPick({ kind: 'evidence', path: e.path, url: e.url, name: e.name }); onClose(); }}>
                <img src={evidenceUrl(e.url)} alt={e.name} loading="lazy" className="aspect-video w-full bg-sand object-cover" />
                <span className="block truncate px-1.5 py-1 text-[11px]">{e.name} <span className="text-muted">{e.width}×{e.height}</span></span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </Modal>
  );
}

/** Image slot with upload, repo-evidence pick and clear. */
export function ImageSlot({ value, onChange, label, height = 'h-40', children }: { value: ImageRef | null; onChange(r: ImageRef | null): void; label: string; height?: string; children?: ReactNode }) {
  const [pick, setPick] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted">{label}</span>
      {value ? (
        <div className="relative overflow-hidden rounded-lg border border-line bg-sand">
          <Img refx={value} alt={label} className={`w-full ${height}`} />
          <p className="truncate border-t border-line bg-cream px-2 py-1 font-mono text-[11px] text-muted" title={refLabel(value)}>{refLabel(value)}</p>
        </div>
      ) : (
        <ImageDrop compact onAdd={(r) => onChange(r[0])} label={`Add ${label.toLowerCase()}`} />
      )}
      <div className="flex flex-wrap gap-1.5">
        <Button small onClick={() => setPick(true)}>From repo evidence</Button>
        {value && <Button small kind="ghost" onClick={() => onChange(null)}>Clear</Button>}
        {children}
      </div>
      <EvidencePicker open={pick} onClose={() => setPick(false)} onPick={onChange} />
    </div>
  );
}
