import mysql from 'mysql2';

import dotenv from 'dotenv'


const result = dotenv.config({path: './backend/.env'})

if (result.error) {
  throw result.error
}

console.log(result.parsed)

const Aa_pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    port: parseInt(process.env.MYSQL_PORT, 10),
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
}).promise()

console.log("Pool created. Ready to query.");

process.on('SIGINT', async () => {
  console.log('\nGracefully shutting down...');
  await Aa_pool.end()
  console.log('MYSQL pool has ended.');
  process.exit(); // Exit the program
  
});


//user functions

async function get_users() {
  console.log('Fetching all users')
  try {
    const [rows] = await Aa_pool.query("SELECT * FROM users",)
    return rows;
  } 
  catch (err) {
    console.error('Error executing query', err);
    return -1;
  } 
}

async function get_user_by_id(id) { 
  console.log('Fetching user by ID:', id) 
  try{
    const [rows] = await Aa_pool.query(`
      SELECT *
      FROM users
      WHERE user_id = ?`,
      [id])
    return rows[0];
  }
  catch(err){
    console.error('Error executing query', err);
    return -1;
    } 
}

async function get_user_by_name(name) {
  console.log('Fetching user by name:', name)
  try {
  const  [rows] = await Aa_pool.query(`
    SELECT *
    FROM users
    WHERE username = ?`,
    [name])
  return  rows;
  }
  catch(err){
    console.error('Error executing query', err);
    return -1;
  }
}

async function get_user_by_email(email) {
  console.log('Fetching user by email:', email)
  try{
    const [rows] = await Aa_pool.query(`
      SELECT *
      FROM users
      WHERE email = ?`,
      [email])
    return await rows[0];
  }
  catch (err){
      console.error('Error executing query', err);
      return -1;
    }
}

async function create_user(username, email, password_hash, role, ) {
  console.log('Creating user:', username)
  try{
    const [res] = await Aa_pool.query(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)`,
      [username, email, password_hash, role])
      console.log("user: " + username +" added")
      const id = res.insertId
    return get_user_by_id(id); 
  }
  catch (err){
      console.error('Error executing query', err);
      return -1;
    }
}

async function delete_user(email) {
  console.log('Deleting user:', email)
  try{
    const res = await Aa_pool.query(`
      DELETE FROM users 
      WHERE  email = ?`,
      [email])
      console.log("user: " + email +" delted")
    return 1; 
  }
  catch (err){
      console.error('Error executing query', err);
      return -1;
    }

}

async function get_friends() {
  console.log('Fetching all friends')
  try {
    const [rows] = await Aa_pool.query("SELECT * FROM friends",)
    return rows;
  } 
  catch (err) {
    console.error('Error executing query', err);
    return -1;
  } 
}

async function get_friends_by_user_id(id) { 
  const user = await get_user_by_id(id)
  const user_email = user.email
  console.log('Fetching friends by ' + user_email + "'s user_ID:", id) 
  try{
    const [rows] = await Aa_pool.query(`
      SELECT *
      FROM friends
      WHERE user_id = ?
      OR friend_id = ?`,
      [id, id])
    return rows;
  }
  catch(err){
    console.error('Error executing query', err);
    return -1;
    } 
}

async function create_friend(user_id, friend_id) {
  const user = await get_user_by_id(user_id)
  const friend = await get_user_by_id(friend_id)
  const user_email = user.email
  const friend_email = friend.email
  console.log('makeing '+ user_email + ' and ' + friend_email + ' frinds')
  try{
    const res = await Aa_pool.query(`
      INSERT 
      INTO friends (user_id, friend_id)
      VALUES (?, ?)`,
      [user_id, friend_id])
      console.log(user_email + ' and ' + friend_email + ' are now pending frinds')
    return 1; 
  }
  catch (err){
    console.error('Error executing query', err);
    return -1;
  }
}
    
async function delete_friendship(user_id, friend_id) {
  const user = await get_user_by_id(user_id)
  const friend = await get_user_by_id(friend_id)
  const user_email = user.email
  const friend_email = friend.email
  console.log('Deleting '+ user_email + ' and ' + friend_email + ' friendship')
  
  try{
    const res = await Aa_pool.query(`
      DELETE FROM friends
      WHERE (user_id = ? AND friend_id = ?)
      OR (user_id = ? AND friend_id = ?)`,
      [user_id, friend_id, friend_id, user_id])
  
      console.log(user_email + "'s and " + friend_email + "'s friendship is now over")
    return 1; 
  }
  catch (err){
    console.error('Error executing query', err);
    return -1;
  }
}


async function accepted_friendship(user_id, friend_id) {
  const user = await get_user_by_id(user_id)
  const friend = await get_user_by_id(friend_id)
  const user_email = user.email
  const friend_email = friend.email
  console.log(user_email + ' and ' + friend_email + ' are becoming friends')
  try{
    const res = await Aa_pool.query(`
      UPDATE friends 
      SET status = 'accepted'
      WHERE user_id = ?
      AND friend_id = ?`,
      [user_id, friend_id])
      console.log(user_email + " and " + friend_email + " are now friends")
    return 1; 
  }
  catch (err){
    console.error('Error executing query', err);
    return -1;
  }
}

async function get_messages() {
  console.log('Fetching all messages')
  try {
    const [rows] = await Aa_pool.query("SELECT * FROM messages",)
    return rows;
  } 
  catch (err) {
    console.error('Error executing query', err);
    return -1;
  } 
}

async function get_message_by_message_id(id) { 
  console.log('Fetching message by message ID:', id) 
  try{
    const [rows] = await Aa_pool.query(`
      SELECT *
      FROM messages
      WHERE message_id = ?`,
      [id])
    return rows[0];
  }
  catch(err){
    console.error('Error executing query', err);
    return -1;
    } 
}

async function get_messages_by_sender_id(id) { 
  console.log('Fetching messages by sender ID:', id) 
  try{
    const [rows] = await Aa_pool.query(`
      SELECT *
      FROM messages
      WHERE sender_id = ?`,
      [id])
    return rows;
  }
  catch(err){
    console.error('Error executing query', err);
    return -1;
    } 
}

async function get_messages_by_receiver_id(id) { 
  console.log('Fetching messages by receiver ID:', id) 
  try{
    const [rows] = await Aa_pool.query(`
      SELECT *
      FROM messages
      WHERE receiver_id = ?`,
      [id])
    return rows;
  }
  catch(err){
    console.error('Error executing query', err);
    return -1;
    } 
}

async function get_messages_by_sender_and_receiver_id(sender_id, receiver_id) { 
  console.log('Fetching messages by sender and receiver IDs:', sender_id, "and", receiver_id) 
  try{
    const [rows] = await Aa_pool.query(`
      SELECT *
      FROM messages
      WHERE sender_id = ?
      AND receiver_id = ?`,
      [sender_id, receiver_id])
    return rows;
  }
  catch(err){
    console.error('Error executing query', err);
    return -1;
    } 
}

async function create_message(sender_id, receiver_id, content) {
  const sender = await get_user_by_id(sender_id)
  const receiver = await get_user_by_id(receiver_id)
  const sender_email = sender.email
  const receiver_email = receiver.email
  console.log(sender_email + ' is sending a message to ' + receiver_email)
  try{
    const res = await Aa_pool.query(`
      INSERT 
      INTO messages (sender_id, receiver_id, content)
      VALUES (?, ?, ?)`,
      [sender_id, receiver_id, content])
      console.log(receiver_email + ' got message from ' + sender_email)
    return 1; 
  }
  catch (err){
    console.error('Error executing query', err);
    return -1;
  }
}

async function delete_message(message_id) {
  console.log('Deleting message:', message_id)
  try{
    const res = await Aa_pool.query(`
      DELETE FROM messages 
      WHERE  message_id = ?`,
      [message_id])
    console.log("message: " + message_id +" delted")
    return 1; 
  }
  catch (err){
    console.error('Error executing query', err);
    return -1;
  }
}


/*
test
console.log(await get_user_by_id(1));
console.log(await get_user_by_name("dummy_user1"));
console.log(await get_user_by_email("dummy_email2"));
console.log(await get_users());
console.log(await create_user('dummy_user3','dummy_email3','dummy_hash3','test'));
console.log(await get_users());
console.log(await delete_user('dummy_email3'));
console.log(await get_users());


console.log(await get_friends());
console.log(await create_friend(2, 3));
console.log(await get_friends_by_user_id(2));
console.log(await accepted_friendship(2, 3));
console.log(await get_friends());
console.log(await delete_friendship(2,3));
console.log(await get_friends());


console.log(await get_messages());
console.log(await get_message_by_message_id(3));
console.log(await get_messages_by_sender_id(1));
console.log(await get_messages_by_receiver_id(1));
console.log(await get_messages_by_sender_and_receiver_id(1,3));
console.log(await create_message(2, 1, "this is a new test"));
console.log(await get_messages_by_receiver_id(1));
console.log(await get_messages());
console.log(await delete_message(4));
console.log(await get_messages());
*/


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
  get_message_by_message_id,
  get_messages_by_sender_id,
  get_messages_by_receiver_id,
  get_messages_by_sender_and_receiver_id,
  create_message,
  delete_message
};
