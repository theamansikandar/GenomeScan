window.runDFA = function(genome, pattern) {
  const n = genome.length;
  const m = pattern.length;
  const matches = [];
  const trace = [];

  const shouldTrace = n < 50000;

  for (let i = 0; i <= n - m; i++) {
    let match = true;
    
    for (let j = 0; j < m; j++) {
      if (genome[i + j] !== pattern[j]) {
        match = false;
        break;
      }
    }

    if (match) {
      matches.push(i);
    }

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
