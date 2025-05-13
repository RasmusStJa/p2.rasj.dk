async function fetchFeed() {
    const container = document.getElementById('postsContainer');
    container.innerHTML = 'Loading posts...';

    try {
        const response = await fetch('/api/feed', {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error('Failed to fetch posts');

        const posts = await response.json();

        if (posts.length === 0) {
            container.innerHTML = '<p>No posts yet.</p>';
            return;
        }

        container.innerHTML = posts.map(post => `
            <div class="post">
                <p>${post.content}</p>
                <small>By user ${post.user_id}</small>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading feed:', error);
        container.innerHTML = '<p>Error loading posts.</p>';
    }
}

// Handle new post creation
async function createPost() {
    const content = document.getElementById('postContent').value.trim();
    if (!content) {
        alert('Please write something first.');
        return;
    }

    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });

        if (!response.ok) throw new Error('Failed to create post');

        document.getElementById('postContent').value = '';
        fetchFeed(); // Refresh the feed
    } catch (error) {
        console.error('Error creating post:', error);
        alert('Failed to post. Are you logged in?');
    }
}

window.createPost = createPost;

// Load feed on load
fetchFeed();
