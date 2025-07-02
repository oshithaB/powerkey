const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const authorizedRoles = require('../middleware/authorized-roles');
const upload = require('../middleware/upload');

const { createCompany, selectCompany } = require('../controllers/company_controller');

// Upload single image with field name 'companyLogo'
router.post(
  '/createCompany',
  verifyToken,
  authorizedRoles('admin'),
  upload.single('companyLogo'),  // 👈 this enables file upload
  createCompany
);

router.get(
  '/selectCompany/:companyId',
  verifyToken,
  selectCompany
);

module.exports = router;
