/* The lab's data model. Every view reads and writes these records; nothing is view-local.
   Unknown values stay null. Dates are ISO strings written when something actually happened. */

export const STATUSES = ['Verified', 'Tentative', 'Needs research', 'In progress', 'Completed'] as const;
export type Status = (typeof STATUSES)[number];

export const STAGES = ['Backlog', 'Selected', 'In progress', 'Review', 'Completed'] as const;
export type Stage = (typeof STAGES)[number];

export type Kind =
  | 'source' | 'reference' | 'decision' | 'character' | 'asset' | 'landmark' | 'zone' | 'story'
  | 'scene' | 'iteration' | 'clue' | 'review' | 'issue' | 'sprint' | 'comparison' | 'brief' | 'measurement';

/** An image is either a file the user added (kept in IndexedDB) or a screenshot from the repository. */
export type ImageRef = { kind: 'blob'; id: string; name?: string } | { kind: 'evidence'; path: string; url: string; name?: string };

export interface Base {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: Status;
  source: string | null;     // file path, URL or "Owner report"
  rationale: string | null;
  tags: string[];
}

export interface Project {
  title: string;
  artDirection: string;
  proposedDirection: string;
  currentChallenge: { kind: 'issue' | 'sprint'; id: string } | null;
  baselineImage: ImageRef | null;
  latestApprovedImage: ImageRef | null;
  owner: string;
  restrictions: string;   // academic submission restrictions still under review
}

export interface Source extends Base {
  title: string;
  kind: 'repo-doc' | 'url' | 'upload' | 'note';
  path: string | null;
  url: string | null;
  sha: string | null;
  note: string;
  text: string | null;      // imported text content (uploads only; repo docs come from the snapshot)
  blob: ImageRef | null;
}

export const COLLECTIONS = {
  A: 'Classic illustrated search-and-find',
  B: 'Savannah visual identity',
  C: 'Character illustration',
  D: 'Environmental illustration',
  E: 'Interface inspiration',
  F: 'Rejected visual examples',
} as const;
export type CollectionKey = keyof typeof COLLECTIONS;

export interface Pin { id: string; x: number; y: number; text: string; severity?: Severity; issueId?: string | null }

export interface Reference extends Base {
  title: string;
  collection: CollectionKey;
  image: ImageRef | null;
  url: string | null;
  creator: string | null;
  license: string | null;      // copyright / usage rights as stated by the person who added it
  intendedUse: string;
  works: string;
  avoid: string;
  colorNotes: string;
  lineNotes: string;
  relevance: number | null;    // 0..5
  pinned: boolean;
  decisionIds: string[];
  characterIds: string[];
  sceneIds: string[];
  pins: Pin[];
  crop: { x: number; y: number; w: number; h: number } | null;  // fractions of the image
}

export type DecisionWorkflow = 'Proposed' | 'Approved' | 'Rejected' | 'Superseded' | 'Experiment';
export type Lineage = 'inherited' | 'superseded' | 'experimental';

export interface DecisionFields {
  title: string;
  category: string;
  originalRule: string;
  proposedReplacement: string;
  rationale: string;
  evidence: string;
  evidenceType: 'Repository document' | 'Visual evidence' | 'Measurement' | 'Owner judgement' | 'None yet';
  expectedVisual: string;
  expectedCost: string;
  compatibility: string;
  sourceRef: string;
}

export interface DecisionVersion { at: string; note: string; fields: DecisionFields }
export interface DecisionEvent { at: string; action: string; by: string; note: string }

export interface DesignDecision extends Omit<Base, 'rationale'>, DecisionFields {
  code: string;
  owner: string;
  priority: number;            // lower = more important
  workflow: DecisionWorkflow;
  lineage: Lineage;
  currentApproved: string | null;
  supersedes: string | null;   // decision id or external ADR name
  experimentOf: string | null;
  history: DecisionEvent[];
  versions: DecisionVersion[];
  relatedFiles: string[];
  referenceIds: string[];
  assetIds: string[];
  issueIds: string[];
  sprintIds: string[];
  tests: string[];
}

export interface CharacterParams {
  silhouette: string;
  proportions: string;
  headScale: number;           // multiplies the head socket scale in the live preview
  pose: string;
  expression: string;          // face part id
  hair: string;
  headwear: string;
  glasses: string;
  beard: string;
  clothing: string;
  colours: Record<string, string>;
  accessories: string;
  scale: number;               // world scale the game uses (0.8 for people)
  outline: string;             // spec only; authored SVG strokes are not rewritten by the preview
  animation: string;
  readability: string;
}

export interface Candidate {
  id: string;
  name: string;
  image: ImageRef;
  uploadedAt: string;
  approval: 'Candidate' | 'Approved' | 'Rejected';
  note: string;
  captures: ImageRef[];        // PNG previews the lab rendered at gameplay scale
  units: number;               // drawing height in game SVG units (an adult in the repo is about 92-108)
  svgText: string | null;      // for SVG uploads, kept so the preview can rasterize it crisply at any size
  approvedAt: string | null;
  approvedBy: string | null;
}

export interface Character extends Base {
  name: string;
  family: string;
  assetIds: string[];           // repo asset ids (e.g. characters/archetypes/painter)
  primaryAsset: string | null;
  params: CharacterParams;
  candidates: Candidate[];
  decisionIds: string[];
  notes: string;
  isTarget: boolean;
}

export const ASSET_STAGES = ['Repo current', 'Placeholder', 'Candidate', 'Approved production', 'Redesign', 'Discard'] as const;
export type AssetStage = (typeof ASSET_STAGES)[number];

export interface Asset extends Base {
  title: string;
  category: string;
  origin: 'repo' | 'upload';
  repoId: string | null;
  image: ImageRef | null;      // uploads
  file: string | null;
  creator: string | null;
  license: string | null;
  version: number;
  description: string;
  stage: AssetStage;
  dims: string | null;
  renderScale: string | null;
  landmarkIds: string[];
  characterIds: string[];
  palette: string[];
  animation: string;
  implNotes: string;
  knownIssues: string;
  replaces: string | null;
}

export interface Landmark extends Base {
  name: string;
  district: string;
  x: number; y: number; w: number; h: number;   // world units in the game's 3200 × 6700 map
  scale: number;
  depthLayer: number;
  assetId: string | null;
  inBuild: boolean;
  composite: boolean;          // invented or combined, not a single verified real place
  history: string;
  composition: string;
  referenceIds: string[];
}

export type ZoneKind = 'boundary' | 'entrance' | 'path' | 'crowd' | 'prop-restriction' | 'hiding' | 'occlusion-review';
export interface Zone extends Base {
  name: string;
  kind: ZoneKind;
  district: string;
  x: number; y: number; w: number; h: number;
  note: string;
}

export interface StoryMoment extends Base {
  title: string;
  district: string;
  description: string;
  characterIds: string[];
  inBuild: boolean;            // only true when the story id exists in the repo scenes
}

export interface SceneParams {
  seed: string;
  district: string;             // riverfront | market | squares | forsyth | all
  difficulty: 'easy' | 'normal' | 'hard';
  density: 'low' | 'standard' | 'dense';
  crowd: number | null;
  // Lab adjustments applied on top of the game's layout. Clearly simulated, never fed back into the game.
  crowdScale: number;           // 0.25 .. 2  multiplies filler people (thinning or duplicating real entities)
  propScale: number;            // 0 .. 2
  varietyBias: number;          // 0 .. 1  share of filler people swapped for story archetypes
  overlap: number;              // 0 .. 1  pulls filler people toward clusters
  foregroundEmphasis: number;   // 0 .. 1  scales up the lowest third
  decoyBoost: number;           // 0 .. 1  extra decoy traits (still capped at two)
  landmarkProminence: number;   // 0.6 .. 1.6
}

export interface LayerState { visible: boolean; opacity: number; locked: boolean; order: number }

export interface Placement { id: string; assetId: string; x: number; y: number; k: number; flip: 0 | 1; layer: string }

export interface Scene extends Base {
  name: string;
  preset: string;
  params: SceneParams;
  layers: Record<string, LayerState>;
  moved: Record<string, { dx: number; dy: number }>;   // entity id -> offset (drag edits)
  added: Placement[];
  removed: string[];
  baselineIterationId: string | null;
  preferredIterationId: string | null;
  decisionIds: string[];
}

export interface SceneMetrics {
  people: number; props: number; stories: number; emptyShare: number; colourCount: number; decoys: number;
  targetOcclusion: number | null; difficultyScore: number; nearby?: number; nearDecoys?: number;
}

export interface SceneIteration extends Base {
  sceneId: string;
  name: string;
  params: SceneParams;
  layers: Record<string, LayerState>;
  moved: Scene['moved'];
  added: Placement[];
  removed: string[];
  thumbnail: string | null;    // small PNG data URL rendered by the lab
  metrics: SceneMetrics | null;
  note: string;
}

export interface Playtest {
  id: string; at: string; seed: string; difficulty: string; timeMs: number | null; wrong: number | null; hints: number | null;
  feedback: string; failures: string; accessibility: string; from: 'manual' | 'game leaderboard';
  player: string | null;
}

export interface ClueConfiguration extends Base {
  name: string;
  district: string;
  region: { x: number; y: number; w: number; h: number } | null;
  maxSharedTraits: number;      // 0..2 by default; 3 or 4 only with explicit approval
  experimentalApproved: boolean;
  decoyFrequency: number;       // 0..1
  sharedPatterns: boolean; similarHats: boolean; similarGlasses: boolean; similarColours: boolean; similarSilhouettes: boolean;
  occlusion: number;            // 0..1
  distraction: number;          // 0..1
  decoyDistance: number;        // world units
  contrast: number;             // 0..1
  zoom: number;                 // zoom at which the target should be identifiable
  targetScale: number;
  hintRadius: number;           // world units (game uses 300)
  complexity: number;           // 0..1
  playtests: Playtest[];
  validator: { at: string; seed: string; difficulty: string; ok: boolean; visibleShare: number; headShare: number; spot: string; tries: number } | null;
}

export const QC_CATEGORIES = {
  line: { label: 'Line quality', checks: ['Consistent outline treatment', 'No accidental jagged edges', 'No unexplained stroke-width changes', 'No clipping or rendering artifacts'] },
  construction: { label: 'Character construction', checks: ['Recognizable silhouette', 'Intentional proportions', 'Distinct head, body and limbs', 'Readable pose', 'Clear accessories'] },
  colour: { label: 'Color', checks: ['Balanced saturation', 'Distinguishable clothing', 'Consistent palette treatment', 'Adequate contrast', 'No purposeless colour combinations'] },
  small: { label: 'Small-scale appearance', checks: ['Recognizable at intended zoom', 'Critical traits survive scaling', 'No excessive detail loss', 'No unintended pixelation', 'No blurred raster scaling'] },
  variation: { label: 'Variation', checks: ['Different poses', 'Different expressions', 'Different outfits', 'Different movement styles', 'Little obvious repetition nearby'] },
  integration: { label: 'Integration', checks: ['Correct placement and anchoring', 'No floating feet', 'Correct layering', 'Appropriate crowd scale', 'Consistent with the environment'] },
  interaction: { label: 'Interaction', checks: ['Accurate click/hit region', 'Visible feedback', 'No target leak through debug highlighting', 'Search remains playable'] },
} as const;
export type QcKey = keyof typeof QC_CATEGORIES;

export interface QcEntry { score: number | null; checks: Record<string, boolean | null>; blocking: boolean; note: string }

export interface QualityReview extends Base {
  subject: { kind: 'asset' | 'character' | 'candidate'; id: string; parentId?: string };
  reviewer: string;
  entries: Record<QcKey, QcEntry>;
  evidence: ImageRef[];
  observations: string;
}

export type Severity = 'Critical' | 'Major' | 'Minor' | 'Note';
export const SEVERITIES: Severity[] = ['Critical', 'Major', 'Minor', 'Note'];

export interface Issue extends Base {
  code: string;
  title: string;
  description: string;
  category: string;
  severity: Severity;
  priority: number;
  stage: Stage;
  reportedBy: string;
  evidence: ImageRef[];
  assetIds: string[];
  characterIds: string[];
  sceneId: string | null;
  district: string | null;
  decisionIds: string[];
  sprintIds: string[];
  comparisonIds: string[];
  rootCause: string;
  proposedChange: string;
  steps: string;
  codePaths: string[];
  acceptance: string;
  testEvidence: string;
}

export interface WorkItem { id: string; text: string; done: boolean }

export interface Sprint extends Base {
  code: string;
  title: string;
  stage: Stage;
  problem: string;
  baseline: string;
  baselineImage: ImageRef | null;
  target: string;
  referenceIds: string[];
  decisionIds: string[];
  assetIds: string[];
  characterIds: string[];
  issueIds: string[];
  files: string[];
  plan: string;
  workItems: WorkItem[];
  testing: string;
  acceptance: string[];
  comparisonIds: string[];
  reviewIds: string[];
  finalDecision: string;
  nextDependency: string;
  ownerAccepted: { at: string; by: string } | null;
}

export const RUBRIC = ['Illustrated quality', 'Character variety', 'Visual richness', 'Landmark recognizability', 'Composition', 'Search challenge', 'Color coherence', 'Small-scale clarity', 'Overall authenticity', 'Readiness for implementation'] as const;

export interface ScreenshotComparison extends Base {
  name: string;
  left: ImageRef | null;
  right: ImageRef | null;
  leftLabel: string;
  rightLabel: string;
  seed: string | null;
  viewport: string | null;
  focus: 'scene' | 'character';
  align: { dx: number; dy: number; scale: number };
  pins: Pin[];
  decisionIds: string[];
  issueIds: string[];
  rubric: Record<string, { left: number | null; right: number | null }>;
  preferred: 'left' | 'right' | null;
  notes: string;
}

export interface BriefSelection { issueId: string | null; sceneId: string | null; characterId: string | null; decisionId: string | null; sprintId: string | null; milestoneId: string | null }

export interface ImplementationBrief extends Base {
  title: string;
  selection: BriefSelection;
  markdown: string;
}

export interface Measurement extends Base {
  label: string;
  tier: 'Interactive baseline' | 'Illustrated quality test' | 'Stress test';
  url: string;
  params: Record<string, string>;
  seconds: number;
  frames: number;
  avgFrameMs: number;
  p95FrameMs: number;
  worstFrameMs: number;
  stdevMs: number;
  fps: number;
  viewport: string;
  dpr: number;
  userAgent: string;
  heapMB: number | null;
  loadMs: number | null;
  firstFrameMs: number | null;
  people: number | null;
  validator: { ok: boolean; visibleShare: number; headShare: number } | null;
  hidden: boolean;            // page was hidden during the run (frame timing unreliable)
}

export interface CheckRun { id: string; at: string; name: string; ok: boolean | null; summary: string; details: string[]; method: string }

export interface Workspace {
  version: 1;
  project: Project;
  sources: Record<string, Source>;
  references: Record<string, Reference>;
  decisions: Record<string, DesignDecision>;
  characters: Record<string, Character>;
  assets: Record<string, Asset>;
  landmarks: Record<string, Landmark>;
  zones: Record<string, Zone>;
  stories: Record<string, StoryMoment>;
  scenes: Record<string, Scene>;
  iterations: Record<string, SceneIteration>;
  clues: Record<string, ClueConfiguration>;
  reviews: Record<string, QualityReview>;
  issues: Record<string, Issue>;
  sprints: Record<string, Sprint>;
  comparisons: Record<string, ScreenshotComparison>;
  briefs: Record<string, ImplementationBrief>;
  measurements: Record<string, Measurement>;
  checks: Record<string, CheckRun>;     // latest automated check results, by check id
  auditNotes: Record<string, string>;   // fact id or section -> owner note
  activity: { at: string; text: string; ref?: { kind: Kind; id: string } }[];
}

export const KIND_TO_COLLECTION: Record<Kind, keyof Workspace> = {
  source: 'sources', reference: 'references', decision: 'decisions', character: 'characters', asset: 'assets',
  landmark: 'landmarks', zone: 'zones', story: 'stories', scene: 'scenes', iteration: 'iterations', clue: 'clues',
  review: 'reviews', issue: 'issues', sprint: 'sprints', comparison: 'comparisons', brief: 'briefs', measurement: 'measurements',
};

export const KIND_LABEL: Record<Kind, string> = {
  source: 'Source', reference: 'Reference', decision: 'Decision', character: 'Character', asset: 'Asset', landmark: 'Landmark',
  zone: 'Zone', story: 'Story moment', scene: 'Scene', iteration: 'Scene iteration', clue: 'Clue setup', review: 'Quality review',
  issue: 'Issue', sprint: 'Sprint', comparison: 'Comparison', brief: 'Brief', measurement: 'Measurement',
};

export interface Milestone { id: string; name: string; at: string; note: string; data: Workspace }

// Repository snapshot written by scripts/ingest.mjs
export interface RepoDoc { path: string; bytes: number; sha: string; lines: number; title: string; headings: { level: number; text: string; line: number }[]; text: string }
export interface RepoAsset { id: string; file: string; bytes: number; sha: string; category: string; inBundle: boolean; viewBox: number[] | null; anchor: number[] | null; slots: string[]; traits: string[]; head: number[] | null; kit: string | null; hats: string[] | null; author: string | null; register: { origin: string; author: string; permission: string; line: number } | null }
export interface RepoEvidence { path: string; url: string; bytes: number; folder: string; name: string; width: number | null; height: number | null }
export interface RepoFact { id: string; area: string; claim: string; ok: boolean; evidence: { path: string; line: number | null; text: string }[] }
export interface RepoSnapshot {
  available: boolean;
  generatedAt: string;
  git?: { head: string | null; branch: string | null; subject: string | null; date: string | null; dirty: boolean; remote: string | null };
  artVersion?: number;
  docs?: RepoDoc[];
  sourceFiles?: { path: string; lines: number; bytes: number }[];
  assets?: RepoAsset[];
  evidence?: RepoEvidence[];
  tests?: { name: string; file: string; line: number }[];
  perfTables?: { heading: string; header: string[]; rows: string[][]; line: number }[];
  districts?: { y0: number; y1: number; name: string; contents: string; source: string; doc: string; line: number }[];
  facts?: RepoFact[];
  counts?: Record<string, number>;
}
