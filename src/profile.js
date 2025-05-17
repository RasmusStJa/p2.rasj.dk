function openProject(projectName) {
    document.getElementById('modalTitle').innerText = projectName;
    // You could load project-specific content here too
    document.getElementById('projectModal').style.display = 'block';
  }
  
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}
    
function toggleFollow(button) {
    if (button.classList.contains('following')) {
      button.classList.remove('following');
      button.textContent = '+ Follow';
    } else {
      button.classList.add('following');
      button.textContent = '- Follow';
    }
  }
  
// --- New Profile View and Edit Functions ---

// Function to fetch and display user profile data
async function loadUserProfile() {
    console.log("loadUserProfile function CALLED (inside profile.js)");
    try {
        console.log("Attempting to fetch /api/users/me... (inside profile.js)");
        const response = await fetch('/api/users/me', { // GET request
            credentials: 'include'
        });
        console.log("Fetch response received (inside profile.js):", response);

        if (!response.ok) {
            console.error("Response not OK (inside profile.js):", response.status, response.statusText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        console.log("Attempting to parse response JSON... (inside profile.js)");
        const userData = await response.json();
        console.log("userData received (inside profile.js):", userData);

        // Populate profile display
        const profileUsernameEl = document.getElementById('profileUsername');
        if (profileUsernameEl) {
            profileUsernameEl.textContent = userData.username || 'N/A';
        } else {
            console.warn("#profileUsername element not found (inside profile.js)");
        }
        
        const profileDisplayNameEl = document.getElementById('profileDisplayName');
        if (profileDisplayNameEl) {
            profileDisplayNameEl.textContent = userData.displayName || 'N/A';
        } else {
            console.warn("#profileDisplayName element not found (inside profile.js)");
        }

        const profileEmailEl = document.getElementById('profileEmail');
        if (profileEmailEl) {
            profileEmailEl.textContent = userData.email || 'N/A';
        } else {
            console.warn("#profileEmail element not found (inside profile.js)");
        }
        
        const profileBioEl = document.getElementById('profileBio');
        if (profileBioEl) {
            profileBioEl.textContent = userData.bio || 'N/A';
        } else {
            console.warn("#profileBio element not found (inside profile.js)");
        }

        // Pre-fill edit form (if elements exist)
        const editDisplayName = document.getElementById('editDisplayName');
        const editBio = document.getElementById('editBio');
        if (editDisplayName) {
            editDisplayName.value = userData.displayName || '';
        } else {
            console.warn("#editDisplayName element not found for pre-fill (inside profile.js)");
        }
        if (editBio) {
            editBio.value = userData.bio || '';
        } else {
            console.warn("#editBio element not found for pre-fill (inside profile.js)");
        }

    } catch (error) {
        console.error('Failed to load user profile (inside catch block in profile.js):', error);
        // Display an error message to the user
    }
}

// Function to open the edit profile modal
function openEditProfileModal() {
    // Pre-fill form with current data (from JS variables or by fetching again)
    const displayNameInput = document.getElementById('editDisplayName');
    const programInput = document.getElementById('editProgram');
    const bioInput = document.getElementById('editBio');

    // Example: Assuming you have current user data stored in a JS object `currentUserProfile`
    // displayNameInput.value = currentUserProfile.displayName || '';
    // programInput.value = currentUserProfile.program || '';
    // bioInput.value = currentUserProfile.bio || '';
    
    document.getElementById('editModalTitle').innerText = 'Edit Profile'; // Or set based on user's name
    document.getElementById('editProfileModal').style.display = 'block';
}

// Function to handle profile update submission
async function handleProfileUpdate(event) {
    event.preventDefault(); // Prevent default form submission

    const displayName = document.getElementById('editDisplayName').value;
    const bio = document.getElementById('editBio').value;

    try {
        const response = await fetch('/api/users/me', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ displayName, bio }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const updatedUserData = await response.json();

        // Update the profile display on the page
        document.getElementById('profileDisplayName').textContent = updatedUserData.displayName || 'N/A';
        document.getElementById('profileBio').textContent = updatedUserData.bio || 'N/A';
        
        // Optionally update other fields if returned
        if (updatedUserData.username) document.getElementById('profileUsername').textContent = updatedUserData.username;
        if (updatedUserData.email) document.getElementById('profileEmail').textContent = updatedUserData.email;


        closeModal('editProfileModal'); // Close the modal on success
        alert('Profile updated successfully!');

    } catch (error) {
        console.error('Failed to update profile:', error);
        alert(`Error updating profile: ${error.message}`);
    }
}


async function loadPublicProfile() {
    const hash = window.location.hash; 
    const parts = hash.split('/');     
    const userId = parts[1];           

    if (!userId) {
        alert('No userId specified.');
        return;
    }

    try {
        const res = await fetch(`/api/publicProfile/${userId}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load profile.');

        const data = await res.json();

        // Display user info
        document.getElementById('username').textContent = data.user.username;

    } catch (err) {
        alert(err.message);
        console.error(err);
    }
}


// --- Event Listeners ---

// ENSURE THIS ENTIRE BLOCK IS COMMENTED OUT OR REMOVED:
/*
window.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();

    // Attach event listener to the edit profile form
    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', handleProfileUpdate);
    }
});
*/
  
