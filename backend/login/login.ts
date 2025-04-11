const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');
const app = express();
const port = 3000;

//middleware to parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: false }));

//middleware to parse JSON bodies
app.use(bodyParser.json());

//middleware to parse session
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

//database connection
const db = require('../db');

// For testing purposes - replace with database interaction
const saltRounds = 10; // Define the salt rounds for hashing
const users = {
    'test@example.com': bcrypt.hashSync('password123', saltRounds) // Use bcrypt.hashSync
};

//login route
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Query user from database
        const query = 'SELECT * FROM users WHERE email = ?';
        const [rows] = await db.query(query, [email]);
        const user = rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Authentication successful
        req.session.userId = user.id; // Store user ID in session
        res.redirect('/dashboard'); // Redirect to dashboard
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

