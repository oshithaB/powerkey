# ERP System

A comprehensive multi-company Enterprise Resource Planning (ERP) system built with React, Node.js, and MySQL. This system provides complete business management capabilities including sales, inventory, accounting, and reporting features.

## 🚀 Features

### Core Modules
- **Multi-Company Management** - Manage multiple companies from a single platform
- **Customer Management** - Complete customer profiles with billing/shipping addresses
- **Vendor Management** - Vendor database with purchase order integration
- **Product & Inventory** - Product catalog with stock tracking and reorder alerts
- **Sales Management** - Estimates, invoices, and payment tracking
- **Purchase Management** - Purchase orders and vendor management
- **Employee Management** - Staff profiles with role-based access control
- **Accounting** - Basic accounting features and financial tracking
- **Reporting** - Profit & loss, commission, and sales reports

### Advanced Features
- **Real-time Collaboration** - Socket.io integration for live editing locks
- **Role-based Access Control** - Admin, staff, and sales roles
- **Tax Management** - Configurable tax rates per company
- **Payment Processing** - Multiple payment methods and tracking
- **Document Generation** - PDF generation for invoices and estimates
- **Cheque Management** - Track and manage company cheques
- **Expense Tracking** - Categorized expense management

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Chart.js** - Data visualization
- **React Hook Form** - Form management
- **Lucide React** - Modern icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MySQL** - Relational database
- **Socket.io** - Real-time communication
- **JWT** - Authentication and authorization
- **Bcrypt** - Password hashing
- **Multer** - File upload handling
- **Nodemailer** - Email functionality
- **Node-cron** - Scheduled tasks

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **MySQL** (v8.0 or higher)
- **npm** or **yarn**

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd powerkey-erp
```

### 2. Database Setup
1. Create a MySQL database named `powerkey_erp`
2. Update the database configuration in `server/.env`:

```env
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=powerkey_erp
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

### 3. Backend Setup
```bash
cd server
npm install
npm run server
```

The backend will automatically:
- Create all necessary database tables
- Insert default roles (admin, sale, staff)
- Create default admin user accounts

### 4. Frontend Setup
```bash
cd client
npm install
npm run dev
```

### 5. Access the Application
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`


## 🏗️ Project Structure

```
powerkey-erp/
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── auth/          # Authentication components
│   │   │   ├── company/       # Company management
│   │   │   ├── dashboard/     # Dashboard components
│   │   │   ├── layout/        # Layout components
│   │   │   ├── modals/        # Modal dialogs
│   │   │   ├── pages/         # Main page components
│   │   │   └── reports/       # Report components
│   │   ├── contexts/          # React contexts
│   │   └── styles/            # CSS and styling
│   └── public/                # Static assets
├── server/                    # Node.js backend
│   ├── controllers/           # Business logic
│   ├── routes/               # API routes
│   ├── middleware/           # Custom middleware
│   ├── DB/                   # Database configuration
│   └── uploads/              # File uploads
└── README.md
```

## 🔄 Development Workflow

### Running in Development
```bash
# Start backend (from server directory)
npm run server

# Start frontend (from client directory)
npm run dev

# Or run both simultaneously (from client directory)
npm run dev
```

## 📝 Environment Variables

### Server (.env)
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=powerkey_erp
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify MySQL is running
   - Check database credentials in `.env`
   - Ensure database exists

2. **File Upload Issues**
   - Check upload directory permissions
   - Verify file size limits
   - Ensure proper file types

3. **Authentication Problems**
   - Clear localStorage and try again
   - Check JWT secret configuration
   - Verify user credentials

### Database Reset
If you need to reset the database:
```sql
DROP DATABASE powerkey_erp;
CREATE DATABASE powerkey_erp;
```
Then restart the server to recreate tables.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation for common solutions

---
<div align="center">

  **TEAM 👨‍💻 OS Software Solutions**

</div>
