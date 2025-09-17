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
};

const getChequeDetails = async (req, res) => {
  const { company_id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT b.*, pm.name AS payment_method_name, v.name AS vendor_name
        FROM bills b
        LEFT JOIN payment_methods pm ON b.payment_method_id = pm.id
        LEFT JOIN vendor v ON b.vendor_id = v.vendor_id
        WHERE b.company_id = ? AND pm.name = 'cheque'`,
      [company_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No cheque payments found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: rows,
    });
  }

  catch (error) {
    console.error('Error fetching cheque details:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

const getPurchasesByProductServiceSummary = async (req, res) => {
  try {
      const { company_id } = req.params;
      const { start_date, end_date } = req.query;

      console.log('Received params:', { company_id, start_date, end_date });

      let query = `
          SELECT 
              p.id as product_id,
              p.name as product_name,
              p.sku,
              pc.name as category_name,
              SUM(oi.qty) as total_quantity_purchased,
              SUM(oi.amount) as total_purchase_amount,
              AVG(oi.rate) as average_unit_price,
              COUNT(DISTINCT o.id) as number_of_purchases
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          LEFT JOIN products p ON oi.product_id = p.id
          LEFT JOIN product_categories pc ON p.category_id = pc.id
          WHERE o.company_id = ?
      `;

      const queryParams = [company_id];

      if (start_date && end_date) {
          query += ` AND DATE(o.order_date) BETWEEN DATE(?) AND DATE(?)`;
          queryParams.push(start_date, end_date);
          console.log('Date filter applied:', { start_date, end_date });
      }

      query += `
          GROUP BY p.id, p.name, p.sku, pc.name, oi.name, oi.sku
          ORDER BY total_purchase_amount DESC, COALESCE(p.name, oi.name)
      `;

      console.log('Query params:', queryParams);

      const [results] = await db.execute(query, queryParams);

      console.log(`Found ${results.length} records`);

      res.json({
          success: true,
          data: results,
          total_records: results.length,
          filter_applied: { start_date, end_date }
      });
  } catch (error) {
      console.error('Error fetching purchases by product/service summary:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getPurchasesByClassDetail = async (req, res) => {
  try {
      const { company_id } = req.params;
      const { start_date, end_date } = req.query;

      console.log('Received params:', { company_id, start_date, end_date });

      let query = `
          SELECT 
              o.class,
              e.name as employee_name,
              o.order_no,
              o.order_date,
              v.name as vendor_name,
              COALESCE(p.name, oi.name) as product_name,
              COALESCE(p.sku, oi.sku) as sku,
              oi.description,
              oi.qty as quantity,
              oi.rate as unit_price,
              oi.amount as total_price
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          LEFT JOIN employees e ON o.class = e.id
          LEFT JOIN products p ON oi.product_id = p.id
          LEFT JOIN vendor v ON o.vendor_id = v.vendor_id
          WHERE o.company_id = ?
      `;

      const queryParams = [company_id];

      if (start_date && end_date) {
          query += ` AND DATE(o.order_date) BETWEEN DATE(?) AND DATE(?)`;
          queryParams.push(start_date, end_date);
          console.log('Date filter applied:', { start_date, end_date });
      }

      query += `
          ORDER BY oi.class, o.order_date DESC, o.order_no
      `;

      console.log('Query params:', queryParams);

      const [results] = await db.execute(query, queryParams);

      console.log(`Found ${results.length} records`);

      res.json({
          success: true,
          data: results,
          total_records: results.length,
          filter_applied: { start_date, end_date }
      });
  } catch (error) {
      console.error('Error fetching purchases by class detail:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getOpenPurchaseOrdersDetail = async (req, res) => {
  try {
      const { company_id } = req.params;
      const { start_date, end_date } = req.query;

      console.log('Received params:', { company_id, start_date, end_date });

      let query = `
          SELECT 
              o.id,
              o.order_no,
              o.order_date,
              v.name as vendor_name,
              v.email as vendor_email,
              v.phone as vendor_phone,
              o.mailling_address,
              o.shipping_address,
              o.ship_via,
              o.total_amount,
              o.status,
              oi.name as item_name,
              oi.sku as item_sku,
              oi.description as item_description,
              oi.qty as item_quantity,
              oi.rate as item_rate,
              oi.amount as item_amount,
              o.class as employee_id,
              e.name as employee_name
          FROM orders o
          LEFT JOIN vendor v ON o.vendor_id = v.vendor_id
          LEFT JOIN order_items oi ON o.id = oi.order_id
          LEFT JOIN employees e ON o.class = e.id
          WHERE o.company_id = ? AND o.status = 'open'
      `;

      const queryParams = [company_id];

      if (start_date && end_date) {
          query += ` AND DATE(o.order_date) BETWEEN DATE(?) AND DATE(?)`;
          queryParams.push(start_date, end_date);
          console.log('Date filter applied:', { start_date, end_date });
      }

      query += `
          ORDER BY o.order_date DESC, o.order_no, oi.name
      `;

      console.log('Final query:', query);
      console.log('Query params:', queryParams);

      const [results] = await db.execute(query, queryParams);

      console.log(`Found ${results.length} records`);

      res.json({
          success: true,
          data: results,
          total_records: results.length,
          filter_applied: { start_date, end_date }
      });
  } catch (error) {
      console.error('Error fetching open purchase orders detail:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getPurchaseList = async (req, res) => {
  try {
      const { company_id } = req.params;
      const { start_date, end_date } = req.query;

      console.log('Received params:', { company_id, start_date, end_date });

      let query = `
          SELECT 
              o.id,
              o.order_no,
              o.order_date,
              v.name as vendor_name,
              v.email as vendor_email,
              o.mailling_address,
              o.shipping_address,
              o.ship_via,
              o.total_amount,
              o.status,
              o.category_name,
              o.class,
              e.name as employee_name,
              o.location,
              COUNT(oi.id) as total_items,
              SUM(CASE WHEN oi.received = TRUE THEN 1 ELSE 0 END) as received_items,
              SUM(CASE WHEN oi.closed = TRUE THEN 1 ELSE 0 END) as closed_items
          FROM orders o
          LEFT JOIN vendor v ON o.vendor_id = v.vendor_id
          LEFT JOIN order_items oi ON o.id = oi.order_id
          LEFT JOIN employees e ON o.class = e.id
          WHERE o.company_id = ?
      `;

      const queryParams = [company_id];

      if (start_date && end_date) {
          query += ` AND DATE(o.order_date) BETWEEN DATE(?) AND DATE(?)`;
          queryParams.push(start_date, end_date);
          console.log('Date filter applied:', { start_date, end_date });
      }

      query += `
          GROUP BY o.id, o.order_no, o.order_date, v.name, v.email, o.mailling_address, 
                   o.shipping_address, o.ship_via, o.total_amount, o.status, 
                   o.category_name, o.class, o.location
          ORDER BY o.order_date DESC, o.order_no
      `;

      console.log('Final query:', query);
      console.log('Query params:', queryParams);

      const [results] = await db.execute(query, queryParams);

      console.log(`Found ${results.length} records`);

      res.json({
          success: true,
          data: results,
          total_records: results.length,
          filter_applied: { start_date, end_date }
      });
  } catch (error) {
      console.error('Error fetching purchase list:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
    getVendorsContactDetails,
    getChequeDetails,
    getPurchasesByProductServiceSummary,
    getPurchasesByClassDetail,
    getOpenPurchaseOrdersDetail,
    getPurchaseList,
};