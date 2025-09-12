const db = require('../../../DB/db');

const getVendorsContactDetails = async (req, res) => {
    const { company_id } = req.params;
    try {
      const [rows] = await db.query(
        `SELECT 
            vendor_id,
            name,
            email,
            phone,
            address,
            tax_number
         FROM vendor
         WHERE is_active = TRUE AND company_id = ?`,
        [company_id]
      );
  
      if (rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Vendor not found',
        });
      }
  
      res.status(200).json({
        status: 'success',
        data: rows,
      });
    } catch (error) {
      console.error('Error fetching vendor contacts:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
}

module.exports = {
    getVendorsContactDetails,
};