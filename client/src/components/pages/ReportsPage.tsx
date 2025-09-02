import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, FileText, TrendingUp, Download, Star } from 'lucide-react';

export default function ReportsPage() {
  const navigate = useNavigate();
  const [favoriteReports, setFavoriteReports] = useState(() => {
    // Load favorite reports from localStorage on initial render
    const saved = localStorage.getItem('favoriteReports');
    return saved ? JSON.parse(saved) : [];
  });

  // Save favorite reports to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('favoriteReports', JSON.stringify(favoriteReports));
  }, [favoriteReports]);

  const reports = [
    {
      name: 'Sales Report',
      description: 'Detailed sales analysis and trends',
      icon: TrendingUp,
      color: 'bg-green-100 text-green-600'
    },
    {
      name: 'Financial Statement',
      description: 'Balance sheet and income statement',
      icon: FileText,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      name: 'Customer Report',
      description: 'Customer analysis and aging report',
      icon: BarChart3,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      name: 'Inventory Report',
      description: 'Stock levels and inventory valuation',
      icon: BarChart3,
      color: 'bg-orange-100 text-orange-600'
    }

  ];

  const businessOverviewReports = [
    {
      name: 'Profit & Loss',
      description: 'Current month P&L statement',
      path: '/reports/profit&loss'
    },
    {
      name: 'Balance Sheet',
      description: 'Cash flow statement',
      path: '/reports/balance-sheet'
    },
    {
      name: 'Profit & Loss By All Classes',
      description: 'P&L statement segmented by Employees',
      path: '/reports/profit&loss-by-class'
    },
    {
      name: 'Profit & Loss By All Customer',
      description: 'P&L statement segmented by Customers',
      path: '/reports/profit&loss-by-customer'
    }
  ];

  const whoOwesYouReports = [
    {
      name: 'Accounts receivable ageing summary',
      description: 'Current month P&L statement',
      path: '/reports/ar-aging-summary'
    },
    {
      name: 'Commissions Report',
      description: 'Commission details for sales persons',
      path: '/reports/commission'
    },
    {
      name: 'Customer Balance Summary',
      description: 'Outstanding balances by customer',
      path: '/reports/customer-balance-summary'
    },
    {
      name: 'Customer Balance Detail',
      description: 'Detailed customer outstanding and balances',
      path: '/reports/customer-balance-detail'
    },
    {
      name: 'Invoices and Received Payments',
      description: 'List of invoices and their payment status',
      path: '/reports/invoices-and-payments'
    },
    {
      name: 'Collection Report',
      description: 'Overview of collections made',
      path: '/reports/collection'
    },
    {
      name: 'Invoice List By Today',
      description: 'Today\'s invoices',
      path: '/reports/invoice-list-by-date'
    },
    {
      name: 'Open Invoices',
      description: 'List of all open invoices',
      path: '/reports/open-invoices'
    }
  ];

  const salesAndCustomersReports = [
    {
      name: 'Sales by Employee Summary',
      description: 'Sales performance by employee',
      path: '/reports/sales'
    },
    {
      name: 'Sales by Customer Summary',
      description: 'Sales performance by customer',
      path: '/reports/sales-by-customer'
    },
    {
      name: 'Sales by Customer Detail',
      description: 'Detailed sales by customer',
      path: '/reports/sales-by-customer-detail'
    },
    {
      name: 'Product/Service List',
      description: 'List of all products and services',
      path: '/reports/product-service-list'
    },
    {
      name: 'Customer Contact List',
      description: 'List of customer contacts details',
      path: '/reports/customer-contact-list'
    },
    {
      name: 'Sales by Product/Service Summary',
      description: 'Sales performance by product/service',
      path: '/reports/sales-by-product-service'
    },
    {
      name: 'Income by Customer Summary',
      description: 'Income details by customer',
      path: '/reports/income-by-customer'
    },
    {
      name: 'Sales by Product/Service Detail',
      description: 'Detailed sales by product/service',
      path: '/reports/sales-by-product-service-detail'
    },
    {
      name: 'Customer Phone List',
      description: 'List of customer phone numbers',
      path: '/reports/customer-phone-list'
    },
    {
      name: 'Deposit Detail',
      description: 'Details of all deposits made',
      path: '/reports/deposit-detail'
    },
    {
      name: 'Estimates by Customer',
      description: 'Estimates provided to each customer',
      path: '/reports/estimates-by-customer'
    },
    {
      name: 'Inventory Valuation Summary',
      description: 'Summary of inventory valuation',
      path: '/reports/inventory-valuation-summary'
    },
    {
      name: 'Inventory Valuation Detail',
      description: 'Detailed inventory valuation report',
      path: '/reports/inventory-valuation-detail'
    },
    {
      name: 'Payment Method List',
      description: 'List of all payment methods used',
      path: '/reports/payment-method-list'
    },
    {
      name: 'Stock Take Worksheet',
      description: 'Worksheet for stock taking',
      path: '/reports/stock-take-worksheet'
    },
    {
      name: 'Time Activities by Customer Detail',
      description: 'Detailed time activities by customer',
      path: '/reports/time-activities-by-customer-detail'
    },
    {
      name: 'Transaction List by Customer',
      description: 'List of transactions by customer',
      path: '/reports/transaction-list-by-customer'
    }

  ];

  const whatYouOweReports = [
    {
      name: 'Accounts Payable Ageing Summary',
      description: 'Summary of outstanding payables',
      path: '/reports/ap-aging-summary'
    },
    {
      name: 'Accounts Payable Ageing Detail',
      description: 'Detailed outstanding payables',
      path: '/reports/ap-aging-detail'
    },
    {
      name: 'Bills and Applied Payments',
      description: 'List of bills and their payment status',
      path: '/reports/bills-and-payments'
    },
    {
      name: 'Bill Payment List',
      description: 'List of all bill payments made',
      path: '/reports/bill-payment-list'
    },
    {
      name: 'Unpaid Bills',
      description: 'List of all unpaid bills',
      path: '/reports/unpaid-bills'
    },
    {
      name: 'Supplier Balance Summary',
      description: 'Outstanding balances by supplier',
      path: '/reports/supplier-balance-summary'
    },
    {
      name: 'Supplier Balance Detail',
      description: 'Detailed supplier outstanding and balances',
      path: '/reports/supplier-balance-detail'
    }
  ];

  const toggleFavorite = (reportName) => {
    setFavoriteReports(prev => {
      if (prev.includes(reportName)) {
        return prev.filter(name => name !== reportName);
      }
      return [...prev, reportName];
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reports.map((report) => (
          <div key={report.name} className="card hover:shadow-lg transition-shadow cursor-pointer">
            <div className="card-content p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${report.color}`}>
                  <report.icon className="h-6 w-6" />
                </div>
                <div className="flex space-x-2">
                  <Download className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {report.name}
              </h3>
              <p className="text-sm text-gray-600">
                {report.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Reports */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Quick Reports</h2>
        </div>
        <div className="card-content">
          {favoriteReports.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Quick Reports</h3>
              <p className="text-gray-600">
                Star a report to add it here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...businessOverviewReports, ...whoOwesYouReports, ...salesAndCustomersReports, ...reports]
                .filter(report => favoriteReports.includes(report.name))
                .map(report => (
                  <button 
                    key={report.name}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
                    onClick={() => navigate('path' in report ? report.path : '/reports')}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{report.name}</h4>
                      <Star 
                        className="h-5 w-5 text-yellow-400 fill-yellow-400 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(report.name);
                        }}
                      />
                    </div>
                    <p className="text-sm text-gray-600">{report.description}</p>
                  </button>
                ))
              }
            </div>
          )}
        </div>
      </div>

      {/* Business Overview */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Business Overview</h2>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {businessOverviewReports.map(report => (
              <button 
                key={report.name}
                className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
                onClick={() => navigate(report.path)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{report.name}</h4>
                  <Star 
                    className={`h-5 w-5 cursor-pointer ${
                      favoriteReports.includes(report.name) 
                        ? 'text-yellow-400 fill-yellow-400' 
                        : 'text-gray-400'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(report.name);
                    }}
                  />
                </div>
                <p className="text-sm text-gray-600">{report.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Who Owes You */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Who Owes You</h2>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {whoOwesYouReports.map(report => (
              <button 
                key={report.name}
                className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
                onClick={() => navigate(report.path)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{report.name}</h4>
                  <Star 
                    className={`h-5 w-5 cursor-pointer ${
                      favoriteReports.includes(report.name) 
                        ? 'text-yellow-400 fill-yellow-400' 
                        : 'text-gray-400'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(report.name);
                    }}
                  />
                </div>
                <p className="text-sm text-gray-600">{report.description}</p>
              </button>
            ))}
          </div>
        </div>

        
      </div>

      {/* Sales and Customers */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Sales and Customers</h2>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {salesAndCustomersReports.map(report => (
              <button 
                key={report.name}
                className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
                onClick={() => navigate(report.path)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{report.name}</h4>
                  <Star 
                    className={`h-5 w-5 cursor-pointer ${
                      favoriteReports.includes(report.name) 
                        ? 'text-yellow-400 fill-yellow-400' 
                        : 'text-gray-400'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(report.name);
                    }}
                  />
                </div>
                <p className="text-sm text-gray-600">{report.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* What You Owe */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">What You Owe</h2>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {whatYouOweReports.map(report => (
              <button 
                key={report.name}
                className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
                onClick={() => navigate(report.path)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{report.name}</h4>
                  <Star 
                    className={`h-5 w-5 cursor-pointer ${
                      favoriteReports.includes(report.name) 
                        ? 'text-yellow-400 fill-yellow-400' 
                        : 'text-gray-400'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(report.name);
                    }}
                  />
                </div>
                <p className="text-sm text-gray-600">{report.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}