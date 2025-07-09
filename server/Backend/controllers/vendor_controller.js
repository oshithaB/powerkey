const db = require("../DB/db");

const getVendors = async (req, res) => {
  try {
    const {company_id} = req.params;

    if (!company_id) {
      return res.status(400).json({success: false, message: "Company ID is required"});
    }

    const [company] = await db.query(
      "SELECT * FROM companies WHERE id = ?",
      [company_id]
    );

    if (company.length === 0) {
      return res.status(404).json({success: false, message: "Company not found"});
    }

    const [vendors] = await db.query(
      "SELECT * FROM vendors WHERE company_id = ?",
      [company_id]
    );

    if (!vendors) {
      return res.status(404).json({success: false, message: "No vendors found for this company"});
    }

    return res.status(200).json(vendors);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return res.status(500).json({success: false, message: "Internal server error"});
  }
};


module.exports = {
  getVendors
};