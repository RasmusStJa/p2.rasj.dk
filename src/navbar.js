fetch('/src/navbar.html')
  .then(res => res.text())
  .then(html => {
    document.getElementById('navbar').innerHTML = html;

    requestAnimationFrame(() => {
      
      checkLoginStatus();
      fetchFriendRequests();
      setInterval(fetchFriendRequests, 60000);  
      
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
      navFeed.classList.remove('hidden');
      navProfile.classList.remove('hidden');
      navLogin.classList.add('hidden');
      navSignup.classList.add('hidden');
  } else {
    // User is not logged in
      loginMessage.style.display = 'none';
      loginButton.style.display = 'inline-block';
      logoutButton.style.display = 'none';
      navFeed.classList.add('hidden');
      navProfile.classList.add('hidden');
      navLogin.classList.remove('hidden');
      navSignup.classList.remove('hidden');
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

async function fetchFriendRequests() {
  try {
    const response = await fetch('/api/friends/requests', {
      credentials: 'include',
    });

    if (response.status === 401) {
      // not logged in
      document.getElementById('notificationCount').classList.add('hidden');
      return;
    }

    if (!response.ok) throw new Error('Failed to fetch friend requests');

    const data = await response.json();
    const requests = data.requests;

    const notificationCount = document.getElementById('notificationCount');
    const friendRequestsContainer = document.getElementById('friendRequestsContainer');

    // Update notification count
    if (requests.length > 0) {
      notificationCount.textContent = requests.length;
      notificationCount.classList.remove('hidden');
    } else {
      notificationCount.classList.add('hidden');
    }

    // Populate friend requests
    friendRequestsContainer.innerHTML = '';
    if (requests.length === 0) {
      friendRequestsContainer.innerHTML = '<p>No new notifications</p>';
      return;
    }

    requests.forEach((req) => {
      const requestDiv = document.createElement('div');
      requestDiv.classList.add('friend-request');

      const nameP = document.createElement('p');
      nameP.textContent = `${req.senderName} sent you a friend request.`;

      const acceptBtn = document.createElement('button');
      acceptBtn.textContent = 'Accept';
      acceptBtn.addEventListener('click', () => respondToFriendRequest(req.senderId, 'accept'));

      const rejectBtn = document.createElement('button');
      rejectBtn.textContent = 'Reject';
      rejectBtn.addEventListener('click', () => respondToFriendRequest(req.senderId, 'reject'));

      requestDiv.appendChild(nameP);
      requestDiv.appendChild(acceptBtn);
      requestDiv.appendChild(rejectBtn);

      friendRequestsContainer.appendChild(requestDiv);
    });
  } catch (error) {
    console.error(error);
  }
}

async function respondToFriendRequest(senderId, action) {
  try {
    const response = await fetch('/api/friends/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ senderId, action }),
    });

    if (!response.ok) throw new Error('Failed to respond to friend request');

    const data = await response.json();
    alert(data.message);

    // Refresh friend requests
    fetchFriendRequests();
  } catch (error) {
    console.error(error);
    alert('An error occurred while responding to the friend request.');
  }
}
