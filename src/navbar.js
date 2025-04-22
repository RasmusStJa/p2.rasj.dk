fetch('/src/navbar.html')
  .then(res => res.text())
  .then(html => {
    document.getElementById('navbar').innerHTML = html;

    requestAnimationFrame(() => {
      // Theme toggle logic
      const toggleBtn = document.getElementById('modeToggle');
      if (!toggleBtn) return console.warn('modeToggle not found');

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

      // Notification toggle logic
      const bell = document.getElementById('notificationBell');
      const dropdown = document.getElementById('notificationDropdown');
      const wrapper = document.getElementById('notificationWrapper');

      if (bell && dropdown && wrapper) {
        bell.addEventListener('click', () => {
          dropdown.classList.toggle('hidden');
        });

        document.addEventListener('mousedown', (event) => {
          if (!wrapper.contains(event.target)) {
            dropdown.classList.add('hidden');
          }
        });
      } else {
        console.warn('Notification elements not found');
      }
    });
  });
