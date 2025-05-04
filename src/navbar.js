fetch('/src/navbar.html')
  .then(res => res.text())
  .then(html => {
    document.getElementById('navbar').innerHTML = html;

    // checkLoginStatus to update the navbar with login state
    checkLoginStatus();

    requestAnimationFrame(() => {
      // Theme toggle logic (no changes needed here)
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

      // Notification toggle logic (no changes needed here)
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

  if (data.loggedIn) {
    // User is logged in
    document.getElementById('login-message').textContent = `Logged in as User ${data.userId}`;
    document.getElementById('login-message').style.display = 'inline'; // Show login message
    document.getElementById('login-button').style.display = 'none'; // Hide login button
    document.getElementById('logout-button').style.display = 'inline'; // Show logout button
    document.getElementById('login-link').style.display = 'none'; // Hide login link in navbar
  } else {
    // User is not logged in
    document.getElementById('login-message').textContent = 'Not logged in';
    document.getElementById('login-message').style.display = 'none'; // Hide login message
    document.getElementById('login-button').style.display = 'inline'; // Show login button
    document.getElementById('logout-button').style.display = 'none'; // Hide logout button
    document.getElementById('login-link').style.display = 'inline'; // Show login link in navbar
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
