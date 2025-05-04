fetch('/src/navbar.html')
  .then(res => res.text())
  .then(html => {
    document.getElementById('navbar').innerHTML = html;

    requestAnimationFrame(() => {
      
      checkLoginStatus(); 
      
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

// Check login status
async function checkLoginStatus() {
  const response = await fetch('/api/auth/status', {
    method: 'GET',
    credentials: 'include', 
  });

  const data = await response.json();

  const loginMessage = document.getElementById('login-message');
  const loginButton = document.getElementById('login-button');
  const logoutButton = document.getElementById('logout-button');
  const navLogin = document.getElementById('nav-login');
  const navSignup = document.getElementById('nav-signup');
  const navFeed = document.getElementById('nav-feed');
  const navProfile = document.getElementById('nav-profile');

  if (data.loggedIn) {
    // User is logged in
      loginMessage.textContent = `Logged in as ${data.username}`;
      loginMessage.style.display = 'inline';
      loginButton.style.display = 'none';
      logoutButton.style.display = 'inline';
      navFeed.style.display = 'inline-block';
      navProfile.style.display = 'inline-block';
      navLogin.style.display = 'none';
      navSignup.style.display = 'none';
  } else {
    // User is not logged in
      loginMessage.style.display = 'none';
      loginButton.style.display = 'inline-block';
      logoutButton.style.display = 'none';
      navFeed.style.display = 'none';
      navProfile.style.display = 'none';
      navLogin.style.display = 'inline-block';
      navSignup.style.display = 'inline-block';
  }
}

// Function to logout
async function logout() {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include', 
  });

  const data = await response.json();
  if (data.message === 'Logged out successfully') {
    checkLoginStatus();  // Refresh login status
  }
}
