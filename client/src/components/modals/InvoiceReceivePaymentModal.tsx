import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCompany } from '../../contexts/CompanyContext';
import axiosInstance from '../../axiosInstance';
import { X, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface InvoiceItem {
  id: number;
  invoice_id: number;
  product_id: number;
  product_name: string;
  description: string;
  quantity: string;
  unit_price: string;
  actual_unit_price: string;
  tax_rate: string;
  tax_amount: string;
  total_price: string;
  created_at: string;
  updated_at: string;
}

interface Invoice {
  id: number;
  invoice_number: string;
  customer_id: number;
  customer_name?: string;
  company_id: number;
  employee_id: number;
  employee_name?: string;
  estimate_id: number | null;
  invoice_date: string;
  due_date: string;
  shipping_date: string;
  total_amount: number | string | null;
  paid_amount: number | string | null;
  balance_due: number | string | null;
  status: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
  computed_status?: string;
  discount_type: 'fixed' | 'percentage';
  discount_value: string;
  discount_amount: string;
  subtotal: string;
  tax_amount: string;
  notes: string;
  terms: string;
  shipping_address: string;
  billing_address: string;
  ship_via: string;
  tracking_number: string;
  created_at: string;
  updated_at: string;
  items: InvoiceItem[];
}

interface Payment {
  payment_amount: number;
  payment_date: string;
  payment_method: string;
  notes?: string;
}

const InvoiceReceivePaymentModal: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
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
      if (!selectedCompany?.company_id) {
        console.log('No company selected, waiting for company context...');
        setError('No company selected. Please select a company first.');
        setLoading(false);
        return;
      }

      // Use customer_id from state.invoice if available
      const customerId = state?.invoice?.customer_id || null;

      if (!customerId || isNaN(customerId)) {
        console.log('Invalid or missing customer ID from state:', state?.invoice?.customer_id);
        setError('Invalid or missing Customer ID');
        setLoading(false);
        return;
      }

      console.log('Fetching invoices with:', { customerId, companyId: selectedCompany.company_id });
      console.log('Location state:', state);

      try {
        const response = await axiosInstance.get(`/api/getInvoicesByCustomer/${selectedCompany.company_id}/${customerId}`);
        console.log('API response:', response.data);
        setInvoices(response.data);
      } catch (error: any) {
        console.error('Error fetching invoices:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        setError('Failed to fetch invoices. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [selectedCompany, state]);

  useEffect(() => {
    if (invoices.length > 0) {
      console.log('Invoices set:', invoices);
    }
  }, [invoices]);

  const handlePaymentChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setPayment((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const customerId = state?.invoice?.customer_id || null;

    if (!customerId || !selectedCompany?.company_id) {
      alert('Missing customer ID or company ID');
      return;
    }
    if (invoices.length === 0) {
      alert('No invoices found for this customer');
      return;
    }

    try {
      await axiosInstance.post(`/api/recordPayment/${selectedCompany.company_id}/${customerId}`, {
        ...payment,
        customer_id: customerId,
        invoice_ids: invoices.map((invoice) => invoice.id),
      });
      alert('Payment recorded successfully');
      navigate('/invoices');
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Failed to record payment');
    }
  };

  // Helper function to format amount safely
  const formatAmount = (amount: number | string | null | undefined): string => {
    if (amount == null || isNaN(Number(amount))) {
      return '0';
    }
    return parseFloat(amount.toString()).toLocaleString();
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
            <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900">
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-red-600">{error}</p>
          <div className="flex justify-end mt-4">
            <button onClick={() => navigate(-1)} className="btn btn-secondary">
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
          <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Customer: {state?.invoice?.customer_name || 'Unknown Customer'}
            </h3>
            <h4 className="text-md font-semibold text-gray-600 mb-2">Invoices</h4>
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
                    {invoices.length === 0 ? (
                    <tr>
                        <td colSpan={7} className="px-4 py-2 text-center text-sm text-gray-500">
                        No invoices found for this customer.
                        </td>
                    </tr>
                    ) : (
                    invoices.map((invoice) => (
                        <tr key={invoice.id}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{invoice.invoice_number}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                            {format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                            {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                            Rs. {formatAmount(invoice.total_amount)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                            Rs. {formatAmount(invoice.paid_amount)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-red-600">
                            Rs. {formatAmount(invoice.balance_due)}
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
                    ))
                    )}
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
            <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">
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