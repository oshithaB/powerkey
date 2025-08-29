import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../axiosInstance';
import { X, Printer, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useCompany } from '../../contexts/CompanyContext';

interface Invoice {
  invoiceId: string;
  companyId: string;
  companyName: string;
  invoiceNumber: string;
  invoiceDate: string;
  discountAmount: string;
  totalAmount: string;
  customerId: string;
  customerName: string;
  productId: string;
  productName: string;
  quantity: number;
  commissionPerUnit: string;
  totalCommission: string;
}

interface CommissionData {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  totalCommission: string;
  invoices: Invoice[];
}

const CommissionReportByEmployees: React.FC = () => {
  const { selectedCompany } = useCompany();
  const [data, setData] = useState<CommissionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [filter, setFilter] = useState<string>('year');
  const [periodStart, setPeriodStart] = useState<string>('');
  const [periodEnd, setPeriodEnd] = useState<string>('');
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const { employeeId } = useParams<{ employeeId: string }>();

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  };

  const fetchCommissionData = async (employeeId: string, startDate?: string, endDate?: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching with params:', { start_date: startDate, end_date: endDate, employeeId });
      const response = await axiosInstance.get(`/api/commission-report/${employeeId}`);
      console.log('API Response:', response.data);
      setData(response.data.data);
    } catch (err) {
      setError('Failed to fetch commission data. Please try again.');
      console.error('Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCompany?.company_id && employeeId) {
      const today = new Date();
      let startDate: string | undefined;
      let endDate: string = today.toISOString().split('T')[0];
  
      if (filter === 'week') {
        startDate = new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0];
      } else if (filter === 'month') {
        startDate = new Date(today.setMonth(today.getMonth() - 1)).toISOString().split('T')[0];
      } else if (filter === 'year') {
        startDate = new Date(2025, 0, 1).toISOString().split('T')[0];
      }
  
      console.log('Filter:', filter, 'Start Date:', startDate, 'End Date:', endDate);
      setPeriodStart(startDate || '');
      setPeriodEnd(endDate);
      fetchCommissionData(employeeId, startDate, endDate);
    } else {
      console.log('Missing selectedCompany or employeeId:', { selectedCompany, employeeId });
      setError('Missing company or employee information');
      setLoading(false);
    }
  }, [selectedCompany?.company_id, employeeId, filter]);

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'LKR' }).format(parseFloat(value));
  };

  const handlePrint = () => {
    setShowPrintPreview(true);
  };

  const handleDownloadPDF = async () => {
    try {
      if (printRef.current) {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const maxContentHeight = pageHeight - 2 * margin;

        const scale = 3;
        const canvas = await html2canvas(printRef.current, {
          scale,
          useCORS: true,
          logging: false,
          windowWidth: printRef.current.scrollWidth,
          windowHeight: printRef.current.scrollHeight,
        });
        const imgData = canvas.toDataURL('image/png', 1.0);
        const imgProps = pdf.getImageProperties(imgData);
        const imgWidth = pageWidth - 2 * margin;
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

        const totalPages = Math.ceil(imgHeight / maxContentHeight);

        for (let i = 0; i < totalPages; i++) {
          if (i > 0) {
            pdf.addPage();
          }
          const srcY = i * maxContentHeight * (canvas.width / imgWidth);
          const pageContentHeight = Math.min(canvas.height - srcY, maxContentHeight * (canvas.width / imgWidth));
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = pageContentHeight;
          const tempCtx = tempCanvas.getContext('2d');
          if (tempCtx) {
            tempCtx.imageSmoothingEnabled = true;
            tempCtx.imageSmoothingQuality = 'high';
            tempCtx.drawImage(canvas, 0, srcY, canvas.width, pageContentHeight, 0, 0, canvas.width, pageContentHeight);
            const pageImgData = tempCanvas.toDataURL('image/png', 1.0);
            pdf.addImage(pageImgData, 'PNG', margin, margin, imgWidth, Math.min(imgHeight - (i * maxContentHeight), maxContentHeight));
          }
        }

        pdf.save(`commission-report-${data?.employeeName || 'employee'}.pdf`);
        setShowPrintPreview(false);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF.');
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
    }
    .section-header {
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
      printColorAdjust: exact !important;
    }
  `;

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
            <button
                onClick={() => navigate(-1)}
                className="text-gray-400 hover:text-gray-600 mr-4"
                title="Go Back"
            >
                <ArrowLeft className="h-6 w-6" />
            </button>
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold mb-4">Employee Commission Report</h1>
              <div className="flex space-x-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="border rounded-md p-2 w-40"
                >
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="year">Last Year</option>
                </select>
                <button
                  onClick={handlePrint}
                  className="text-gray-400 hover:text-gray-600"
                  title="Print Report"
                >
                  <Printer className="h-6 w-6" />
                </button>
                <button
                  onClick={() => navigate('/dashboard/reports')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div id="print-content">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm">Employee Commission Details</p>
                <p className="text-sm">
                    {formatDate(periodStart)} - {formatDate(periodEnd)}, {new Date(periodEnd).getFullYear()}

                </p>
              </div>

              {error && <div className="text-red-500 mb-4">{error}</div>}
              {loading && <div className="text-center">Loading data...</div>}
              {data && (
                <>
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold">{data.employeeName}</h2>
                    <p className="text-sm text-gray-600">{data.employeeEmail}</p>
                    <p className="text-sm text-gray-600">Total Commission: {formatCurrency(data.totalCommission)}</p>
                  </div>
                  {data.invoices.length > 0 ? (
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="bg-gray-100 p-2 font-semibold text-lg border-b section-header text-left" style={{backgroundColor: '#e2e8f0', WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact', printColorAdjust: 'exact'}}>Invoice Number</th>
                          <th className="bg-gray-100 p-2 font-semibold text-lg border-b section-header text-left" style={{backgroundColor: '#e2e8f0', WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact', printColorAdjust: 'exact'}}>Company</th>
                          <th className="bg-gray-100 p-2 font-semibold text-lg border-b section-header text-left" style={{backgroundColor: '#e2e8f0', WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact', printColorAdjust: 'exact'}}>Date</th>
                          <th className="bg-gray-100 p-2 font-semibold text-lg border-b section-header text-left" style={{backgroundColor: '#e2e8f0', WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact', printColorAdjust: 'exact'}}>Customer</th>
                          <th className="bg-gray-100 p-2 font-semibold text-lg border-b section-header text-left" style={{backgroundColor: '#e2e8f0', WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact', printColorAdjust: 'exact'}}>Product</th>
                          <th className="bg-gray-100 p-2 font-semibold text-lg border-b section-header text-right" style={{backgroundColor: '#e2e8f0', WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact', printColorAdjust: 'exact'}}>Quantity</th>
                          <th className="bg-gray-100 p-2 font-semibold text-lg border-b section-header text-right" style={{backgroundColor: '#e2e8f0', WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact', printColorAdjust: 'exact'}}>Commission/Unit</th>
                          <th className="bg-gray-100 p-2 font-semibold text-lg border-b section-header text-right" style={{backgroundColor: '#e2e8f0', WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact', printColorAdjust: 'exact'}}>Total Commission</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.invoices.map((invoice) => (
                          <tr key={invoice.invoiceId}>
                            <td className="p-2 border-b">{invoice.invoiceNumber}</td>
                            <td className="p-2 border-b">{invoice.companyName}</td>
                            <td className="p-2 border-b">{formatDate(invoice.invoiceDate)}</td>
                            <td className="p-2 border-b">{invoice.customerName}</td>
                            <td className="p-2 border-b">{invoice.productName}</td>
                            <td className="p-2 border-b text-right">{invoice.quantity}</td>
                            <td className="p-2 border-b text-right">{formatCurrency(invoice.commissionPerUnit)}</td>
                            <td className="p-2 border-b text-right">{formatCurrency(invoice.totalCommission)}</td>
                          </tr>
                        ))}
                        <tr>
                          <td className="p-2 border-t-2 border-gray-800 font-bold" colSpan={7}>Total Commission</td>
                          <td className="p-2 border-t-2 border-gray-800 font-bold text-right">{formatCurrency(data.totalCommission)}</td>
                        </tr>
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-sm text-gray-600">No invoices found for this employee.</p>
                  )}
                  <p className="text-sm mt-5">Report generated at {new Date().toLocaleString()}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Print Preview Modal */}
      {showPrintPreview && data && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto w-full z-50"
          style={{ marginTop: "-10px" }}
        >
          <div className="relative top-4 mx-auto p-5 border w-full max-w-5xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Print Preview - Employee Commission Report
              </h3>
              <button
                onClick={() => setShowPrintPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[70vh]">
              <div
                ref={printRef}
                className="p-8 bg-white text-gray-900"
              >
                {/* Header */}
                <div className="flex justify-between items-start border-b pb-4 mb-6">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">Employee Commission Report</h1>
                    <h2 className="text-xl text-gray-600 mb-2">Employee Commission Details</h2>
                    <h2 className="text-xl text-gray-600 mb-2">
                      {/* {selectedCompany?.name || 'Company Name'} (Pvt) Ltd. */}
                    </h2>
                    <p className="text-sm text-gray-600">
                      Period: {formatDate(periodStart)} - {formatDate(periodEnd)}, {new Date(periodEnd).getFullYear()}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">Employee: {data.employeeName}</p>
                    <p className="text-sm text-gray-600">Email: {data.employeeEmail}</p>
                  </div>

                  {/* {selectedCompany?.company_logo && (
                    <img
                      src={`http://localhost:3000${selectedCompany.company_logo}`}
                      alt={`${selectedCompany.name} Logo`}
                      className="h-20 w-auto max-w-[200px] object-contain"
                    />
                  )} */}
                </div>

                {/* Report Content */}
                {data.invoices.length > 0 ? (
                  <table className="w-full border-collapse mb-6">
                    <thead>
                      <tr>
                        <th className="bg-gray-100 p-2 font-bold text-base border section-header text-left" style={{backgroundColor: '#e2e8f0', WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact', printColorAdjust: 'exact'}}>INVOICE NUMBER</th>
                        <th className="bg-gray-100 p-2 font-bold text-base border section-header text-left" style={{backgroundColor: '#e2e8f0', WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact', printColorAdjust: 'exact'}}>COMPANY</th>
                        <th className="bg-gray-100 p-2 font-bold text-base border section-header text-left" style={{backgroundColor: '#e2e8f0', WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact', printColorAdjust: 'exact'}}>DATE</th>
                        <th className="bg-gray-100 p-2 font-bold text-base border section-header text-left" style={{backgroundColor: '#e2e8f0', WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact', printColorAdjust: 'exact'}}>CUSTOMER</th>
                        <th className="bg-gray-100 p-2 font-bold text-base border section-header text-left" style={{backgroundColor: '#e2e8f0', WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact', printColorAdjust: 'exact'}}>PRODUCT</th>
                        <th className="bg-gray-100 p-2 font-bold text-base border section-header text-right" style={{backgroundColor: '#e2e8f0', WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact', printColorAdjust: 'exact'}}>QTY</th>
                        <th className="bg-gray-100 p-2 font-bold text-base border section-header text-right" style={{backgroundColor: '#e2e8f0', WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact', printColorAdjust: 'exact'}}>COMM/UNIT</th>
                        <th className="bg-gray-100 p-2 font-bold text-base border section-header text-right" style={{backgroundColor: '#e2e8f0', WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact', printColorAdjust: 'exact'}}>TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.invoices.map((invoice) => (
                        <tr key={invoice.invoiceId}>
                          <td className="p-2 border-b">{invoice.invoiceNumber}</td>
                            <td className="p-2 border-b">{invoice.companyName}</td>
                          <td className="p-2 border-b">{formatDate(invoice.invoiceDate)}</td>
                          <td className="p-2 border-b">{invoice.customerName}</td>
                          <td className="p-2 border-b">{invoice.productName}</td>
                          <td className="p-2 border-b text-right">{invoice.quantity}</td>
                          <td className="p-2 border-b text-right">{formatCurrency(invoice.commissionPerUnit)}</td>
                          <td className="p-2 border-b text-right font-medium">{formatCurrency(invoice.totalCommission)}</td>
                        </tr>
                      ))}
                      <tr>
                        <td className="p-2 border-t-2 border-gray-800 font-bold" colSpan={7}>TOTAL COMMISSION</td>
                        <td className="p-2 border-t-2 border-gray-800 font-bold text-right text-lg">{formatCurrency(data.totalCommission)}</td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-gray-600">No invoices found for this employee.</p>
                )}

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
                        Employee Commission Report
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setShowPrintPreview(false)}
                className="btn btn-secondary btn-md"
              >
                Cancel
              </button>
              <button
                onClick={handleDownloadPDF}
                className="btn btn-primary btn-md"
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

export default CommissionReportByEmployees;