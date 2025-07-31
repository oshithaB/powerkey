import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Package, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  Calendar,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

interface DashboardHomeProps {
  data: any;
}

export default function DashboardHome({ data }: DashboardHomeProps) {
  // Default values for metrics and recentInvoices
  const metrics = data?.metrics || {};
  const recentInvoices = data?.recentInvoices || [];

  const statCards = [
    {
      name: 'Total Customers',
      value: metrics.customers || 0,
      icon: Users,
      color: 'bg-blue-500',
      href: '/dashboard/customers'
    },
    {
      name: 'Total Products',
      value: metrics.products || 0,
      icon: Package,
      color: 'bg-green-500',
      href: '/dashboard/products'
    },
    {
      name: 'Total Invoices',
      value: metrics.invoices || 0,
      icon: FileText,
      color: 'bg-purple-500',
      href: '/dashboard/invoices'
    },
    {
      name: 'Total Revenue',
      value: `Rs. ${(metrics.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-yellow-500',
      href: '/dashboard/reports'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome to your ERP Dashboard</h1>
        <p className="text-primary-100">
          Here's an overview of your business performance and recent activities.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Link
            key={stat.name}
            to={stat.href}
            className="card hover:shadow-lg transition-shadow duration-200"
          >
            <div className="card-content p-6">
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-gray-500">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                View details
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent Invoices</h2>
              <Link
                to="/dashboard/invoices"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="card-content">
            {recentInvoices.length > 0 ? (
              <div className="space-y-4">
                {recentInvoices.map((invoice: any) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {invoice.invoice_number}
                      </p>
                      <p className="text-sm text-gray-600">
                        {invoice.customer_name || 'Unknown Customer'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        Rs. {invoice.total_amount?.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(invoice.created_at), 'MMM dd')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first invoice.
                </p>
                <div className="mt-6">
                  <Link
                    to="/dashboard/invoices"
                    className="btn btn-primary btn-sm"
                  >
                    Create Invoice
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Quick Actions</h2>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-2 gap-4">
              <Link
                to="/dashboard/customers"
                className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <Users className="h-8 w-8 text-primary-600 mb-2" />
                <p className="font-medium text-gray-900">Add Customer</p>
                <p className="text-sm text-gray-600">Create new customer</p>
              </Link>
              
              <Link
                to="/dashboard/products"
                className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <Package className="h-8 w-8 text-primary-600 mb-2" />
                <p className="font-medium text-gray-900">Add Product</p>
                <p className="text-sm text-gray-600">Create new product</p>
              </Link>
              
              <Link
                to="/dashboard/invoices"
                className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <FileText className="h-8 w-8 text-primary-600 mb-2" />
                <p className="font-medium text-gray-900">Create Invoice</p>
                <p className="text-sm text-gray-600">Generate new invoice</p>
              </Link>
              
              <Link
                to="/dashboard/reports"
                className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <TrendingUp className="h-8 w-8 text-primary-600 mb-2" />
                <p className="font-medium text-gray-900">View Reports</p>
                <p className="text-sm text-gray-600">Business analytics</p>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Performance Overview</h2>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                Rs. {(metrics.totalRevenue || 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{metrics.customers || 0}</p>
              <p className="text-sm text-gray-600">Active Customers</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-3">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{metrics.products || 0}</p>
              <p className="text-sm text-gray-600">Products in Stock</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}