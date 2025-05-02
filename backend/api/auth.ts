import bcrypt from 'bcrypt';
import pool from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface SignupParams {
    email: string;
    password: string;
}

export interface SignupResult {
    userId: number;
    username: string;
}

interface UserRow extends RowDataPacket {
    user_id: number;
    email: string;
}

export async function signupUser({ email, password }: SignupParams): Promise<SignupResult> {
    const username = email.split('@')[0];
    const dbPool = await pool();

    // Check if user exists
    const checkUserQuery = 'SELECT user_id, email FROM users WHERE email = ?';
    const [existingUsers] = await dbPool.query<UserRow[]>(checkUserQuery, [email]);

    if (existingUsers.length > 0) {
        const existing = existingUsers[0];
        let conflictField = existing.email === email ? 'email' : 'unknown';
        throw new Error(`User with this ${conflictField} already exists`);
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert the new user
    const role = 'student';
    const insertUserQuery = 'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)';
    
    const [result] = await dbPool.query<ResultSetHeader>(insertUserQuery, [
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
