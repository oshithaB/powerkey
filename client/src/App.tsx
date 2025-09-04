import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CompanyProvider, useCompany } from './contexts/CompanyContext';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';
import { SocketProvider } from './contexts/SocketContext';
import axiosInstance from './axiosInstance';

import Login from './components/auth/Login';
import CompanySelection from './components/company/CompanySelection';
import CreateCompany from './components/company/CreateCompany';
import Dashboard from './components/dashboard/Dashboard';
import Layout from './components/layout/Layout';
import useTokenExpirationCheck from './tokenExpirationCheckHook';

import CreateEstimate from './components/modals/CreateEstimate';
import EditEstimate from './components/modals/EditEstimate';
import CreateInvoice from './components/modals/CreateInvoice';
import EditInvoice from './components/modals/EditInvoice';
import InvoiceRecievedPayment from './components/modals/InvoiceReceivePaymentModal';
import PurchaseOrdersPage from './components/modals/PurchaseOrdersPage';
import EditPurchaseOrders from './components/modals/EditPurchaseOrders';
import CreateExpense from './components/modals/CreateExpense';
import CreateBill from './components/modals/CreateBill';
import CreateCheque from './components/modals/CreateCheque';
import EditCheques from './components/modals/EditCheques';

// Reports
import ProfitAndLossReport from './components/reports/ProfitAndLossReport';
import CommissionReport from './components/reports/CommissionReport';
import CommissionReportByEmployees from './components/reports/CommissionReportByEmployees';
import SalesReport from './components/reports/SalesReport';
import SalesReportByEmployees from './components/reports/SalesReportByEmployees';
import ProfitAndLossByClass from './components/reports/ProfitAndLossByClass';
import ProfitAndLossByClassInDetail from './components/reports/ProfitAndLossByClassInDetail';
import ProfitAndLossByCustomer from './components/reports/ProfitAndLossByCustomer';
import ProfitAndLossByCustomerInDetail from './components/reports/ProfitAndLossByCustomerInDetail';
import ARAgingSummaryReport from './components/reports/ARAgingSummaryReport';
import ARAgingSummaryInDetails from './components/reports/ARAgingSummaryInDetails';

import CustomerContactDetails from './components/reports/Sales&Customers/CustomerContactDetails';
import ProductAndServiceList from './components/reports/Sales&Customers/ProductAndServiceList';
import SalesbyCustomerSummary from './components/reports/Sales&Customers/SalesbyCustomerSummary';
import SalesbyCustomerDetail from './components/reports/Sales&Customers/SalesbyCustomerDetail';
import SalesbyProductSummary from './components/reports/Sales&Customers/SalesbyProductSummary';
import SalesbyProductDetail from './components/reports/Sales&Customers/SalesbyProductDetail';

import NotFound from './components/NotFound/NotFound';

interface Cheque {
  id: number;
  cheque_number: string;
  bank_name: string;
  branch_name: string;
  cheque_date: string;
  payee_name: string;
  amount: number;
  status: 'pending' | 'deposited' | 'returned';
  created_at: string;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const isChecking = useTokenExpirationCheck();

  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function AppContent() {
  const { selectedCompany } = useCompany();
  const { setHasNearDueCheques } = useNotification();

  useEffect(() => {
    const fetchCheques = async () => {
      try {
        if (selectedCompany?.company_id) {
          const response = await axiosInstance.get(`/api/getChequesByCompanyId/${selectedCompany.company_id}`);
          const fetchedCheques: Cheque[] = response.data;

          // Check for near-due pending cheques
          const hasNearDue = fetchedCheques.some((cheque) => {
            if (cheque.cheque_date && cheque.status === 'pending') {
              const today = new Date();
              const chequeDate = new Date(cheque.cheque_date);
              const diffInTime = chequeDate.getTime() - today.getTime();
              const diffInDays = diffInTime / (1000 * 3600 * 24);
              return diffInDays >= 0 && diffInDays <= 3;
            }
            return false;
          });
          setHasNearDueCheques(hasNearDue);
        } else {
          setHasNearDueCheques(false);
        }
      } catch (error) {
        console.error('Error fetching cheques for notification:', error);
        setHasNearDueCheques(false);
      }
    };

    fetchCheques();
  }, [selectedCompany, setHasNearDueCheques]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/companies"
          element={
            <ProtectedRoute>
              <CompanySelection />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-company"
          element={
            <ProtectedRoute>
              <CreateCompany />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <SocketProvider>
                <Layout>
                  <Dashboard />
                </Layout>
              </SocketProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/estimates/create"
          element={
            <ProtectedRoute>
              <CreateEstimate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/estimates/edit/:id"
          element={
            <ProtectedRoute>
              <SocketProvider>
                <EditEstimate />
              </SocketProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchase-orders"
          element={
            <ProtectedRoute>
              <PurchaseOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices/create"
          element={
            <ProtectedRoute>
              <CreateInvoice />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices/edit"
          element={
            <ProtectedRoute>
              <SocketProvider>
                <EditInvoice />
              </SocketProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices/receive-payment/:invoiceId"
          element={
            <ProtectedRoute>
              <InvoiceRecievedPayment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchase-orders/edit/:orderId"
          element={
            <ProtectedRoute>
              <EditPurchaseOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expense/create"
          element={
            <ProtectedRoute>
              <CreateExpense />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bill/create"
          element={
            <ProtectedRoute>
              <CreateBill />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cheque/create"
          element={
            <ProtectedRoute>
              <CreateCheque />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cheque/edit/:id"
          element={
            <ProtectedRoute>
              <EditCheques />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/companies" />} />
        {/* Reports */}
        <Route
          path="/reports/profit&loss"
          element={
            <ProtectedRoute>
              <ProfitAndLossReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/profit&loss-by-class"
          element={
            <ProtectedRoute>
              <ProfitAndLossByClass />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/profit-and-loss-by-employee/:employeeId"
          element={
            <ProtectedRoute>
              <ProfitAndLossByClassInDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/profit&loss-by-customer"
          element={
            <ProtectedRoute>
              <ProfitAndLossByCustomer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/profit-and-loss-by-customer/:customerId"
          element={
            <ProtectedRoute>
              <ProfitAndLossByCustomerInDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/commission"
          element={
            <ProtectedRoute>
              <CommissionReport />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/commission-by-employee/:employeeId"
          element={
            <ProtectedRoute>
              <CommissionReportByEmployees />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/sales"
          element={
            <ProtectedRoute>
              <SalesReport />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/sales-by-employee/:employeeId"
          element={
            <ProtectedRoute>
              <SalesReportByEmployees />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/ar-aging-summary"
          element={
            <ProtectedRoute>
              <ARAgingSummaryReport />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/ar-aging-in-detail/:customerId"
          element={
            <ProtectedRoute>
              <ARAgingSummaryInDetails />
            </ProtectedRoute>
          }
        />


        <Route
          path="/reports/customer-contact-list"
          element={
            <ProtectedRoute>
              <CustomerContactDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/product-service-list"
          element={
            <ProtectedRoute>
              <ProductAndServiceList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/sales-by-customer"
          element={
            <ProtectedRoute>
              <SalesbyCustomerSummary />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/sales-by-customer-detail/:customerId"
          element={
            <ProtectedRoute>
              <SalesbyCustomerDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/sales-by-product"
          element={
            <ProtectedRoute>
              <SalesbyProductSummary />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/sales-by-product-detail/:productId"
          element={
            <ProtectedRoute>
              <SalesbyProductDetail />
            </ProtectedRoute>
          }
        />

        {/* Catch-all route for 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <CompanyProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </CompanyProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;