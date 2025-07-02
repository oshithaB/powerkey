const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const authorizedRoles = require('../middleware/authorized-roles');

const { 
    getUserDetails,
    addUser
} = require('../controllers/user_controller');

router.get('/getUserDetails', verifyToken, getUserDetails);
router.post('/addUser', verifyToken, authorizedRoles('admin'), addUser);

module.exports = router;