const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const authorizedRoles = require('../middleware/authorized-roles');

const {
    createBill,
    getBills,
    getBillById,
    updateBill
} = require('../controllers/bill_controller');


