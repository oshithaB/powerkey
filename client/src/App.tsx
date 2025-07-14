import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CompanyProvider, useCompany } from './contexts/CompanyContext';

import Login from './components/auth/Login';
import Register from './components/auth/Register';
import CompanySelection from './components/company/CompanySelection';
import CreateCompany from './components/company/CreateCompany';
import Dashboard from './components/dashboard/Dashboard';
import Layout from './components/layout/Layout';

import CreateEstimate from './components/modals/CreateEstimate'
import CreateInvoice from './components/modals/CreateInvoice';
import PurchaseOrdersPage from './components/modals/PurchaseOrdersPage';

// Reports
import ProfitAndLossReport from './components/reports/ProfitAndLossReport';

import NotFound from './components/NotFound/NotFound';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function ProtectedRouteWithCompany({ children }: { children: React.ReactNode }) {
  const {selectedCompany} = useCompany();


  return <>{children}</>;
}



function App() {
  return (
    <AuthProvider>
      <CompanyProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/companies" 
              element={
                  <ProtectedRoute>
                    <ProtectedRouteWithCompany>
                      <CompanySelection />
                    </ProtectedRouteWithCompany>
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
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/companies" />} />
              <Route
                path="/estimates/create"
                element={
                  <ProtectedRoute>
                    <CreateEstimate />
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
                path="/purchase-orders"
                element={
                  <ProtectedRoute>
                    <PurchaseOrdersPage />
                  </ProtectedRoute>
                }
              />

              {/* Reports Routes */}
              <Route
                path="/reports/profit&loss"
                element={
                  <ProtectedRoute>
                    <ProfitAndLossReport />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all route for 404 Not Found */}
              <Route path='*' element={<NotFound />} />
            </Routes>
          </div>
        </Router>
      </CompanyProvider>
    </AuthProvider>
  );
}

export default App;