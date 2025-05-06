async function loadContent(section) {
    const contentDiv = document.getElementById('content');
    const links = document.querySelectorAll('.topnav a');

    if (!contentDiv) {
        console.error('CRITICAL: Could not find #content element!');
        return;
    }

    contentDiv.innerHTML = '';

    if (links && links.length > 0) {
        links.forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`.topnav a[href="#${section}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    const filePath = `/public/${section}.html`;

    // Section requires authentication
    if (isProtectedSection(section)) {
        const authenticated = await isAuthenticated();
        if (!authenticated) {
            console.warn('Attempted to access a protected section while not authenticated. Redirecting to login.');
            window.location.href = '/#login';  
            return;
        }
    }
    
    if (await isAuthenticated() && (section === 'login' || section === 'signup')) {
        console.warn('Attempted to access login/signup while authenticated. Redirecting to home.');
        window.location.href = '/#home';  
        return;
    }

    fetch(filePath)
        .then(response => {
            if (!response.ok) {
                console.error(`HTTP error! status: ${response.status} for ${filePath}`);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            if (contentDiv) {
                contentDiv.innerHTML = data;
                // Attach listeners after a short delay to ensure elements are present
                requestAnimationFrame(() => {
                    if (section === 'login') {
                        attachLoginListener();
                    } else if (section === 'signup') {
                        attachSignupListener();
                    }
                });
            } else {
                console.error('#content element became null before setting innerHTML!');
            }
        })
        .catch(error => {
            console.error(`Error during fetch or processing for ${section}:`, error);
            if (contentDiv) {
                contentDiv.innerHTML = `<p>Failed to load content. Please try again later.</p>`;
            }
        });
}

function isAuthenticated() {
    return fetch('/api/auth/status', {
        method: 'GET',
        credentials: 'include', 
    })
    .then(response => {
        if (!response.ok) {
            return false; 
        }
        return response.json().then(data => data.loggedIn);
    })
    .catch(() => false); 
}

function isProtectedSection(section) {
    const protectedSections = ['feed', 'profile'];
    return protectedSections.includes(section);
}

function loadContentFromLogo() {
    loadContent('home');

    // Ensure the 'Home' nav link gets the active class
    document.querySelectorAll('.topnav a').forEach(link => link.classList.remove('active'));
    document.querySelector('.topnav a[href="#home"]')?.classList.add('active');
}

async function loginUser(email, password) {
    try {
        const response = await fetch('api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ email: email, password: password })
        });

        const result = await response.json();

        if (response.ok) {
            console.log('Login successful:', result);
            window.location.href = '/'; // Redirect to the root on success
            return { success: true };
        } else {
            console.error(`Login failed: ${response.status} - ${result?.error || response.statusText}`);
            return { success: false, message: result?.error || `Login failed (Status: ${response.status})` };
        }
    } catch (error) {
        console.error('Network error or problem during login:', error);
        return { success: false, message: 'Network error during login.' };
    }
}

function attachLoginListener() {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorParagraph = document.getElementById('login-error');

    if (loginForm && emailInput && passwordInput && errorParagraph) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            errorParagraph.textContent = '';
            errorParagraph.style.display = 'none';

            const email = emailInput.value;
            const password = passwordInput.value;

            const result = await loginUser(email, password);

            if (!result.success) {
                errorParagraph.textContent = result.message;
                errorParagraph.style.display = 'block';
            }
            // Success case is handled by redirection inside loginUser
        });
    } else {
        console.warn('Login form elements not found after loading content. Listener not attached.');
    }
}

async function signupUser(email, password) {
    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const contentType = response.headers.get('content-type') || '';

        let result;
        if (contentType.includes('application/json')) {
            result = await response.json();
        } else {
            const text = await response.text();
            console.warn('Expected JSON but got:', text);
            result = { error: 'Unexpected response from server.' };
        }

        if (response.ok) {
            console.log('Signup successful:', result);
            return { success: true, message: result?.message || 'Signup successful!' };
        } else {
            console.error(`Signup failed: ${response.status} - ${result?.error || response.statusText}`);
            return { success: false, message: result?.error || `Signup failed (Status: ${response.status})` };
        }
    } catch (error) {
        console.error('Network error or problem during signup:', error);
        return { success: false, message: 'Network error during signup.' };
    }
}

function attachSignupListener() {
    const signupForm = document.getElementById('signupForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const signupBtn = document.getElementById('signupBtn');
    const messageArea = document.getElementById('messageArea');

    if (signupForm && emailInput && passwordInput && signupBtn && messageArea) {
        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            messageArea.textContent = '';
            messageArea.className = 'message';

            const email = emailInput.value;
            const password = passwordInput.value;

            if (!email || !password) {
                showMessage(messageArea, 'Please fill in all fields.', 'error');
                return;
            }

            signupBtn.disabled = true;
            signupBtn.textContent = 'Signing up...';

            const result = await signupUser(email, password);

            if (result.success) {
                showMessage(messageArea, result.message, 'success');
                signupForm.reset();
                // Optionally redirect after successful signup
                // setTimeout(() => { loadContent('login'); }, 2000);
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

function showMessage(element, message, type) {
    if (element) {
        element.textContent = message;
        element.className = 'message';
        if (type === 'success' || type === 'error') {
            element.classList.add(type);
        }
        element.style.display = 'block';
    } else {
        console.error("Attempted to show message but target element was null.");
    }
}

window.onload = () => {
    loadContent('home');
};
