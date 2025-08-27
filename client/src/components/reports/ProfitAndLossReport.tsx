import React, { useState, useEffect } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import axiosInstance from '../../axiosInstance';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProfitAndLossData {
  period: {
    start_date: string;
    end_date: string;
    generated_at: string;
  };
  income: {
    sales_of_product_income: number;
    shipping_income: number;
    tax_income: number;
    discounts_given: number;
    other_income: number;
    total_income: number;
    net_income: number;
  };
  cost_of_sales: {
    cost_of_sales: number;
    inventory_shrinkage: number;
    total_cost_of_sales: number;
  };
  expenses: {
    operating_expenses: number;
    other_expenses: number;
    total_expenses: number;
  };
  profitability: {
    gross_profit: number;
    net_earnings: number;
    gross_profit_margin: number;
    net_profit_margin: number;
  };
  cash_flow: {
    total_invoiced: number;
    total_paid: number;
    outstanding_balance: number;
    collection_rate: number;
  };
  summary: {
    total_revenue: number;
    total_costs: number;
    net_profit_loss: number;
    is_profitable: boolean;
  };
}

const ProfitAndLossReport: React.FC = () => {
  const { selectedCompany } = useCompany();
  const [data, setData] = useState<ProfitAndLossData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchProfitAndLossData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(`/api/profit-and-loss/${selectedCompany?.company_id}`);
      console.log(response.data);
      setData(response.data.data);
    } catch (err) {
      setError('Failed to fetch profit and loss data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCompany?.company_id) {
      fetchProfitAndLossData();
    }
  }, [selectedCompany?.company_id]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'LKR' }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="container mx-auto p-4">
      <div className='flex justify-between items-center mb-4'>
        <h1 className="text-2xl font-bold mb-4">Profit and Loss Report</h1>

        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>

      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}
      {loading && <div className="text-center">Loading data...</div>}
      {data && (
        <div className="space-y-6">
          {/* Company Info */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold">Company: {selectedCompany?.name}</h2>
            <p>Address: {selectedCompany?.address || 'N/A'}</p>
            <p>Email: {selectedCompany?.email_address || 'N/A'}</p>
            <p>Phone: {selectedCompany?.contact_number || 'N/A'}</p>
          </div>

          {/* Period */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold">Report Period</h2>
            <p>Start Date: {data.period.start_date}</p>
            <p>End Date: {data.period.end_date}</p>
            <p>Generated At: {new Date(data.period.generated_at).toLocaleString()}</p>
          </div>

          {/* Income Section */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold">Income</h2>
            <p>Product Income: {formatCurrency(data.income.sales_of_product_income)}</p>
            <p>Shipping Income: {formatCurrency(data.income.shipping_income)}</p>
            <p>Tax Income: {formatCurrency(data.income.tax_income)}</p>
            <p>Discounts Given: {formatCurrency(data.income.discounts_given)}</p>
            <p>Other Income: {formatCurrency(data.income.other_income)}</p>
            <p>Total Income: {formatCurrency(data.income.total_income)}</p>
            <p>Net Income: {formatCurrency(data.income.net_income)}</p>
          </div>

          {/* Cost of Sales Section */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold">Cost of Sales</h2>
            <p>Cost of Sales: {formatCurrency(data.cost_of_sales.cost_of_sales)}</p>
            <p>Inventory Shrinkage: {formatCurrency(data.cost_of_sales.inventory_shrinkage)}</p>
            <p>Total Cost of Sales: {formatCurrency(data.cost_of_sales.total_cost_of_sales)}</p>
          </div>

          {/* Expenses Section */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold">Expenses</h2>
            <p>Operating Expenses: {formatCurrency(data.expenses.operating_expenses)}</p>
            <p>Other Expenses: {formatCurrency(data.expenses.other_expenses)}</p>
            <p>Total Expenses: {formatCurrency(data.expenses.total_expenses)}</p>
          </div>

          {/* Profitability Section */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold">Profitability</h2>
            <p>Gross Profit: {formatCurrency(data.profitability.gross_profit)}</p>
            <p>Net Earnings: {formatCurrency(data.profitability.net_earnings)}</p>
            <p>Gross Profit Margin: {formatPercentage(data.profitability.gross_profit_margin)}</p>
            <p>Net Profit Margin: {formatPercentage(data.profitability.net_profit_margin)}</p>
          </div>

          {/* Cash Flow Section */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold">Cash Flow</h2>
            <p>Total Invoiced: {formatCurrency(data.cash_flow.total_invoiced)}</p>
            <p>Total Paid: {formatCurrency(data.cash_flow.total_paid)}</p>
            <p>Outstanding Balance: {formatCurrency(data.cash_flow.outstanding_balance)}</p>
            <p>Collection Rate: {formatPercentage(data.cash_flow.collection_rate)}</p>
          </div>

          {/* Summary Section */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold">Summary</h2>
            <p>Total Revenue: {formatCurrency(data.summary.total_revenue)}</p>
            <p>Total Costs: {formatCurrency(data.summary.total_costs)}</p>
            <p>Net Profit/Loss: {formatCurrency(data.summary.net_profit_loss)}</p>
            <p>Profitable: {data.summary.is_profitable ? 'Yes' : 'No'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfitAndLossReport;