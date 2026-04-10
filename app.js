document.addEventListener('DOMContentLoaded', () => {
  
  if (typeof buildDFA === 'function' && document.getElementById('dfa-visual')) {
    buildDFA();
  }

  if (typeof renderGroverBars === 'function' && document.getElementById('amp-init')) {
    renderGroverBars(0);
  }

  if (typeof drawSpeedupChart === 'function' && document.getElementById('speedup-chart')) {
    setTimeout(drawSpeedupChart, 200);
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.pipe-step, .theory-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
});
