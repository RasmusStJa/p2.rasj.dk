// Fetch and display the feed
async function loadFeed() {
    try {
        const response = await fetch('/api/feed', {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to load feed');
        }

        const posts = await response.json();
        renderPosts(posts);
    } catch (error) {
        console.error('Error loading feed:', error);
        const container = document.getElementById('postsContainer');
        if (container) container.innerHTML = '<p>Failed to load feed.</p>';
    }
}

// Post creation logic
async function createPost() {
    const textarea = document.getElementById('postContent');
    const content = textarea?.value.trim();

    if (!content) {
        alert('Post content cannot be empty.');
        return;
    }

    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ content })
        });

        const result = await response.json();

        if (response.ok) {
            textarea.value = ''; // Clear textarea
            loadFeed();          // Refresh the feed
        } else {
            console.error('Post creation failed:', result.error);
            alert(result.error || 'Failed to create post.');
        }
    } catch (err) {
        console.error('Error creating post:', err);
        alert('Network error while creating post.');
    }
}

// Render posts to DOM
function renderPosts(posts) {
    const container = document.getElementById('postsContainer');

    if (!container) return;

    if (!posts || posts.length === 0) {
        container.innerHTML = '<p>No posts to show.</p>';
        return;
    }

    container.innerHTML = posts.map(post => `
        <div class="post-card">
            <p><strong>${post.username}</strong> <small>${new Date(post.created_at).toLocaleString()}</small></p>
            <p>${post.content}</p>
        </div>
    `).join('');
}
