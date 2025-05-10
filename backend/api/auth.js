import bcrypt from 'bcrypt';
import pool from '../db';

export async function signupUser({ email, password }) {
    const username = email.split('@')[0];
    const dbPool = await pool();

    // Check if email already exists
    const checkEmailQuery = 'SELECT user_id FROM users WHERE email = ?';
    const [emailRows] = await dbPool.query(checkEmailQuery, [email]);

    if (emailRows.length > 0) {
        throw new Error('Email already exists.');
    }

    // Check if username already exists
    const checkUsernameQuery = 'SELECT user_id FROM users WHERE username = ?';
    const [usernameRows] = await dbPool.query(checkUsernameQuery, [username]);

    if (usernameRows.length > 0) {
        throw new Error('Username already exists.');
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert the new user
    const role = 'student';
    const insertUserQuery = 'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)';
    
    const [result] = await dbPool.query(insertUserQuery, [
        username,
        email,
        hashedPassword,
        role
    ]);

    return {
        userId: result.insertId,
        username
    };
}
