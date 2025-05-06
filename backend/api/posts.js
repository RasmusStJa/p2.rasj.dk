async function createNewPost(postContent) {
    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            // Adjust the body based on what your backend expects
            // You might need to include tags or other data
            body: JSON.stringify({ content: postContent })
        });

        const newPost = await response.json(); // Assumes backend returns the created post or a success message

        if (response.ok || response.status === 201) { // Check for OK or Created status
            console.log('Post created successfully:', newPost);
            // Optionally, clear the input field, refresh the feed, etc.
            // Example: clearPostInput(); fetchFeed();
            return newPost; // Return the created post data
        } else if (response.status === 401) {
             console.log('Not logged in. Redirecting to login...');
             // Redirect to login page
             // window.location.href = '/login.html';
             return null;
        } else {
            // Handle other errors (400, 500)
            console.error(`Error creating post: ${response.status} - ${newPost?.message || newPost?.error || response.statusText}`);
            // Display an error message to the user
            return null;
        }
    } catch (error) {
        console.error('Network error or problem creating post:', error);
        // Display a network error message to the user
        return null;
    }
}

// Example usage (e.g., in a form submit handler for creating posts):
// const postTextArea = document.getElementById('post-content');
// const createdPost = await createNewPost(postTextArea.value);
// if (createdPost) { /* Update UI */ } else { /* Show error */ }
