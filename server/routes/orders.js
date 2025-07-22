const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order_controller');
const vendorController = require('../controllers/vendor_controller');
const employeeController = require('../controllers/employee_controller');
const customerController = require('../controllers/customer_controller');


// Order routes
router.get('/orders/count/:companyId', orderController.getOrderCount);
router.get('/getOrders/:companyId', orderController.getOrders);
router.post('/orders/:companyId', orderController.createOrder);
router.get('/order-items/:companyId', orderController.getOrderItems);
router.post('/order-items/:companyId', orderController.createOrderItem);
router.delete('/orders/:companyId/:orderId', orderController.deleteOrder);

// Vendor routes
router.get('/vendors/:companyId', vendorController.getVendors);

// Employee routes
router.get('/employees', employeeController.getEmployees);

// Customer routes
router.get('/customers/:companyId', customerController.getCustomers);

module.exports = router;