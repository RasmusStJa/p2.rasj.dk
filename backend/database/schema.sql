

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL, -- 'student' or 'staff'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE friends (
    user_id INT REFERENCES users(user_id),
    friend_id INT REFERENCES users(user_id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')), -- 'pending', 'accepted', 'rejected'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, friend_id)
);

CREATE TABLE messages (
    message_id SERIAL PRIMARY KEY,
    sender_id INT REFERENCES users(user_id),
    receiver_id INT REFERENCES users(user_id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/*
INSERT INTO users (username, email, password_hash, role)
VALUES
('dummy_user1','dummy_email1','dummy_hash1','test'),
('dummy_user2','dummy_email2','dummy_hash2','test'),
('dummy_user3','dummy_email3','dummy_hash3','test');

INSERT INTO messages (sender_id, receiver_id, content)
VALUES
(1,2,"this is a test"),
(1,3,"this is a test"),
(3,1,"this is a test");


INSERT INTO friends (user_id, friend_id)
VALUES
(1,2),
(1,3);
*/