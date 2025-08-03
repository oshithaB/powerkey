import React, { useState, useEffect } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import axiosInstance from '../../axiosInstance';
import { Plus, Edit, Trash2, FileText, Eye, DollarSign, Filter, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface Invoice {
  id: number;
  invoice_number: string;
  customer_id: number | null;
  customer_name?: string;
  employee_id: number;
  employee_name?: string; // Updated to match backend
  estimate_id?: number;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  status: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
  notes: string;
  terms: string;
  created_at: string;
}

export default function InvoicesPage() {
  const navigate = useNavigate();
  const { selectedCompany } = useCompany();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    customer: '',
    employee: '',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    if (!selectedCompany?.company_id) {
      console.log('No company selected, redirecting to /companies');
      navigate('/companies');
      return;
    }
    fetchInvoices();
    fetchCustomers();
    fetchEmployees();
  }, [selectedCompany, navigate]); // Removed filters from dependencies

  const fetchInvoices = async () => {
    try {
      const response = await axiosInstance.get(`/api/getInvoice/${selectedCompany?.company_id}`);
      console.log('Fetched invoices:', response.data.map((inv: Invoice) => ({ id: inv.id, customer_id: inv.customer_id, customer_name: inv.customer_name })));
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axiosInstance.get(`/api/getCustomers/${selectedCompany?.company_id}`);
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axiosInstance.get(`/api/employees`);
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleEdit = async (invoice: Invoice) => {
    try {
      const response = await axiosInstance.get(`/api/getInvoiceItems/${selectedCompany?.company_id}/${invoice.id}`);
      const items = response.data;
      navigate('/invoices/edit', { state: { invoice, items } });
    } catch (error) {
      console.error('Error fetching invoice items:', error);
      alert('Failed to fetch invoice items');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await axiosInstance.delete(`/api/deleteInvoice/${selectedCompany?.company_id}/${id}`);
        fetchInvoices();
      } catch (error) {
        console.error('Error deleting invoice:', error);
      }
    }
  };

  const handleAddPayment = (invoice: Invoice) => {
    if (!invoice.customer_id || isNaN(invoice.customer_id) || invoice.customer_id <= 0) {
      console.error('Invalid or missing customer ID for invoice:', {
        id: invoice.id,
        customer_id: invoice.customer_id,
      });
      alert(`Cannot proceed: Invalid or missing customer ID for invoice ${invoice.invoice_number}`);
      return;
    }
    console.log('Navigating to receive payment for customer ID:', invoice.customer_id);
    navigate(`/invoices/receive-payment/${invoice.customer_id}`, { state: { invoice } });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partially_paid':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCustomerSearch = (value: string) => {
    setCustomerFilter(value);
    if (value) {
      const filteredSuggestions = customers.filter((customer) =>
        customer.name.toLowerCase().includes(value.toLowerCase())
      );
      setCustomerSuggestions(filteredSuggestions);
    } else {
      setCustomerSuggestions([]);
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearchTerm =
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      'Unknown Customer'.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filters.status
      ? invoice.status === filters.status
      : true;

    const matchesCustomer = customerFilter
      ? invoice.customer_name?.toLowerCase().includes(customerFilter.toLowerCase()) ||
        'Unknown Customer'.toLowerCase().includes(customerFilter.toLowerCase())
      : true;

    const invoiceDate = new Date(invoice.invoice_date).getTime();
    const matchesDate =
      (!filters.dateFrom || invoiceDate >= new Date(filters.dateFrom).getTime()) &&
      (!filters.dateTo || invoiceDate <= new Date(filters.dateTo).getTime());

    return matchesSearchTerm && matchesStatus && matchesCustomer && matchesDate;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary btn-md"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
          <button
            onClick={() => navigate('/invoices/create')}
            className="btn btn-primary btn-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="card">
          <div className="card-content">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="input"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                <div className="relative">
                  <input
                    type="text"
                    className="input pr-3 w-full"
                    value={customerFilter}
                    onChange={(e) => handleCustomerSearch(e.target.value)}
                    placeholder="Search customers..."
                    onBlur={() => setCustomerSuggestions([])}
                  />
                  {customerSuggestions.length > 0 && (
                    <ul className="absolute z-10 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto w-full">
                      {customerSuggestions.map((customer) => (
                        <li
                          key={customer.id}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onMouseDown={() => {
                            setCustomerFilter(customer.name);
                            setCustomerSuggestions([]);
                          }}
                        >
                          {customer.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    className="input"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    placeholder="From"
                  />
                  <input
                    type="date"
                    className="input"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    placeholder="To"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.invoice_number}
                        </div>
                        <div className="text-sm text-gray-500">
                          #{invoice.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.customer_name || 'Unknown Customer'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.employee_name || 'Unknown Employee'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}
                    </div>
                    <div className="text-sm text-gray-500">
                      Due: {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      Rs. {invoice.total_amount?.toLocaleString() || '0.00'}
                    </div>
                    <div className="text-sm text-gray-500">
                      Paid: Rs. {invoice.paid_amount?.toLocaleString() || '0.00'}
                    </div>
                    {invoice.balance_due > 0 && (
                      <div className="text-sm text-red-600">
                        Due: Rs. {invoice.balance_due?.toLocaleString() || '0.00'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                      {invoice.status.replace('_', ' ').charAt(0).toUpperCase() + invoice.status.replace('_', ' ').slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(invoice)}
                        className="text-primary-600 hover:text-primary-900"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        className="text-blue-600 hover:text-blue-900"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        className="text-gray-600 hover:text-gray-900"
                        title="Print"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleAddPayment(invoice)}
                        className="text-green-600 hover:text-green-900"
                        title="Add Payment"
                        disabled={!invoice.customer_id}
                      >
                        <DollarSign className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(invoice.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}