async function fetchFeed() {
    const container = document.getElementById('postsContainer');
    container.innerHTML = 'Loading posts...';

    console.log('[DEBUG] Starting fetchFeed');

    try {
        const response = await fetch('/api/feed', {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('[DEBUG] /api/feed response status:', response.status);

        if (!response.ok) throw new Error('Failed to fetch posts');

        const posts = await response.json();

        console.log('[DEBUG] Posts received:', posts);

        if (posts.length === 0) {
            container.innerHTML = '<p>No posts yet.</p>';
            return;
        }

        container.innerHTML = posts.map(post => `
            <div class="post">
                <p>${post.content}</p>
                <small>By ${post.username}</small>
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

    console.log('[DEBUG] Creating post with content:', content);

    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });

         console.log('[DEBUG] /api/posts response status:', response.status);

        if (!response.ok) {
            const errData = await response.json();
            console.error('[ERROR] Post creation failed:', errData);
            throw new Error('Failed to create post');
        }
        
        console.log('[DEBUG] Post created successfully');
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
