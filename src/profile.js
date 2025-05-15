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
    try {
        // Assume your backend API endpoint for the current user is /api/users/me
        const response = await fetch('/api/users/me', { // GET request
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const userData = await response.json();

        // Populate profile display
        document.getElementById('profileUsername').textContent = userData.username || 'N/A';
        document.getElementById('profileDisplayName').textContent = userData.displayName || 'N/A';
        document.getElementById('profileEmail').textContent = userData.email || 'N/A';
        document.getElementById('profileBio').textContent = userData.bio || 'N/A';

        // Pre-fill edit form (if elements exist)
        const editDisplayName = document.getElementById('editDisplayName');
        const editBio = document.getElementById('editBio');
        if (editDisplayName) editDisplayName.value = userData.displayName || '';
        if (editBio) editBio.value = userData.bio || '';

    } catch (error) {
        console.error('Failed to load user profile:', error);
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

// --- Event Listeners ---

// Call loadUserProfile when the page loads
window.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();

    // Attach event listener to the edit profile form
    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', handleProfileUpdate);
    }
});
  
