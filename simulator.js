let currentMode = 'classical';

function setMode(mode) {
  currentMode = mode;
  document.getElementById('btn-classical').classList.toggle('active', mode === 'classical');
  document.getElementById('btn-quantum').classList.toggle('active', mode === 'quantum');
}

async function runSimulation() {
  const fileInput = document.getElementById('genome-file');
  const patternInput = document.getElementById('pattern-input');
  const resultsDiv = document.getElementById('sim-results');
  
  if (!fileInput.files[0]) return alert("Please upload a DNA file (.txt)");
  if (!patternInput.value) return alert("Please enter a pattern");

  const pattern = patternInput.value.toUpperCase().replace(/[^ATCG]/g, '');
  const file = fileInput.files[0];

  // 1. Show UI Loading immediately
  resultsDiv.innerHTML = `
    <div style="padding:30px; border:2px dashed var(--green); border-radius:12px; text-align:center; background:#f9fff9;">
      <h3 style="color:var(--green); margin-bottom:10px;">🧬 Processing Large Genome</h3>
      <p style="font-family:var(--mono); font-size:14px; color:var(--ink-light);">File size: ${(file.size / 1024 / 1024).toFixed(2)} MB</p>
      <div class="loader-bar"></div>
    </div>
  `;

  // 2. Use a small delay so the UI actually renders the loading box
  await new Promise(r => setTimeout(r, 100));

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const genome = e.target.result.toUpperCase().replace(/[^ATCG]/g, '');
      
      // Run the optimized engine
      const t0 = performance.now();
      const { matches, trace } = window.runDFA(genome, pattern);
      const t1 = performance.now();
      const timeTaken = (t1 - t0).toFixed(2);

      // 3. Render Results
      if (currentMode === 'classical') {
        renderClassical(genome, pattern, matches, trace, timeTaken);
      } else {
        renderQuantum(genome, pattern, matches, timeTaken);
      }

    } catch (err) {
      console.error(err);
      resultsDiv.innerHTML = `<p style="color:red;">Error processing file: ${err.message}</p>`;
    }
  };

  reader.readAsText(file);
}

function renderClassical(genome, pattern, matches, trace, time) {
  const resultsDiv = document.getElementById('sim-results');
  resultsDiv.innerHTML = `
    <div class="sim-box" style="animation: fadeIn 0.5s ease;">
      <h3 style="color:var(--green); font-family:var(--serif);">Classical Result</h3>
      <p>Processed <strong>${genome.length.toLocaleString()}</strong> base pairs in <strong>${time}ms</strong></p>
      <p>Matches found: <span style="color:var(--green); font-weight:bold;">${matches.length}</span></p>
      <div style="background:#eee; padding:10px; font-family:monospace; font-size:12px; max-height:100px; overflow:auto; margin-top:10px;">
        ${genome.substring(0, 1000)}...
      </div>
    </div>
  `;
}

async function renderQuantum(genome, pattern, matches, time) {
    const resultsDiv = document.getElementById('sim-results');
    const N = genome.length;
    const iterations = Math.floor(Math.PI / 4 * Math.sqrt(N));

    resultsDiv.innerHTML = `
    <div class="sim-box" style="border-left: 5px solid var(--amber);">
      <h3 style="color:var(--amber); font-family:var(--serif);">Quantum Grover Result</h3>
      <p>Search Space Size (N): <strong>${N.toLocaleString()}</strong></p>
      <p>Required Grover Iterations (√N): <strong>${iterations.toLocaleString()}</strong></p>
      <p>Found <strong>${matches.length}</strong> matches using probability amplification.</p>
    </div>
    `;
}
