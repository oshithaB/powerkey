import React, { useState, useEffect } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import axios from 'axios';
import { X, Plus, Trash2, FileCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface InvoiceModalProps {
  invoice: any;
  onSave: () => void;
}

interface InvoiceItem {
  product_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_amount: number;
  total_price: number;
}

export default function InvoiceModal({ invoice, onSave }: InvoiceModalProps) {
  const { selectedCompany } = useCompany();
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [taxRates, setTaxRates] = useState<any[]>([]);
  const [customerEstimates, setCustomerEstimates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showEstimateSelection, setShowEstimateSelection] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    invoice_number: '',
    customer_id: '',
    employee_id: '',
    estimate_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    discount_type: 'fixed' as 'percentage' | 'fixed',
    discount_value: 0,
    notes: '',
    terms: ''
  });

  const [items, setItems] = useState<InvoiceItem[]>([
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
    fetchData();
    if (invoice) {
      setFormData({
        invoice_number: invoice.invoice_number,
        customer_id: invoice.customer_id.toString(),
        employee_id: invoice.employee_id?.toString() || '',
        estimate_id: invoice.estimate_id?.toString() || '',
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        discount_type: invoice.discount_type,
        discount_value: invoice.discount_value,
        notes: invoice.notes || '',
        terms: invoice.terms || ''
      });
      fetchInvoiceItems();
    }
  }, [invoice]);

  const fetchData = async () => {
    try {
      const [customersRes, employeesRes, productsRes, taxRatesRes] = await Promise.all([
        axios.get(`/api/customers/${selectedCompany?.company_id}`),
        axios.get(`/api/employees/${selectedCompany?.company_id}`),
        axios.get(`/api/products/${selectedCompany?.company_id}`),
        axios.get(`/api/tax-rates/${selectedCompany?.company_id}`)
      ]);

      setCustomers(customersRes.data);
      setEmployees(employeesRes.data);
      setProducts(productsRes.data);
      setTaxRates(taxRatesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchInvoiceItems = async () => {
    if (!invoice) return;
    try {
      const response = await axios.get(`/api/invoices/${selectedCompany?.company_id}/${invoice.id}/items`);
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching invoice items:', error);
    }
  };

  const fetchCustomerEstimates = async (customerId: string) => {
    if (!customerId) return;
    try {
      const response = await axios.get(`/api/customers/${selectedCompany?.company_id}/${customerId}/estimates`);
      setCustomerEstimates(response.data);
      if (response.data.length > 0) {
        setShowEstimateSelection(true);
      }
    } catch (error) {
      console.error('Error fetching customer estimates:', error);
    }
  };

  const handleCustomerChange = (customerId: string) => {
    setFormData({ ...formData, customer_id: customerId });
    if (customerId && !invoice) {
      fetchCustomerEstimates(customerId);
    }
  };

  const convertEstimateToInvoice = async (estimateId: number) => {
    try {
      const response = await axios.post(`/api/estimates/${selectedCompany?.company_id}/${estimateId}/convert`);
      alert('Estimate converted to invoice successfully!');
      onSave();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to convert estimate');
    }
  };

  const loadEstimateData = async (estimateId: string) => {
    if (!estimateId) return;
    try {
      const [estimateRes, itemsRes] = await Promise.all([
        axios.get(`/api/estimates/${selectedCompany?.company_id}/${estimateId}`),
        axios.get(`/api/estimates/${selectedCompany?.company_id}/${estimateId}/items`)
      ]);

      const estimate = estimateRes.data;
      setFormData({
        ...formData,
        estimate_id: estimateId,
        due_date: estimate.expiry_date,
        discount_type: estimate.discount_type,
        discount_value: estimate.discount_value,
        notes: estimate.notes,
        terms: estimate.terms
      });
      setItems(itemsRes.data);
      setShowEstimateSelection(false);
    } catch (error) {
      console.error('Error loading estimate data:', error);
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

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
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

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const totalTax = items.reduce((sum, item) => sum + item.tax_amount, 0);
    
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
        employee_id: formData.employee_id ? parseInt(formData.employee_id) : null,
        estimate_id: formData.estimate_id ? parseInt(formData.estimate_id) : null
      };

      if (invoice) {
        await axios.put(`/api/invoices/${selectedCompany?.company_id}/${invoice.id}`, submitData);
      } else {
        await axios.post(`/api/invoices/${selectedCompany?.company_id}`, submitData);
      }

      onSave();
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, totalTax, discountAmount, total } = calculateTotals();

  return (
    <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.5 }}
        >
      <div className="container mx-auto px-4 py-8">
        <div className="relative top-4 mx-auto p-5 border w-full max-w-7xl shadow-lg rounded-md bg-white">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {invoice ? 'Edit Invoice' : 'Create New Invoice'}
            </h3>
            <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Estimate Selection Modal */}
          {showEstimateSelection && customerEstimates.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-lg font-medium text-blue-900 mb-3">
                This customer has {customerEstimates.length} estimate(s). Would you like to convert one to an invoice?
              </h4>
              <div className="space-y-2">
                {customerEstimates.map((estimate) => (
                  <div key={estimate.id} className="flex justify-between items-center p-3 bg-white border rounded">
                    <div>
                      <span className="font-medium">{estimate.estimate_number}</span>
                      <span className="text-gray-500 ml-2">${estimate.total_amount}</span>
                      <span className="text-gray-500 ml-2">({estimate.status})</span>
                    </div>
                    <div className="space-x-2">
                      <button
                        onClick={() => convertEstimateToInvoice(estimate.id)}
                        className="btn btn-primary btn-sm"
                      >
                        Convert to Invoice
                      </button>
                      <button
                        onClick={() => loadEstimateData(estimate.id.toString())}
                        className="btn btn-secondary btn-sm"
                      >
                        Use as Template
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowEstimateSelection(false)}
                className="mt-3 btn btn-secondary btn-sm"
              >
                Create New Invoice
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header Information */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Number
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
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
                  onChange={(e) => handleCustomerChange(e.target.value)}
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
                      {employee.first_name} {employee.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Date *
                </label>
                <input
                  type="date"
                  required
                  className="input"
                  value={formData.invoice_date}
                  onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  className="input"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>

            {/* Items Section */}
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
                          ${item.total_price.toFixed(2)}
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

            {/* Totals Section */}
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
                        <span className="w-20 text-right">${discountAmount.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>${totalTax.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn btn-secondary btn-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-md"
              >
                {loading ? 'Saving...' : invoice ? 'Update Invoice' : 'Create Invoice'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}