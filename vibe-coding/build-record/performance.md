# Performance: illustrated Forsyth Park (checkpoint 2)

Measured 2026-11-15 with `tests/perf.mjs`: a scripted 20 s tour that pans across the park and zooms between 0.6x and 3.5x, with the page opened from `file://`. Numbers that were not measured are marked unknown.

## Setup

| Item | Value |
|---|---|
| Build | `build/index.html` + `build/js/game.js` + `build/js/assets.bundle.js` (art version 1, 84 assets, 889 KB bundle, 57 KB engine) |
| Device | Apple M4, macOS (Darwin 24.6.0) |
| Browser | Installed Google Chrome driven by `playwright-core` 1.49.1, headless, flags `--enable-gpu --use-angle=metal` |
| GPU | ANGLE Metal renderer, Apple M4 (reported by WebGL) |
| Viewport | 1440 × 900 CSS px, device pixel ratio 1 and 2 |
| Seed | `PERF-1`, difficulty normal |

## Results

Load = asset decode, masks and target validation. First frame = load plus the first full draw. Frame times come from `requestAnimationFrame` deltas over the tour; the display caps at 60 Hz, so 16.7 ms is the floor. Feedback = a synthetic click to the second painted frame afterwards.

| Density | People | DPR | Load ms | First frame ms | Avg FPS | p95 frame ms | p99 frame ms | Worst ms | Feedback ms | JS heap MB | Raster MPx |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| low | 181 | 1 | 198 | 215 | 60.0 | 16.7 | 16.8 | 16.8 | 40.7 | 9.5 | 11.6 |
| standard | 361 | 1 | 338 | 352 | 60.0 | 16.7 | 16.8 | 16.8 | 37.1 | 10.7 | 15.3 |
| dense | 601 | 1 | 522 | 553 | 60.0 | 16.7 | 16.8 | 16.8 | 35.1 | 15.4 | 20.6 |
| stress `crowd=2000` | 2,001 | 1 | 307 | 323 | 60.0 | 16.7 | 16.8 | 16.8 | 34.4 | 15.4 | 17.5 |
| stress `crowd=10000` | 10,001 | 1 | 349 | 379 | 59.8 | 16.8 | 16.8 | 49.9 | 36.5 | 51.0 | 19.0 |
| low | 181 | 2 | 191 | 205 | 60.0 | 16.7 | 16.8 | 16.8 | 39.7 | 9.5 | 37.7 |
| standard | 361 | 2 | 330 | 344 | 60.0 | 16.7 | 16.8 | 16.8 | 33.7 | 14.5 | 47.9 |
| dense | 601 | 2 | 514 | 536 | 60.0 | 16.7 | 16.8 | 16.8 | 34.1 | 15.4 | 48.0 |
| stress `crowd=2000` | 2,001 | 2 | 313 | 329 | 60.0 | 16.8 | 16.8 | 16.8 | 31.7 | 14.5 | 48.0 |
| stress `crowd=10000` | 10,001 | 2 | 352 | 381 | 59.7 | 16.8 | 16.8 | 33.4 | 36.5 | 20.7 | 48.0 |

Stress crowds reuse 24 looks per archetype, so 10,000 people need about 370 sprite decodes, not 10,000. At DPR 2 the sprite cache reaches its 48 MPx budget and evicts least-recently-used tiers.

## Re-run with motion (revision 2)

Everyone now moves, so every frame redraws. Same tour, same machine:

| Density | People | DPR | Load ms | First frame ms | Avg FPS | p95 ms | p99 ms | Worst ms | Feedback ms | Heap MB | Raster MPx |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| low | 181 | 1 | 188 | 199 | 60.0 | 16.7 | 16.8 | 16.8 | 39.7 | 9.5 | 11.2 |
| standard | 361 | 1 | 335 | 348 | 60.0 | 16.7 | 16.8 | 16.8 | 34.9 | 13.6 | 15.3 |
| dense | 601 | 1 | 516 | 542 | 60.0 | 16.7 | 16.8 | 33.3 | 36.0 | 17.4 | 20.1 |
| `crowd=2000` | 2,001 | 1 | 315 | 331 | 60.0 | 16.7 | 16.8 | 33.3 | 35.9 | 17.4 | 17.6 |
| `crowd=10000` | 10,001 | 1 | 361 | 392 | 59.5 | 16.8 | 16.8 | 33.4 | 37.9 | 26.3 | 19.2 |
| low | 181 | 2 | 188 | 199 | 60.0 | 16.7 | 16.8 | 16.8 | 40.4 | 9.5 | 36.1 |
| standard | 361 | 2 | 329 | 343 | 60.0 | 16.8 | 16.8 | 16.8 | 37.1 | 11.3 | 47.9 |
| dense | 601 | 2 | 518 | 542 | 59.9 | 16.8 | 16.8 | 50.0 | 37.2 | 22.0 | 47.9 |
| `crowd=2000` | 2,001 | 2 | 317 | 334 | 60.0 | 16.7 | 16.8 | 33.3 | 37.8 | 14.5 | 47.9 |
| `crowd=10000` | 10,001 | 2 | 363 | 395 | 58.8 | 16.8 | 33.3 | 33.4 | 43.9 | 26.3 | 47.9 |

## The whole city (checkpoint 4)

Default scene `savannah`: 3200 × 6700 world, four districts. Same tour keyframes, which cover River Street and City Market at the north end; the Forsyth numbers above still describe the south end. With motion on.

| Density | People | DPR | Load ms | First frame ms | Avg FPS | p95 ms | p99 ms | Worst ms | Feedback ms | Heap MB | Raster MPx | Sprites |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| low | 451 | 1 | 464 | 473 | 60.0 | 16.7 | 16.8 | 16.8 | 46.0 | 19.6 | 7.4 | 514 |
| standard | 901 | 1 | 815 | 839 | 60.0 | 16.7 | 16.8 | 33.4 | 38.9 | 23.4 | 11.3 | 964 |
| dense | 1,501 | 1 | 1,388 | 1,405 | 59.6 | 16.8 | 16.8 | 83.3 | 38.1 | 42.6 | 16.0 | 1,564 |
| `crowd=10000` | 10,001 | 1 | 428 | 450 | 60.0 | 16.7 | 16.8 | 16.8 | 35.9 | 24.8 | 16.5 | 443 |
| standard | 901 | 2 | 803 | 840 | 60.0 | 16.8 | 16.8 | 16.8 | 43.8 | 23.4 | 38.4 | 964 |
| dense | 1,501 | 2 | 1,406 | 1,422 | 59.6 | 16.7 | 16.8 | 66.6 | 34.8 | 29.8 | 47.9 | 1,564 |

Load time now scales with distinct sprites (every person has a unique look up to 2,000 people; stress crowds share looks). The asset bundle is 1.2 MB because the city ground embeds Forsyth's.

### After drawn walk frames (revision 2)

Walking bodies and the target now have a second drawn frame, so about 470 walkers load two sprites each. Large building rows rasterize up to 4.2 MPx per tier instead of 2,048 px wide, so they stay sharp at 3.5x.

| Density | DPR | Load ms | Avg FPS | p95 ms | Worst ms | Raster MPx | Sprites |
|---|---:|---:|---:|---:|---:|---:|---:|
| standard (901) | 1 | 1,410 | 59.6 | 16.7 | 83.3 | 23.4 | 1,443 |
| dense (1,501) | 1 | 2,601 | 59.8 | 16.8 | 50.1 | 30.6 | 2,399 |
| standard (901) | 2 | 1,388 | 59.8 | 16.8 | 50.1 | 48.0 | 1,443 |

Load time is the cost of the second frame; frame rate is unchanged.

## What changed during measurement

- First headless run without the GPU flags: 35 FPS at standard density, frame times in 16.7 ms steps. The page reported no WebGL renderer, which points to software compositing. Timing the draw call itself showed 26 ms per frame at 1.0x zoom.
- Cause: `imageSmoothingQuality = 'high'` while downscaling 480 sprites and the ground every frame. Switched to `'low'` (bilinear); sprite tiers are chosen within 2x of the drawn size, so edges stay clean. Draw cost at 1.0x fell from 26 ms to 6 ms in the same software setup.
- Crowd spacing was O(n²) and would not have built a 10,000 crowd. It now uses a 64-unit spatial hash.

## Unknown or not yet measured

- Phones and tablets (no physical device tested). Mobile Safari and Firefox.
- A headed browser window (all runs were headless; the GPU run uses the real Metal device).
- Long-session memory growth beyond the 20 s tour.
- Cost of drawn animation frames (not built yet; current motion is procedural).

## Overhaul: camera, Bull Street city, new art (2026-11-16)

Same machine and method as above (`tests/perf.mjs`, Apple M4, headless Chrome with the Metal GPU flags, 1440 × 900, DPR 1, seed `PERF-1`, city scene). The tour's 0.6x keyframes are now clamped to the viewport-cover zoom, so the camera never shows blank edges during the run.

| Run | People | Load ms | Avg FPS | p95 ms | p99 ms | Worst ms | Heap MB |
|---|---:|---:|---:|---:|---:|---:|---:|
| before, standard | 901 | 1467 | 59.8 | 16.7 | 16.8 | 100.0 | 35.6 |
| after, standard | 901 | 1529 | 59.6 | 16.8 | 16.8 | 66.7 | 31.6 |
| after, dense | 1,501 | 2579 | 59.6 | 16.7 | 16.8 | 66.6 | 54.2 |
| after, `crowd=2000` | 2,001 | 3704 | 59.2 | 16.7 | 16.8 | 83.3 | 61.0 |

The display caps at 60 Hz, so these show headroom on this laptop only. Phones and older laptops were not measured. An earlier 41 FPS figure came from the lab's iframe without GPU flags and is not comparable.

## Wider city, 9120 × 7600 (2026-11-16, later)

Same method and machine. The crowd budget doubled with the area (standard 1,800, dense 3,000).

| Run | People | Load ms | Avg FPS | p95 ms | Worst ms | Heap MB |
|---|---:|---:|---:|---:|---:|---:|
| standard | 1,801 | 3838 | 59.0 | 16.8 | 216.6 | 68.9 |
| dense | 3,001 | 4560 | 59.1 | 16.8 | 116.6 | 92.9 |

Loading takes about 2.5 times longer than the 3200-wide city (1529 ms). Expect noticeably longer loads on slower laptops and phones, which were not measured. The worst frames are one-off hitches while ground tiles are drawn the first time.

### After load & frame optimization (2026-11-16, final)

SVG `<pattern>` fills and safe path compaction cut `assets.bundle.js` from 6.94 MB (1.03 MB gzip) to 2.89 MB (310 KB gzip). Deferred walk-frame decoding, lazy hit-mask rasterization, crowd look pooling (up to 40 looks per archetype for crowds > 650), and a 400-tile LRU ground cache cut startup load by ~7x on the 9120 × 7600 city:

| Run | People | Load ms | First frame ms | Avg FPS | p95 ms | Worst ms | Feedback ms | Heap MB | Raster MPx |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| standard | 1,801 | 565 | 595 | 59.6 | 16.7 | 66.7 | 38.1 | 28.0 | 33.7 |
| dense | 3,001 | 564 | 602 | 59.7 | 16.7 | 66.6 | 38.4 | 31.6 | 34.1 |

