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
const tax_ratesRoutes = require("./routes/tax_rates");
const vendorRoutes = require("./routes/vendor");

app.use(cors({
  origin: 'http://localhost:5173', // Allow frontend origin
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('public/uploads'));

app.use("/api", authRoutes);
app.use("/api", companyRoutes);
app.use("/api", userRoutes);
app.use("/api", roleRoutes);
app.use("/api", employeeRoutes);
app.use("/api", vendorRoutes);

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
