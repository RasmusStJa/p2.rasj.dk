import mysql from 'mysql2';

import dotenv from 'dotenv'


const result = dotenv.config()

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


console.log(await get_user_by_id(1));
console.log(await get_user_by_name("dummy_user1"));
console.log(await get_user_by_email("dummy_email2"));
console.log(await get_users());
console.log(await create_user('dummy_user3','dummy_email3','dummy_hash3','test'));
console.log(await get_users());
console.log(await delete_user('dummy_email3'));
console.log(await get_users());