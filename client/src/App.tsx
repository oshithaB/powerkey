import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CompanyProvider, useCompany } from './contexts/CompanyContext';
import { SocketProvider } from './contexts/SocketContext';

import Login from './components/auth/Login';
import Register from './components/auth/Register';
import CompanySelection from './components/company/CompanySelection';
import CreateCompany from './components/company/CreateCompany';
import Dashboard from './components/dashboard/Dashboard';
import Layout from './components/layout/Layout';
import useTokenExpirationCheck from './tokenExpirationCheckHook';

import CreateEstimate from './components/modals/CreateEstimate'
import EditEstimate from './components/modals/EditEstimate';
import CreateInvoice from './components/modals/CreateInvoice';
import EditInvoice from './components/modals/EditInvoice';
import InvoiceRecievedPayment from './components/modals/InvoiceReceivePaymentModal';
import PurchaseOrdersPage from './components/modals/PurchaseOrdersPage';

// Reports
// import ProfitAndLossReport from './components/reports/ProfitAndLossReport';

import NotFound from './components/NotFound/NotFound';

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



function App() {

  return (
    <Router>
      <AuthProvider>
        <CompanyProvider>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/companies" 
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
                    <EditInvoice />
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

              <Route path="/" element={<Navigate to="/companies" />} />

              {/* Catch-all route for 404 Not Found */}
              <Route path='*' element={<NotFound />} />

            </Routes>
          </div>
        </CompanyProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;