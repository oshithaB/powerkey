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
const invoiceRoutes = require("./routes/invoice");

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

const estimateViewers = {}; // { estimateId: Set of usernames }

io.on('connection', (socket) => {
  console.log('User connected');

  socket.on('start_estimate_listening', ({ estimateIds, user }) => {
    socket.username = user;
    socket.estimateIds = estimateIds;

    estimateIds.forEach((id) => {
      socket.join(id);
      if (!estimateViewers[id]) estimateViewers[id] = new Set();
      estimateViewers[id].add(user);
      io.to(id).emit('viewers_update', {
        estimateId: id,
        viewers: [...estimateViewers[id]],
      });
    });
  });

  socket.on('disconnect', () => {
    if (socket.estimateIds && socket.username) {
      socket.estimateIds.forEach((id) => {
        estimateViewers[id]?.delete(socket.username);
        io.to(id).emit('viewers_update', {
          estimateId: id,
          viewers: [...estimateViewers[id]],
        });
      });
    }
    console.log('User disconnected');
  });
});


server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
