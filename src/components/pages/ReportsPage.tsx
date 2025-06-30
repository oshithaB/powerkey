import React from 'react';
import { BarChart3, FileText, TrendingUp, Download } from 'lucide-react';

export default function ReportsPage() {
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
                <Download className="h-5 w-5 text-gray-400" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left">
              <h4 className="font-medium text-gray-900 mb-1">Profit & Loss</h4>
              <p className="text-sm text-gray-600">Current month P&L statement</p>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left">
              <h4 className="font-medium text-gray-900 mb-1">Cash Flow</h4>
              <p className="text-sm text-gray-600">Cash flow statement</p>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left">
              <h4 className="font-medium text-gray-900 mb-1">Trial Balance</h4>
              <p className="text-sm text-gray-600">Current trial balance</p>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left">
              <h4 className="font-medium text-gray-900 mb-1">Accounts Receivable</h4>
              <p className="text-sm text-gray-600">Outstanding customer invoices</p>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left">
              <h4 className="font-medium text-gray-900 mb-1">Accounts Payable</h4>
              <p className="text-sm text-gray-600">Outstanding vendor bills</p>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left">
              <h4 className="font-medium text-gray-900 mb-1">Tax Summary</h4>
              <p className="text-sm text-gray-600">Tax collected and paid</p>
            </button>
          </div>
        </div>
      </div>

      {/* Custom Reports */}
      <div className="card">
        <div className="card-header">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Custom Reports</h2>
            <button className="btn btn-primary btn-sm">
              Create Report
            </button>
          </div>
        </div>
        <div className="card-content">
          <div className="text-center py-8">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Custom Reports</h3>
            <p className="text-gray-600">
              Create custom reports tailored to your business needs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}