/* First-run workspace. Grounded in the repository (paths and lines cited) and in the owner's brief.
   Nothing here claims an approval, a score, a player result or a benchmark that did not happen:
   those fields start empty and are filled by using the lab. */
import type {
  Asset, Character, CharacterParams, ClueConfiguration, DesignDecision, Issue, Landmark, RepoSnapshot, Scene, SceneParams,
  ScreenshotComparison, Source, Sprint, StoryMoment, Workspace, LayerState,
} from '../types';
import { now, uid } from '../lib/util';

const BRIEF = 'Owner brief: "Art Direction & Build Lab" master prompt (pasted 2026-11-16)';
const base = (status: Base['status'], source: string | null, rationale: string | null = null, tags: string[] = []) =>
  ({ createdAt: now(), updatedAt: now(), status, source, rationale, tags });
type Base = { status: import('../types').Status };

export const LAYERS = [
  ['background', 'Background'], ['distant', 'Distant architecture'], ['terrain', 'Street and terrain'], ['landmarks', 'Landmark structures'],
  ['vegetation', 'Vegetation'], ['props', 'Environmental props'], ['crowd-bg', 'Background crowds'], ['crowd-mid', 'Midground crowds'],
  ['crowd-fg', 'Foreground crowds'], ['target', 'Target and decoys'], ['interactive', 'Interactive objects'], ['overlay', 'UI and debug overlays'],
] as const;
export type LayerId = (typeof LAYERS)[number][0];

export const defaultLayers = (): Record<string, LayerState> =>
  Object.fromEntries(LAYERS.map(([id], i) => [id, { visible: true, opacity: 1, locked: id === 'background', order: i }]));

export const DEFAULT_PARAMS: SceneParams = {
  seed: 'SAV-2026', district: 'forsyth', difficulty: 'normal', density: 'standard', crowd: null,
  crowdScale: 1, propScale: 1, varietyBias: 0, overlap: 0, foregroundEmphasis: 0, decoyBoost: 0, landmarkProminence: 1,
};

export const PRESETS: Record<string, { note: string; params: Partial<SceneParams>; live: 'game' | 'v1' }> = {
  'Current Diorama': { live: 'v1', note: 'Matches the version 1 procedural build (archived at docs/history/index-v1.html): uniform scatter, no stories, little variety. The live view switches to the real v1 renderer. The sketch only approximates its spacing.', params: { density: 'standard', crowdScale: 1, propScale: 0.3, varietyBias: 0, overlap: 0, foregroundEmphasis: 0, decoyBoost: 0, landmarkProminence: 1 } },
  'Illustrated Savannah': { live: 'game', note: 'The current illustrated build exactly as the game generates it for this replay identity. Every lab adjustment is at neutral.', params: { density: 'standard', crowdScale: 1, propScale: 1, varietyBias: 0, overlap: 0, foregroundEmphasis: 0, decoyBoost: 0, landmarkProminence: 1 } },
  'Crowded Picture Book': { live: 'game', note: 'Dense crowds pulled into clusters, more story archetypes and props. Starts from the game\'s dense layout. Everything beyond that is a lab simulation.', params: { density: 'dense', crowdScale: 1.35, propScale: 1.3, varietyBias: 0.45, overlap: 0.55, foregroundEmphasis: 0.35, decoyBoost: 0.2, landmarkProminence: 1 } },
  'Landmark Showcase': { live: 'game', note: 'Fewer people, larger landmarks, open sightlines toward them.', params: { density: 'low', crowdScale: 0.8, propScale: 0.9, varietyBias: 0.2, overlap: 0.1, foregroundEmphasis: 0, decoyBoost: 0, landmarkProminence: 1.35 } },
  Experimental: { live: 'game', note: 'Free parameters. Nothing is implied about the game.', params: {} },
};

const ADR1 = 'vibe-coding/decisions/ADR-001.md';
const ADR2 = 'vibe-coding/decisions/ADR-002-illustrated-world.md';

function decision(code: string, title: string, category: string, originalRule: string, proposedReplacement: string, extra: Partial<DesignDecision>): DesignDecision {
  const fields = {
    title, category, originalRule, proposedReplacement,
    rationale: extra.rationale ?? '', evidence: extra.evidence ?? '', evidenceType: extra.evidenceType ?? 'Repository document',
    expectedVisual: extra.expectedVisual ?? '', expectedCost: extra.expectedCost ?? '', compatibility: extra.compatibility ?? '', sourceRef: extra.sourceRef ?? ADR1,
  } as const;
  return {
    id: 'dec_' + code.toLowerCase().replace(/[^a-z0-9]/g, ''), code, ...base('Tentative', fields.sourceRef, fields.rationale), ...fields,
    owner: '', priority: Number(code.slice(-1)), workflow: 'Proposed', lineage: 'inherited', currentApproved: null,
    supersedes: 'ADR-001', experimentOf: null,
    history: [{ at: now(), action: 'Seeded', by: 'Build Lab', note: 'Seeded from the owner brief and the repository. Not approved in the lab.' }],
    versions: [], relatedFiles: [], referenceIds: [], assetIds: [], issueIds: [], sprintIds: [], tests: [],
    ...extra, tags: extra.tags ?? [],
  } as DesignDecision;
}

export function seedDecisions(): DesignDecision[] {
  return [
    decision('ADR-V001', 'Procedural geometry versus illustration', 'Rendering', 'All buildings, props and people are generated with procedural geometry at runtime (ADR-001 Option C, "Zero external assets").', 'Evaluate a hybrid illustrated 2D/2.5D pipeline: authored visual components with procedural placement.', {
      rationale: 'The owner reports the world reads as low-quality procedural sprites. The audit records one silhouette for all 421 v1 people (docs/audit.md §1).',
      evidence: `ADR-002 §2–§6 records this replacement in the repository: 100 original SVG files are now packed into build/js/assets.bundle.js. The lab has not approved it. Whether the current crowd still reads as procedural is open (VIS-001).`,
      expectedVisual: 'Drawn silhouettes, faces, folds and props in place of boxes.', expectedCost: 'Authoring time per asset; a pack step; larger download (bundle about 2.4 MB).',
      compatibility: 'Keeps seed, fallback, beacon and leaderboard contracts (ADR-002 §4).', sourceRef: `${ADR1} (Option C); ${ADR2} §2–§6`,
      relatedFiles: ['vibe-coding/tools/pack-assets.mjs', 'vibe-coding/src/engine/sprites.js', 'vibe-coding/src/characters/compose.js'],
      tests: ['loads from file:// with no external requests and no page errors'],
    }),
    decision('ADR-V002', 'Orthographic projection', 'Camera', 'Fixed orthographic projection at 45° elevation and 15° azimuth (ADR-001 §1 Projection System).', 'Compare the current projection with readable illustrated overhead and shallow-isometric compositions. Let visual tests decide; do not assume the camera math should be discarded.', {
      rationale: 'The audit lists the fixed camera as a restriction that turns the scene into a diorama of boxes (docs/audit.md §2).',
      evidence: 'ADR-002 §3 replaced it with a 2D world camera looking down at about 50° from the south (art-direction.md). No side-by-side projection test exists in the lab yet.',
      evidenceType: 'Repository document', expectedVisual: 'Upright figures and buildings on a map-like ground, depth from overlap.', expectedCost: 'Each asset is drawn once in its natural view.',
      compatibility: 'Hit testing changes from radius picks to alpha masks (HANDOFF.md Functions).', sourceRef: `${ADR1} §1; ${ADR2} §3`,
      relatedFiles: ['vibe-coding/src/engine/engine.js', 'vibe-coding/src/engine/input.js'],
    }),
    decision('ADR-V003', 'Zero external image assets', 'Assets', 'No image files, downloaded models or external assets. Everything is generated at runtime in one HTML file (ADR-001 Context 1).', 'Explore locally bundled original SVG, PNG, WebP or layered assets. Keep an assignment-compliant mode until course restrictions are reviewed.', {
      rationale: 'An asset ban leaves typed primitive geometry as the only option (docs/audit.md §2).',
      evidence: 'ADR-002 §5–§6 lifts the ban for original local assets and records provenance in sources/asset-register.md (100 rows). Course restrictions have not been reviewed in the lab: see Project → restrictions.',
      evidenceType: 'Repository document', expectedVisual: 'Makes authored art possible at all.', expectedCost: 'Provenance record per asset; a pack step for authors.',
      compatibility: 'An assignment-compliant (zero-asset) mode exists only as the archived v1 game at docs/history/index-v1.html.', sourceRef: `${ADR1} Context 1; ${ADR2} §5–§6`,
      relatedFiles: ['vibe-coding/sources/asset-register.md', 'vibe-coding/tools/pack-assets.mjs'],
    }),
    decision('ADR-V004', 'Color hierarchy', 'Palette', '80/15/5 cognitive colour distribution applied to the whole product (HARNESS v1 §3).', 'Apply 80/15/5 mainly to the surrounding interface; give the game world its own richer illustrated palette.', {
      rationale: 'The audit says the rule starves the world of colour (docs/audit.md §2).',
      evidence: 'ADR-002 keeps 80/15/5 for the interface only. sources/art-direction.md defines a world palette (lawn, paving, brick, oak, moss, azalea, townhouse colours).',
      expectedVisual: 'Varied, saturated world colour while the HUD stays calm.', expectedCost: 'Low.', compatibility: 'None.', sourceRef: `${ADR2} (Supersedes list); vibe-coding/sources/art-direction.md Palette`,
      relatedFiles: ['vibe-coding/sources/art-direction.md', 'vibe-coding/src/characters/make.js'],
    }),
    decision('ADR-V005', 'Crowd construction', 'Characters', 'Procedural figures assembled from repeated geometry: two leg rectangles, a torso rectangle and a head circle (docs/audit.md §1).', 'Expand to authored character families with distinct poses, expressions, outfits, accessories and interaction states.', {
      rationale: 'One silhouette with different shirt colours cannot carry a search-and-find page.',
      evidence: 'Current build: 24 archetypes, 7 bodies with a head socket, and a part library (5 faces, 10 hair, 9 hats, 3 glasses, 2 beards) per sources/art-direction.md. The filler crowd draws mostly from the 7 bodies (src/scenes/build.js POOL_PATH / POOL_STAND), which is a hypothesis for VIS-003.',
      expectedVisual: 'Silhouette-first variety; recognisable activities.', expectedCost: 'More drawings and animation frames per family.',
      compatibility: 'Decoy cap still enforced in make.js.', sourceRef: `docs/audit.md §1; vibe-coding/sources/art-direction.md; vibe-coding/src/scenes/build.js`,
      relatedFiles: ['vibe-coding/src/scenes/build.js', 'vibe-coding/src/characters/make.js', 'vibe-coding/assets/characters/'],
    }),
    decision('ADR-V006', 'Crowd difficulty', 'Gameplay', 'NPC decoys share at most one or two target traits (PRD FR-03, HARNESS §4).', 'Make decoy frequency, similarity and distribution configurable while keeping exactly one true target.', {
      rationale: 'Difficulty should come from composition, not tiny graphics.',
      evidence: 'Code: make.js throws if a non-target carries more than two traits (line 83). build.js DECOY_RATE easy 0.06, normal 0.16, hard 0.32. Hard spots require 50–86% visibility (HANDOFF.md).',
      expectedVisual: 'Meaningful lookalikes, never a second target.', expectedCost: 'Validator and test updates if the cap changes.',
      compatibility: 'Changing the cap above two contradicts HARNESS hard rule 4 and needs an explicit approval.', sourceRef: 'vibe-coding/src/characters/make.js:83; vibe-coding/src/scenes/build.js:6; HARNESS.md hard rule 4',
      relatedFiles: ['vibe-coding/src/characters/make.js', 'vibe-coding/src/scenes/build.js'],
      tests: ['decoy cap, single target and stripe rule hold across 36 seeds', 'hard mode hides him in company: a crowd and nearby decoys'],
    }),
    decision('ADR-V007', 'Performance target', 'Performance', '60 FPS with up to 10,000 animated NPCs as a hard gate (ADR-001, CHECKLIST).', 'Separate the visual quality target, default crowd performance and extreme stress-test performance. Benchmark on real devices.', {
      rationale: 'The audit found no measurement behind the v1 claim (docs/audit.md §4).',
      evidence: 'build-record/performance.md reports runs on one Apple M4 in headless Chrome. The lab treats them as documented claims until re-measured (Quality Control → Benchmark).',
      evidenceType: 'Measurement', expectedVisual: 'Lets characters be detailed at default density.', expectedCost: 'A benchmark per device class.',
      compatibility: '?crowd= stays as a labelled stress test.', sourceRef: `${ADR1}; vibe-coding/build-record/performance.md`,
      relatedFiles: ['vibe-coding/tests/perf.mjs', 'vibe-coding/build-record/performance.md', 'vibe-coding/src/engine/sprites.js'],
      tests: ['stress crowd of 10,000 builds and stays playable'],
    }),
    decision('ADR-V008', 'Scene composition', 'Composition', 'Four shuffled procedural districts in a miniature diorama; people scattered uniformly (docs/audit.md §1).', 'Test denser editorial compositions with identifiable districts, scene-specific staging and more foreground/middle-ground/background variation.', {
      rationale: 'Uniform scatter has no paths, clusters or focal points (HARNESS gate B).',
      evidence: 'Current build: one continuous 3200 × 6700 world, fixed geography, 47 stories (docs/savannah-blueprint.md). Whether density reads as a picture book is open (VIS-005).',
      expectedVisual: 'Clusters, paths and focal points.', expectedCost: 'Hand layout per district.',
      compatibility: 'Same replay identity must still rebuild the same world (HARNESS hard rule 5).', sourceRef: 'vibe-coding/docs/savannah-blueprint.md; docs/audit.md §1',
      relatedFiles: ['vibe-coding/src/scenes/riverfront.js', 'vibe-coding/src/scenes/market.js', 'vibe-coding/src/scenes/squares.js', 'vibe-coding/src/scenes/forsyth.js'],
    }),
  ];
}

const p = (o: Partial<CharacterParams>): CharacterParams => ({
  silhouette: '', proportions: 'Adult about 92 SVG units soles to crown; head about a quarter of body height (art-direction.md, Character style guide).',
  headScale: 1, pose: '', expression: 'smile', hair: '', headwear: '', glasses: '', beard: '', clothing: '', colours: {},
  accessories: '', scale: 0.8, outline: 'People 1.1 world-unit ink outline #2B1D16 (art-direction.md, Line).', animation: '', readability: 'About 30 CSS px tall at zoom 1.0 (74 world units × 0.4 px).', ...o,
});

function family(name: string, assetIds: string[], params: Partial<CharacterParams>, notes = '', isTarget = false): Character {
  return {
    id: 'chr_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), ...base('Tentative', 'vibe-coding/sources/art-direction.md'),
    name, family: name, assetIds, primaryAsset: assetIds[0] ?? null, params: p(params), candidates: [], decisionIds: ['dec_adrv005'], notes, isTarget,
  };
}

export function seedCharacters(): Character[] {
  const A = 'characters/archetypes/', B = 'characters/bodies/';
  return [
    family('Primary hidden target', [A + 'target-walker'], { silhouette: 'Tall walker with bobble hat and stick.', pose: 'Walking (two drawn frames).', clothing: 'Red-and-white horizontal stripes, blue trousers #1E88E5.', accessories: 'Round glasses, wooden walking stick #8D6E63, striped bobble hat with white pom-pom.', animation: 'Walk frames 1 and 2; paces within 22 units of his spot.' }, 'Exactly one per playable scene. The five traits are binding (ADR-002 §4).', true),
    family('SCAD students', [A + 'scad-student-portfolio'], { silhouette: 'Student carrying an oversized portfolio.', pose: 'Walking with portfolio.' }),
    family('Faculty and artists', [A + 'painter', A + 'sculptor'], { silhouette: 'Beret and smock at an easel; sculptor at a plinth.', pose: 'Working at easel or plinth.' }),
    family('Tourists', [A + 'tourist-photographer', A + 'tour-guide'], { silhouette: 'Sun hat and camera; guide with raised flag.', pose: 'Photographing; leading a group.' }),
    family('Street musicians and performers', [A + 'saxophonist', A + 'juggler', A + 'dancer'], { silhouette: 'Fedora and sax; costumed juggler; dancer mid-twirl.', pose: 'Performing.' }),
    family('Vendors', [A + 'praline-vendor'], { silhouette: 'Vendor with a praline cart.', pose: 'Standing at cart.' }, 'Market stall keepers use crowd bodies (src/scenes/market.js "market-vendors").'),
    family('Festival attendees', [A + 'festival-goer'], { silhouette: 'Festival-goer.', pose: 'Standing.' }),
    family('Joggers and cyclists', [A + 'jogger', A + 'cyclist'], { silhouette: 'Runner mid-stride; rider on a bicycle.', pose: 'Running about 55 units/s; riding about 85 units/s (savannah-blueprint.md, Movement).' }),
    family('Families and groups', [A + 'parent-stroller', A + 'kid-balloon', A + 'child-bubbles', A + 'chess-players', A + 'bride', A + 'groom'], { silhouette: 'Stroller, balloon, bubbles, a chess pair, a wedding couple.' }),
    family('Historic-Savannah-inspired characters', [A + 'historian', A + 'riverboat-worker'], { silhouette: 'Historian in period dress; riverboat worker.' }, 'Period dress is an interpretation. Research the reference before treating it as accurate.'),
    family('Park regulars', [A + 'elder-pigeon-feeder', A + 'reader-seated', A + 'dog-walker', A + 'picnicker-startled', A + 'gardener', A + 'maintenance-worker'], { silhouette: 'Feeder on a bench, reader, dachshund walker, startled picnicker, gardener, worker with rake.' }, 'Not in the brief\'s family list; these archetypes exist in the repo.'),
    family('Search decoys and crowd bodies', [B + 'walk', B + 'dress', B + 'phone', B + 'coffee', B + 'tote', B + 'cane', B + 'child', B + 'seated'], { silhouette: 'Seven bodies with a head socket plus a seated body; heads assembled from parts.', hair: 'crop', pose: 'Walking, standing, seated.', animation: 'Walk bodies have a second drawn frame.' }, 'Most of the filler crowd uses these bodies (src/scenes/build.js POOL_PATH and POOL_STAND). Decoy traits are added here, capped at two.'),
  ];
}

export function seedIssues(): Issue[] {
  const mk = (n: number, title: string, category: string, severity: Issue['severity'], o: Partial<Issue>): Issue => ({
    id: 'iss_vis' + String(n).padStart(3, '0'), code: 'VIS-' + String(n).padStart(3, '0'), ...base('Needs research', 'Owner report (brief §15)'),
    title, description: '', category, severity, priority: n, stage: 'Backlog', reportedBy: 'Project owner', evidence: [], assetIds: [], characterIds: [],
    sceneId: null, district: null, decisionIds: [], sprintIds: [], comparisonIds: [], rootCause: '', proposedChange: '', steps: '', codePaths: [], acceptance: '', testEvidence: '', ...o,
  });
  return [
    mk(1, 'Characters appear too procedural', 'Characters', 'Major', {
      description: 'Reported: people read as procedural sprites or geometric figures rather than illustrated characters.',
      rootCause: 'Hypothesis. The brief describes v1 (four rectangles and a circle per person, docs/audit.md §1). The current build uses drawn SVG archetypes. If the impression remains, likely causes: (1) most of the filler crowd comes from 7 crowd bodies; (2) only walking bodies and the target have drawn frames, the rest move by procedural offsets (checkpoint-2 review, Revision 2); (3) on-screen size is about 30 CSS px at zoom 1.0. Inspect at gameplay scale before deciding.',
      proposedChange: 'Sprint 01: illustrated character system review at gameplay scale.', decisionIds: ['dec_adrv001', 'dec_adrv005'], sprintIds: ['spr_s01'],
      characterIds: ['chr_search-decoys-and-crowd-bodies'], codePaths: ['vibe-coding/assets/characters/bodies/', 'vibe-coding/src/scenes/build.js', 'vibe-coding/src/engine/engine.js'],
      acceptance: 'Owner judges a gameplay-scale crowd capture as illustrated, with a before/after comparison attached.',
    }),
    mk(2, 'Crowd lacks sufficient illustrated personality', 'Characters', 'Major', { description: 'Reported: the crowd lacks personality: expressions, gestures, interactions.', rootCause: 'Hypothesis: 5 face parts and no gesture variation on crowd bodies; stories are concentrated in 47 placed clusters.', decisionIds: ['dec_adrv005'], codePaths: ['vibe-coding/assets/characters/parts/faces/', 'vibe-coding/src/characters/make.js'] }),
    mk(3, 'Repetitive character silhouettes', 'Characters', 'Major', { description: 'Reported: nearby characters share silhouettes.', rootCause: 'Hypothesis: POOL_PATH weights walk 20, dress 13, tote 10 dominate filler (src/scenes/build.js). Measure with the Character Workshop silhouette grid and a crowd capture.', decisionIds: ['dec_adrv005'], sprintIds: ['spr_s01'], codePaths: ['vibe-coding/src/scenes/build.js'] }),
    mk(4, 'Environmental geometry lacks visual detail', 'Environment', 'Minor', { description: 'Reported: buildings and terrain lack detail.', rootCause: 'Needs inspection per district; checkpoint-4 screenshots exist for river, market, squares and pier.', decisionIds: ['dec_adrv001'], codePaths: ['vibe-coding/assets/environments/', 'vibe-coding/tools/author/'] }),
    mk(5, 'Scene composition does not yet feel dense enough', 'Composition', 'Major', { description: 'Reported: the scene does not yet feel as dense as a picture book.', rootCause: 'Hypothesis: standard density spreads 900 people over 3200 × 6700 units with spacing 30 (build.js). Test in Scene Composer against the same seed.', decisionIds: ['dec_adrv008'], codePaths: ['vibe-coding/src/scenes/build.js', 'vibe-coding/src/scenes/savannah.js'] }),
    mk(6, 'Existing color/spacing rules may constrain the world', 'Design rules', 'Minor', { description: 'Reported: interface colour and spacing rules may be limiting the world.', rootCause: 'ADR-002 already scopes 80/15/5 to the interface. Check whether any remaining rule still applies it to the world.', decisionIds: ['dec_adrv004'] }),
    mk(7, 'Asset restrictions may be preventing visual improvement', 'Design rules', 'Minor', { description: 'Reported: asset restrictions may block improvement.', rootCause: 'ADR-002 lifted the asset ban for original local files. Academic submission restrictions are unreviewed.', decisionIds: ['dec_adrv003'] }),
    mk(8, 'Projection may not suit the intended illustration style', 'Camera', 'Minor', { description: 'Reported: the projection may not suit the illustration style.', rootCause: 'v1 used 45°/15° orthographic. Current build uses a 2D world camera (~50° from the south). Compare captures.', decisionIds: ['dec_adrv002'] }),
    mk(9, 'Need better relationship between landmarks and clues', 'Gameplay', 'Minor', { description: 'Reported: landmarks and clues are weakly related.', rootCause: 'Hints name an area (area() per district) and draw a 300-unit circle (checkpoint-3 review). Hiding spots are listed per district in savannah-blueprint.md.', codePaths: ['vibe-coding/src/scenes/build.js', 'vibe-coding/src/main.js'] }),
    mk(10, 'Need independently verified visual and performance benchmarks', 'QA', 'Major', { description: 'Reported: benchmarks need independent verification.', rootCause: 'performance.md numbers come from one machine in headless Chrome. Visual scores in checkpoint reviews are self-assessed (HARNESS: "A self-assigned score alone is not proof").', decisionIds: ['dec_adrv007'], codePaths: ['vibe-coding/tests/perf.mjs', 'vibe-coding/build-record/performance.md'] }),
  ];
}

export function seedSprint(): Sprint {
  return {
    id: 'spr_s01', code: 'Sprint 01', ...base('Tentative', BRIEF), title: 'Replace low-quality character construction with an illustrated character system',
    stage: 'Selected',
    problem: 'Characters are reported to read as procedural (VIS-001) with repetitive silhouettes (VIS-003).',
    baseline: 'Current build: 24 archetypes, 7 crowd bodies with assembled heads, drawn walk frames only for walking bodies and the target. Attach a gameplay-scale screenshot as the baseline image.',
    baselineImage: null,
    target: 'Crowd characters that read as drawn at gameplay scale: distinct silhouettes, varied poses, coherent outlines.',
    referenceIds: [], decisionIds: ['dec_adrv001', 'dec_adrv005'], assetIds: [], characterIds: ['chr_search-decoys-and-crowd-bodies'], issueIds: ['iss_vis001', 'iss_vis003'],
    files: ['vibe-coding/assets/characters/bodies/', 'vibe-coding/assets/characters/parts/', 'vibe-coding/src/characters/compose.js', 'vibe-coding/src/characters/make.js', 'vibe-coding/src/scenes/build.js', 'vibe-coding/sources/asset-register.md'],
    plan: '1. Capture the baseline crowd at zoom 1.0 and 2.0 for a fixed seed.\n2. Pick one crowd body family to redraw first.\n3. Upload the candidate in Character Workshop, review at 100/200/400% and in crowd context.\n4. Score the sprite checklist; fix blocking failures.\n5. Compare before/after; owner accepts or rejects.',
    workItems: [], testing: 'Character Workshop previews at gameplay scale; silhouette grid; Comparison Studio before/after at the same seed and viewport; game tests still pass (vibe-coding/tests/illustrated.test.mjs).',
    acceptance: [
      'At least one actual revised character asset is uploaded (not a text note).',
      'Preview captured at intended gameplay scale (zoom 1.0, about 30 CSS px tall).',
      'Comparison against the old representation is saved.',
      'Pose or expression quality is demonstrated in the candidate.',
      'Sprite quality checklist passes with no blocking failure.',
      'Project owner explicitly accepts the result.',
    ],
    comparisonIds: [], reviewIds: [], finalDecision: '', nextDependency: 'Sprint 02: character pose variation', ownerAccepted: null,
  };
}

export function seedLandmarks(): Landmark[] {
  const L = (id: string, name: string, district: string, x: number, y: number, w: number, h: number, assetId: string | null, status: Landmark['status'], source: string, o: Partial<Landmark> = {}): Landmark => ({
    id: 'lmk_' + id, ...base(status, source), name, district, x, y, w, h, scale: 1, depthLayer: 60, assetId, inBuild: Boolean(assetId), composite: false, history: '', composition: '', referenceIds: [], ...o,
  });
  return [
    L('fountain', 'Forsyth Park Fountain', 'forsyth', 1600, 742 + 4300, 420, 300, 'environments/forsyth/fountain', 'Verified', 'vibe-coding/src/scenes/forsyth.js:24', { history: 'Real landmark (1858). Drawing approved at checkpoint 1 as recognisable without a label (visual-qa/art-direction/review.md).' }),
    L('gaston', 'Gaston Street townhouses', 'forsyth', 1600, 270 + 4300, 3200, 260, 'environments/forsyth/gaston-street-houses', 'Verified', 'vibe-coding/src/scenes/forsyth.js:19', { depthLayer: 10, history: 'Generic Savannah row (stoops, shutters, iron balconies). Not a specific address.' }),
    L('waving-girl', 'Waving Girl statue', 'riverfront', 420, 560, 80, 140, 'props/landmarks/waving-girl', 'Verified', 'vibe-coding/src/scenes/riverfront.js:14', { history: 'Real statue on River Street (Florence Martus). Position in the game is compositional, not surveyed.' }),
    L('warehouses', 'Cotton warehouse row and Factors Walk', 'riverfront', 1600, 1350, 3200, 340, 'environments/riverfront/warehouse-row', 'Verified', 'vibe-coding/src/scenes/riverfront.js:11', { depthLayer: 10, history: 'Drawn as the Bay Street side with iron footbridges over Factors Walk (savannah-blueprint.md, Known gaps).' }),
    L('pier', 'Festival Pier tents', 'riverfront', 2600, 405, 1100, 120, 'props/festival/tent', 'Tentative', 'vibe-coding/src/scenes/riverfront.js:7-16', { composite: true, history: 'Composite: a stylised festival on a plank pier. Do not present as a permanent Savannah landmark.' }),
    L('market-gate', 'City Market gate and shopfronts', 'market', 1600, 1830, 3200, 300, 'environments/market/market-row', 'Verified', 'vibe-coding/src/scenes/market.js:12', { depthLayer: 10, history: 'City Market is a real district; the row is a composition of shopfronts.' }),
    L('obelisk', 'Obelisk square monument', 'squares', 900, 3690, 80, 200, 'props/landmarks/obelisk', 'Needs research', 'vibe-coding/src/scenes/squares.js:10', { composite: true, history: 'Which real square and monument this represents is not documented in the repo. Research before naming it.' }),
    L('row-houses', 'Italianate townhouses with twin-spired church', 'squares', 1600, 3220, 3200, 320, 'environments/squares/row-houses', 'Needs research', 'vibe-coding/src/scenes/squares.js:9', { depthLayer: 10, composite: true, history: 'Twin spires suggest a real cathedral. The repo does not say which; verify before claiming it.' }),
    L('poetter', 'SCAD Poetter Hall', 'none', 0, 0, 0, 0, null, 'Needs research', 'Owner brief §11 District A; docs/audit.md §1 (v1 only)', { inBuild: false, history: 'District A in the brief. Existed only as two boxes in v1. The current build has no Poetter Hall asset or district.' }),
  ];
}

export function seedStories(): StoryMoment[] {
  return [
    ['Students carrying oversized art supplies', 'market'], ['Street musicians performing', 'riverfront'], ['Tourists reacting to something unusual', 'riverfront'],
    ['Vendors exchanging goods', 'market'], ['Dogs interrupting pedestrians', 'forsyth'], ['A performer attracting a crowd', 'squares'],
  ].map(([title, district]) => ({
    id: 'sto_' + title.toLowerCase().replace(/[^a-z]+/g, '-').slice(0, 30), ...base('Tentative', BRIEF + ' §11'),
    title, district, description: 'Proposed story idea from the brief. Not a claim about existing game content.', characterIds: [], inBuild: false,
  }));
}

export function seedScene(): Scene {
  return {
    id: 'scn_forsyth', ...base('Tentative', 'Game scene builder (vibe-coding/src/scenes/*.js) run in the lab'), name: 'Forsyth Park · SAV-2026', preset: 'Illustrated Savannah',
    params: { ...DEFAULT_PARAMS }, layers: defaultLayers(), moved: {}, added: [], removed: [], baselineIterationId: null, preferredIterationId: null, decisionIds: ['dec_adrv008'],
  };
}

export function seedClue(): ClueConfiguration {
  return {
    id: 'clu_game-normal', ...base('Verified', 'vibe-coding/src/scenes/build.js:6; vibe-coding/src/characters/make.js; HANDOFF.md placeTarget', 'Values copied from the game code for the normal difficulty.'),
    name: 'Game default (normal)', district: 'all', region: null, maxSharedTraits: 2, experimentalApproved: false, decoyFrequency: 0.16,
    sharedPatterns: false, similarHats: true, similarGlasses: true, similarColours: true, similarSilhouettes: false,
    occlusion: 0.3, distraction: 0.5, decoyDistance: 200, contrast: 0.5, zoom: 1, targetScale: 0.8, hintRadius: 300, complexity: 0.5, playtests: [], validator: null,
  };
}

export function seedComparison(snap: RepoSnapshot): ScreenshotComparison | null {
  const ev = snap.evidence ?? [];
  const before = ev.find((e) => e.path.endsWith('visual-overhaul/before-overview-1440.png'));
  const after = ev.find((e) => e.path.endsWith('checkpoint-2/overview-1440.png'));
  if (!before || !after) return null;
  return {
    id: 'cmp_v1-vs-cp2', ...base('Tentative', 'Repository screenshots in build-record/', 'Both images are real captures from the repo. No ratings are filled in.'),
    name: 'Version 1 vs checkpoint 2 overview (repo evidence)',
    left: { kind: 'evidence', path: before.path, url: before.url, name: before.name }, right: { kind: 'evidence', path: after.path, url: after.url, name: after.name },
    leftLabel: 'Version 1 (procedural)', rightLabel: 'Checkpoint 2 (illustrated Forsyth)', seed: null, viewport: '1440 px wide', focus: 'scene',
    align: { dx: 0, dy: 0, scale: 1 }, pins: [], decisionIds: ['dec_adrv001'], issueIds: [], rubric: {}, preferred: null,
    notes: 'v1 seed SAV-2026 per visual-qa/art-direction/review.md. The checkpoint 2 seed is not recorded in the file name: check checkpoint-2/review.md.',
  };
}

export function repoAssetRecord(a: NonNullable<RepoSnapshot['assets']>[number]): Asset {
  const title = a.id.split('/').pop()!.replace(/-/g, ' ');
  return {
    id: 'ast_' + a.id.replace(/[^a-z0-9]+/gi, '_'), ...base('Tentative', a.file, a.register ? `Register line ${a.register.line}: ${a.register.origin}` : null),
    title: title[0].toUpperCase() + title.slice(1), category: a.category, origin: 'repo', repoId: a.id, image: null, file: a.file,
    creator: a.register?.author ?? a.author, license: a.register?.permission ?? null, version: 1, description: '', stage: 'Repo current',
    dims: a.viewBox ? `${a.viewBox[2]} × ${a.viewBox[3]} SVG units` : null, renderScale: a.id.startsWith('characters/') ? '0.8 world units per SVG unit' : null,
    landmarkIds: [], characterIds: [], palette: [], animation: '', implNotes: '', knownIssues: '', replaces: null,
  };
}

export function repoSources(snap: RepoSnapshot): Source[] {
  return (snap.docs ?? []).map((d) => ({
    id: 'src_' + d.path.replace(/[^a-z0-9]+/gi, '_'), ...base('Verified', d.path, `Read by ingest at ${snap.generatedAt.slice(0, 10)}, sha ${d.sha}.`),
    title: d.title, kind: 'repo-doc', path: d.path, url: null, sha: d.sha, note: '', text: null, blob: null,
  }));
}

export function initialWorkspace(snap: RepoSnapshot): Workspace {
  const by = <T extends { id: string }>(xs: T[]) => Object.fromEntries(xs.map((x) => [x.id, x]));
  const decisions = seedDecisions();
  const issues = seedIssues();
  for (const i of issues) for (const d of i.decisionIds) { const dec = decisions.find((x) => x.id === d); if (dec && !dec.issueIds.includes(i.id)) dec.issueIds.push(i.id); }
  for (const d of decisions) if (['dec_adrv001', 'dec_adrv005'].includes(d.id)) d.sprintIds.push('spr_s01');
  const cmp = seedComparison(snap);
  const sources: Source[] = [
    ...repoSources(snap),
    { id: 'src_brief', ...base('Verified', BRIEF), title: 'Owner brief: Art Direction & Build Lab', kind: 'note', path: null, url: null, sha: null, note: 'The master prompt that defined this lab. Its baseline section describes the version 1 build.', text: null, blob: null },
    { id: 'src_deployed', ...base('Verified', 'https://waldo-savannah.vercel.app/', 'Checked 2026-11-16 while building the lab: the deployed HTML references js/game.js and assets.bundle.js, so it serves the illustrated build, not v1.'), title: 'Deployed game (Vercel)', kind: 'url', path: null, url: 'https://waldo-savannah.vercel.app/', sha: null, note: '', text: null, blob: null },
  ];
  return {
    version: 1,
    project: {
      title: "Waldo's Savannah",
      artDirection: 'A busy search-and-find picture-book page set in Savannah, seen from about 50° above, from the south. Warm dark-brown ink line, flat saturated fills, crowds full of small stories. (vibe-coding/sources/art-direction.md)',
      proposedDirection: 'Illustrated 2D world built from original SVG assets with procedural placement (ADR-002). The lab tests whether the current build meets the picture-book bar, one change at a time.',
      currentChallenge: { kind: 'sprint', id: 'spr_s01' }, baselineImage: null, latestApprovedImage: null, owner: '',
      restrictions: 'Unreviewed: whether the course assignment still requires a zero-asset build. Until reviewed, keep the archived v1 game available as the compliant version.',
    },
    sources: by(sources), references: {}, decisions: by(decisions), characters: by(seedCharacters()),
    assets: by((snap.assets ?? []).map(repoAssetRecord)), landmarks: by(seedLandmarks()), zones: {}, stories: by(seedStories()),
    scenes: by([seedScene()]), iterations: {}, clues: by([seedClue()]), reviews: {}, issues: by(issues), sprints: by([seedSprint()]),
    comparisons: cmp ? by([cmp]) : {}, briefs: {}, measurements: {}, checks: {}, auditNotes: {},
    activity: [{ at: now(), text: 'Workspace created from the repository snapshot and the owner brief.' }],
  };
}

/** Bring a saved workspace up to date with a newer repository snapshot without touching the owner's edits. */
export function mergeSnapshot(ws: Workspace, snap: RepoSnapshot): Workspace {
  ws.checks ??= {};
  for (const a of snap.assets ?? []) {
    const rec = repoAssetRecord(a);
    if (!ws.assets[rec.id]) ws.assets[rec.id] = rec;
  }
  for (const s of repoSources(snap)) {
    const cur = ws.sources[s.id];
    if (!cur) ws.sources[s.id] = s;
    else if (cur.sha !== s.sha) { cur.sha = s.sha; cur.updatedAt = now(); cur.rationale = s.rationale; }
  }
  return ws;
}

export const newId = uid;
