import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgpu';
import { getThreadsCount, setWasmPaths } from '@tensorflow/tfjs-backend-wasm';
import { parseKataGoModelV8 } from './katago/loadModelV8';
import { KataGoModelV8Tf } from './katago/modelV8';
import { encodeInputs, GLOBAL_CHANNELS, parseDiagram, SPATIAL_CHANNELS } from './katago/features';
import { gtpCoord, POSITIONS, type BenchPosition } from './positions';

const BASE = import.meta.env.BASE_URL;
const MODEL_URL = `${BASE}models/g170-b6c96.bin.gz`;
setWasmPaths(`${BASE}tfjs/`);

export const BACKENDS = ['webgpu', 'wasm'] as const;
export type BackendName = (typeof BACKENDS)[number];
export const SIZES = [9, 19] as const;
export const TIMED_PASSES = 30;

export type LoadTiming = { fetchMs: number; parseMs: number; uploadMs: number; totalMs: number };

export type SizeResult = {
  size: number;
  warmupMs: number;
  medianMs: number;
  p95Ms: number;
  minMs: number;
  passes: number;
};

export type Sanity = {
  position: string;
  toMove: string;
  stones: number;
  top3: { move: string; prob: number; occupied: boolean }[];
  passProb: number;
  /** Sum of tanh(ownership) over the board, black positive. */
  ownershipSumBlack: number;
  winrateToMove: number;
};

export type BackendResult =
  | { backend: BackendName; ok: true; load: LoadTiming; sizes: SizeResult[]; sanity: Sanity[]; wasm?: WasmInfo }
  | { backend: BackendName; ok: false; reason: string };

export type WasmInfo = { simd: boolean; threads: boolean; threadsCount: number; crossOriginIsolated: boolean };

export type Progress = (text: string, fraction: number) => void;

const nextFrame = () => new Promise<void>((r) => setTimeout(r, 0));

async function gunzipIfNeeded(bytes: Uint8Array): Promise<Uint8Array> {
  if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) return bytes; // server already decoded it
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function loadModel(): Promise<{ model: KataGoModelV8Tf; load: LoadTiming }> {
  const t0 = performance.now();
  const res = await fetch(MODEL_URL);
  if (!res.ok) throw new Error(`Không tải được model: ${res.status}`);
  const raw = new Uint8Array(await res.arrayBuffer());
  const t1 = performance.now();
  const parsed = parseKataGoModelV8(await gunzipIfNeeded(raw));
  const t2 = performance.now();
  const model = new KataGoModelV8Tf(parsed);
  const t3 = performance.now();
  return { model, load: { fetchMs: t1 - t0, parseMs: t2 - t1, uploadMs: t3 - t2, totalMs: t3 - t0 } };
}

type Prepared = { pos: BenchPosition; stones: Uint8Array; spatial: Float32Array; global: Float32Array };

function prepare(pos: BenchPosition): Prepared {
  const stones = parseDiagram(pos.diagram);
  const { spatial, global } = encodeInputs({ stones, size: pos.size, toMove: pos.toMove });
  return { pos, stones, spatial, global };
}

/** One forward pass including input upload and output download. */
async function forwardOnce(model: KataGoModelV8Tf, p: Prepared) {
  const size = p.pos.size;
  const t0 = performance.now();
  const spatial = tf.tensor4d(p.spatial, [1, size, size, SPATIAL_CHANNELS]);
  const global = tf.tensor2d(p.global, [1, GLOBAL_CHANNELS]);
  const out = model.forward(spatial, global);
  const [policy, pass, ownership, value] = await Promise.all([
    out.policy.data(),
    out.policyPass.data(),
    out.ownership.data(),
    out.value.data(),
  ]);
  const ms = performance.now() - t0;
  const policyChannels = out.policy.shape[3];
  tf.dispose([spatial, global, out.policy, out.policyPass, out.value, out.scoreValue, out.ownership]);
  return { ms, policy, policyChannels, pass: pass[0], ownership, value };
}

function sanityOf(p: Prepared, r: Awaited<ReturnType<typeof forwardOnce>>): Sanity {
  const size = p.pos.size;
  const area = size * size;
  const logits: number[] = [];
  for (let i = 0; i < area; i++) logits.push(r.policy[i * r.policyChannels]); // channel 0: main policy
  logits.push(r.pass);
  const max = Math.max(...logits);
  const exps = logits.map((l) => Math.exp(l - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  const probs = exps.map((e) => e / sum);
  const top3 = probs
    .slice(0, area)
    .map((prob, i) => ({ i, prob }))
    .sort((a, b) => b.prob - a.prob)
    .slice(0, 3)
    .map(({ i, prob }) => ({
      move: gtpCoord(i % size, (i / size) | 0, size),
      prob,
      occupied: p.stones[i] !== 0,
    }));
  const sign = p.pos.toMove === 'black' ? 1 : -1;
  let ownershipSumBlack = 0;
  for (let i = 0; i < area; i++) ownershipSumBlack += sign * Math.tanh(r.ownership[i]);
  const v = Array.from(r.value);
  const vmax = Math.max(...v);
  const ve = v.map((x) => Math.exp(x - vmax));
  const winrateToMove = ve[0] / ve.reduce((a, b) => a + b, 0);
  return {
    position: p.pos.name,
    toMove: p.pos.toMove === 'black' ? 'Đen' : 'Trắng',
    stones: p.stones.reduce((a, s) => a + (s ? 1 : 0), 0),
    top3,
    passProb: probs[area],
    ownershipSumBlack,
    winrateToMove,
  };
}

function stats(samples: number[]) {
  const s = [...samples].sort((a, b) => a - b);
  const median = s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
  const p95 = s[Math.min(s.length - 1, Math.ceil(0.95 * s.length) - 1)];
  return { median, p95, min: s[0] };
}

async function wasmInfo(): Promise<WasmInfo> {
  return {
    simd: Boolean(await tf.env().getAsync('WASM_HAS_SIMD_SUPPORT')),
    threads: Boolean(await tf.env().getAsync('WASM_HAS_MULTITHREAD_SUPPORT')),
    threadsCount: getThreadsCount(),
    crossOriginIsolated: self.crossOriginIsolated === true,
  };
}

async function useBackend(name: BackendName): Promise<string | null> {
  if (name === 'webgpu' && !('gpu' in navigator)) return 'Trình duyệt không có navigator.gpu';
  try {
    const ok = await tf.setBackend(name);
    await tf.ready();
    if (!ok || tf.getBackend() !== name) return `Khởi tạo backend ${name} thất bại`;
    return null;
  } catch (e) {
    return `Khởi tạo backend ${name} lỗi: ${e instanceof Error ? e.message : String(e)}`;
  }
}

export async function runBackend(name: BackendName, progress: Progress, base: number, span: number): Promise<BackendResult> {
  progress(`${name}: khởi tạo backend`, base);
  const reason = await useBackend(name);
  if (reason) return { backend: name, ok: false, reason };

  progress(`${name}: tải model`, base);
  const { model, load } = await loadModel();
  const sizes: SizeResult[] = [];
  const sanity: Sanity[] = [];
  try {
    for (const [si, size] of SIZES.entries()) {
      const set = POSITIONS[size];
      const positions = [prepare(set.empty), prepare(set.midgame)];

      progress(`${name} ${size}x${size}: lượt chạy đầu (warm-up)`, base + (span * si) / SIZES.length);
      const warm = await forwardOnce(model, positions[1]);
      sanity.push(sanityOf(positions[1], warm));
      sanity.push(sanityOf(positions[0], await forwardOnce(model, positions[0])));

      const samples: number[] = [];
      for (let i = 0; i < TIMED_PASSES; i++) {
        await nextFrame();
        const r = await forwardOnce(model, positions[i % positions.length]);
        samples.push(r.ms);
        const frac = (si + (i + 1) / TIMED_PASSES) / SIZES.length;
        progress(`${name} ${size}x${size}: lượt ${i + 1}/${TIMED_PASSES}`, base + span * frac);
      }
      const st = stats(samples);
      sizes.push({ size, warmupMs: warm.ms, medianMs: st.median, p95Ms: st.p95, minMs: st.min, passes: samples.length });
    }
    const wasm = name === 'wasm' ? await wasmInfo() : undefined;
    return { backend: name, ok: true, load, sizes, sanity, wasm };
  } finally {
    model.dispose();
  }
}

export type GpuInfo = { vendor: string; architecture: string; device: string; description: string } | null;

export async function webGpuAdapterInfo(): Promise<GpuInfo> {
  // Typed loosely so the project does not need @webgpu/types.
  const gpu = (navigator as unknown as { gpu?: { requestAdapter(): Promise<unknown> } }).gpu;
  if (!gpu) return null;
  try {
    const adapter = (await gpu.requestAdapter()) as
      | { info?: Record<string, string>; requestAdapterInfo?: () => Promise<Record<string, string>> }
      | null;
    if (!adapter) return null;
    const info = adapter.info ?? (await adapter.requestAdapterInfo?.()) ?? {};
    return {
      vendor: info.vendor ?? '',
      architecture: info.architecture ?? '',
      device: info.device ?? '',
      description: info.description ?? '',
    };
  } catch {
    return null;
  }
}
