// ============================================================
//  dfa.js — High-Performance Large Scale DNA Engine
// ============================================================

window.runDFA = function(genome, pattern) {
  const n = genome.length;
  const m = pattern.length;
  const matches = [];
  const trace = [];
  
  // CRITICAL: Only record a trace for small files (< 50,000 bp)
  // Recording 2 million steps in an array will crash the browser.
  const shouldTrace = n < 50000;

  // Simple, extremely fast matching logic
  for (let i = 0; i <= n - m; i++) {
    let match = true;
    
    // Check pattern
    for (let j = 0; j < m; j++) {
      if (genome[i + j] !== pattern[j]) {
        match = false;
        break;
      }
    }

    if (match) {
      matches.push(i);
    }

    // Only store trace data if the file is small enough to handle it
    if (shouldTrace && i < 1000) { 
      trace.push({
        pos: i,
        char: genome[i],
        isMatch: match
      });
    }
  }

  return { matches, trace };
};
