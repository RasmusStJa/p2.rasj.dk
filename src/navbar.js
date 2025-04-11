fetch('/src/navbar.html')
  .then(res => res.text())
  .then(html => {
    document.getElementById('navbar').innerHTML = html;

    // Theme logic goes here, AFTER navbar is inserted
    const toggleBtn = document.getElementById('modeToggle');

    const savedMode = localStorage.getItem('theme') || '';
    setTheme(savedMode);

    toggleBtn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? '' : 'dark');
    });

    function setTheme(mode) {
      if (mode === 'dark') {
        document.documentElement.classList.add('dark');
        toggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
      } else {
        document.documentElement.classList.remove('dark');
        toggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
      }
      localStorage.setItem('theme', mode);
    }
  });
