const progress = document.createElement('div');
progress.className = 'reading-progress';
progress.setAttribute('aria-hidden', 'true');
document.body.prepend(progress);

let ticking = false;

function updateProgress() {
  const available = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = available > 0 ? Math.min(1, Math.max(0, window.scrollY / available)) : 0;
  progress.style.transform = `scaleX(${ratio})`;
  ticking = false;
}

window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  window.requestAnimationFrame(updateProgress);
}, { passive: true });

window.addEventListener('resize', updateProgress, { passive: true });
updateProgress();
