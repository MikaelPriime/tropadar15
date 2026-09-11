// Aplicado antes do CSS para evitar um flash do tema errado ao carregar.
(() => {
  const root = document.documentElement;
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  let choice = 'system';
  try {
    const saved = localStorage.getItem('r15-sc-theme');
    if (['light', 'dark', 'system'].includes(saved)) choice = saved;
  } catch { /* O tema continua funcionando se o armazenamento estiver bloqueado. */ }
  const apply = () => {
    const theme = choice === 'system' ? (system.matches ? 'dark' : 'light') : choice;
    root.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#080808' : '#f2eee5';
  };
  window.siteTheme = {
    get choice() { return choice; },
    set(value) {
      if (!['light', 'dark', 'system'].includes(value)) return;
      choice = value;
      apply();
      try { localStorage.setItem('r15-sc-theme', choice); } catch { /* Sem persistência. */ }
    }
  };
  system.addEventListener('change', apply);
  apply();
})();
