const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const authorizedRoles = require('../middleware/authorized-roles');
const upload = require('../middleware/upload');

const { 
    createCompany, 
    selectCompany, 
    getCompanies, 
    getDashboardData,
    updateCompany
} = require('../controllers/company_controller');

// Upload single image with field name 'logo'
router.post(
  '/createCompany',
  verifyToken,
  authorizedRoles(['admin']), // Ensure only admin can create company
  upload.single('logo'),  // Changed from 'companyLogo' to 'logo'
  createCompany
);

router.get(
  '/selectCompany/:companyId',
  verifyToken,
  selectCompany
);

router.get(
  '/companies',
  verifyToken,
  getCompanies
);

router.get(
  '/dashboard/:companyId',
  verifyToken,
  getDashboardData
);

router.put(
  '/updateCompany',
  verifyToken,
  authorizedRoles(['admin']),
  upload.single('logo'),
  updateCompany
);

module.exports = router;