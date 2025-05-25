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
        post.reactions = post.reactions || { like: 0, laugh: 0, heart: 0 };

        return `
            <div class="post-card" data-id="${post.post_id}">
                <div class="post-header">
                    <a href="#profile/${post.user_id}" onclick="loadContent('profile/${post.user_id}')" class="post-user">${post.username}</a>
                    <span class="post-time">${formatTime(post.created_at)}</span>
                </div>
                <p class="post-content">${post.content}</p>
                <div class="post-actions">
                
                    <button class="reaction-btn" data-reaction="like">
                      <span class="reaction-emoji">👍</span>
                      <span class="reaction-count">${post.reactions.like}</span>
                    </button>
                    <button class="reaction-btn" data-reaction="laugh">
                      <span class="reaction-emoji">😂</span>
                      <span class="reaction-count">${post.reactions.laugh}</span>
                    </button>
                    <button class="reaction-btn" data-reaction="heart">
                      <span class="reaction-emoji">❤️</span>
                      <span class="reaction-count">${post.reactions.heart}</span>
                    </button>
                    
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
            const reactionType = btn.dataset.reaction;

            try {
                const res = await fetch(`/api/posts/${postId}/react`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ reactionType })
                });

                if (res.ok) {
                    const data = await res.json();
                    // Update the reaction count in the UI
                    const countSpan = btn.querySelector('.reaction-count');
                        if (countSpan) {
                          countSpan.textContent = data.reactions[reactionType] ?? 0;
                        }
                }
            } catch (err) {
                console.error('Failed to react to post:', err);
            }
        });
    });

    // COMMENT HANDLERS
    container.querySelectorAll('.comment-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
        const box = btn.nextElementSibling;       
        const postCard = btn.closest('.post-card');
        const postId = postCard.dataset.id;
        const commentBox = postCard.querySelector('.comment-box');
        const sidebar = document.getElementById('commentsSidebar');

        if (!sidebar) return;

        sidebar.innerHTML = '<p>Loading comments...</p>';

        if (box.classList.contains('hidden')) {
        // Fetch & render existing comments
        try {
            const resp = await fetch(`/api/posts/${postId}/comments`, {
            credentials: 'include'
            });
            if (resp.ok) {
            const comments = await resp.json();
            if (comments.length) {
                sidebar.innerHTML = `
                        <h3>Comments</h3>
                        ${comments.map(c => `
                            <div class="comment-block">
                                <p><strong>${c.username}</strong> ${formatTime(c.created_at)}</p>
                                <p>${c.content}</p>
                            </div>
                        `).join('')}
                        <div class="comment-box">
                            <input type="text" placeholder="Write a comment..." class="comment-input"/>
                            <button class="submit-comment">Post</button>
                        </div>
                    `;
            } else {
                existingDiv.innerHTML = '<p>No comments yet.</p>';
            }
            } else {
            existingDiv.innerHTML = '<p>Failed to load comments.</p>';
            }
        } catch (err) {
            console.error('Error loading comments:', err);
            existingDiv.innerHTML = '<p>Error loading comments.</p>';
        }
        }

        document.querySelectorAll('.post-card').forEach(p => p.classList.remove('highlighted'));
        postCard.classList.add('highlighted');
        
        box.classList.toggle('hidden');
        sidebar.classList.toggle('hidden');
        });
    });

    container.querySelectorAll('.submit-comment').forEach(btn => {
        btn.addEventListener('click', async () => {
            const postCard = btn.closest('.post-card');
            const postId = postCard.dataset.id;
            const input = document.querySelector('#commentsSidebar .comment-input');
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
