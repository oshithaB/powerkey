import React, { useState, useEffect } from 'react';
import { PieChart, BarChart3, TrendingUp, Activity } from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2'; // Added Line import
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement, // Added LineElement
  PointElement, // Added PointElement
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import axios from 'axios';
import { useCompany } from '../../contexts/CompanyContext';
import axiosInstance from '../../axiosInstance';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend); // Updated registration

export default function AnalyticsPage() {
  const { selectedCompany } = useCompany();
  const [topProducts, setTopProducts] = useState<{ name: string; total_quantity: number; total_revenue: number }[]>([]);
  const [topSalespersons, setTopSalespersons] = useState<{ name: string; total_sales: number; total_invoices: number }[]>([]);
  const [topCustomers, setTopCustomers] = useState<{ name: string; email: string; purchase_count: number; total_spent: number }[]>([]);
  const companyId = selectedCompany?.company_id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsResponse = await axiosInstance.get(`api/top10Products/${selectedCompany?.company_id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setTopProducts(productsResponse.data.data);

        const salespersonsResponse = await axiosInstance.get(`api/top5Salespersons/${companyId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setTopSalespersons(salespersonsResponse.data.data);

        const customersResponse = await axiosInstance.get(`api/customerPurchaseFrequency/${companyId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setTopCustomers(customersResponse.data.data);
        console.log(customersResponse.data.data);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      }
    };

    if (companyId) {
      fetchData();
    }
  }, [companyId]);

  const normalizeRevenue = (revenue: number) => revenue / 100;

  const topProductsData = {
    labels: topProducts.map((product) => product.name),
    datasets: [
      {
        label: 'Total Quantity Sold',
        data: topProducts.map((product) => Number(product.total_quantity)),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        label: 'Total Revenue (x100)',
        data: topProducts.map((product) => normalizeRevenue(Number(product.total_revenue))),
        backgroundColor: 'rgba(255, 159, 64, 0.6)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 1,
        yAxisID: 'y1',
      },
    ],
  };

  const topSalespersonsData = {
    labels: topSalespersons.map((salesperson) => salesperson.name),
    datasets: [
      {
        label: 'Total Sales',
        data: topSalespersons.map((salesperson) => Number(salesperson.total_sales)),
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        label: 'Total Invoices',
        data: topSalespersons.map((salesperson) => Number(salesperson.total_invoices)),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
        yAxisID: 'y1',
      },
    ],
  };

  const topCustomersData = {
    labels: topCustomers.map((customer) => customer.name),
    datasets: [
      {
        label: 'Purchase Count',
        data: topCustomers.map((customer) => Number(customer.purchase_count)),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: 'Total Spent (x100)',
        data: topCustomers.map((customer) => normalizeRevenue(Number(customer.total_spent))),
        borderColor: 'rgba(255, 206, 86, 1)',
        backgroundColor: 'rgba(255, 206, 86, 0.2)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const datasetLabel = context.dataset.label || '';
            const value = context.parsed.y;
            if (datasetLabel.includes('Revenue') || datasetLabel.includes('Spent')) {
              return `${datasetLabel}: ${(value * 100).toFixed(2)}`;
            }
            return `${datasetLabel}: ${value}`;
          },
        },
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Quantity / Invoices / Purchases',
        },
        beginAtZero: true,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Revenue (x100) / Sales / Total Spent (x100)',
        },
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-content p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Revenue Growth</p>
                <p className="text-2xl font-bold text-gray-900">0%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Profit Margin</p>
                <p className="text-2xl font-bold text-gray-900">0%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Customer Growth</p>
                <p className="text-2xl font-bold text-gray-900">0%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <PieChart className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Market Share</p>
                <p className="text-2xl font-bold text-gray-900">0%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Top 5 Salespersons</h2>
          </div>
          <div className="card-content">
            <div className="h-64">
              {topSalespersons.length > 0 ? (
                <Bar data={topSalespersonsData} options={chartOptions} />
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">No data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Top 5 Customers</h2>
          </div>
          <div className="card-content">
            <div className="h-64">
              {topCustomers.length > 0 ? (
                <Line data={topCustomersData} options={chartOptions} />
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <PieChart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">No data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Top 10 Products</h2>
        </div>
        <div className="card-content">
          <div className="h-64">
            {topProducts.length > 0 ? (
              <Bar data={topProductsData} options={chartOptions} />
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <PieChart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">No data available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-content p-12 text-center">
          <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Analytics Coming Soon</h3>
          <p className="text-gray-600">
            Interactive charts, predictive analytics, and business intelligence features will be available in the next update.
          </p>
        </div>
      </div>
    </div>
  );
}