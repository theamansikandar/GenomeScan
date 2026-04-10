// ============================================================
//  app.js — Initialisation & UI Logic
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  
  // Init DFA visual if the container exists on the page
  if (typeof buildDFA === 'function' && document.getElementById('dfa-visual')) {
    buildDFA();
  }

  // Init Grover bars if the container exists on the page
  if (typeof renderGroverBars === 'function' && document.getElementById('amp-init')) {
    renderGroverBars(0);
  }

  // Draw speedup chart if canvas exists
  if (typeof drawSpeedupChart === 'function' && document.getElementById('speedup-chart')) {
    setTimeout(drawSpeedupChart, 200);
  }

  // Animate elements on scroll for a modern feel
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  // Apply scroll animations to cards and pipeline steps
  document.querySelectorAll('.pipe-step, .theory-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
});
