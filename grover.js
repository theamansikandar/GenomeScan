const N_STATES = 8;
const TARGET_IDX = 3; 
const AMPLITUDE_DATA = {
  0: { 
    heights: Array(N_STATES).fill(1 / Math.sqrt(N_STATES)),
    color: 'var(--green-light)',
    label: 'Equal superposition'
  },
  1: { 
    heights: Array(N_STATES).fill(1 / Math.sqrt(N_STATES)).map((v, i) => i === TARGET_IDX ? -v : v),
    color: 'var(--amber)',
    label: 'Oracle applied'
  },
  2: { 
    heights: (() => {
      const base = 1 / Math.sqrt(N_STATES);
      const mean = ((N_STATES - 1) * base - base) / N_STATES; 
      return Array(N_STATES).fill(0).map((_, i) => {
        const a = i === TARGET_IDX ? -base : base;
        return 2 * mean - a;
      });
    })(),
    color: 'var(--green-mid)',
    label: 'Amplified after diffusion'
  },
  3: { 
    heights: Array(N_STATES).fill(0).map((_, i) => i === TARGET_IDX ? 0.97 : 0.04),
    color: 'var(--green)',
    label: 'Ready for measurement'
  }
};

let groverStep = 0;

function renderGroverBars(stepIdx) {
  const ids = ['amp-init', 'amp-oracle', 'amp-diffuse', 'amp-measure'];
  const data = AMPLITUDE_DATA[stepIdx];

  ids.forEach((id, si) => {
    const el = document.getElementById(id);
    if (!el) return;
    const d = AMPLITUDE_DATA[si];
    const maxAmp = Math.max(...d.heights.map(Math.abs));
    el.innerHTML = d.heights.map((amp, i) => {
      const pct = Math.abs(amp) / maxAmp * 100;
      const isTarget = (i === TARGET_IDX);
      const neg = amp < 0;
      return `<div class="amp-bar" style="
        height: ${Math.max(pct, 3)}%;
        background: ${isTarget ? 'var(--amber)' : (neg ? '#C1121F' : d.color)};
        opacity: ${si === groverStep ? 1 : 0.35};
        ${isTarget ? 'outline: 2px solid var(--amber-light)' : ''}
      " title="State |${i}⟩: ${amp.toFixed(3)}"></div>`;
    }).join('');
  });
}

function setGroverStep(step) {
  groverStep = step;
  document.querySelectorAll('.gstep').forEach((el, i) => {
    el.classList.toggle('active', i === step);
  });
  document.getElementById('grover-step-label').textContent = `Step ${step + 1} of 4`;
  renderGroverBars(step);
}

function groverNext() {
  setGroverStep((groverStep + 1) % 4);
}
function groverPrev() {
  setGroverStep((groverStep + 3) % 4);
}

function drawSpeedupChart() {
  const canvas = document.getElementById('speedup-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  const pad = { top: 30, right: 40, bottom: 50, left: 70 };
  const cw = W - pad.left - pad.right;
  const ch = H - pad.top - pad.bottom;

  // Axes
  ctx.strokeStyle = 'rgba(27,67,50,0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top);
  ctx.lineTo(pad.left, pad.top + ch);
  ctx.lineTo(pad.left + cw, pad.top + ch);
  ctx.stroke();

  // Axis labels
  ctx.fillStyle = '#7A7A65';
  ctx.font = '11px DM Mono, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Database size N (genome segments)', pad.left + cw / 2, H - 8);
  ctx.save();
  ctx.translate(16, pad.top + ch / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Steps required', 0, 0);
  ctx.restore();

  const Ns = [10, 100, 500, 1000, 5000, 10000, 50000, 100000];
  const maxSteps = 100000;
  const xScale = x => pad.left + (Math.log10(x) - Math.log10(Ns[0])) / (Math.log10(Ns[Ns.length-1]) - Math.log10(Ns[0])) * cw;
  const yScale = y => pad.top + (1 - Math.min(y, maxSteps) / maxSteps) * ch;

  // Grid lines
  ctx.strokeStyle = 'rgba(27,67,50,0.06)';
  [0.2, 0.4, 0.6, 0.8, 1.0].forEach(t => {
    const y = pad.top + ch * (1 - t);
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cw, y); ctx.stroke();
    ctx.fillStyle = '#7A7A65';
    ctx.font = '10px DM Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillText((t * maxSteps / 1000).toFixed(0) + 'k', pad.left - 6, y + 4);
  });

  // X-axis labels
  ctx.textAlign = 'center';
  Ns.filter((_, i) => i % 2 === 0).forEach(n => {
    const x = xScale(n);
    ctx.fillStyle = '#7A7A65';
    ctx.font = '10px DM Mono, monospace';
    ctx.fillText(n >= 1000 ? (n/1000)+'k' : n, x, pad.top + ch + 16);
    ctx.strokeStyle = 'rgba(27,67,50,0.06)';
    ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + ch); ctx.stroke();
  });

  // Classical O(N) line
  ctx.strokeStyle = '#C1121F';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([]);
  ctx.beginPath();
  Ns.forEach((n, i) => {
    const x = xScale(n), y = yScale(n);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Quantum O(√N) line
  ctx.strokeStyle = '#1B4332';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  Ns.forEach((n, i) => {
    const x = xScale(n), y = yScale(Math.sqrt(n));
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Legend
  const lx = pad.left + cw - 160, ly = pad.top + 20;
  ctx.fillStyle = '#C1121F'; ctx.fillRect(lx, ly, 24, 3);
  ctx.fillStyle = '#3D3D30'; ctx.font = '11px Syne, sans-serif';
  ctx.textAlign = 'left'; ctx.fillText('Classical  O(N)', lx + 30, ly + 5);

  ctx.fillStyle = '#1B4332'; ctx.fillRect(lx, ly + 20, 24, 3);
  ctx.fillStyle = '#3D3D30';
  ctx.fillText('Quantum  O(√N)', lx + 30, ly + 25);
}
