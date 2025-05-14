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

function formatTime(isoString) {
    const time = new Date(isoString);
    const now = new Date();

    const isToday = time.toDateString() === now.toDateString();
    const diff = Math.floor((now - time) / 1000);

    if (isToday) {
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    }

    return time.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Render posts to DOM
function renderPosts(posts) {
    const container = document.getElementById('postsContainer');

    if (!container) return;

    if (!posts || posts.length === 0) {
        container.innerHTML = '<p>No posts to show.</p>';
        return;
    }

    container.innerHTML = posts.map(post => {
        const reactions = post.reactions || { like: 0, laugh: 0, heart: 0 };

        return `
            <div class="post-card" data-id="${post.post_id}">
                <div class="post-header">
                    <span class="post-user">${post.username}</span>
                    <span class="post-time">${formatTime(post.created_at)}</span>
                </div>
                <p class="post-content">${post.content}</p>
                <div class="post-actions">
                    <span class="reaction-btn" data-type="like">👍 <span class="count">${reactions.like}</span></span>
                    <span class="reaction-btn" data-type="laugh">😂 <span class="count">${reactions.laugh}</span></span>
                    <span class="reaction-btn" data-type="heart">❤️ <span class="count">${reactions.heart}</span></span>
                    <button class="comment-btn">💬 Comment</button>
                    <div class="comment-box hidden">
                        <input type="text" placeholder="Write a comment..." class="comment-input"/>
                        <button class="submit-comment">Post</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');


// REACTION HANDLERS
    container.querySelectorAll('.reaction-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const postCard = btn.closest('.post-card');
            const postId = postCard.dataset.id;
            const reactionType = btn.dataset.type;

            try {
                const res = await fetch(`/api/posts/${postId}/react`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ reactionType })
                });

                if (res.ok) {
                    const data = await res.json();
                    const updatedReactions = data.reactions;

                    // Update each count
                    postCard.querySelector('[data-type="like"] .count').textContent = updatedReactions.like;
                    postCard.querySelector('[data-type="laugh"] .count').textContent = updatedReactions.laugh;
                    postCard.querySelector('[data-type="heart"] .count').textContent = updatedReactions.heart;
                }
            } catch (err) {
                console.error('Failed to react to post:', err);
            }
        });
    });

    // COMMENT HANDLERS
    container.querySelectorAll('.comment-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const box = btn.nextElementSibling;
            box.classList.toggle('hidden');
        });
    });

    container.querySelectorAll('.submit-comment').forEach(btn => {
        btn.addEventListener('click', async () => {
            const postCard = btn.closest('.post-card');
            const postId = postCard.dataset.id;
            const input = postCard.querySelector('.comment-input');
            const comment = input.value.trim();

            if (!comment) return;

            try {
                const res = await fetch(`/api/posts/${postId}/comment`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ comment })
                });

                if (res.ok) {
                    input.value = '';
                }
            } catch (err) {
                console.error('Failed to post comment:', err);
            }
        });
    });
}
