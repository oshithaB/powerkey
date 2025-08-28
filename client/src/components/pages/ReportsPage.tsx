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
    }
  ];

  const whoOwesYouReports = [
    {
      name: 'Accounts receivable ageing summary',
      description: 'Current month P&L statement',
      path: '/reports/profit&loss'
    },
    {
      name: 'Commissions Report',
      description: 'Commission details for sales persons',
      path: '/reports/commission'
    }
  ];

  const salesAndCustomersReports = [
    {
      name: 'Sales by employee summary',
      description: 'Current month P&L statement',
      path: '/reports/profit&loss'
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
    </div>
  );
}