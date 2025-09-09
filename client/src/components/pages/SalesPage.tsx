import React, { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Receipt, FileClock } from 'lucide-react';
import EstimatesPage from './EstimatesPage';
import InvoicesPage from './InvoicesPage';
import { useLocation } from 'react-router-dom';
import { useCompany } from '../../contexts/CompanyContext';
import axiosInstance from '../../axiosInstance';

export default function SalesPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [salesData, setSalesData] = useState({
    totalSales: 0,
    totalInvoices: 0,
    totalProformaInvoices: 0,
    growthPercentage: 0
  });
  const location = useLocation();
  const { selectedCompany } = useCompany();

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
    if (selectedCompany?.company_id) {
      fetchSalesData();
    }
  }, [location.state, selectedCompany?.company_id]);

  const fetchSalesData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axiosInstance.get(`/api/getSalesPageData/${selectedCompany?.company_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        setSalesData(response.data);
      }

    } catch (error) {
      console.error('Error fetching sales data:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200" style={{marginTop: '-1px'}}>
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`${
              activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('estimates')}
            className={`${
              activeTab === 'estimates'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Estimates
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`${
              activeTab === 'invoices'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Invoices
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div>
          {/* Sales Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card">
              <div className="card-content p-6">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Sales</p>
                    <p className="text-2xl font-bold text-gray-900">Rs. {salesData.totalSales.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-content p-6">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Receipt className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Invoices</p>
                    <p className="text-2xl font-bold text-gray-900">{salesData.totalInvoices}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-content p-6">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <FileClock className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Proforma Invoices</p>
                    <p className="text-2xl font-bold text-gray-900">{salesData.totalProformaInvoices}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-content p-6">
                <div className="flex items-center">
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Growth</p>
                    <p className={`text-2xl font-bold ${salesData.growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {salesData.growthPercentage >= 0 ? '+' : ''}{salesData.growthPercentage}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          
        </div>
      )}

      {activeTab === 'estimates' && (
        <EstimatesPage />
      )}

      {activeTab === 'invoices' && (
        <InvoicesPage />
      )}
    </div>
  );
}