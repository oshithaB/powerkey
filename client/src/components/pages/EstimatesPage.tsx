import React, { useState, useEffect, useRef } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import axios from 'axios';
import axiosInstance from '../../axiosInstance';
import { Plus, Search, Edit, Trash2, FileText, Eye, Send, FileCheck, Printer, X } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Estimate {
  id: number;
  estimate_number: string;
  customer_id: number;
  customer_name?: string;
  customer_billing_address?: string;
  customer_shipping_address?: string;
  employee_id: number;
  employee_name: string;
  estimate_date: string;
  expiry_date?: string | null;
  subtotal: number;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' | 'converted';
  notes: string;
  terms: string;
  is_active: boolean;
  invoice_id: number | null;
  created_at: string;
}

interface EstimateItem {
  id?: number;
  product_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_amount: number;
  total_price: number;
}

export default function EstimatesPage() {
  const { selectedCompany } = useCompany();
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [taxRates, setTaxRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEstimate, setEditingEstimate] = useState<Estimate | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printingEstimate, setPrintingEstimate] = useState<Estimate | null>(null);
  const [printItems, setPrintItems] = useState<EstimateItem[]>([]);
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    estimate_number: '',
    customer_id: '',
    employee_id: '',
    estimate_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    discount_type: 'fixed' as 'percentage' | 'fixed',
    discount_value: 0,
    notes: '',
    terms: ''
  });

  const [items, setItems] = useState<EstimateItem[]>([
    {
      product_id: 0,
      description: '',
      quantity: 1,
      unit_price: 0,
      tax_rate: 0,
      tax_amount: 0,
      total_price: 0
    }
  ]);

  useEffect(() => {
    fetchEstimates();
    fetchData();
    fetchCustomers();
  }, [selectedCompany]);

  const fetchCustomers = async () => {
    try {
      const response = await axiosInstance.get(`/api/getCustomers/${selectedCompany?.company_id}`);
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchEstimates = async () => {
    try {
      const response = await axiosInstance.get(`/api/estimates/${selectedCompany?.company_id}`);
      setEstimates(response.data);
    } catch (error) {
      console.error('Error fetching estimates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [customersRes, employeesRes, productsRes, taxRatesRes] = await Promise.all([
        axiosInstance.get(`/api/getCustomers/${selectedCompany?.company_id}`),
        axiosInstance.get(`/api/employees/`),
        axiosInstance.get(`/api/getProducts/${selectedCompany?.company_id}`),
        axiosInstance.get(`/api/tax-rates/${selectedCompany?.company_id}`)
      ]);

      setCustomers(customersRes.data);
      setEmployees(employeesRes.data);
      setProducts(productsRes.data);
      setTaxRates(taxRatesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchEstimateItems = async (estimateId: number) => {
    try {
      const response = await axios.get(`/api/estimates/${selectedCompany?.company_id}/${estimateId}/items`);
      return response.data.length > 0 ? response.data : [
        {
          product_id: 0,
          description: '',
          quantity: 1,
          unit_price: 0,
          tax_rate: 0,
          tax_amount: 0,
          total_price: 0
        }
      ];
    } catch (error) {
      console.error('Error fetching estimate items:', error);
      return [
        {
          product_id: 0,
          description: '',
          quantity: 1,
          unit_price: 0,
          tax_rate: 0,
          tax_amount: 0,
          total_price: 0
        }
      ];
    }
  };

  const handleEdit = async (estimate: Estimate) => {
    setEditingEstimate(estimate);
    setFormData({
      estimate_number: estimate.estimate_number,
      customer_id: estimate.customer_id.toString(),
      employee_id: estimate.employee_id?.toString() || '',
      estimate_date: estimate.estimate_date || new Date().toISOString().split('T')[0],
      expiry_date: estimate.expiry_date || '',
      discount_type: estimate.discount_type,
      discount_value: estimate.discount_value,
      notes: estimate.notes || '',
      terms: estimate.terms || ''
    });
    
    const fetchedItems = await fetchEstimateItems(estimate.id);
    setItems(fetchedItems);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this estimate?')) {
      try {
        await axiosInstance.delete(`/api/deleteEstimate/${selectedCompany?.company_id}/${id}`);
        fetchEstimates();
      } catch (error: any) {
        const backendMessage = error.response?.data?.error;
        alert(backendMessage || 'Failed to delete estimate');
        console.error('Error deleting estimate:', error);
      }
    }
  };

  const handleConvertToInvoice = async (estimateId: number) => {
    if (window.confirm('Convert this estimate to an invoice?')) {
      try {
        const response = await axios.post(`/api/estimates/${selectedCompany?.company_id}/${estimateId}/convert`);
        alert('Estimate converted to invoice successfully!');
        fetchEstimates();
      } catch (error: any) {
        alert(error.response?.data?.error || 'Failed to convert estimate');
      }
    }
  };

  const handlePrint = async (estimate: Estimate) => {
    try {
      setPrintingEstimate(estimate);
      const fetchedItems = await fetchEstimateItems(estimate.id);
      setPrintItems(fetchedItems);
      setShowPrintPreview(true);
    } catch (error) {
      console.error('Error preparing print preview:', error);
      alert('Failed to load print preview');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      if (printRef.current) {
        const canvas = await html2canvas(printRef.current, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`estimate_${printingEstimate?.estimate_number}.pdf`);
        setShowPrintPreview(false);
        setPrintingEstimate(null);
        setPrintItems([]);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF');
    }
  };

  const addItem = () => {
    setItems([...items, {
      product_id: 0,
      description: '',
      quantity: 1,
      unit_price: 0,
      tax_rate: 0,
      tax_amount: 0,
      total_price: 0
    }]);
  };

  const removeItem = async (index: number) => {
    const item = items[index];
    
    // If editing an existing estimate and the item has an ID, delete it from the backend
    if (editingEstimate && item.id) {
      try {
        await axios.delete(`/api/estimate-items/${selectedCompany?.company_id}/${editingEstimate.id}/${item.id}`);
        setItems(items.filter((_, i) => i !== index));
      } catch (error: any) {
        const backendMessage = error.response?.data?.error;
        alert(backendMessage || 'Failed to delete estimate item');
        console.error('Error deleting estimate item:', error);
      }
    } else {
      // For new items or new estimates, remove directly from state
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof EstimateItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    if (field === 'product_id' && value) {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        updatedItems[index].description = product.name;
        updatedItems[index].unit_price = product.unit_price;
      }
    }

    if (field === 'quantity' || field === 'unit_price' || field === 'tax_rate') {
      const item = updatedItems[index];
      const subtotal = item.quantity * item.unit_price;
      item.tax_amount = (subtotal * item.tax_rate) / 100;
      item.total_price = subtotal + item.tax_amount;
    }

    setItems(updatedItems);
  };

  const calculateTotals = (itemsToCalculate: EstimateItem[] = items) => {
    const subtotal = itemsToCalculate.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const totalTax = itemsToCalculate.reduce((sum, item) => sum + item.tax_amount, 0);
    
    let discountAmount = 0;
    if (formData.discount_type === 'percentage') {
      discountAmount = (subtotal * formData.discount_value) / 100;
    } else {
      discountAmount = formData.discount_value;
    }

    const total = subtotal - discountAmount + totalTax;

    return { subtotal, totalTax, discountAmount, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        items,
        customer_id: parseInt(formData.customer_id),
        employee_id: formData.employee_id ? parseInt(formData.employee_id) : null
      };

      if (editingEstimate) {
        await axios.put(`/api/estimates/${selectedCompany?.company_id}/${editingEstimate.id}`, submitData);
      } else {
        await axios.post(`/api/estimates/${selectedCompany?.company_id}`, submitData);
      }

      fetchEstimates();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving estimate:', error);
      alert('Failed to save estimate');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      estimate_number: '',
      customer_id: '',
      employee_id: '',
      estimate_date: new Date().toISOString().split('T')[0],
      expiry_date: '',
      discount_type: 'fixed',
      discount_value: 0,
      notes: '',
      terms: ''
    });
    setItems([
      {
        product_id: 0,
        description: '',
        quantity: 1,
        unit_price: 0,
        tax_rate: 0,
        tax_amount: 0,
        total_price: 0
      }
    ]);
    setEditingEstimate(null);
  };

  const formatDate = (isoDate: string | Date | null | undefined) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-yellow-100 text-yellow-800';
      case 'converted':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredEstimates = estimates.filter(estimate =>
    estimate.estimate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    estimate.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    estimate.customer_billing_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    estimate.customer_shipping_address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { subtotal, totalTax, discountAmount, total } = calculateTotals();

  if (loading && !showModal) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900"></h1>
        <button
          onClick={() => {
            resetForm();
            navigate('/estimates/create');
          }}
          className="btn btn-primary btn-md"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Estimate
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      {/* Status Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select
          className="input pr-3 w-full"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Estimates</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="declined">Declined</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Date Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
        <input
          type="date"
          className="input pr-3 w-full"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
      </div>

      {/* Customer Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
        <select
          className="input pr-3 w-full"
          value={customerFilter}
          onChange={(e) => setCustomerFilter(e.target.value)}
        >
          <option value="">All Customers</option>
          {customers.map(customer => (
            <option key={customer.id} value={customer.name}>
              {customer.name}
            </option>
          ))}
        </select>
      </div>

      </div>


      {/* Estimates Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estimate
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
              {filteredEstimates.map((estimate) => (
                <tr key={estimate.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {estimate.estimate_number}
                        </div>
                        <div className="text-sm text-gray-500">
                          #{estimate.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {estimate.customer_name || 'Unknown Customer'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {estimate.employee_name || 'Not assigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(new Date(estimate.estimate_date), 'MMM dd, yyyy')}
                    </div>
                    {estimate.expiry_date && (
                      <div className="text-sm text-gray-500">
                        Expires: {format(new Date(estimate.expiry_date), 'MMM dd, yyyy')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ${estimate.total_amount?.toLocaleString() || '0.00'}
                    </div>
                    {estimate.discount_amount > 0 && (
                      <div className="text-sm text-gray-500">
                        Discount: ${estimate.discount_amount.toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(estimate.status)}`}>
                      {estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(estimate)}
                        className="text-primary-600 hover:text-primary-900"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handlePrint(estimate)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handlePrint(estimate)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Print"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                      {estimate.status !== 'converted' && (
                        <button
                          onClick={() => handleConvertToInvoice(estimate.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Convert to Invoice"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(estimate.id)}
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

      {/* Print Preview Modal */}
      {showPrintPreview && printingEstimate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto w-full z-50" style={{ marginTop: "-10px" }}>
          <div className="relative top-4 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Print Preview</h3>
              <button
                onClick={() => {
                  setShowPrintPreview(false);
                  setPrintingEstimate(null);
                  setPrintItems([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[70vh]">
              <div ref={printRef} className="p-8 bg-white w-[210mm] min-h-[297mm] text-gray-900">
                <div className="border-b pb-4 mb-4">
                  <h1 className="text-3xl font-bold">Estimate #{printingEstimate.estimate_number}</h1>
                  <p className="text-sm text-gray-600">ID: {printingEstimate.id}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold">Customer</h3>
                    <p>{printingEstimate.customer_name || 'Unknown Customer'}</p>
                    <p>{printingEstimate.customer_billing_address || 'No address provided'}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Details</h3>
                    <p>Estimate Date: {formatDate(printingEstimate.estimate_date) || 'N/A'}</p>
                    {printingEstimate.expiry_date && (
                      <p>Expiry Date: {formatDate(printingEstimate.expiry_date)}</p>
                    )}
                    <p>Employee: {printingEstimate.employee_name || 'Not assigned'}</p>
                    <p>Status: {printingEstimate.status.charAt(0).toUpperCase() + printingEstimate.status.slice(1)}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Items</h3>
                  <table className="w-full border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left">Item #</th>
                        <th className="px-4 py-2 text-left">Product</th>
                        <th className="px-4 py-2 text-left">Description</th>
                        <th className="px-4 py-2 text-right">Qty</th>
                        <th className="px-4 py-2 text-right">Unit Price</th>
                        <th className="px-4 py-2 text-right">Tax %</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printItems.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2">{index + 1}</td>
                          <td className="px-4 py-2">
                            {item.product_id ? products.find(p => p.id === item.product_id)?.name || 'N/A' : 'N/A'}
                          </td>
                          <td className="px-4 py-2">{item.description || 'N/A'}</td>
                          <td className="px-4 py-2 text-right">{item.quantity}</td>
                          <td className="px-4 py-2 text-right">${Number(item.unit_price || 0).toFixed(2)}</td>
                          <td className="px-4 py-2 text-right">{item.tax_rate}%</td>
                          <td className="px-4 py-2 text-right">${Number(item.total_price || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    {printingEstimate.notes && (
                      <div>
                        <h3 className="text-lg font-semibold">Notes</h3>
                        <p className="text-sm">{printingEstimate.notes}</p>
                      </div>
                    )}
                    {printingEstimate.terms && (
                      <div className="mt-4">
                        <h3 className="text-lg font-semibold">Terms & Conditions</h3>
                        <p className="text-sm">{printingEstimate.terms}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>${Number(printingEstimate.subtotal || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Discount ({printingEstimate.discount_type === 'percentage' ? '%' : '$'}):</span>
                          <span>${Number(printingEstimate.discount_amount || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax:</span>
                          <span>${Number(printingEstimate.tax_amount || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg border-t pt-2">
                          <span>Total:</span>
                          <span>${Number(printingEstimate.total_amount || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => {
                  setShowPrintPreview(false);
                  setPrintingEstimate(null);
                  setPrintItems([]);
                }}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto w-full z-50" style={{marginTop: "-10px"}}>
          <div className="relative top-4 mx-auto p-5 border w-full max-w-7xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingEstimate ? 'Edit Estimate' : 'Create New Estimate'}
              </h3>
              <button 
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimate Number
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.estimate_number}
                    onChange={(e) => setFormData({ ...formData, estimate_number: e.target.value })}
                    placeholder="AUTO"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer *
                  </label>
                  <select
                    required
                    className="input"
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  >
                    <option value="">Select Customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee
                  </label>
                  <select
                    className="input"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  >
                    <option value="">Select Employee</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimate Date *
                  </label>
                  <input
                    type="date"
                    className="input"
                    value={formatDate(formData.estimate_date)}
                    onChange={(e) => setFormData({ ...formData, estimate_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    className="input"
                    value={formatDate(formData.expiry_date)}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Items</h4>
                  <button
                    type="button"
                    onClick={addItem}
                    className="btn btn-secondary btn-sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tax %</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2">
                            <select
                              className="input"
                              value={item.product_id}
                              onChange={(e) => updateItem(index, 'product_id', parseInt(e.target.value))}
                            >
                              <option value={0}>Select Product</option>
                              {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              className="input"
                              value={item.description}
                              onChange={(e) => updateItem(index, 'description', e.target.value)}
                              placeholder="Item description"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              step="0.01"
                              className="input w-20"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              step="0.01"
                              className="input w-24"
                              value={item.unit_price}
                              onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          <td className="px-4 py-2">
                            <select
                              className="input w-20"
                              value={item.tax_rate}
                              onChange={(e) => updateItem(index, 'tax_rate', parseFloat(e.target.value) || 0)}
                            >
                              <option value={0}>0%</option>
                              {taxRates.map((tax) => (
                                <option key={tax.id} value={tax.rate}>
                                  {tax.rate}%
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-2 text-right">
                            ${Number(item.total_price || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      className="input min-h-[80px]"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional notes..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Terms & Conditions
                    </label>
                    <textarea
                      className="input min-h-[80px]"
                      value={formData.terms}
                      onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                      placeholder="Terms and conditions..."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Discount:</span>
                        <div className="flex items-center space-x-2">
                          <select
                            className="input w-24"
                            value={formData.discount_type}
                            onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
                          >
                            <option value="fixed">$</option>
                            <option value="percentage">%</option>
                          </select>
                          <input
                            type="number"
                            step="0.01"
                            className="input w-24"
                            value={formData.discount_value}
                            onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                          />
                          <span className="w-20 text-right">${Number(discountAmount || 0).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>${Number(totalTax || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total:</span>
                        <span>${Number(total || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="btn btn-secondary btn-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary btn-md"
                >
                  {loading ? 'Saving...' : editingEstimate ? 'Update Estimate' : 'Create Estimate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}