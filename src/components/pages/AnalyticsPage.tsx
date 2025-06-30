import React from 'react';
import { PieChart, BarChart3, TrendingUp, Activity } from 'lucide-react';

export default function AnalyticsPage() {
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
            <h2 className="text-lg font-semibold">Revenue Trend</h2>
          </div>
          <div className="card-content">
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">Revenue chart will be displayed here</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Sales by Category</h2>
          </div>
          <div className="card-content">
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <PieChart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">Sales breakdown chart will be displayed here</p>
              </div>
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