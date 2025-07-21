const db = require("../DB/db");
const bcrypt = require('bcrypt');

// This function retrieves user details based on the userId from the request
// and returns the user information in JSON format.
const getUserDetails = async (req, res) => {
    try {
        const userId = req.userId;
        console.log('User ID from request:', userId);
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }
        console.log('Get user details request received for userId:', userId);

        const [user] = await db.query(
            'SELECT * FROM user WHERE user_id = ? AND is_active = 1',
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
            'SELECT * FROM user WHERE username = ? OR email = ? AND is_active = 1',
            [username, email]
        );
        console.log('Checking for existing user:', result);

        if (result.length > 0) {
            return res.status(400).json({ success: false, message: 'Username or email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

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

// This function updates user details based on the userId from the request.
// It allows updating fields like fullname, username, email, and password.
// It checks for conflicts with existing usernames and emails.
// It hashes the new password if provided.
// It returns success or error messages based on the operation outcome.
const updateUser = async (req, res) => {
    try {
        const userId = req.userId;
        const updates = req.body;
        console.log('Update user request received for userId:', userId, 'with updates:', updates);
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        const allowedFields = ['fullname', 'username', 'email', 'password'];
        const fieldsToUpdate = {};
        for (const key of allowedFields) {
            if (updates[key]) {
                fieldsToUpdate[key] = updates[key];
            }
        }

        console.log(fieldsToUpdate);

        const [existingUserData] = await db.query(
            'SELECT * FROM user WHERE user_id = ? AND is_active = 1',
            [userId]
        );

        if (existingUserData.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found for update' });
        }

        if (fieldsToUpdate.fullname) {
            if (fieldsToUpdate.fullname === existingUserData[0].full_name) {
                delete fieldsToUpdate.fullname;
            }
        }

        if (fieldsToUpdate.password) {
            if (await bcrypt.compare(fieldsToUpdate.password, existingUserData[0].password_hash)) {
                delete fieldsToUpdate.password;
            }
        }

        // Check for username, email conflicts if those fields are being updated
        if (fieldsToUpdate.username || fieldsToUpdate.email) {

            if (fieldsToUpdate.username === existingUserData[0].username) {
                delete fieldsToUpdate.username;
            }

            if (fieldsToUpdate.email === existingUserData[0].email) {
                delete fieldsToUpdate.email;
            }
            

            const [conflict] = await db.query(
                'SELECT * FROM user WHERE (username = ? OR email = ?) AND user_id != ? AND is_active = 1',
                [
                    fieldsToUpdate.username || '',
                    fieldsToUpdate.email || '',
                    userId
                ]
            );
            if (conflict.length > 0) {
                return res.status(400).json({ success: false, message: 'Username, email or password already exists' });
            }
        }

        if (Object.keys(fieldsToUpdate).length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields to update' });
        }

        // Prepare update query
        const setClauses = [];
        const values = [];

        if (fieldsToUpdate.fullname) {
            setClauses.push('full_name = ?');
            values.push(fieldsToUpdate.fullname);
        }
        if (fieldsToUpdate.username) {
            setClauses.push('username = ?');
            values.push(fieldsToUpdate.username);
        }
        if (fieldsToUpdate.email) {
            setClauses.push('email = ?');
            values.push(fieldsToUpdate.email);
        }
        if (fieldsToUpdate.password) {
            const hashedPassword = await bcrypt.hash(fieldsToUpdate.password, 10);
            setClauses.push('password_hash = ?');
            values.push(hashedPassword);
        }

        if (setClauses.length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields to update' });
        }

        values.push(userId);

        const [result] = await db.query(
            `UPDATE user SET ${setClauses.join(', ')} WHERE user_id = ? AND is_active = 1`,
            values
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'User not found or nothing to update' });
        }

        return res.status(200).json({ success: true, message: 'User updated successfully' });
        
    } catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

const softDeleteUser = async (req, res) => {
    try {
        const {userId} = req.params;
        console.log('Soft delete user request received for userId:', userId);

        const [result] = await db.query(
            'SELECT * FROM user WHERE user_id = ? AND is_active = 1', 
            [ userId ]);

        if (result.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const [deleteResult] = await db.query(
            'UPDATE user SET is_active = 0 WHERE user_id = ?',
            [userId]
        );

        if (deleteResult.affectedRows === 0) {
            return res.status(500).json({ success: false, message: 'Failed to soft delete user' });
        }

        return res.status(200).json({ success: true, message: 'User soft deleted successfully' });
    } catch (error) {
        console.error('Error soft deleting user:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// const permanentlyDeleteUser = async (req, res) => {
//     try {
//         const { userId } = req.params;
//         console.log('Permanently delete user request received for userId:', userId);

//         const [result] = await db.query(
//             'SELECT * FROM user WHERE user_id = ?',
//             [userId]
//         );

//         if (result.length === 0) {
//             return res.status(404).json({ success: false, message: 'User not found' });
//         }

//         const [deleteResult] = await db.query(
//             'DELETE FROM user WHERE user_id = ?',
//             [userId]
//         );

//         if (deleteResult.affectedRows === 0) {
//             return res.status(500).json({ success: false, message: 'Failed to permanently delete user' });
//         }

//         return res.status(200).json({ success: true, message: 'User permanently deleted successfully' });
//     } catch (error) {
//         console.error('Error permanently deleting user:', error);
//         return res.status(500).json({ success: false, message: 'Internal server error' });
//     }
// };



module.exports = {
    getUserDetails,
    addUser,
    updateUser,
    softDeleteUser,
    // permanentlyDeleteUser
};