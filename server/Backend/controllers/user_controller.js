const db = require("../DB/db");
const bcrypt = require('bcrypt');

// This function retrieves user details based on the userId from the request
// and returns the user information in JSON format.
const getUserDetails = async (req, res) => {
    try {
        const userId = req.userId;
        console.log('Get user details request received for userId:', userId);

        const [user] = await db.query(
            'SELECT * FROM user WHERE user_id = ?',
            [userId]
        );

        if (user.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        console.log('User details retrieved:', user[0]);
        return res.status(200).json({ success: true, data: user[0] });
    }
    catch (error) {
        console.error('Error retrieving user details:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}


// This function adds a new user to the database.
// It checks for existing username and email, hashes the password.
const addUser = async (req, res) => {
    try {
        const {fullname, username, email, password, role} = req.body;
        console.log('Add user request received:', req.body);

        const [result] = await db.query(
            'SELECT * FROM user WHERE username = ? OR email = ?',
            [username, email]
        );
        console.log('Checking for existing user:', result);

        if (result.length > 0) {
            return res.status(400).json({ success: false, message: 'Username or email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [isMatch] = await db.query(
            'SELECT * FROM user WHERE password_hash = ?',
            [hashedPassword]
        );
        console.log('Checking for existing password:', isMatch);

        if (isMatch.length > 0) {
            return res.status(400).json({ success: false, message: 'Password already exists' });
        }

        const role_lowercase = role.toLowerCase();
        console.log('Role after conversion to lowercase:', role_lowercase);

        const [role_id] = await db.query(
            'SELECT role_id FROM role WHERE name = ?',
            [role_lowercase]
        );
        console.log('Role ID fetched:', role_id);

        if (role_id.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }

        const [newUser] = await db.query(
            'INSERT INTO user (full_name, username, email, password_hash, role_id) VALUES (?, ?, ?, ?, ?)',
            [fullname, username, email, hashedPassword, role_id[0].role_id]
        );
        console.log('New user created:', newUser);

        if (newUser.affectedRows === 0) {
            return res.status(500).json({ success: false, message: 'Failed to create user' });
        }

        return res.status(201).json({ success: true, message: 'User created successfully' });
    } catch (error) {
        console.error('Error adding user:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

module.exports = {
    getUserDetails,
    addUser
};