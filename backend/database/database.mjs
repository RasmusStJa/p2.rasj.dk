import mysql from 'mysql2';
import dotenv from 'dotenv';

const result = dotenv.config({ path: './backend/.env' });

if (result.error) {
  throw result.error;
}

console.log("Loaded .env:", result.parsed);

const Aa_pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  port: parseInt(process.env.MYSQL_PORT, 10),
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
}).promise();

console.log("MySQL connection pool created.");

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nGracefully shutting down...');
  await Aa_pool.end();
  console.log('MySQL pool has ended.');
  process.exit();
});

// ───── USER FUNCTIONS ─────

async function get_users() {
  try {
    const [rows] = await Aa_pool.query("SELECT * FROM users");
    return rows;
  } catch (err) {
    console.error('Error fetching users:', err);
    return -1;
  }
}

async function get_user_by_id(id) {
  try {
    const [rows] = await Aa_pool.query(
      "SELECT * FROM users WHERE user_id = ?",
      [id]
    );
    return rows[0];
  } catch (err) {
    console.error('Error fetching user by ID:', err);
    return -1;
  }
}

async function get_user_by_name(name) {
  try {
    const [rows] = await Aa_pool.query(
      "SELECT * FROM users WHERE username = ?",
      [name]
    );
    return rows;
  } catch (err) {
    console.error('Error fetching user by name:', err);
    return -1;
  }
}

async function get_user_by_email(email) {
  try {
    const [rows] = await Aa_pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    return rows[0];
  } catch (err) {
    console.error('Error fetching user by email:', err);
    return -1;
  }
}

async function create_user(username, email, password_hash, role) {
  try {
    const [res] = await Aa_pool.query(
      "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
      [username, email, password_hash, role]
    );
    console.log("User created:", username);
    return get_user_by_id(res.insertId);
  } catch (err) {
    console.error('Error creating user:', err);
    return -1;
  }
}

async function delete_user(email) {
  try {
    await Aa_pool.query("DELETE FROM users WHERE email = ?", [email]);
    console.log("User deleted:", email);
    return 1;
  } catch (err) {
    console.error('Error deleting user:', err);
    return -1;
  }
}

// ───── FRIEND FUNCTIONS ─────

async function get_friends() {
  try {
    const [rows] = await Aa_pool.query("SELECT * FROM friends");
    return rows;
  } catch (err) {
    console.error('Error fetching friends:', err);
    return -1;
  }
}

async function get_friends_by_user_id(id) {
  try {
    const [rows] = await Aa_pool.query(
      "SELECT * FROM friends WHERE user_id = ? OR friend_id = ?",
      [id, id]
    );
    return rows;
  } catch (err) {
    console.error('Error fetching friends by user ID:', err);
    return -1;
  }
}

async function create_friend(user_id, friend_id) {
  try {
    await Aa_pool.query(
      "INSERT INTO friends (user_id, friend_id) VALUES (?, ?)",
      [user_id, friend_id]
    );
    console.log(`Friend request sent from ${user_id} to ${friend_id}`);
    return 1;
  } catch (err) {
    console.error('Error creating friend:', err);
    return -1;
  }
}

async function delete_friendship(user_id, friend_id) {
  try {
    await Aa_pool.query(
      `DELETE FROM friends 
       WHERE (user_id = ? AND friend_id = ?) 
       OR (user_id = ? AND friend_id = ?)`,
      [user_id, friend_id, friend_id, user_id]
    );
    console.log(`Friendship between ${user_id} and ${friend_id} deleted.`);
    return 1;
  } catch (err) {
    console.error('Error deleting friendship:', err);
    return -1;
  }
}

async function accepted_friendship(user_id, friend_id) {
  try {
    await Aa_pool.query(
      "UPDATE friends SET status = 'accepted' WHERE user_id = ? AND friend_id = ?",
      [user_id, friend_id]
    );
    console.log(`Friendship accepted between ${user_id} and ${friend_id}`);
    return 1;
  } catch (err) {
    console.error('Error accepting friendship:', err);
    return -1;
  }
}

// ───── MESSAGE FUNCTIONS ─────

async function get_messages() {
  try {
    const [rows] = await Aa_pool.query("SELECT * FROM messages");
    return rows;
  } catch (err) {
    console.error('Error fetching messages:', err);
    return -1;
  }
}

async function get_message_by_message_id(id) {
  try {
    const [rows] = await Aa_pool.query(
      "SELECT * FROM messages WHERE message_id = ?",
      [id]
    );
    return rows[0];
  } catch (err) {
    console.error('Error fetching message by ID:', err);
    return -1;
  }
}

async function get_messages_by_sender_id(id) {
  try {
    const [rows] = await Aa_pool.query(
      "SELECT * FROM messages WHERE sender_id = ?",
      [id]
    );
    return rows;
  } catch (err) {
    console.error('Error fetching messages by sender ID:', err);
    return -1;
  }
}

async function get_messages_by_receiver_id(id) {
  try {
    const [rows] = await Aa_pool.query(
      "SELECT * FROM messages WHERE receiver_id = ?",
      [id]
    );
    return rows;
  } catch (err) {
    console.error('Error fetching messages by receiver ID:', err);
    return -1;
  }
}

async function get_messages_by_sender_and_receiver_id(sender_id, receiver_id) {
  try {
    const [rows] = await Aa_pool.query(
      "SELECT * FROM messages WHERE sender_id = ? AND receiver_id = ?",
      [sender_id, receiver_id]
    );
    return rows;
  } catch (err) {
    console.error('Error fetching messages between sender and receiver:', err);
    return -1;
  }
}

async function create_message(sender_id, receiver_id, content) {
  try {
    await Aa_pool.query(
      "INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)",
      [sender_id, receiver_id, content]
    );
    console.log(`Message sent from ${sender_id} to ${receiver_id}`);
    return 1;
  } catch (err) {
    console.error('Error creating message:', err);
    return -1;
  }
}

async function delete_message(message_id) {
  try {
    await Aa_pool.query("DELETE FROM messages WHERE message_id = ?", [message_id]);
    console.log(`Message ${message_id} deleted.`);
    return 1;
  } catch (err) {
    console.error('Error deleting message:', err);
    return -1;
  }
}

// ───── EXPORTS ─────

export {
  get_users,
  get_user_by_id,
  get_user_by_name,
  get_user_by_email,
  create_user,
  delete_user,
  get_friends,
  get_friends_by_user_id,
  create_friend,
  delete_friendship,
  accepted_friendship,
  get_messages,
  get_message_by_message_id,
  get_messages_by_sender_id,
  get_messages_by_receiver_id,
  get_messages_by_sender_and_receiver_id,
  create_message,
  delete_message
};
