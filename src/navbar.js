fetch('/src/navbar.html')
      .then(res => res.text())
      .then(html => {
        document.getElementById('navbar').innerHTML = html;

        // Theme logic goes here, AFTER navbar is inserted
        const toggleBtn = document.getElementById('modeToggle');
        const themeLink = document.getElementById('themeStylesheet');

        const savedMode = localStorage.getItem('theme') || 'light';
        setTheme(savedMode);

        toggleBtn.addEventListener('click', () => {
          const currentTheme = themeLink.getAttribute('href').includes('dark') ? 'dark' : 'light';
          const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
          setTheme(newTheme);
        });

        function setTheme(mode) {
          themeLink.setAttribute('href', `/src/${mode}mode.css`);
          localStorage.setItem('theme', mode);
          document.getElementById('modeToggle').innerHTML =
            mode === 'dark'
              ? '<i class="fa-solid fa-sun"></i>'
              : '<i class="fa-solid fa-moon"></i>';
        }
      });