import React, { useState, useEffect } from 'react';
import { PieChart, BarChart3, TrendingUp, Activity } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import axios from 'axios';
import { useCompany } from '../../contexts/CompanyContext';
import axiosInstance from '../../axiosInstance';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AnalyticsPage() {
  const { selectedCompany } = useCompany();
  const [topProducts, setTopProducts] = useState<{ name: string; total_quantity: number; total_revenue: number }[]>([]);
  const [topSalespersons, setTopSalespersons] = useState<{ name: string; total_sales: number; total_invoices: number }[]>([]);
  const companyId = selectedCompany?.company_id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch top 10 products
        const productsResponse = await axiosInstance.get(`api/top10Products/${selectedCompany?.company_id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setTopProducts(productsResponse.data.data);

        // Fetch top 5 salespersons
        const salespersonsResponse = await axiosInstance.get(`api/top5Salespersons/${companyId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setTopSalespersons(salespersonsResponse.data.data);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      }
    };

    if (companyId) {
      fetchData();
    }
  }, [companyId]);

  // Normalize revenue for better visualization (e.g., divide by 100 for scaling)
  const normalizeRevenue = (revenue: number) => revenue / 100;

  // Data for Top 10 Products Bar Chart
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

  // Data for Top 5 Salespersons Bar Chart
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
            if (datasetLabel.includes('Revenue')) {
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
          text: 'Quantity / Invoices',
        },
        beginAtZero: true,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Revenue (x100) / Sales',
        },
        beginAtZero: true,
        grid: {
          drawOnChartArea: false, // Avoid overlapping grid lines
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
      </div>

      {/* Analytics Overview */}
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

      {/* Charts */}
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
      </div>

      {/* Performance Metrics */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Key Performance Indicators</h2>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">0</h3>
              <p className="text-sm text-gray-600">Average Order Value</p>
            </div>

            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">0%</h3>
              <p className="text-sm text-gray-600">Customer Retention Rate</p>
            </div>

            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">0</h3>
              <p className="text-sm text-gray-600">Inventory Turnover</p>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon */}
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