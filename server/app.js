const express = require("express");
const app = express();
const initDatabase = require("./DB/initdb");
const cors = require("cors");

const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

(async () => {
  try {
    await initDatabase(); // Initialize the database
    // console.log("Database initialized successfully.");
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
const invoiceRoutes = require("./routes/invoice");
const paymentMethodRoutes = require("./routes/paymentMethod");

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
app.use("/api", invoiceRoutes);
app.use("/api", paymentMethodRoutes);

const editingEstimates = {}; // { estimateId: user }

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  socket.join("estimate_room");
  console.log("Socket joined estimate_room", socket.id);
  const estimateRoom = io.sockets.adapter.rooms.get("estimate_room");
  const members = estimateRoom ? Array.from(estimateRoom) : [];
  console.log("Members in estimate_room:", members);

  socket.on("start_listening", () => {
    // Send current locked estimates

    socket.emit("locked_estimates", editingEstimates);
    console.log("Current locked estimates sent to client-socket:", editingEstimates);
  });

  socket.on("start_edit_estimate", ({ estimateId, user }) => {
    socket.estimateId = estimateId; // Store estimateId in socket
    socket.user = user; // Store user in socket
    console.log(`User ${user} started editing estimate ${estimateId}`);
    editingEstimates[estimateId] = user;
    io.to("estimate_room").emit("locked_estimates", editingEstimates);
    console.log("Sending updated locked estimates to all clients in estimate_room:", editingEstimates);
  });

  socket.on("stop_edit_estimate", ({ estimateId, user }) => {
    console.log(`stope_edit_estimate event received`);
    delete editingEstimates[estimateId];
    io.to("estimate_room").emit("locked_estimates", editingEstimates);
    console.log(`User ${user} stopped editing estimate ${estimateId}`);
    console.log("Sending updated locked estimates to all clients in estimate_room:", editingEstimates);

  });

  socket.on("disconnect", () => {
    const estimateId = socket.estimateId;
    const user = socket.user;

    if (estimateId && user && editingEstimates[estimateId] === user) {
      delete editingEstimates[estimateId];
      io.to("estimate_room").emit("locked_estimates", editingEstimates);
    }

    socket.leave("estimate_room");
  });
});


server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
