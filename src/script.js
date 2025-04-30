function loadContent(section) {
    const contentDiv = document.getElementById('content');
    const links = document.querySelectorAll('.topnav a'); // Might run before topnav exists

    if (!contentDiv) {
        console.error('CRITICAL: Could not find #content element!');
        return; // Stop if the target div doesn't exist
    }

    // Clear existing content safely
    contentDiv.innerHTML = '';

    // Update active links safely
    if (links && links.length > 0) {
        links.forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`.topnav a[href="#${section}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    // Ensure the path is correct relative to the root where index.html is served
    const filePath = `/public/${section}.html`;

    fetch(filePath)
        .then(response => {
          if (!response.ok) {
            console.error(`HTTP error! status: ${response.status} for ${filePath}`);
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.text();
        })
        .then(data => {
          // Inject HTML
          try {
            if (contentDiv) { // Double-check contentDiv still exists
                contentDiv.innerHTML = data;
            } else {
                console.error('#content element became null before setting innerHTML!');
            }
          } catch (e) {
            console.error(`Error setting innerHTML for ${section}:`, e);
          }

          // Attach listeners after DOM update
          if (section === 'login') {
            setTimeout(attachLoginListener, 100);
          } else if (section === 'signup') {
            setTimeout(attachSignupListener, 100);
          }
        })
        .catch(error => {
            // Log the error but perhaps provide a user-friendly message
            console.error(`Error during fetch or processing for ${section}:`, error);
            if (contentDiv) {
               contentDiv.innerHTML = `<p>Failed to load content. Please try again later.</p>`;
            }
        });
}

function loadContentFromLogo() {
  loadContent('home');

  // Ensure the 'Home' nav link gets the active class
  document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active'));
  document.querySelector('.nav-links a[href="#home"]')?.classList.add('active');
}

// Function to handle the login API call
async function loginUser(email, password) {
    try {
        const response = await fetch('http://p2.rasj.dk/auth/login', { // Make sure backend is running and accessible
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email: email, password: password })
        });

        const result = await response.json(); // Get JSON response body

        if (response.ok) {
            console.log('Login successful:', result);
            // Redirect to the main page (or feed page) after successful login
            window.location.href = '/'; // Navigate to the root
            // Alternatively, use your loadContent function if appropriate:
            // loadContent('feed');
            return { success: true };
        } else {
            // Handle login errors (400, 401, 500)
            console.error(`Login failed: ${response.status} - ${result?.error || response.statusText}`);
            return { success: false, message: result?.error || `Login failed (Status: ${response.status})` };
        }
    } catch (error) {
        console.error('Network error or problem during login:', error);
        return { success: false, message: 'Network error during login.' };
    }
}

// Function to attach the event listener to the login form
function attachLoginListener() {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorParagraph = document.getElementById('login-error');

    // Check if the form actually exists on the currently loaded content
    if (loginForm && emailInput && passwordInput && errorParagraph) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission
            errorParagraph.textContent = ''; // Clear previous errors
            errorParagraph.style.display = 'none'; // Hide error paragraph

            const email = emailInput.value;
            const password = passwordInput.value;

            const result = await loginUser(email, password);

            if (!result.success) {
                errorParagraph.textContent = result.message; // Show error message
                errorParagraph.style.display = 'block'; // Make error visible
            }
            // Success case is handled by redirection inside loginUser
        });
    } else {
        // This might happen if loadContent finishes but the elements aren't quite ready,
        // or if login.html doesn't have the expected IDs.
        console.warn('Login form elements not found after loading content. Listener not attached.');
        // Optionally, retry after a short delay, but ideally the elements are found immediately.
    }
}

// Function to handle the signup API call
async function signupUser(email, studentId, password) {
    try {
        // Adjust URL if backend is on a different port, e.g., 'http://localhost:3001/auth/signup'
        const response = await fetch('http://p2.rasj.dk/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email, studentId, password })
        });

        const result = await response.json();

        if (response.ok) { // Status 201 Created
            console.log('Signup successful:', result);
            return { success: true, message: result?.message || 'Signup successful!' };
        } else { // Handle errors (400, 409, 500)
            console.error(`Signup failed: ${response.status} - ${result?.error || response.statusText}`);
            return { success: false, message: result?.error || `Signup failed (Status: ${response.status})` };
        }
    } catch (error) {
        console.error('Network error or problem during signup:', error);
        return { success: false, message: 'Network error during signup.' };
    }
}

// Function to attach the event listener to the signup form
function attachSignupListener() {
    const signupForm = document.getElementById('signupForm');
    const emailInput = document.getElementById('email');
    const studentIdInput = document.getElementById('studentId');
    const passwordInput = document.getElementById('password');
    const signupBtn = document.getElementById('signupBtn');
    const messageArea = document.getElementById('messageArea'); // Assuming this ID exists in signup.html

    if (signupForm && emailInput && studentIdInput && passwordInput && signupBtn && messageArea) {
        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            messageArea.textContent = ''; // Clear previous messages
            messageArea.className = 'message'; // Reset class

            const email = emailInput.value;
            const studentId = studentIdInput.value;
            const password = passwordInput.value;

            // Basic frontend validation
            if (!email || !studentId || !password) {
                showMessage(messageArea, 'Please fill in all fields.', 'error');
                return;
            }

            signupBtn.disabled = true;
            signupBtn.textContent = 'Signing up...';

            const result = await signupUser(email, studentId, password);

            if (result.success) {
                showMessage(messageArea, result.message, 'success');
                 // Optionally redirect or clear form
                 // setTimeout(() => { loadContent('login'); }, 2000); // Example: load login after success
                signupForm.reset();
            } else {
                showMessage(messageArea, result.message, 'error');
            }

            signupBtn.disabled = false;
            signupBtn.textContent = 'Sign Up';
        });
    } else {
        console.warn('Signup form elements not found after loading content. Listener not attached.');
    }
}

// Helper to display messages in a specified area
function showMessage(element, message, type) {
    if (element) {
        element.textContent = message;
        // Reset classes first then add type
        element.className = 'message'; // Base class
        if (type === 'success' || type === 'error') {
             element.classList.add(type);
        }
        element.style.display = 'block'; // Make sure it's visible
    } else {
        console.error("Attempted to show message but target element was null.");
    }
}

// Load Home section by default when the page loads
window.onload = () => {
    // TODO: Add auth check later
    loadContent('home'); // Call loadContent
};
