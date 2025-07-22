const express = require("express");
const app = express();
const initDatabase = require("./DB/initdb");
const cors = require("cors");

(async () => {
  try {
    await initDatabase(); // Initialize the database
    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize the database:", error);
  }
})();

const authRoutes = require("./routes/auth");
const companyRoutes = require("./routes/company");
const userRoutes = require("./routes/user");
const roleRoutes = require("./routes/role");
const employeeRoutes = require("./routes/employee");
const vendorRoutes = require("./routes/vendor");
const customerRoutes = require("./routes/customer");
const productcategoryRoutes = require("./routes/product_category");
const productRoutes = require("./routes/product");
const orderRoutes = require("./routes/orders");
const tax_ratesRoutes = require("./routes/tax_rates");
const estimateRoutes = require("./routes/estimates");

app.use(cors({
  origin: 'http://localhost:5173', // Allow frontend origin
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('public/uploads'));
app.use('/Product_Uploads', express.static('Product_Uploads'));

app.use("/api", authRoutes);
app.use("/api", companyRoutes);
app.use("/api", userRoutes);
app.use("/api", roleRoutes);
app.use("/api", employeeRoutes);
app.use("/api", vendorRoutes);
app.use("/api", customerRoutes);
app.use("/api", productcategoryRoutes);
app.use("/api", productRoutes);
app.use("/api", orderRoutes);
app.use("/api", tax_ratesRoutes);
app.use("/api", estimateRoutes);

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
