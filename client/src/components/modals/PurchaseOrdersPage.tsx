import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Trash2 } from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import axiosInstance from '../../axiosInstance';

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
  id: number | string;
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
  isEditing?: boolean;
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
  const [orderCount, setOrderCount] = useState(0);
  const [vendorFilter, setVendorFilter] = useState('');
  const [vendorSuggestions, setVendorSuggestions] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [productSuggestions, setProductSuggestions] = useState<any[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number | null>(null);

  useEffect(() => {
    if (selectedCompany) {
      fetchVendors();
      fetchCategories();
      fetchEmployees();
      fetchOrderCount();
      fetchProducts();
    }
  }, [selectedCompany]);

  useEffect(() => {
    if (vendorFilter) {
      const filteredVendors = vendors.filter((vendor) =>
        vendor.name.toLowerCase().includes(vendorFilter.toLowerCase())
      );
      setVendorSuggestions(filteredVendors);
    } else {
      setVendorSuggestions([]);
    }
  }, [vendorFilter, vendors]);

  useEffect(() => {
    if (activeSuggestionIndex !== null) {
      const activeItem = orderItems[activeSuggestionIndex];
      if (activeItem?.name) {
        const filteredSuggestions = products.filter(product =>
          product.name.toLowerCase().includes(activeItem.name.toLowerCase())
        );
        setProductSuggestions(filteredSuggestions);
      } else {
        setProductSuggestions(products);
      }
    } else {
      setProductSuggestions([]);
    }
  }, [orderItems, products, activeSuggestionIndex]);

  const fetchProducts = async () => {
    try {
      const response = await axiosInstance.get(`/api/getProducts/${selectedCompany?.company_id}`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await axiosInstance.get(`/api/getVendors/${selectedCompany?.company_id}`);
      setVendors(response.data);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get(`/api/getCategories/${selectedCompany?.company_id}`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
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

  const fetchOrderCount = async () => {
    try {
      const response = await axiosInstance.get(`/api/orders/count/${selectedCompany?.company_id}`);
      const count = response.data.count + 1;
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
    if (name === 'vendor_id') {
      const selectedVendor = vendors.find(vendor => vendor.vendor_id === Number(value));
      setOrder((prev) => ({
        ...prev,
        vendor_id: value === '' ? null : Number(value),
        mailling_address: selectedVendor ? selectedVendor.address : '',
      }));
    } else {
      setOrder((prev) => ({
        ...prev,
        [name]: value === '' ? null : value,
      }));
    }
  };

  const addItem = () => {
    const newItem: OrderItem = {
      id: `temp_${Date.now()}`,
      order_id: order.id,
      product_id: null,
      name: '',
      sku: '',
      description: '',
      qty: 0,
      rate: 0,
      amount: 0,
      class: '',
      received: false,
      closed: false,
      isEditing: true,
    };
    setOrderItems([...orderItems, newItem]);
    setProductSuggestions(products);
  };

  const updateItem = (id: number | string, field: keyof OrderItem, value: any) => {
    const updatedItems = [...orderItems];
    const index = updatedItems.findIndex(item => item.id === id);
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    if (field === 'product_id' && value) {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        updatedItems[index].name = product.name;
        updatedItems[index].sku = product.sku || '';
        updatedItems[index].description = product.description || '';
        updatedItems[index].rate = product.cost_price || 0;
        updatedItems[index].product_id = product.id;
      }
    }

    if (field === 'qty' || field === 'rate') {
      const item = updatedItems[index];
      item.amount = Number((item.qty * item.rate).toFixed(2));
    }

    setOrderItems(updatedItems);
  };

  const removeItem = (id: number | string) => {
    setOrderItems((prev) => prev.filter((item) => item.id !== id));
  };

  const calculateTotal = () => {
    return Number(orderItems.reduce((sum, item) => sum + Number(item.amount), 0).toFixed(2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const hasEditingItem = orderItems.some(item => item.isEditing);
      if (hasEditingItem) {
        alert('Please save or cancel the new item before submitting the order.');
        return;
      }
      const orderData = {
        ...order,
        total_amount: calculateTotal(),
        company_id: selectedCompany?.company_id,
      };
      const response = await axiosInstance.post(`/api/orders/${selectedCompany?.company_id}`, orderData);
      const orderId = response.data.id;

      for (const item of orderItems) {
        await axiosInstance.post(`/api/order-items/${selectedCompany?.company_id}`, {
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="input pr-3 w-full"
                    value={vendorFilter}
                    onChange={(e) => {
                      setVendorFilter(e.target.value);
                      if (!e.target.value) setVendorSuggestions([]);
                    }}
                    placeholder="Search vendors..."
                    onBlur={() => setVendorSuggestions([])}
                  />
                  {vendorSuggestions.length > 0 && (
                    <ul className="absolute z-10 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto w-full">
                      {vendorSuggestions.map((vendor) => (
                        <li
                          key={vendor.vendor_id}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onMouseDown={() => {
                            setVendorFilter(vendor.name);
                            setOrder((prev) => ({
                              ...prev,
                              vendor_id: vendor.vendor_id,
                              mailling_address: vendor.address,
                            }));
                            setVendorSuggestions([]);
                          }}
                        >
                          {vendor.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mailing Address</label>
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
                <label className="block text-sm font-medium text-gray-700">Email</label>
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
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  name="category_id"
                  value={order.category_id || ''}
                  onChange={handleOrderChange}
                  className="input"
                >
                  <option value="">Select Category</option>
                  <option value="cost_of_sales">Cost of Sales</option>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <label className="block text-sm font-medium text-gray-700">Ship Via</label>
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
                  onClick={addItem}
                  className="btn btn-primary btn-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6">
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
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orderItems.map((item, index) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {item.isEditing ? (
                              <>
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => {
                                    updateItem(item.id, 'name', e.target.value);
                                    setActiveSuggestionIndex(index);
                                  }}
                                  onFocus={() => {
                                    setActiveSuggestionIndex(index);
                                    const filtered = products.filter(product =>
                                      product.name.toLowerCase().includes(item.name?.toLowerCase() || '')
                                    );
                                    setProductSuggestions(filtered.length > 0 ? filtered : products);
                                  }}
                                  onBlur={() => {
                                    setTimeout(() => {
                                      if (activeSuggestionIndex === index) {
                                        setProductSuggestions([]);
                                        setActiveSuggestionIndex(null);
                                      }
                                    }, 200);
                                  }}
                                  className="border rounded px-2 py-2 w-full"
                                  placeholder="Search product"
                                  required
                                />
                                {activeSuggestionIndex === index && productSuggestions.length > 0 && (
                                  <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
                                    {productSuggestions.map(product => (
                                      <li
                                        key={product.id}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                                        onMouseDown={() => {
                                          updateItem(item.id, 'product_id', product.id);
                                          setProductSuggestions([]);
                                          setActiveSuggestionIndex(null);
                                        }}
                                      >
                                        {product.image && (
                                          <img
                                            src={`http://localhost:3000${product.image}`}
                                            alt={product.name}
                                            className="w-8 h-8 object-cover mr-2 rounded"
                                          />
                                        )}
                                        <span>{product.name}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </>
                            ) : (
                              item.name
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {item.isEditing ? (
                              <input
                                type="text"
                                name="sku"
                                value={item.sku}
                                onChange={(e) => updateItem(item.id, 'sku', e.target.value)}
                                className="input w-full"
                                placeholder="Product SKU"
                              />
                            ) : (
                              item.sku || '-'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {item.isEditing ? (
                              <input
                                type="text"
                                name="description"
                                value={item.description}
                                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                className="input w-full"
                                placeholder="Product Description"
                              />
                            ) : (
                              item.description || '-'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {item.isEditing ? (
                              <input
                                type="number"
                                name="qty"
                                value={item.qty}
                                onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value) || 1)}
                                className="input w-full"
                                min="1"
                                required
                              />
                            ) : (
                              item.qty
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {item.isEditing ? (
                              <input
                                type="number"
                                name="rate"
                                value={item.rate}
                                onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                                className="input w-full"
                                step="0.01"
                                required
                              />
                            ) : (
                              `Rs. ${Number(item.rate).toFixed(2)}`
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            Rs. {Number(item.amount).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {item.isEditing ? (
                              <div className="flex space-x-2">
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total:</span>
                        <span>Rs. {calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
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