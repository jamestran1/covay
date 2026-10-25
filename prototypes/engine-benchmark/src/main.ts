import './style.css';
import { BACKENDS, runBackend, TIMED_PASSES, webGpuAdapterInfo, type BackendResult, type GpuInfo, type Sanity } from './bench';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const runBtn = $<HTMLButtonElement>('run');
const copyBtn = $<HTMLButtonElement>('copy');
const nameInput = $<HTMLInputElement>('device-name');
const progressBox = $<HTMLDivElement>('progress-box');
const progressBar = $<HTMLProgressElement>('progress');
const statusEl = $<HTMLParagraphElement>('status');
const resultsEl = $<HTMLElement>('results');
const markdownEl = $<HTMLTextAreaElement>('markdown');
const copyStatus = $<HTMLParagraphElement>('copy-status');

const fmt = (ms: number) => ms.toFixed(1);
const pct = (p: number) => `${(p * 100).toFixed(1)}%`;

type Env = { userAgent: string; cores: string; memory: string; gpu: GpuInfo; when: string };

let last: { results: BackendResult[]; env: Env } | null = null;

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

function sanityLine(s: Sanity) {
  const moves = s.top3
    .map((m) => `${m.move} ${pct(m.prob)}${m.occupied ? ' (ô đã có quân!)' : ''}`)
    .join(', ');
  return (
    `${s.position} (${s.stones} quân, ${s.toMove} đi): top 3 = ${moves}; pass ${pct(s.passProb)}; ` +
    `tổng ownership (Đen dương) = ${s.ownershipSumBlack.toFixed(1)}; tỉ lệ thắng bên đi = ${pct(s.winrateToMove)}`
  );
}

function gpuText(gpu: GpuInfo) {
  if (!gpu) return 'không có';
  const parts = [gpu.vendor, gpu.architecture, gpu.device, gpu.description].filter(Boolean);
  return parts.length ? parts.join(' / ') : 'có adapter, trình duyệt ẩn thông tin';
}

function wasmText(results: BackendResult[]) {
  const w = results.find((r) => r.backend === 'wasm' && r.ok);
  if (!w || !w.ok || !w.wasm) return 'không chạy';
  const { simd, threads, threadsCount, crossOriginIsolated } = w.wasm;
  return (
    `SIMD ${simd ? 'có' : 'không'}, threads ${threads ? `có (${threadsCount})` : 'không'}` +
    `, crossOriginIsolated=${crossOriginIsolated}` +
    (threads ? '' : ' (GitHub Pages không đặt được COOP/COEP nên WASM chạy 1 luồng, như dự kiến)')
  );
}

function toMarkdown(results: BackendResult[], env: Env, deviceName: string) {
  const lines: string[] = [];
  lines.push(`### Benchmark KataGo TF.js: ${deviceName.trim() || '(chưa ghi tên máy)'}`);
  lines.push('');
  lines.push(`Mạng \`g170-b6c96\`, một lượt suy luận (policy + ownership), không MCTS. ${TIMED_PASSES} lượt đo mỗi cấu hình.`);
  lines.push('');
  lines.push('| Backend | Bàn | Lượt đầu (ms) | Median (ms) | p95 (ms) | Min (ms) |');
  lines.push('|---|---|---:|---:|---:|---:|');
  for (const r of results) {
    if (!r.ok) {
      lines.push(`| ${r.backend} | bỏ qua | ${r.reason} | | | |`);
      continue;
    }
    for (const s of r.sizes) {
      lines.push(`| ${r.backend} | ${s.size}x${s.size} | ${fmt(s.warmupMs)} | ${fmt(s.medianMs)} | ${fmt(s.p95Ms)} | ${fmt(s.minMs)} |`);
    }
  }
  lines.push('');
  lines.push('| Backend | Tải model (ms) | fetch | parse | upload weights |');
  lines.push('|---|---:|---:|---:|---:|');
  for (const r of results) {
    if (!r.ok) continue;
    const l = r.load;
    lines.push(`| ${r.backend} | ${fmt(l.totalMs)} | ${fmt(l.fetchMs)} | ${fmt(l.parseMs)} | ${fmt(l.uploadMs)} |`);
  }
  lines.push('');
  lines.push('Môi trường:');
  lines.push(`- Tên máy: ${deviceName.trim() || '(chưa ghi)'}`);
  lines.push(`- User agent: \`${env.userAgent}\``);
  lines.push(`- hardwareConcurrency: ${env.cores}`);
  lines.push(`- deviceMemory: ${env.memory}`);
  lines.push(`- WASM: ${wasmText(results)}`);
  lines.push(`- WebGPU adapter: ${gpuText(env.gpu)}`);
  lines.push(`- Thời điểm: ${env.when}`);
  lines.push('');
  lines.push('Kiểm tra hợp lý:');
  for (const r of results) {
    if (!r.ok) continue;
    for (const s of r.sanity) lines.push(`- ${r.backend}, ${sanityLine(s)}`);
  }
  return lines.join('\n');
}

function render(results: BackendResult[], env: Env) {
  const timing = $<HTMLTableElement>('timing');
  let html =
    '<thead><tr><th>Backend</th><th>Bàn</th><th>Lượt đầu</th><th>Median</th><th>p95</th><th>Min</th></tr></thead><tbody>';
  for (const r of results) {
    if (!r.ok) {
      html += `<tr><td>${r.backend}</td><td colspan="5" class="skip">Bỏ qua: ${escapeHtml(r.reason)}</td></tr>`;
      continue;
    }
    for (const s of r.sizes) {
      html += `<tr><td>${r.backend}</td><td>${s.size}x${s.size}</td><td>${fmt(s.warmupMs)}</td><td>${fmt(s.medianMs)}</td><td>${fmt(s.p95Ms)}</td><td>${fmt(s.minMs)}</td></tr>`;
    }
  }
  timing.innerHTML = `${html}</tbody><caption>Thời gian (ms) một lượt suy luận, ${TIMED_PASSES} lượt đo</caption>`;

  const loading = $<HTMLTableElement>('loading');
  let lh = '<thead><tr><th>Backend</th><th>Tải model</th><th>fetch</th><th>parse</th><th>upload</th></tr></thead><tbody>';
  for (const r of results) {
    if (!r.ok) continue;
    const l = r.load;
    lh += `<tr><td>${r.backend}</td><td>${fmt(l.totalMs)}</td><td>${fmt(l.fetchMs)}</td><td>${fmt(l.parseMs)}</td><td>${fmt(l.uploadMs)}</td></tr>`;
  }
  loading.innerHTML = `${lh}</tbody><caption>Thời gian tải model (ms)</caption>`;

  const sanity = $<HTMLDivElement>('sanity');
  sanity.innerHTML = results
    .filter((r): r is Extract<BackendResult, { ok: true }> => r.ok)
    .map((r) => `<p><strong>${r.backend}</strong></p><ul>${r.sanity.map((s) => `<li>${escapeHtml(sanityLine(s))}</li>`).join('')}</ul>`)
    .join('');

  $<HTMLUListElement>('env').innerHTML = [
    `User agent: ${escapeHtml(env.userAgent)}`,
    `hardwareConcurrency: ${env.cores}`,
    `deviceMemory: ${env.memory}`,
    `WASM: ${escapeHtml(wasmText(results))}`,
    `WebGPU adapter: ${escapeHtml(gpuText(env.gpu))}`,
  ]
    .map((t) => `<li>${t}</li>`)
    .join('');

  resultsEl.hidden = false;
  markdownEl.value = toMarkdown(results, env, nameInput.value);
}

async function run() {
  runBtn.disabled = true;
  copyStatus.textContent = '';
  progressBox.hidden = false;
  const progress = (text: string, fraction: number) => {
    statusEl.textContent = text;
    progressBar.value = fraction;
  };
  try {
    const nav = navigator as Navigator & { deviceMemory?: number };
    const env: Env = {
      userAgent: navigator.userAgent,
      cores: String(navigator.hardwareConcurrency ?? 'không rõ'),
      memory: nav.deviceMemory ? `${nav.deviceMemory} GB` : 'không rõ',
      gpu: await webGpuAdapterInfo(),
      when: new Date().toISOString(),
    };
    const results: BackendResult[] = [];
    const span = 1 / BACKENDS.length;
    for (const [i, backend] of BACKENDS.entries()) {
      try {
        results.push(await runBackend(backend, progress, i * span, span));
      } catch (e) {
        results.push({ backend, ok: false, reason: e instanceof Error ? e.message : String(e) });
      }
    }
    last = { results, env };
    render(results, env);
    progress('Xong.', 1);
    document.body.dataset.benchDone = 'true';
  } catch (e) {
    progress(`Lỗi: ${e instanceof Error ? e.message : String(e)}`, 0);
  } finally {
    runBtn.disabled = false;
  }
}

async function copy() {
  if (!last) return;
  const md = toMarkdown(last.results, last.env, nameInput.value);
  markdownEl.value = md;
  try {
    await navigator.clipboard.writeText(md);
    copyStatus.textContent = 'Đã copy. Mở ticket và dán vào một comment.';
  } catch {
    markdownEl.select();
    const ok = document.execCommand('copy');
    copyStatus.textContent = ok ? 'Đã copy.' : 'Không copy tự động được, hãy chọn và copy nội dung bên dưới.';
  }
}

runBtn.addEventListener('click', () => void run());
copyBtn.addEventListener('click', () => void copy());
nameInput.addEventListener('input', () => {
  if (last) markdownEl.value = toMarkdown(last.results, last.env, nameInput.value);
});
