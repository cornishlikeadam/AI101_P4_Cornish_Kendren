import type { RepoSnapshot } from '../types';
import raw from './repo-snapshot.json';

/** The repository as read by scripts/ingest.mjs at dev or build time. */
export const snapshot = raw as unknown as RepoSnapshot;

export const docByPath = (p: string) => snapshot.docs?.find((d) => d.path === p) ?? null;
export const repoAsset = (id: string) => snapshot.assets?.find((a) => a.id === id) ?? null;
export const evidenceByPath = (p: string) => snapshot.evidence?.find((e) => e.path === p) ?? null;
export const evidenceUrl = (url: string) => (import.meta.env.BASE_URL || './') + url;
