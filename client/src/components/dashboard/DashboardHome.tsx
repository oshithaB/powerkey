import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCompany } from '../../contexts/CompanyContext';
import { 
  Banknote,
  Package, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Workflow,
  ArrowUpRight,
  Users,
  TrendingDown,
  Wallet
} from 'lucide-react';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DashboardHomeProps {
  data: any;
}

interface MoneyFlowData {
  total_received: number;
  total_spent: number;
  net_amount: number;
  money_in_drawer: number;
  date: string;
}

export default function DashboardHome({ data }: DashboardHomeProps) {
  const [moneyFlowData, setMoneyFlowData] = useState<MoneyFlowData | null>(null);
  const [loading, setLoading] = useState(true);
  const { selectedCompany } = useCompany();
  
  // Default values for metrics and recentInvoices
  const metrics = data?.metrics || {};
  const recentInvoices = data?.recentInvoices || [];

  useEffect(() => {
    const fetchMoneyFlowData = async () => {
      try {
        const response = await fetch(`/api/moneyInDrawer/${selectedCompany?.company_id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          setMoneyFlowData(result.data);
        } else {
          console.error('Failed to fetch money flow data');
        }
      } catch (error) {
        console.error('Error fetching money flow data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMoneyFlowData();
  }, []);

  const statCards = [
    {
      name: 'Payable Cheques',
      value: metrics.nearDueCheques || 0,
      icon: Banknote,
      color: 'bg-red-500',
      href: '/dashboard/cheques'
    },
    {
      name: 'Low stock Products',
      value: metrics.products || 0,
      icon: Workflow,
      color: 'bg-green-500',
      href: '/dashboard/products'
    },
    {
      name: 'Total Overdues',
      value: `Rs. ${(metrics.overdue || 0).toLocaleString()}`,
      icon: FileText,
      color: 'bg-red-500',
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

  // Prepare pie chart data
  const pieChartData = moneyFlowData ? [
    {
      name: 'Money Received',
      value: moneyFlowData.total_received,
      color: '#10B981', // green
      icon: '↗'
    },
    {
      name: 'Money Spent',
      value: moneyFlowData.total_spent,
      color: '#EF4444', // red
      icon: '↘'
    }
  ].filter(item => item.value > 0) : [];

  const COLORS = ['#10B981', '#EF4444'];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-lg font-bold" style={{ color: data.color }}>
            Rs. {data.value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

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

      {/* Today Money Flow */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Today's Money Flow</h2>
            <div className="text-sm text-gray-500">
              {format(new Date(), 'MMMM dd, yyyy')}
            </div>
          </div>
        </div>
        <div className="card-content">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600">Loading money flow data...</span>
            </div>
          ) : moneyFlowData ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Summary Cards */}
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="bg-green-500 p-2 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">Money Received</p>
                      <p className="text-2xl font-bold text-green-900">
                        Rs. {moneyFlowData.total_received.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="bg-red-500 p-2 rounded-lg">
                      <TrendingDown className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">Money Spent</p>
                      <p className="text-2xl font-bold text-red-900">
                        Rs. {moneyFlowData.total_spent.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`${moneyFlowData.net_amount >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'} border rounded-lg p-4`}>
                  <div className="flex items-center">
                    <div className={`${moneyFlowData.net_amount >= 0 ? 'bg-blue-500' : 'bg-orange-500'} p-2 rounded-lg`}>
                      <Wallet className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${moneyFlowData.net_amount >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                        Net Amount
                      </p>
                      <p className={`text-2xl font-bold ${moneyFlowData.net_amount >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                        Rs. {moneyFlowData.net_amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {moneyFlowData.net_amount >= 0 ? 'Positive cash flow' : 'Negative cash flow'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pie Chart */}
              <div className="flex flex-col items-center">
                {pieChartData.length > 0 ? (
                  <>
                    <div className="w-full h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4 mt-4">
                      {pieChartData.map((entry, index) => (
                        <div key={entry.name} className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          ></div>
                          <span className="text-sm text-gray-600">{entry.name}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Wallet className="h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions today</h3>
                    <p className="text-sm text-gray-500 text-center">
                      No money received or spent today. Start by creating an invoice or recording an expense.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Failed to load money flow data</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}