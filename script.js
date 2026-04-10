let currentMode = 'classical';
let globalGenomeMemory = "";

function setMode(mode) {
  currentMode = mode;
  document.getElementById('btn-classical').classList.toggle('active', mode === 'classical');
  document.getElementById('btn-quantum').classList.toggle('active', mode === 'quantum');
}

const delay = ms => new Promise(res => setTimeout(res, ms));

function handleFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  document.getElementById('file-status').innerHTML = "Status: Reading file into memory...";
  const reader = new FileReader();
  reader.onload = function(e) {
    const cleanDNA = e.target.result.toUpperCase().replace(/[^ATCG]/g, '');
    globalGenomeMemory = cleanDNA;
    document.getElementById('file-status').innerHTML = `Success! Loaded ${cleanDNA.length.toLocaleString()} base pairs.`;
    document.getElementById('file-status').style.color = "var(--green)";
  };
  reader.readAsText(file);
}

function buildDFATable(pattern) {
  const m = pattern.length;
  const alphabet = ['A', 'C', 'G', 'T'];
  const dfa = Array(m + 1).fill(null).map(() => ({'A':0, 'C':0, 'G':0, 'T':0}));
  
  if (m === 0) return dfa;
  
  dfa[0][pattern[0]] = 1;
  let x = 0;
  
  for (let j = 1; j <= m; j++) {
    for (let c of alphabet) {
      if (j < m && pattern[j] === c) {
        dfa[j][c] = j + 1;
      } else {
        dfa[j][c] = dfa[x][c];
      }
    }
    if (j < m) {
      x = dfa[x][pattern[j]];
    }
  }
  return dfa;
}

async function runEngine() {
  const resultsDiv = document.getElementById('sim-results');
  const pattern = document.getElementById('pattern-input').value.toUpperCase().replace(/[^ATCG]/g, '');

  if (!globalGenomeMemory || !pattern || pattern.length > globalGenomeMemory.length) {
    alert("Please fix your inputs."); return;
  }

  resultsDiv.innerHTML = `<h3 style="color:var(--green); text-align:center;">Analyzing...</h3>`;
  await delay(50);

  const dfaTable = buildDFATable(pattern);
  const t0 = performance.now();
  let matches = [];
  let totalComparisons = 0;
  const n = globalGenomeMemory.length;
  const m = pattern.length;
  
  let currentState = 0;
  
  for (let i = 0; i < n; i++) {
    totalComparisons++; 
    let char = globalGenomeMemory[i];
    if (!['A','C','G','T'].includes(char)) continue; 
    
    currentState = dfaTable[currentState][char];
    if (currentState === m) {
      matches.push(i - m + 1);
    }
  }
  const execMs = (performance.now() - t0).toFixed(2);

  const numStatesToShow = 12; 
  const requiredSnippetLength = numStatesToShow + m - 1;
  let snippetStart = matches.length > 0 ? Math.max(0, matches[0] - Math.floor(numStatesToShow/2)) : 0;
  let snippet = globalGenomeMemory.substring(snippetStart, snippetStart + requiredSnippetLength);
  while(snippet.length < requiredSnippetLength && snippetStart > 0) { 
    snippetStart--; 
    snippet = globalGenomeMemory.substring(snippetStart, snippetStart + requiredSnippetLength); 
  }

  resultsDiv.innerHTML = `<div id="animation-panel"></div><div id="math-panel" class="sim-box" style="margin-top:20px; animation: fadeIn 0.4s ease-out;"></div>`;

  if (currentMode === 'classical') {
    await playClassicalAnimation(snippet, pattern);
    renderClassicalMath(n, matches, totalComparisons, execMs, dfaTable, pattern);
  } else {
    await playAdvancedQuantumAnimation(snippet, pattern);
    renderQuantumMath(n, matches, m, execMs);
  }
}

async function playClassicalAnimation(snippet, pattern) {
  const animPanel = document.getElementById('animation-panel');
  const m = pattern.length;
  
  animPanel.innerHTML = `
    <div class="anim-container">
      <h4 style="color:#00ffcc; margin-bottom:10px;">Live Trace (Classical DFA Automaton)</h4>
      <p style="font-size:12px; color:#aaa;">State machine evaluating string sequentially...</p>
      <div class="dna-track" id="dna-track">
        ${snippet.split('').map(c => `<div class="dna-char">${c}</div>`).join('')}
        <div class="scanner-box" id="scanner" style="width:${m * 24}px;">${pattern}</div>
      </div>
    </div>
  `;
  
  const scanner = document.getElementById('scanner');
  for (let i = 0; i <= snippet.length - m; i++) {
    scanner.style.left = `${i * 24}px`;
    scanner.className = 'scanner-box';
    await delay(250); 
    
    let match = true;
    for(let j=0; j<m; j++) { if(snippet[i+j] !== pattern[j]) match = false; }
    
    if(match) {
      scanner.className = 'scanner-box match-found';
      await delay(800); 
    }
  }
}

async function playAdvancedQuantumAnimation(snippet, pattern) {
  const animPanel = document.getElementById('animation-panel');
  const m = pattern.length;
  const N_states = snippet.length - m + 1;
  
  const states = [];
  let targetIndex = -1;
  for(let i=0; i<N_states; i++) {
    const sub = snippet.substring(i, i+m);
    states.push(sub);
    if (sub === pattern) targetIndex = i;
  }

  let colsHtml = '';
  for(let i=0; i<N_states; i++) {
    colsHtml += `
      <div class="q-state-col">
        <div class="q-prob-label" id="prob-${i}">0%</div>
        <div class="q-bar-container">
          <div class="q-bar-top-half"><div class="q-amp-up" id="amp-up-${i}"></div></div>
          <div class="q-bar-bottom-half"><div class="q-amp-down" id="amp-down-${i}"></div></div>
        </div>
        <div class="q-label">${states[i]}</div>
      </div>`;
  }

  animPanel.innerHTML = `
    <div class="anim-container" style="padding-bottom: 40px;">
      <h4 style="color:#ffcc00; margin-bottom:5px;">Quantum Mathematical Trace: Amplitude Amplification</h4>
      <p id="q-desc" style="font-size:13px; color:#aaa; margin-bottom: 5px; height: 40px;">Loading Register...</p>
      <div class="q-chart">
        <div class="q-zero-axis"></div>
        <div class="q-mean-line" id="q-mean-line"></div>
        ${colsHtml}
      </div>
    </div>
  `;

  await delay(800);
  const desc = document.getElementById('q-desc');
  const meanLine = document.getElementById('q-mean-line');

  desc.innerHTML = `<strong style="color:#00ffcc">Phase 1: Superposition (Initialization)</strong><br>Hadamard gates map all ${N_states} DNA substrings simultaneously.`;
  const visualScale = 90; 
  let initialAmp = 1 / Math.sqrt(N_states);
  let vAmp = initialAmp * visualScale;

  for(let i=0; i<N_states; i++) {
    document.getElementById(`amp-up-${i}`).style.height = `${vAmp}%`;
  }
  await delay(2500);

  if (targetIndex === -1) {
     desc.innerHTML = `<strong style="color:#ff3366">Phase 2: Oracle</strong><br>Target sequence not found in this snippet.`;
     return; 
  }

  desc.innerHTML = `<strong style="color:#ff3366">Phase 2: The Quantum Oracle</strong><br>The Oracle mathematically tags the target state ("${pattern}") by flipping its phase by 180°.`;
  document.getElementById(`amp-up-${targetIndex}`).style.height = `0%`;
  document.getElementById(`amp-down-${targetIndex}`).style.height = `${vAmp}%`;
  await delay(2500);

  let currentAmps = new Array(N_states).fill(initialAmp);
  currentAmps[targetIndex] = -initialAmp; 
  let sum = currentAmps.reduce((a, b) => a + b, 0);
  let meanAmp = sum / N_states;
  let vMean = meanAmp * visualScale;

  desc.innerHTML = `<strong style="color:#ffcc00">Phase 3a: Diffusion (Mean Calculation)</strong><br>The system calculates the average amplitude of all states.`;
  meanLine.style.display = 'block';
  meanLine.style.top = `calc(50% - ${vMean/2}px)`; 
  await delay(2500);

  desc.innerHTML = `<strong style="color:#00ff00">Phase 3b: Inversion about the Mean</strong><br>Amplitudes reflect across the average. Target amplifies heavily.`;
  for(let i=0; i<N_states; i++) {
    let newAmp = 2 * meanAmp - currentAmps[i];
    let vNewAmp = Math.abs(newAmp * visualScale);
    let prob = Math.pow(newAmp, 2) * 100;

    if (newAmp > 0) {
       document.getElementById(`amp-up-${i}`).style.height = `${vNewAmp}%`;
       document.getElementById(`amp-down-${i}`).style.height = `0%`;
       if(i === targetIndex) document.getElementById(`amp-up-${i}`).style.background = "#00ff00"; 
    } else {
       document.getElementById(`amp-up-${i}`).style.height = `0%`;
       document.getElementById(`amp-down-${i}`).style.height = `${vNewAmp}%`;
    }

    const probLabel = document.getElementById(`prob-${i}`);
    probLabel.innerText = `${prob.toFixed(0)}%`;
    probLabel.style.opacity = 1;
    if(i === targetIndex) probLabel.style.color = "#00ff00";
  }
  meanLine.style.opacity = '0'; 
  await delay(2000);
  
  desc.innerHTML = `<strong style="color:#00ff00">Measurement Collapse</strong><br>Upon measurement, the system collapses to the state with the highest probability.`;
}

function renderClassicalMath(n, matches, comparisons, time, dfaTable, pattern) {
  let tableHtml = `<table class="dfa-table"><tr><th>State</th><th>A</th><th>C</th><th>G</th><th>T</th></tr>`;
  for (let i = 0; i < dfaTable.length; i++) {
    let rowClass = (i === pattern.length) ? "style='background:var(--green-pale); font-weight:bold;'" : "";
    let label = (i === pattern.length) ? `q${i} (ACCEPT)` : `q${i}`;
    tableHtml += `<tr ${rowClass}>
      <td>${label}</td><td>q${dfaTable[i]['A']}</td><td>q${dfaTable[i]['C']}</td>
      <td>q${dfaTable[i]['G']}</td><td>q${dfaTable[i]['T']}</td>
    </tr>`;
  }
  tableHtml += `</table>`;

  let traceHtml = `<div style="font-family:var(--mono); font-size:13px; background:var(--cream); border: 1px solid var(--cream-dark); border-radius: 4px; overflow: hidden;">`;
  let state = 0;
  const limit = Math.min(n, 300);
  
  for(let i=0; i<limit; i++) {
    let char = globalGenomeMemory[i];
    let nextState = dfaTable[state][char];
    let isMatch = (nextState === pattern.length);
    let bg = isMatch ? 'background:var(--green-pale); border-left:3px solid var(--green);' : 'border-bottom:1px solid var(--cream-dark);';
    let matchTxt = isMatch ? `<span style="color:var(--green); font-weight:bold; margin-left:15px;">MATCH</span>` : '';
    
    traceHtml += `
      <div style="padding:8px 10px; ${bg} display:flex; align-items:center; color:var(--ink);">
        <span style="width:70px; color:var(--ink-light);">i = ${i}</span>
        <span style="width:50px; font-weight:bold; font-size:15px; color:var(--amber);">${char}</span>
        <span style="width:120px; font-weight: 500;">q${state} -> q${nextState}</span>
        ${matchTxt}
      </div>
    `;
    state = nextState;
  }
  if (n > limit) traceHtml += `<div style="padding:15px; color:var(--ink-light); text-align: center;">... Output truncated. ${(n - limit).toLocaleString()} more transitions computed instantly. ...</div>`;
  traceHtml += `</div>`;

  document.getElementById('math-panel').innerHTML = `
    <div style="font-family:var(--serif); font-size:1.5rem; margin-bottom:15px; color:var(--green);">Full Genome Execution Results</div>
    <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--cream-dark); padding:8px 0;"><span>Base Pairs Scanned</span><strong>${n.toLocaleString()} bp</strong></div>
    <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--cream-dark); padding:8px 0;"><span>Matches Found</span><strong style="color:var(--green);">${matches.length.toLocaleString()}</strong></div>
    <div style="display:flex; justify-content:space-between; padding:8px 0;"><span>Time Taken</span><strong>${time} ms</strong></div>
    <div style="margin-top: 30px; border-top: 2px solid var(--cream-dark); padding-top: 20px;">
      <h4 style="font-family:var(--serif); font-size:1.3rem; color:var(--green); margin-bottom: 10px;">Theory of Computation: DFA Automaton</h4>
      <p style="font-size: 13px; color: var(--ink-mid); margin-bottom: 15px;">KMP Transition Table to guarantee zero false positives and zero backtracking.</p>
      ${tableHtml}
      <h5 style="margin-top: 20px; margin-bottom:10px; font-family:var(--mono); font-size: 12px; color:var(--ink-light);">State Transition Trace (First 300 steps)</h5>
      ${traceHtml}
    </div>
  `;
}

function renderQuantumMath(n, matches, pLen, time) {
  const searchSpace = n - pLen + 1;
  const groverIterations = Math.max(1, Math.floor(Math.PI / 4 * Math.sqrt(searchSpace)));
  const speedup = (searchSpace / groverIterations).toFixed(1);

  document.getElementById('math-panel').innerHTML = `
    <div style="font-family:var(--serif); font-size:1.5rem; margin-bottom:15px; color:var(--amber);">Full Genome Quantum Mathematics</div>
    <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--cream-dark); padding:8px 0;"><span>Search Space Size (N)</span><strong>${searchSpace.toLocaleString()} Qubit Combinations</strong></div>
    <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--cream-dark); padding:8px 0;"><span>Classical Checks Needed</span><strong>${searchSpace.toLocaleString()}</strong></div>
    <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--cream-dark); padding:8px 0;"><span>Grover Iterations Required</span><strong style="color:var(--amber);">${groverIterations.toLocaleString()} (O(√N))</strong></div>
    <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--cream-dark); padding:8px 0;"><span>Theoretical Speedup</span><strong style="color:var(--green);">${speedup}x Faster</strong></div>
    <div style="display:flex; justify-content:space-between; padding:8px 0;"><span>Total Matches Confirmed</span><strong style="color:var(--green);">${matches.length.toLocaleString()}</strong></div>
  `;
}
