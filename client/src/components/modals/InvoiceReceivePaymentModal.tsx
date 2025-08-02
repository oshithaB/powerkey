// In InvoiceReceivePaymentModal.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useCompany } from '../../contexts/CompanyContext';
import axiosInstance from '../../axiosInstance';
import { X, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface Invoice {
  id: number;
  invoice_number: string;
  customer_id: number;
  customer_name?: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  status: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
  computed_status?: string;
}

interface Payment {
  payment_amount: number;
  payment_date: string;
  payment_method: string;
  notes?: string;
}

const InvoiceReceivePaymentModal: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>(); // Extract customerId from URL
  const { state } = useLocation();
  const navigate = useNavigate();
  const { selectedCompany } = useCompany();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payment, setPayment] = useState<Payment>({
    payment_amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    notes: '',
  });

  useEffect(() => {
    const fetchInvoices = async () => {
      console.log('Fetching invoices with:', { customerId, companyId: selectedCompany?.company_id });

      if (!selectedCompany?.company_id || !customerId) {
        setError(
          `Missing required information: ${!selectedCompany?.company_id ? 'Company ID' : ''}${
            !selectedCompany?.company_id && !customerId ? ' and ' : ''
          }${!customerId ? 'Customer ID' : ''}`
        );
        setLoading(false);
        return;
      }

      try {
        const response = await axiosInstance.get(
          `/api/getInvoicesByCustomer/${customerId}/${selectedCompany.company_id}`
        );
        if (response.data.length === 0) {
          setError('No invoices found for this customer');
        } else {
          setInvoices(response.data);
        }
      } catch (error) {
        console.error('Error fetching invoices:', error);
        setError('Failed to fetch invoices. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [selectedCompany, customerId]);

  const handlePaymentChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setPayment((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !selectedCompany?.company_id) {
      alert('Missing customer ID or company ID');
      return;
    }

    try {
      // Implement payment submission logic here
      await axiosInstance.post(`/api/recordPayment/${selectedCompany.company_id}/${customerId}`, {
        ...payment,
        customer_id: customerId,
        invoice_ids: invoices.map((invoice) => invoice.id), // Optionally send invoice IDs
      });
      alert('Payment recorded successfully');
      navigate('/invoices');
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Failed to record payment');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Error</h2>
            <button onClick={() => navigate('/invoices')} className="text-gray-600 hover:text-gray-900">
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-red-600">{error}</p>
          <div className="flex justify-end mt-4">
            <button onClick={() => navigate('/invoices')} className="btn btn-secondary">
              Back to Invoices
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Record Payment</h2>
          <button onClick={() => navigate('/invoices')} className="text-gray-600 hover:text-gray-900">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Customer Invoices</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance Due
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{invoice.invoice_number}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      Rs. {invoice.total_amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      Rs. {invoice.paid_amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-red-600">
                      Rs. {invoice.balance_due.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          (invoice.computed_status || invoice.status) === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : (invoice.computed_status || invoice.status) === 'partially_paid'
                            ? 'bg-yellow-100 text-yellow-800'
                            : (invoice.computed_status || invoice.status) === 'overdue'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {(invoice.computed_status || invoice.status)
                          .replace('_', ' ')
                          .charAt(0)
                          .toUpperCase() +
                          (invoice.computed_status || invoice.status).replace('_', ' ').slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <form onSubmit={handleSubmitPayment} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount</label>
              <input
                type="number"
                name="payment_amount"
                value={payment.payment_amount}
                onChange={handlePaymentChange}
                className="input w-full"
                placeholder="Enter payment amount"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
              <input
                type="date"
                name="payment_date"
                value={payment.payment_date}
                onChange={handlePaymentChange}
                className="input w-full"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              name="payment_method"
              value={payment.payment_method}
              onChange={handlePaymentChange}
              className="input w-full"
            >
              <option value="cash">Cash</option>
              <option value="credit_card">Credit Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="check">Check</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              value={payment.notes}
              onChange={handlePaymentChange}
              className="input w-full h-24"
              placeholder="Add any notes about the payment"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={() => navigate('/invoices')} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <DollarSign className="h-4 w-4 mr-2" />
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceReceivePaymentModal;