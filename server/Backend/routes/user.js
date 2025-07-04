const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const authorizedRoles = require('../middleware/authorized-roles');

const { 
    getUserDetails,
    addUser,
    updateUser
} = require('../controllers/user_controller');

router.get('/getUserDetails', verifyToken, getUserDetails);
router.post('/addUser', verifyToken, authorizedRoles('admin'), addUser);
router.put('/updateUser', verifyToken, updateUser);

module.exports = router;