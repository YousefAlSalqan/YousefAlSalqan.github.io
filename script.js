const themeSelect = document.querySelector('#theme');
const systemTheme = matchMedia('(prefers-color-scheme: dark)');

function applyTheme() {
  const theme = themeSelect.value === 'system' ? (systemTheme.matches ? 'dark' : 'light') : themeSelect.value;
  document.documentElement.dataset.theme = theme;
}

themeSelect.closest('label').hidden = false;
themeSelect.addEventListener('change', applyTheme);
systemTheme.addEventListener('change', applyTheme);
applyTheme();

// One-time, first-visit hierarchy. Content stays visible without JavaScript or motion.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const revealNodes = document.querySelectorAll('.section-heading, .featured-project, .project');
if (!reducedMotion.matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.remove('waiting');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.08 });
  for (const node of revealNodes) {
    node.classList.add('waiting');
    observer.observe(node);
  }
  reducedMotion.addEventListener('change', () => {
    if (!reducedMotion.matches) return;
    observer.disconnect();
    for (const node of revealNodes) node.classList.remove('waiting');
  });
  // Tabbing to a link must never leave the focused content visually hidden.
  document.addEventListener('focusin', event => event.target.closest('.waiting')?.classList.remove('waiting'));
}
