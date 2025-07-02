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

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('public/uploads'));

app.use("/api", authRoutes);
app.use("/api", companyRoutes);
app.use("/api", userRoutes);
app.use("/api", roleRoutes);

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
