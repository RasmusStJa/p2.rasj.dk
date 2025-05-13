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
            renderFeed(feedPosts);
        } else if (response.status === 401) {
            console.log('Not logged in. Redirecting to login...');
            window.location.href = '/login.html';
        } else {
            const errorData = await response.json();
            console.error(`Error fetching feed: ${errorData?.message || response.statusText}`);
        }
    } catch (error) {
        console.error('Network error or problem fetching feed:', error);
    }
}

function renderFeed(posts) {
    const postsContainer = document.getElementById('postsContainer');
    postsContainer.innerHTML = ''; // Clear the container before appending new posts

    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.classList.add('post');

        postElement.innerHTML = `
            <div><strong>${post.username}</strong> <small>${new Date(post.created_at).toLocaleString()}</small></div>
            <p>${post.content}</p>
        `;

        postsContainer.appendChild(postElement); // Add the post to the container
    });
}


// Function to create a new post
async function createPost() {
    const content = document.getElementById('postContent').value;

    if (!content.trim()) {
        alert('Post content cannot be empty');
        return;
    }

    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content })
        });

        if (response.ok) {
            const post = await response.json();
            console.log('New post created:', post);
            fetchFeed(); // Refresh the feed after creating a post
            document.getElementById('postContent').value = ''; // Clear input after posting
        } else {
            const errorData = await response.json();
            console.error('Error creating post:', errorData.message);
        }
    } catch (error) {
        console.error('Network error while creating post:', error);
    }
}

window.createPost = createPost;

// Call fetchFeed when the page loads to display the existing posts
document.addEventListener('DOMContentLoaded', fetchFeed);
