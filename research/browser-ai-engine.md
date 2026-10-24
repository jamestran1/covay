# Research: which Go AI engine can run fully client-side in the browser

Ticket: [jamestran1/covay#2](https://github.com/jamestran1/covay/issues/2) (map: [#1](https://github.com/jamestran1/covay/issues/1))
Researched: 2026-10-24. Sources are repos, READMEs, license pages and npm metadata, linked inline.

## Question

For a beginner-focused Go learning PWA (TypeScript, React + Vite, no backend), which engine can run fully in the browser? Compare download size, speed, ability to play deliberately weak, license, maintenance, and whether it exposes an ownership map usable for dead-stone detection under Chinese area scoring. The rules engine stays hand-written in the domain layer; the AI sits behind an application-layer port.

## TL;DR

- **Recommendation: KataGo networks evaluated in the browser, behind our own `GoEngine` port.** Start with the tiny `g170 b6c96` net (about 3.6 MB gzipped, CC0) evaluated with TensorFlow.js (WebGPU, falling back to WASM) and make it weak with policy-based strategies (KaTrain "calibrated rank" style). Add the optional KataGo **Human SL** net (about 94.5 MiB, MIT-style license) later as a downloadable "play like a 20k / 15k / 10k" pack. Ownership comes from the same forward pass and directly gives dead-stone marking for area scoring.
- **Fallback: `@sabaki/deadstones`** (MIT, Rust to WASM, about 40 KB unpacked) for scoring/dead stones plus a **hand-written simple bot** (random-legal with eye protection, or capture-greedy heuristics) for the very first lessons. This has zero model download and no license risk.
- **Rejected as primary:** GNU Go WASM (GPLv3, unmaintained since 2009, no ownership output), Pachi WASM (GPL-2.0, no ownership heatmap in the browser build), Leela Zero (GPLv3, no browser port, no ownership/score head).

## Candidates compared

| Candidate | Download (engine + weights) | Speed (measured, source) | Weak-play control | License | Maintenance | Ownership map |
|---|---|---|---|---|---|---|
| KataGo nets via TensorFlow.js ([Sir-Teo/web-katrain](https://github.com/Sir-Teo/web-katrain)) | TF.js WASM/WebGPU backend + 3.6 MB (b6c96) or about 96 MB (b18c384nbt) | No published numbers; README says the small net "can boot quickly on ordinary laptops and phones" | KaTrain strategies (`rank`, `policy`, `weighted`, `scoreloss`, ...) plus `human` strategy using Human SL `rank_20k` to `rank_9d` | App MIT; KataGo nets MIT-style, g170 nets CC0; TF.js Apache-2.0 | Active (pushed 2026-10-21), but 27 stars, single maintainer | Yes: root/tree ownership, ownership stddev |
| KataGo C++ compiled to WASM, Eigen CPU ([toyoshi/katago-wasm](https://github.com/toyoshi/katago-wasm)) | `katago.wasm` 5.4 MiB + `katago.js` 132 KiB + net | b6c96, 9x9, 400 visits: 141 to 156 visits/s in Firefox/Chromium; 125 visits/s on Apple M2 Safari (about 3.2 s per 400 visits) | Full KataGo config incl. `humanSLProfile` (Human SL verified to load in Safari) | Wrapper MIT; KataGo MIT-style | Spike only (created 2026-07-26, 0 stars); iPad untested | Yes (KataGo analysis engine) |
| KataGo WebGPU backend ([saigo-online/katago-webgpu](https://github.com/saigo-online/katago-webgpu)) | One `kataeval.wasm` with WebGPU + Eigen fallback + net (b5c192 default up to b18c384nbt) | Native GB10: 418 to 1814 nnEvals/s by batch size; browser numbers in its `WEBGPU_STATUS.md` | Full KataGo search in threaded build; net selector as strength knob | MIT-style (same as KataGo) | Active but very new (3 stars); WebGPU needs secure context | Yes (value head ownership) |
| Bare KataGo net, no search ([maksimKorzh/go](https://github.com/maksimKorzh/go)) | b6c96 about 4 MB; b10c128 about 11 MB | Single forward pass per move | Two fixed levels: "around OGS 5 kyu" (b6) and "around OGS 1 dan" (b10) | No license on repo (cannot reuse code) | Low activity | Net has it, app does not expose it |
| GNU Go via Emscripten ([TristanCacqueray/wasm-gnugo](https://github.com/TristanCacqueray/wasm-gnugo), [dna2ai/gnugo.js](https://github.com/dna2ai/gnugo.js)) | Small (no NN), exact size not published | Fast, classical | `--level` only; about 5 to 7 kyu on 9x9 ([Wikipedia](https://en.wikipedia.org/wiki/GNU_Go)) | GPLv3 (gnugo.js repo says MIT but it is a GNU Go derivative, so GPLv3 applies) | Ports last pushed 2024 and 2021; upstream last release 3.8 (2009) | No ownership map; has its own scoring/dead-stone estimate via `score` |
| Pachi `nodcnn` to WASM ([saigo-online/pachi-web](https://github.com/saigo-online/pachi-web)) | "~1 MB of assets" | MCTS, playout-bound | Pachi has fixed-strength options; "competent amateur-dan" at full strength | GPL-2.0 | New port (0 stars); upstream [pasky/pachi](https://github.com/pasky/pachi) active | **No** ownership heatmap; dead stones yes; score "crude only" (its own capability table) |
| Leela Zero ([leela-zero/leela-zero](https://github.com/leela-zero/leela-zero)) | Nets tens of MB | No maintained browser port found (only [zliu1022/Webgo](https://github.com/zliu1022/Webgo), which is a web UI to a server-side LZ, AGPL-3.0) | Only via visits/net size | GPLv3 | Upstream last push 2024-05 | **No** (winrate only, no score/ownership head) |
| `@sabaki/deadstones` ([SabakiHQ/deadstones](https://github.com/SabakiHQ/deadstones)) | npm 2.2.0, 40,798 bytes unpacked | Monte Carlo playouts, 100 by default | Not a player | MIT | Active (2.2.0 published 2026-07-07) | `getProbabilityMap` in [-1, 1] per point; `guess()` returns dead stones |

## Findings per criterion

### 1. Download size

- The g170 `b6c96` net that web-katrain ships is "about 3.6 MB compressed" ([web-katrain README](https://github.com/Sir-Teo/web-katrain#models-and-performance)); maksimKorzh/go lists it as "~4MB" and b10c128 as "~11MB" ([README](https://github.com/maksimKorzh/go)).
- Strong nets are large: `kata1-b18c384nbt-...bin.gz` is about 96 MB; web-katrain caps uploads at 128 MB ([README](https://github.com/Sir-Teo/web-katrain#models-and-performance)).
- Human SL net `b18c384nbt-humanv0.bin.gz` is 94.5 MiB ([toyoshi/katago-wasm README](https://github.com/toyoshi/katago-wasm#browser-build)). Its official download does not send CORS headers, so we must self-host it ([web-katrain docs/engine.md](https://github.com/Sir-Teo/web-katrain/blob/main/docs/engine.md#human-like-moves)).
- KataGo itself compiled to WASM: `katago.wasm` 5.4 MiB ([BENCHMARK.md](https://github.com/toyoshi/katago-wasm/blob/main/BENCHMARK.md)).
- Pachi WASM: about 1 MB ([pachi-web README](https://github.com/saigo-online/pachi-web)).
- Small extra net "Lionffen b6c64" is optimized for speed but "trained specifically for 19x19 and might NOT perform well on any other board sizes" ([extra networks](https://katagotraining.org/extra_networks/)), so it is a poor fit for a 9x9-first beginner app.

### 2. Speed

- Only hard browser numbers found: KataGo Eigen WASM with SIMD, b6c96, 9x9, 400 visits, one thread: median 148 visits/s (Node, ARM Cortex-X925), 141 to 156 visits/s in Firefox/Chromium, 125 visits/s in Safari on an M2 Mac mini. Without `-msimd128` it drops to about 106 visits/s ([BENCHMARK.md](https://github.com/toyoshi/katago-wasm/blob/main/BENCHMARK.md)).
- No published phone measurement for any candidate. iPad is "untested" in katago-wasm. This is the main open risk and should be a spike.
- For beginner play we do not need search: a single policy forward pass of a b6 net per move is enough (maksimKorzh/go plays "bare net", no MCTS, at about 5 kyu). That makes phone latency far less critical than for analysis.
- Threaded WASM needs `SharedArrayBuffer`, which needs COOP/COEP headers (`same-origin` / `require-corp`). Without them it runs single-threaded; WebGPU is unaffected ([web-katrain README](https://github.com/Sir-Teo/web-katrain#models-and-performance)). Our static host must be able to set these headers.

### 3. Playing deliberately weak

- The bare b6c96 policy is already about OGS 5 kyu ([maksimKorzh/go](https://github.com/maksimKorzh/go)), too strong for real beginners, so a weakening layer is mandatory.
- KataGo Human SL: profiles `rank_20k` to `rank_9d` (and `preaz_*`, `proyear_*`) imitate players of that rank ([gtp_human5k_example.cfg](https://github.com/lightvector/KataGo/blob/master/cpp/configs/gtp_human5k_example.cfg), [KataGo README](https://github.com/lightvector/KataGo#human-style-play-and-analysis)). KataGo describes it as predicting "human moves across players of all different ranks" and suggests uses in "teaching tools for mistakes" ([extra networks](https://katagotraining.org/extra_networks/)). This is the best-fit tool for a learning app, but costs 94.5 MiB.
- katago-wasm found Human SL "viable as an additional policy evaluation, but not as the primary 400-visit search model on the Eigen WebAssembly backend" ([README](https://github.com/toyoshi/katago-wasm#browser-build)). Sampling the human policy needs one evaluation per move, which matches that finding.
- KaTrain's "Calibrated Rank Bot" was "calibrated on various bots (e.g. GnuGo and Pachi at different strength settings)" and avoids "serious (DDK) blunders" ([KaTrain README](https://github.com/sanderland/katrain), MIT). web-katrain ports these strategies to TypeScript and shows a calibrated rank estimate per setting. Policy-only strategies (`policy`, `weighted`, `rank`) need no search and work with the tiny net.
- GNU Go and Pachi expose only coarse level/strength knobs.

### 4. License compatibility (open-source app)

- KataGo code: MIT-style permission text ([LICENSE](https://github.com/lightvector/KataGo/blob/master/LICENSE)).
- KataGo nets (kata1 run and "KataGo" extra nets incl. Human SL): "KataGo Neural Network License", MIT-style, notice must be kept. g170 nets are CC0 ([network license](https://katagotraining.org/network_license/)). The shipped b6c96 is a g170 net, so no notice burden.
- TensorFlow.js: Apache-2.0 (npm `@tensorflow/tfjs` 4.22.0).
- web-katrain: MIT, so its TS feature extraction, model parser and MCTS can be vendored with attribution.
- GNU Go GPLv3, Leela Zero GPLv3, Pachi GPL-2.0: bundling them forces the distributed app under GPL. Avoid unless the project chooses GPL.

### 5. Maintenance

- KataGo upstream active (5.2k stars, pushed 2026-09-28). KaTrain active (pushed 2026-10-05).
- Browser ports are all young and small: web-katrain (27 stars, active), katago-webgpu (3 stars), katago-wasm (spike). Treat them as reference code to vendor, not as dependencies.
- `@tensorflow/tfjs` latest 4.22.0 is from 2024-10-21, about two years old. Usable, but it is a stale dependency; a KataGo-native WASM path (katago-wasm or katago-webgpu) is the hedge.
- GNU Go upstream frozen since 3.8 (2009); its WASM ports last pushed 2021 and 2024.

### 6. Ownership map and dead stones under Chinese area scoring

- KataGo's value head outputs per-point ownership; `kata-analyze` reports "a heatmap of the predicted territory ownership of every location of the board" ([KataGo README](https://github.com/lightvector/KataGo)). web-katrain returns ownership and ownership stddev in modes `none` / `root` / `tree`, and its tests assert that "under area scoring the ownership map sums to black's area minus white's" ([docs/engine.md](https://github.com/Sir-Teo/web-katrain/blob/main/docs/engine.md#verifying-evaluation-accuracy)). Dead stones = stones whose point ownership strongly favours the opponent (threshold, for example |v| > 0.6, to be tuned in a spike).
- Feature extraction includes "area features for Chinese rules", so the net is told the rule set ([docs/engine.md](https://github.com/Sir-Teo/web-katrain/blob/main/docs/engine.md#feature-extraction)).
- web-katrain notes that after two passes under area scoring it counts the board exactly rather than trusting the net; our domain rules engine should own final counting the same way, with ownership only proposing dead stones for the player to confirm.
- `@sabaki/deadstones.getProbabilityMap` gives the same shape of data (per-point value in [-1, 1]) without any NN, and `guess({finished: true})` is designed for completed games ([README](https://github.com/SabakiHQ/deadstones)).
- Pachi WASM: dead stones yes, ownership heatmap no ([pachi-web capability table](https://github.com/saigo-online/pachi-web)). Leela Zero: no ownership at all.

## Recommendation

1. Define an application-layer port, for example `GoEngine` with `suggestMove(position, strength)` and `ownership(position)`, and a capability flag set (the pachi-web README shows the same pattern: gate features on `capabilities.ownership`, not on engine identity).
2. First adapter: **KataGo net in a Web Worker via TensorFlow.js**, porting the needed parts of web-katrain (MIT): model parser, input features, policy/ownership readout. Ship g170 `b6c96` (about 3.6 MB, CC0) precached by the service worker. Beginner strength via policy-based weakening (KaTrain `rank`/`weighted`), no MCTS needed for play.
3. Optional pack: KataGo Human SL (94.5 MiB, self-hosted for CORS, MIT-style notice) for "play like rank_20k ... rank_10k" once users are past the first lessons.
4. Scoring: the domain rules engine counts area exactly; dead stones are proposed from KataGo ownership (or deadstones fallback) and confirmed by the player.

## Fallback

`@sabaki/deadstones` (MIT, about 40 KB) for dead-stone proposal plus a hand-written TypeScript bot for the very weakest levels (random legal moves that do not fill own eyes, prefer captures/ataris). Zero model download, works on any device, no COOP/COEP, and it plugs into the same port. If the TF.js path proves too slow or stale, swap the adapter for a KataGo-native WASM build ([toyoshi/katago-wasm](https://github.com/toyoshi/katago-wasm) or [saigo-online/katago-webgpu](https://github.com/saigo-online/katago-webgpu)) without touching the domain.

## Open questions (for a spike)

- Measured latency of one b6c96 policy+ownership evaluation on a mid-range Android phone and an iPhone (TF.js WASM single-threaded vs WebGPU). No primary source has this.
- Ownership threshold for dead-stone proposals on 9x9 beginner games, and how often it disagrees with `@sabaki/deadstones`.
- Whether `rank_20k` Human SL play is actually beatable by a true beginner (20k is the floor of the profiles), or whether the hand-written bot is still needed below that.
- Can our static host set COOP/COEP headers (affects threaded WASM only)?
