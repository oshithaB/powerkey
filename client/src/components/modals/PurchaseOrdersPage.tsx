import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, Plus } from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import axios from 'axios';

interface Order {
  id: number;
  company_id: number;
  vendor_id: number | null;
  mailling_address?: string;
  email?: string;
  order_no: string;
  order_date: string;
  category_id: number | null;
  class: number | null;
  customer_id: number | null;
  shipping_address?: string;
  location: string;
  ship_via?: string;
  total_amount: number | null | string;
  status: string;
  created_at: string;
}

interface OrderItem {
  id: number;
  order_id: number;
  product_id: number | null;
  name: string;
  sku: string;
  description: string;
  qty: number;
  rate: number;
  amount: number | null | string;
  class: string;
  received: boolean;
  closed: boolean;
}

interface Vendor {
  vendor_id: number;
  name: string;
  address: string;
}

interface Category {
  id: number;
  name: string;
}

interface Employee {
  id: number;
  name: string;
}

interface Customer {
  id: number;
  name: string;
  shipping_address: string;
}

export default function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const { selectedCompany } = useCompany();
  const [order, setOrder] = useState<Order>({
    id: 0,
    company_id: selectedCompany?.company_id || 0,
    vendor_id: null,
    mailling_address: '',
    email: '',
    customer_id: null,
    shipping_address: '',
    order_no: '',
    order_date: new Date().toISOString().split('T')[0],
    category_id: null,
    class: null,
    location: '',
    ship_via: '',
    total_amount: null,
    status: 'draft',
    created_at: new Date().toISOString(),
  });
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showItemForm, setShowItemForm] = useState(false);
  const [newItem, setNewItem] = useState<Omit<OrderItem, 'id' | 'order_id'>>({
    product_id: null,
    name: '',
    sku: '',
    description: '',
    qty: 1,
    rate: 0,
    amount: 0,
    class: '',
    received: false,
    closed: false,
  });
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    if (selectedCompany) {
      fetchVendors();
      fetchCategories();
      fetchEmployees();
      fetchCustomers();
      fetchOrderCount();
    }
  }, [selectedCompany]);

  const fetchVendors = async () => {
    try {
      const response = await axios.get(`/api/vendors/${selectedCompany?.company_id}`);
      setVendors(response.data);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`/api/categories/${selectedCompany?.company_id}`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`/api/employees`);
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`/api/customers/${selectedCompany?.company_id}`);
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchOrderCount = async () => {
    try {
      const response = await axios.get(`/api/orders/count/${selectedCompany?.company_id}`);
      const count = response.data.count + 1; // Increment for new order
      setOrderCount(count);
      setOrder((prev) => ({
        ...prev,
        order_no: `ORD-${count}`,
      }));
    } catch (error) {
      console.error('Error fetching order count:', error);
      setOrder((prev) => ({
        ...prev,
        order_no: `ORD-${orderCount + 1}`,
      }));
    }
  };

  const handleOrderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle vendor selection and auto-populate mailing address
    if (name === 'vendor_id') {
      const selectedVendor = vendors.find(vendor => vendor.vendor_id === Number(value));
      setOrder((prev) => ({
        ...prev,
        vendor_id: value === '' ? null : Number(value),
        mailling_address: selectedVendor ? selectedVendor.address : '',
      }));
    } 
    // Handle customer selection and auto-populate shipping address
    else if (name === 'customer_id') {
      const selectedCustomer = customers.find(customer => customer.id === Number(value));
      setOrder((prev) => ({
        ...prev,
        customer_id: value === '' ? null : Number(value),
        shipping_address: selectedCustomer ? selectedCustomer.shipping_address : '',
      }));
    } 
    else {
      setOrder((prev) => ({
        ...prev,
        [name]: value === '' ? null : value,
      }));
    }
  };

  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewItem((prev) => ({
      ...prev,
      [name]: value === '' ? null : value,
    }));
  };

  const addItem = () => {
    const amount = Number(newItem.qty) * Number(newItem.rate);
    setOrderItems((prev) => [
      ...prev,
      {
        ...newItem,
        id: prev.length + 1,
        order_id: order.id,
        amount: amount.toFixed(2),
      },
    ]);
    setNewItem({
      product_id: null,
      name: '',
      sku: '',
      description: '',
      qty: 1,
      rate: 0,
      amount: 0,
      class: '',
      received: false,
      closed: false,
    });
    setShowItemForm(false);
  };

  const removeItem = (id: number) => {
    setOrderItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const orderData = {
        ...order,
        total_amount: orderItems.reduce((sum, item) => sum + Number(item.amount), 0).toFixed(2),
        company_id: selectedCompany?.company_id,
      };
      const response = await axios.post(`/api/orders/${selectedCompany?.company_id}`, orderData);
      const orderId = response.data.id;

      for (const item of orderItems) {
        await axios.post(`/api/order-items/${selectedCompany?.company_id}`, {
          ...item,
          order_id: orderId,
        });
      }

      navigate('/orders');
    } catch (error: any) {
      console.error('Error saving order:', error);
      alert(error.response?.data?.message || 'Failed to save order');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ duration: 0.5 }}
    >
      <div className="space-y-6">
        <div className="relative top-4 mx-auto p-5 border w-full max-w-7xl shadow-lg rounded-md bg-white">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Create Purchase Order</h3>
            <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Order Number</label>
                <input
                  type="text"
                  name="order_no"
                  value={order.order_no}
                  className="input"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Order Date</label>
                <input
                  type="date"
                  name="order_date"
                  value={order.order_date}
                  onChange={handleOrderChange}
                  className="input"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Vendor</label>
                <select
                  name="vendor_id"
                  value={order.vendor_id || ''}
                  onChange={handleOrderChange}
                  className="input"
                >
                  <option value="">Select Vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.vendor_id} value={vendor.vendor_id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700'>Mailing Address</label>
                <input
                  type="text"
                  name="mailling_address"
                  value={order.mailling_address || ''}
                  onChange={handleOrderChange}
                  className="input"
                  placeholder="Enter mailing address"
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700'>Email</label>
                <input
                  type="email"
                  name="email"
                  value={order.email || ''}
                  onChange={handleOrderChange}
                  className="input"
                  placeholder="Enter email"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className='block text-sm font-medium text-gray-700'>Customer</label>
                <select
                  name="customer_id"
                  value={order.customer_id || ''}
                  onChange={handleOrderChange}
                  className="input"
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
                <label className='block text-sm font-medium text-gray-700'>Customer Shipping Address</label>
                <input
                  type="text"
                  name="shipping_address"
                  value={order.shipping_address || ''}
                  onChange={handleOrderChange}
                  className="input"
                  placeholder="Enter shipping address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  name="category_id"
                  value={order.category_id || ''}
                  onChange={handleOrderChange}
                  className="input"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Class</label>
                <select
                  name="class"
                  value={order.class || ''}
                  onChange={handleOrderChange}
                  className="input"
                >
                  <option value="">Select Employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  name="location"
                  value={order.location}
                  onChange={handleOrderChange}
                  className="input"
                  placeholder="Enter location"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Purchase Order Status</label>
                <select
                  name="status"
                  value={order.status}
                  onChange={handleOrderChange}
                  className="input"
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700'>Ship Via</label>
                <input
                  type="text"
                  name="ship_via"
                  value={order.ship_via || ''}
                  onChange={handleOrderChange}
                  className="input"
                  placeholder="Enter shipping method"
                />
              </div>
            </div>

            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-medium text-gray-900">Order Items</h4>
                <button
                  type="button"
                  onClick={() => setShowItemForm(true)}
                  className="btn btn-primary btn-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </button>
              </div>

              {showItemForm && (
                <div className="border p-4 rounded-md mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Item Name</label>
                      <input
                        type="text"
                        name="name"
                        value={newItem.name}
                        onChange={handleItemChange}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">SKU</label>
                      <input
                        type="text"
                        name="sku"
                        value={newItem.sku}
                        onChange={handleItemChange}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <input
                        type="text"
                        name="description"
                        value={newItem.description}
                        onChange={handleItemChange}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Quantity</label>
                      <input
                        type="number"
                        name="qty"
                        value={newItem.qty}
                        onChange={handleItemChange}
                        className="input"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Rate</label>
                      <input
                        type="number"
                        name="rate"
                        value={newItem.rate}
                        onChange={handleItemChange}
                        className="input"
                        step="0.01"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Class</label>
                      <input
                        type="text"
                        name="class"
                        value={newItem.class}
                        onChange={handleItemChange}
                        className="input"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowItemForm(false)}
                      className="btn btn-secondary btn-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={addItem}
                      className="btn btn-primary btn-sm"
                    >
                      Add Item
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Class
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orderItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.sku || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.description || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.qty}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${Number(item.rate).toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${Number(item.amount).toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.class || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => navigate('/orders')}
                className="btn btn-secondary btn-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-md"
              >
                Save Order
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}