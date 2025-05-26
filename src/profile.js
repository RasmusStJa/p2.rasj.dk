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
    
async function friends(button) {
    const hash = window.location.hash; 
    const match = hash.match(/\/(\d+)$/);
    const targetUserId = match ? match[1] : null;

    if (!targetUserId) {
        console.error("No target user ID found in URL.");
        return;
    }

    try {
        // Step 1: Check friendship status
        const response = await fetch(`/api/friends/status/${targetUserId}`, {
            credentials: 'include'
        });

        if (!response.ok) throw new Error("Failed to check friendship status");

        const { status } = await response.json();

        // Step 2: Handle each status case
        if (status === 'none' || status === 'rejected') {
            // Send friend request
            const sendRes = await fetch(`/api/friends/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ friendId: targetUserId })
            });

            if (!sendRes.ok) throw new Error("Failed to send friend request");

            button.textContent = 'Pending (Cancel)';
            button.classList.add('pending');
            button.classList.remove('friend');
        } else if (status === 'pending') {
            // Cancel pending request
            const cancelRes = await fetch(`/api/friends/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ friendId: targetUserId })
            });

            if (!cancelRes.ok) throw new Error("Failed to cancel request");

            button.textContent = '+ Add Friend';
            button.classList.remove('pending', 'friend');
        } else if (status === 'accepted') {
            // Confirm and remove friend
            const confirmDelete = confirm("Are you sure you want to remove this friend?");
            if (!confirmDelete) return;

            const deleteRes = await fetch(`/api/friends/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ friendId: targetUserId })
            });

            if (!deleteRes.ok) throw new Error("Failed to delete friend");

            button.textContent = '+ Add Friend';
            button.classList.remove('friend');
        }

    } catch (err) {
        console.error("Friendship handling error:", err);
        alert("Error handling friend request.");
    }
}

  
// --- New Profile View and Edit Functions ---

// Function to fetch and display user profile data
async function loadProfile(id) {
    let endpoint = '/api/users/';
    let isSelf = false;

    if (!id) {
        alert('No userId specified.');
        return;
    }

    if (id === 'me') {
        endpoint += 'me';
        isSelf = true;
    } else if (typeof id === 'string' || typeof id === 'number') {
        endpoint += id;
    } else {
        console.error('Invalid user ID provided to loadProfile:', id);
        return;
    }

    try {
        const response = await fetch(endpoint, {
            credentials: 'include'
        });

        if (!response.ok) {
            console.error("Response not OK (inside profile.js):", response.status, response.statusText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const userData = await response.json();

        const profileUsernameEl = document.getElementById('profileUsername');
        const profileEmailEl = document.getElementById('profileEmail');
        const profileBioEl = document.getElementById('profileBio');
        const followBtn = document.getElementById('followBtn');
        const editBtn = document.getElementById('editBtn');
        const deleteBtn = document.getElementById('deleteBtn');

        const profileStudyEl = document.getElementById('profileStudy');
        const profileHashtagsEl = document.getElementById('profileHashtags');

        // Populate profile display
        if (profileUsernameEl) profileUsernameEl.textContent = userData.displayName || userData.username || 'N/A';
        
        if (profileEmailEl) profileEmailEl.textContent = userData.email || 'N/A';
        if (profileBioEl) profileBioEl.textContent = userData.bio || 'N/A';

            if (profileStudyEl) {
                const program = userData.program || '';
                const school = userData.school || '';
                profileStudyEl.textContent = (program || school)
                ? `${program}${program && school ? ' @ ' : ''}${school}`
                : 'N/A';
            }
        
         if (profileHashtagsEl) profileHashtagsEl.textContent = userData.hashtags || 'N/A';

        // If it's your own profile, pre-fill the edit form
        if (isSelf) {
            const editDisplayName = document.getElementById('editDisplayName');
            const editBio = document.getElementById('editBio');
            const editProgram = document.getElementById('"editProgram');
            const editSchool = document.getElementById('editSchool');
            const editHashtags = document.getElementById('editHashtags');

            if (editDisplayName) editDisplayName.value = userData.displayName || '';
            if (editBio) editBio.value = userData.bio || '';
            if (editProgram) editProgram.value = userData.program || '';
            if (editSchool) editSchool.value = userData.school || '';
            if (editHashtags) editHashtags.value = userData.hashtags || '';

            followBtn.style.display = 'none';
            editBtn.style.display = 'inline';
            deleteBtn.style.display = 'inline';
        } else {
            followBtn.style.display = 'inline';
            editBtn.style.display = 'none';
            deleteBtn.style.display = 'none';
            updateFriendButton(followBtn, id);
        }

    } catch (error) {
        console.error('Failed to load user profile:', error);
        alert(`Failed to load profile: ${error.message}`);
    }
}


// Function to open the edit profile modal
function openEditProfileModal() {
    const displayNameInput = document.getElementById('editDisplayName');
    const bioInput = document.getElementById('editBio');
    const modalTitle = document.getElementById('editModalTitle');
    const modal = document.getElementById('editProfileModal');
    const program = document.getElementById('editProgram');
    const school = document.getElementById('editSchool');
    const hashtags = document.getElementById('editHashtags');

    if (!displayNameInput || !bioInput || !modalTitle || !modal || !program || !school || !hashtags) {
        console.error('Edit modal elements not found in DOM.');
        return;
    }

    modalTitle.innerText = 'Edit Profile';
    modal.style.display = 'block';
}

// Function to handle profile update submission
async function handleProfileUpdate(event) {
    event.preventDefault(); // Prevent default form submission

    const displayName = document.getElementById('editDisplayName').value;
    const bio = document.getElementById('editBio').value;
    const program = document.getElementById('editProgram').value;
    const school = document.getElementById('editSchool').value;
    const hashtags = document.getElementById('editHashtags').value;

    try {
        const response = await fetch('/api/users/me', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ displayName, program, bio, school, hashtags }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const updatedUserData = await response.json();

        // Update the profile display on the page
        document.getElementById('profileUsername').textContent = updatedUserData.displayName || updatedUserData.username || 'N/A';

        document.getElementById('profileBio').textContent = updatedUserData.bio || 'N/A';
        
        // Optionally update other fields if returned
        if (updatedUserData.email) document.getElementById('profileEmail').textContent = updatedUserData.email;


        closeModal('editProfileModal'); // Close the modal on success
        alert('Profile updated successfully!');

    } catch (error) {
        console.error('Failed to update profile:', error);
        alert(`Error updating profile: ${error.message}`);
    }
}

function DeleteProfile() {
    const confirmDelete = confirm("⚠️ Are you sure you want to permanently delete your profile and all related data? This action cannot be undone.");

    if (!confirmDelete) return;

    fetch('/api/delete', {
        method: 'POST',
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Failed to delete profile: ${response.statusText}`);
        }
        return response.json(); // optional if your endpoint sends JSON
    })
    .then(() => {
        alert("Your profile has been deleted.");
        window.location.href = '/'; // Redirect to home or login
    })
    .catch(error => {
        console.error("Error deleting profile:", error);
        alert("An error occurred while deleting your profile.");
    });
}

async function updateFriendButton(button, targetUserId) {
  const resp = await fetch(`/api/friends/status/${targetUserId}`, {
    credentials: 'include'
  });
  if (!resp.ok) {
    console.warn('Could not get friendship status');
    return;
  }
  const { status } = await resp.json();
  button.classList.remove('pending', 'friend');
  if (status === 'none' || status === 'rejected') {
    button.textContent = '+ Add Friend';
  } else if (status === 'pending') {
    button.textContent = 'Pending (Cancel)';
    button.classList.add('pending');
  } else if (status === 'accepted') {
    button.textContent = '- Remove Friend';
    button.classList.add('friend');
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
  
