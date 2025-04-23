async function fetchFeed() {
    try {
        const response = await fetch('/api/feed', {
            method: 'GET',
            headers: {
                'Accept': 'application/json' // Indicate we expect JSON back
            }
        });

        if (response.ok) {
            const feedPosts = await response.json();
            console.log('Feed loaded:', feedPosts);
            // Now you can use feedPosts to display the feed in your UI
            // Example: renderFeed(feedPosts);
        } else if (response.status === 401) {
            console.log('Not logged in. Redirecting to login...');
            // Redirect to login page
            // window.location.href = '/login.html';
        } else {
            // Handle other errors (e.g., 500)
            const errorData = await response.json(); // Try to get error message from body
            console.error(`Error fetching feed: ${response.status} - ${errorData?.message || response.statusText}`);
            // Display an error message to the user
        }
    } catch (error) {
        console.error('Network error or problem fetching feed:', error);
        // Display a network error message to the user
    }
}

// Example usage: Call this function when the feed page loads
// fetchFeed();
