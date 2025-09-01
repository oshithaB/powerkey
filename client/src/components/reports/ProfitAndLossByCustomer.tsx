import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../axiosInstance';
import { X, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useCompany } from '../../contexts/CompanyContext';

interface ProfitAndLossData {
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  income: {
    sales_of_product_income: number;
    shipping_income: number;
    tax_income: number;
    discounts_given: number;
    total_income: number;
    net_income: number;
  };
  cost_of_sales: {
    cost_of_sales: number;
    total_cost_of_sales: number;
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
}

const ProfitAndLossByCustomer: React.FC = () => {
  const { selectedCompany } = useCompany();
  const [data, setData] = useState<ProfitAndLossData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [filter, setFilter] = useState<string>('year');
  const [periodStart, setPeriodStart] = useState<string>('');
  const [periodEnd, setPeriodEnd] = useState<string>('');
  const [inventoryShrinkage, setInventoryShrinkage] = useState<number>(0);
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  };

  const fetchProfitAndLossData = async (startDate?: string, endDate?: string) => {
    if (!selectedCompany?.company_id) {
      setError('No company selected');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [profitResponse, shrinkageResponse] = await Promise.all([
        axiosInstance.get(`/api/profit-and-loss-all-customers/${selectedCompany.company_id}`, {
          params: { start_date: startDate, end_date: endDate }
        }),
        axiosInstance.get(`/api/inventory-shrinkage/${selectedCompany.company_id}`)
      ]);
      
      // Validate response structure
      if (profitResponse.data?.data?.customers && Array.isArray(profitResponse.data.data.customers)) {
        setData(profitResponse.data.data.customers);
        setInventoryShrinkage(shrinkageResponse.data?.data?.inventory_shrinkage || 0);
      } else {
        setData([]);
        setError('Invalid data format received from server');
      }
    } catch (err) {
      setError('Failed to fetch profit and loss data. Please try again.');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCompany?.company_id) {
      const today = new Date();
      let startDate: string | undefined;
      let endDate: string = today.toISOString().split('T')[0];

      if (filter === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
      } else if (filter === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startDate = monthAgo.toISOString().split('T')[0];
      } else if (filter === 'year') {
        startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
      }

      setPeriodStart(startDate || '');
      setPeriodEnd(endDate);
      fetchProfitAndLossData(startDate, endDate);
    }
  }, [selectedCompany?.company_id, filter]);

  const formatCurrency = (value: number) => {
    // Handle null/undefined values
    const numValue = typeof value === 'number' ? value : 0;
    return new Intl.NumberFormat('en-LK', { 
      style: 'currency', 
      currency: 'LKR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numValue);
  };

  const safeGetValue = (customer: ProfitAndLossData, path: string): number => {
    try {
      const keys = path.split('.');
      let value: any = customer;
      for (const key of keys) {
        value = value?.[key];
      }
      return typeof value === 'number' ? value : 0;
    } catch {
      return 0;
    }
  };

  const getTotal = (path: string) => {
    return data.reduce((total, customer) => total + safeGetValue(customer, path), 0);
  };

  const handleCustomerClick = (customerId: string) => {
    navigate(`/reports/profit-and-loss-by-customer/${customerId}`);
  };

  const handlePrint = () => {
    if (data.length === 0) {
      alert('No data available to print');
      return;
    }
    setShowPrintPreview(true);
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) {
      alert('Print content not available');
      return;
    }

    try {
      const pdf = new jsPDF('l', 'mm', 'a4'); // Changed to landscape for better table fit
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const maxContentHeight = pageHeight - 2 * margin;

      const scale = 2; // Reduced scale for better performance
      const canvas = await html2canvas(printRef.current, {
        scale,
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: '#ffffff',
        windowWidth: printRef.current.scrollWidth,
        windowHeight: printRef.current.scrollHeight,
      });
      
      const imgData = canvas.toDataURL('image/png', 0.95);
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = pageWidth - 2 * margin;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

      const totalPages = Math.ceil(imgHeight / maxContentHeight);

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          pdf.addPage();
        }
        
        const srcY = i * maxContentHeight * (canvas.height / imgHeight);
        const pageContentHeight = Math.min(canvas.height - srcY, maxContentHeight * (canvas.height / imgHeight));
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = pageContentHeight;
        const tempCtx = tempCanvas.getContext('2d');
        
        if (tempCtx && pageContentHeight > 0) {
          tempCtx.imageSmoothingEnabled = true;
          tempCtx.imageSmoothingQuality = 'high';
          tempCtx.drawImage(canvas, 0, srcY, canvas.width, pageContentHeight, 0, 0, canvas.width, pageContentHeight);
          const pageImgData = tempCanvas.toDataURL('image/png', 0.95);
          pdf.addImage(pageImgData, 'PNG', margin, margin, imgWidth, Math.min(imgHeight - (i * maxContentHeight), maxContentHeight));
        }
      }

      const filename = `profit-and-loss-by-customer-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
      setShowPrintPreview(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const printStyles = `
    @media print {
      .section-header {
        background-color: #e2e8f0 !important;
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .cost-section {
        background-color: #f7fafc !important;
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      table {
        page-break-inside: avoid;
      }
      tr {
        page-break-inside: avoid;
      }
    }
    .cost-section {
      background-color: #f7fafc;
    }
  `;

  const renderTableRow = (label: string, getValue: (emp: ProfitAndLossData) => number, isTotal = false, isSection = false, sectionClass = '') => (
    <tr key={label}>
      <td className={`p-2 border-b ${isTotal ? 'font-bold' : 'font-medium'} ${sectionClass}`}>
        {label}
      </td>
      {data.map((customer) => (
        <td key={customer.customer.id} className={`p-2 border-b text-right ${isTotal ? 'font-bold' : ''} ${sectionClass}`}>
          {formatCurrency(getValue(customer))}
        </td>
      ))}
      <td className={`p-2 border-b text-right ${isTotal ? 'font-bold' : ''} ${sectionClass}`}>
        {formatCurrency(data.reduce((total, emp) => total + getValue(emp), 0))}
      </td>
    </tr>
  );

  if (!selectedCompany) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">Please select a company to view profit and loss data.</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 py-8">
          <div className="relative top-4 mx-auto p-5 border w-full max-w-7xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold mb-4">Profit and Loss by Customer</h1>
              <div className="flex space-x-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="border rounded-md p-2 w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="year">This Year</option>
                </select>
                <button
                  onClick={handlePrint}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  title="Print Report"
                  disabled={loading || data.length === 0}
                >
                  <Printer className="h-6 w-6" />
                </button>
                <button
                  onClick={() => navigate(-1)}
                  className="text-gray-400 hover:text-gray-600"
                  title="Close"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div id="print-content">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm font-medium">Profit and Loss Summary</p>
                <p className="text-sm text-gray-600">
                  {filter === 'week' && `Last 7 days: ${formatDate(periodStart)} - ${formatDate(periodEnd)}`}
                  {filter === 'month' && `Last 1 month: ${formatDate(periodStart)} - ${formatDate(periodEnd)}`}
                  {filter === 'year' && `Year to Date: ${formatDate(periodStart)} - ${formatDate(periodEnd)}`}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              
              {loading && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <p className="mt-2 text-gray-600">Loading data...</p>
                </div>
              )}
              
              {!loading && !error && data.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No data available for the selected period.
                </div>
              )}
              
              {!loading && !error && data.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-full">
                    <thead>
                      <tr>
                        <th className="bg-gray-100 p-3 font-semibold text-lg border section-header text-left" 
                            style={{ backgroundColor: '#e2e8f0', WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact', printColorAdjust: 'exact' }}>
                          Account
                        </th>
                        {data.map((customer) => (
                          <th key={customer.customer.id} 
                              onClick={() => handleCustomerClick(customer.customer.id)}
                              className="bg-gray-100 p-3 font-semibold text-lg border section-header text-right min-w-[120px] cursor-pointer hover:underline"
                              style={{ backgroundColor: '#e2e8f0', WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact', printColorAdjust: 'exact' }}>
                            {customer.customer.name}
                          </th>
                        ))}
                        <th className="bg-gray-100 p-3 font-semibold text-lg border section-header text-right min-w-[120px]" 
                            style={{ backgroundColor: '#e2e8f0', WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact', printColorAdjust: 'exact' }}>
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Income Section */}
                      {renderTableRow('Discounts given', (emp) => -safeGetValue(emp, 'income.discounts_given'))}
                      {renderTableRow('Sales of Product Income', (emp) => safeGetValue(emp, 'income.sales_of_product_income'))}
                      {renderTableRow('Shipping Income', (emp) => safeGetValue(emp, 'income.shipping_income'))}
                      {renderTableRow('Tax Income', (emp) => safeGetValue(emp, 'income.tax_income'))}
                      {renderTableRow('Total for Income', (emp) => safeGetValue(emp, 'income.total_income'), true)}
                      
                      {/* Cost of Sales Section */}
                      {renderTableRow('Cost of Sales', (emp) => safeGetValue(emp, 'cost_of_sales.cost_of_sales'), false, true, 'cost-section')}
                      <tr>
                        <td className="p-2 border-b font-medium cost-section">Inventory Shrinkage</td>
                        {data.map((customer) => (
                          <td key={customer.customer.id} className="p-2 border-b text-right cost-section">
                            {formatCurrency(0)}
                          </td>
                        ))}
                        <td className="p-2 border-b text-right cost-section">
                          {formatCurrency(inventoryShrinkage)}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 border-b font-bold cost-section">Total for Cost of Sales</td>
                        {data.map((customer) => (
                          <td key={customer.customer.id} className="p-2 border-b text-right font-bold cost-section">
                            {formatCurrency(safeGetValue(customer, 'cost_of_sales.total_cost_of_sales'))}
                          </td>
                        ))}
                        <td className="p-2 border-b text-right font-bold cost-section">
                          {formatCurrency(getTotal('cost_of_sales.total_cost_of_sales') + inventoryShrinkage)}
                        </td>
                      </tr>
                      
                      {/* Profit Section */}
                      {renderTableRow('Gross Profit', (emp) => safeGetValue(emp, 'profitability.gross_profit'), true)}
                      {renderTableRow('Other Income', () => 0)}
                      {renderTableRow('Expenses', () => 0)}
                      {renderTableRow('Other Expenses', () => 0)}
                      
                      {/* Final Net Earnings */}
                      <tr>
                        <td className="p-3 border-t-2 border-gray-800 font-bold">Net Earnings</td>
                        {data.map((customer) => (
                          <td key={customer.customer.id} className="p-3 border-t-2 border-gray-800 font-bold text-right">
                            {formatCurrency(safeGetValue(customer, 'profitability.net_earnings'))}
                          </td>
                        ))}
                        <td className="p-3 border-t-2 border-gray-800 font-bold text-right">
                          {formatCurrency(getTotal('profitability.net_earnings') - inventoryShrinkage)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
              
              <p className="text-sm mt-5 text-gray-600">
                Report generated at {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Print Preview Modal */}
      {showPrintPreview && data.length > 0 && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Print Preview - Profit and Loss by Customer
              </h3>
              <button
                onClick={() => setShowPrintPreview(false)}
                className="text-gray-400 hover:text-gray-600"
                title="Close Preview"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <div ref={printRef} className="p-8 bg-white text-gray-900">
                {/* Header */}
                <div className="flex justify-between items-start border-b pb-4 mb-6">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">Profit and Loss by Customer</h1>
                    <h2 className="text-xl text-gray-600 mb-2">Profit and Loss Summary</h2>
                    <h2 className="text-xl text-gray-600 mb-2">
                      {selectedCompany?.name || 'Company Name'} (Pvt) Ltd.
                    </h2>
                    <p className="text-sm text-gray-600">
                      Period: {formatDate(periodStart)} - {formatDate(periodEnd)}, {new Date(periodEnd).getFullYear()}
                    </p>
                  </div>

                  {selectedCompany?.company_logo && (
                    <img
                      src={`http://localhost:3000${selectedCompany.company_logo}`}
                      alt={`${selectedCompany.name} Logo`}
                      className="h-20 w-auto max-w-[200px] object-contain"
                    />
                  )}
                </div>

                {/* Report Content */}
                <table className="w-full border-collapse mb-6">
                  <thead>
                    <tr>
                      <th className="bg-gray-100 p-2 font-bold text-base border section-header text-left" 
                          style={{ backgroundColor: '#e2e8f0', WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact', printColorAdjust: 'exact' }}>
                        Account
                      </th>
                      {data.map((customer) => (
                        <th key={customer.customer.id} 
                            className="bg-gray-100 p-2 font-bold text-base border section-header text-right" 
                            style={{ backgroundColor: '#e2e8f0', WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact', printColorAdjust: 'exact' }}>
                          {customer.customer.name}
                        </th>
                      ))}
                      <th className="bg-gray-100 p-2 font-bold text-base border section-header text-right" 
                          style={{ backgroundColor: '#e2e8f0', WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact', printColorAdjust: 'exact' }}>
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Income Section */}
                    {renderTableRow('Discounts given', (emp) => -safeGetValue(emp, 'income.discounts_given'))}
                    {renderTableRow('Sales of Product Income', (emp) => safeGetValue(emp, 'income.sales_of_product_income'))}
                    {renderTableRow('Shipping Income', (emp) => safeGetValue(emp, 'income.shipping_income'))}
                    {renderTableRow('Tax Income', (emp) => safeGetValue(emp, 'income.tax_income'))}
                    {renderTableRow('Total for Income', (emp) => safeGetValue(emp, 'income.total_income'), true)}
                    
                    {/* Cost of Sales Section */}
                    {renderTableRow('Cost of Sales', (emp) => safeGetValue(emp, 'cost_of_sales.cost_of_sales'), false, true, 'cost-section')}
                    <tr>
                      <td className="p-2 border-b font-medium cost-section">Inventory Shrinkage</td>
                      {data.map((customer) => (
                        <td key={customer.customer.id} className="p-2 border-b text-right cost-section">
                          {formatCurrency(0)}
                        </td>
                      ))}
                      <td className="p-2 border-b text-right cost-section">
                        {formatCurrency(inventoryShrinkage)}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 border-b font-bold cost-section">Total for Cost of Sales</td>
                      {data.map((customer) => (
                        <td key={customer.customer.id} className="p-2 border-b text-right font-bold cost-section">
                          {formatCurrency(safeGetValue(customer, 'cost_of_sales.total_cost_of_sales'))}
                        </td>
                      ))}
                      <td className="p-2 border-b text-right font-bold cost-section">
                        {formatCurrency(getTotal('cost_of_sales.total_cost_of_sales') + inventoryShrinkage)}
                      </td>
                    </tr>
                    
                    {/* Profit Section */}
                    {renderTableRow('Gross Profit', (emp) => safeGetValue(emp, 'profitability.gross_profit'), true)}
                    {renderTableRow('Other Income', () => 0)}
                    {renderTableRow('Expenses', () => 0)}
                    {renderTableRow('Other Expenses', () => 0)}
                    
                    {/* Final Net Earnings */}
                    <tr>
                      <td className="p-2 border-t-2 border-gray-800 font-bold">Net Earnings</td>
                      {data.map((customer) => (
                        <td key={customer.customer.id} className="p-2 border-t-2 border-gray-800 font-bold text-right">
                          {formatCurrency(safeGetValue(customer, 'profitability.net_earnings'))}
                        </td>
                      ))}
                      <td className="p-2 border-t-2 border-gray-800 font-bold text-right">
                        {formatCurrency(getTotal('profitability.net_earnings') - inventoryShrinkage)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Footer */}
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">
                        Report generated at: {new Date().toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        Profit and Loss by Customer
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={() => setShowPrintPreview(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfitAndLossByCustomer;