import React, { useState, useEffect } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import axiosInstance from '../../axiosInstance';
import { X, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface ExpenseModalProps {
  expense?: any;
  onSave?: () => void;
}

interface ExpenseItem {
  product_id: number;
  product_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Category {
  id: number;
  name: string;
}

interface PaymentAccount {
  id: number;
  name: string;
}

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, accountType?: string, description?: string) => Promise<void>;
  existingMethods: string[];
  title: string;
  label: string;
}

export default function ExpenseModal({ expense, onSave }: ExpenseModalProps) {
  const { selectedCompany } = useCompany();
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productSuggestions, setProductSuggestions] = useState<any[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [paymentAccountFilter, setPaymentAccountFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [categorySuggestions, setCategorySuggestions] = useState<Category[]>([]);
  const [paymentAccountSuggestions, setPaymentAccountSuggestions] = useState<PaymentAccount[]>([]);
  const [paymentMethodSuggestions, setPaymentMethodSuggestions] = useState<string[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number | null>(null);
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false);
  const [isCreatePaymentAccountModalOpen, setIsCreatePaymentAccountModalOpen] = useState(false);
  const [isCreatePaymentMethodModalOpen, setIsCreatePaymentMethodModalOpen] = useState(false);
  const navigate = useNavigate();

  const initialFormData = {
    expense_number: `EXP-${Date.now()}`,
    category_id: '',
    payment_account_id: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: '',
    notes: '',
    payee: '',
  };

  const [formData, setFormData] = useState(expense ? {
    ...initialFormData,
    ...expense,
    payment_date: expense.payment_date.split('T')[0],
  } : initialFormData);

  const initialItems = [{
    product_id: 0,
    product_name: '',
    description: '',
    quantity: 0,
    unit_price: 0,
    total_price: 0,
  }];

  const [items, setItems] = useState<ExpenseItem[]>(expense?.items || initialItems);

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get(`/api/getExpenseCategories/${selectedCompany?.company_id}`);
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to fetch categories');
    }
  };

  const fetchPaymentAccounts = async () => {
    try {
      const response = await axiosInstance.get(`/api/getPaymentAccounts/${selectedCompany?.company_id}`);
      setPaymentAccounts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching payment accounts:', error);
      setError('Failed to fetch payment accounts');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axiosInstance.get(`/api/getProducts/${selectedCompany?.company_id}`);
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to fetch products');
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await axiosInstance.get(`/api/getPaymentMethods`);
      const methods = Array.isArray(response.data) 
        ? response.data.map(method => {
            if (typeof method === 'string') {
              return method;
            }
            if (typeof method === 'object' && method !== null) {
              return method.name || method.method || method.title || method.value || String(method);
            }
            return String(method);
          })
        : [];
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      setError('Failed to fetch payment methods');
      setPaymentMethods([]);
    }
  };

  const handleCreateCategory = async (name: string, type?: string, description?: string) => {
    try {
      const response = await axiosInstance.post(`/api/categories/${selectedCompany?.company_id}`, {
        name,
        category_type: type || null,
        description: description || null,
      });
      const newCategory = response.data;
      setCategories((prev) => [...prev, newCategory]);
      setFormData({ ...formData, category_id: newCategory.id.toString() });
      setIsCreateCategoryModalOpen(false);
      alert('Category created successfully.');
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Failed to create category.');
    }
  };

  const handleCreatePaymentAccount = async (name: string) => {
    try {
      const response = await axiosInstance.post(`/api/payment-accounts/${selectedCompany?.company_id}`, {
        name,
      });
      const newAccount = response.data;
      setPaymentAccounts((prev) => [...prev, newAccount]);
      setFormData({ ...formData, payment_account_id: newAccount.id.toString() });
      setPaymentAccountFilter(newAccount.name);
      setIsCreatePaymentAccountModalOpen(false);
      alert('Payment account created successfully.');
    } catch (error) {
      console.error('Error creating payment account:', error);
      alert('Failed to create payment account.');
    }
  };

  const handleCreatePaymentMethod = async (name: string) => {
    try {
      const response = await axiosInstance.post('/api/createPaymentMethod', {
        name,
      });
      const newMethod = response.data.name;
      setPaymentMethods((prev) => [...prev, newMethod]);
      setFormData({ ...formData, payment_method: newMethod });
      setPaymentMethodFilter(newMethod);
      setIsCreatePaymentMethodModalOpen(false);
      alert('Payment method created successfully.');
    } catch (error) {
      console.error('Error creating payment method:', error);
      alert('Failed to create payment method.');
    }
  };

  useEffect(() => {
    if (selectedCompany) {
      fetchCategories();
      fetchPaymentAccounts();
      fetchProducts();
      fetchPaymentMethods();
    }
  }, [selectedCompany]);

  useEffect(() => {
    if (activeSuggestionIndex !== null) {
      const activeItem = items[activeSuggestionIndex];
      if (activeItem?.product_name) {
        const filteredSuggestions = products.filter(product =>
          product.name.toLowerCase().includes(activeItem.product_name.toLowerCase())
        );
        setProductSuggestions(filteredSuggestions);
      } else {
        setProductSuggestions(products);
      }
    } else {
      setProductSuggestions([]);
    }
  }, [items, products, activeSuggestionIndex]);

  const updateItem = (index: number, field: keyof ExpenseItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    if (field === 'product_id' && value) {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        updatedItems[index].product_name = product.name;
        updatedItems[index].description = product.description || '';
        updatedItems[index].unit_price = product.unit_price || 0;
        updatedItems[index].product_id = product.id;
      }
    }

    if (field === 'quantity' || field === 'unit_price') {
      const item = updatedItems[index];
      item.total_price = Number((item.quantity * item.unit_price).toFixed(2));
    }

    setItems(updatedItems);
  };

  const addItem = () => {
    setItems([...items, {
      product_id: 0,
      product_name: '',
      description: '',
      quantity: 0,
      unit_price: 0,
      total_price: 0,
    }]);
    setProductSuggestions(products);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return Number(items.reduce((sum, item) => sum + item.total_price, 0).toFixed(2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.expense_number) {
        throw new Error('Expense number is required');
      }
      if (!formData.category_id) {
        throw new Error('Category is required');
      }
      if (!formData.payment_date) {
        throw new Error('Payment date is required');
      }
      if (!items.some(item => item.product_id !== 0)) {
        throw new Error('At least one valid item is required');
      }

      const total = calculateTotal();

      const submitData = {
        ...formData,
        company_id: selectedCompany?.company_id,
        category_id: parseInt(formData.category_id) || null,
        payment_account_id: parseInt(formData.payment_account_id) || null,
        total_amount: Number(total),
        items: items.map(item => ({
          ...item,
          product_id: parseInt(item.product_id as any) || null,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          total_price: Number(item.total_price),
        })),
      };

      if (expense) {
        await axiosInstance.put(`/api/expenses/${selectedCompany?.company_id}/${expense.id}`, submitData);
      } else {
        await axiosInstance.post(`/api/createExpenses/${selectedCompany?.company_id}`, submitData);
      }

      setFormData(initialFormData);
      setItems(initialItems);

      if (onSave && typeof onSave === 'function') {
        onSave();
      } else {
        navigate("/dashboard/expenses");
      }
    } catch (error: any) {
      console.error('Error saving expense:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save expense';
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const total = calculateTotal();

//   payment method
  const CreatePaymentMethodModal: React.FC<CreateModalProps> = ({
    isOpen,
    onClose,
    onCreate,
    existingMethods,
    title,
    label,
  }) => {
    const [newName, setNewName] = useState('');
  
    const handleCreate = async () => {
      const trimmedName = newName.trim();
      if (!trimmedName) {
        alert(`${label} name is required.`);
        return;
      }
      if (existingMethods.includes(trimmedName.toLowerCase())) {
        alert(`${label} already exists.`);
        return;
      }
      await onCreate(trimmedName);
      setNewName('');
    };
  
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <button onClick={onClose} className="text-gray-600 hover:text-gray-900">
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">{label} Name *</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="input w-full"
              placeholder={`Enter ${label.toLowerCase()} name`}
              maxLength={50}
              autoFocus
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="btn btn-secondary btn-md">
              Cancel
            </button>
            <button type="button" onClick={handleCreate} className="btn btn-primary btn-md">
              Create
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Category modal
  const CreateCategoryModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, type?: string, description?: string) => Promise<void>;
    existingMethods: string[];
  }> = ({ isOpen, onClose, onCreate, existingMethods }) => {
    const [newName, setNewName] = useState('');
    const [categoryType, setCategoryType] = useState('');
    const [description, setDescription] = useState('');
  
    const categoryTypes = ['Operational', 'Administrative', 'Marketing', 'Miscellaneous'];
  
    const handleCreate = async () => {
      const trimmedName = newName.trim();
      if (!trimmedName) {
        alert('Category name is required.');
        return;
      }
      if (existingMethods.includes(trimmedName.toLowerCase())) {
        alert('Category already exists.');
        return;
      }
      await onCreate(trimmedName, categoryType, description);
      setNewName('');
      setCategoryType('');
      setDescription('');
    };
  
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Create New Category</h2>
            <button onClick={onClose} className="text-gray-600 hover:text-gray-900">
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="input w-full"
              placeholder="Enter category name"
              maxLength={50}
              autoFocus
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Category Type</label>
            <select
              value={categoryType}
              onChange={(e) => setCategoryType(e.target.value)}
              className="input w-full"
            >
              <option value="">Select Category Type</option>
              {categoryTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input w-full min-h-[80px]"
              placeholder="Enter category description"
              maxLength={200}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="btn btn-secondary btn-md">
              Cancel
            </button>
            <button type="button" onClick={handleCreate} className="btn btn-primary btn-md">
              Create
            </button>
          </div>
        </div>
      </div>
    );
  };

  // payment account modal
  const CreatePaymentAccountModal: React.FC<CreateModalProps> = ({
    isOpen,
    onClose,
    onCreate,
    existingMethods,
    title,
    label,
  }) => {
    const [newName, setNewName] = useState('');
    const [accountType, setAccountType] = useState('');
    const [description, setDescription] = useState('');
  
    const accountTypes = ['Operational', 'Administrative', 'Marketing', 'Miscellaneous'];
  
    const handleCreate = async () => {
      const trimmedName = newName.trim();
      if (!trimmedName) {
        alert(`${label} name is required.`);
        return;
      }
      if (existingMethods.includes(trimmedName.toLowerCase())) {
        alert(`${label} already exists.`);
        return;
      }
      await onCreate(trimmedName, accountType, description);
      setNewName('');
      setAccountType('');
      setDescription('');
    };
  
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <button onClick={onClose} className="text-gray-600 hover:text-gray-900">
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">{label} Name *</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="input w-full"
              placeholder={`Enter ${label.toLowerCase()} name`}
              maxLength={50}
              autoFocus
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              className="input w-full"
            >
              <option value="">Select Account Type</option>
              {accountTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input w-full min-h-[80px]"
              placeholder="Enter category description"
              maxLength={200}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="btn btn-secondary btn-md">
              Cancel
            </button>
            <button type="button" onClick={handleCreate} className="btn btn-primary btn-md">
              Create
            </button>
          </div>
        </div>
      </div>
    );
  };

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
              Create New Expense
            </h3>
            <button
              onClick={() => navigate("/dashboard/expenses")}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expense Number *
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.expense_number}
                  onChange={(e) => setFormData({ ...formData, expense_number: e.target.value })}
                  placeholder="Enter expense number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payee
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.payee || ''}
                  onChange={(e) => setFormData({ ...formData, payee: e.target.value })}
                  placeholder="Enter payee name"
                />
              </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                    </label>
                    <select
                        name="category_id"
                        value={formData.category_id}
                        onChange={(e) => {
                        if (e.target.value === 'create_new') {
                            setIsCreateCategoryModalOpen(true);
                        } else {
                            setFormData({ ...formData, category_id: e.target.value });
                        }
                        }}
                        className="input w-full"
                        required
                    >
                        <option value="" disabled>
                        Select Category
                        </option>
                        <option value="create_new">+ Create New Category</option>
                        {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Account *
                    </label>
                    <select
                        name="payment_account_id"
                        value={formData.payment_account_id}
                        onChange={(e) => {
                        if (e.target.value === 'create_new') {
                            setIsCreatePaymentAccountModalOpen(true);
                        } else {
                            setFormData({ ...formData, payment_account_id: e.target.value });
                        }
                        }}
                        className="input w-full"
                        required
                    >
                        <option value="" disabled>
                        Select Payment Account
                        </option>
                        <option value="create_new">+ Create New Payment Account</option>
                        {paymentAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                            {account.name}
                        </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Date *
                    </label>
                    <input
                        type="date"
                        className="input"
                        value={formData.payment_date}
                        onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Method
                    </label>
                    <select
                        name="payment_method"
                        value={formData.payment_method}
                        onChange={(e) => {
                        if (e.target.value === 'create_new') {
                            setIsCreatePaymentMethodModalOpen(true);
                        } else {
                            setFormData({ ...formData, payment_method: e.target.value });
                        }
                        }}
                        className="input w-full"
                    >
                        <option value="" disabled>
                        Select Payment Method
                        </option>
                        <option value="create_new">+ Create New Payment Method</option>
                        {paymentMethods.map((method, index) => (
                        <option key={`${method}-${index}`} value={method}>
                            {method.charAt(0).toUpperCase() + method.slice(1)}
                        </option>
                        ))}
                    </select>
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
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={item.product_name || ''}
                            onChange={(e) => {
                              updateItem(index, 'product_name', e.target.value);
                              setActiveSuggestionIndex(index);
                            }}
                            onFocus={() => {
                              setActiveSuggestionIndex(index);
                              const filtered = products.filter(product =>
                                product.name.toLowerCase().includes(item.product_name?.toLowerCase() || '')
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
                            placeholder="Search product"
                            className="border rounded px-2 py-1 w-full"
                          />
                          {activeSuggestionIndex === index && productSuggestions.length > 0 && (
                            <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
                              {productSuggestions.map(product => (
                                <li
                                  key={product.id}
                                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                                  onMouseDown={() => {
                                    const updatedItems = [...items];
                                    updatedItems[index] = {
                                      ...updatedItems[index],
                                      quantity: 1,
                                      product_id: product.id,
                                      product_name: product.name,
                                      description: product.description || '',
                                      unit_price: product.unit_price || 0,
                                      total_price: product.unit_price || 0,
                                    };
                                    setItems(updatedItems);
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
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            className="input"
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            placeholder="Item description"
                            required
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            className="input w-20"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            required
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="input w-24"
                            value={item.unit_price}
                            onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                            required
                          />
                        </td>
                        <td className="px-4 py-2 text-center border border-gray-200">
                          Rs. {item.total_price.toFixed(2)}
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
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>Rs. {total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => navigate("/dashboard/expenses")}
                className="btn btn-secondary btn-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-md"
              >
                {loading ? 'Saving...' : expense ? 'Update Expense' : 'Create Expense'}
              </button>
            </div>
          </form>

          <CreateCategoryModal
            isOpen={isCreateCategoryModalOpen}
            onClose={() => setIsCreateCategoryModalOpen(false)}
            onCreate={handleCreateCategory}
            existingMethods={categories.map(c => c.name.toLowerCase())}
            />
            <CreatePaymentAccountModal
            isOpen={isCreatePaymentAccountModalOpen}
            onClose={() => setIsCreatePaymentAccountModalOpen(false)}
            onCreate={handleCreatePaymentAccount}
            existingMethods={paymentAccounts.map(a => a.name.toLowerCase())}
            title="Create New Payment Account"
            label="Payment Account"
            />
            <CreatePaymentMethodModal
            isOpen={isCreatePaymentMethodModalOpen}
            onClose={() => setIsCreatePaymentMethodModalOpen(false)}
            onCreate={handleCreatePaymentMethod}
            existingMethods={paymentMethods.map(m => m.toLowerCase())}
            title="Create New Payment Method"
            label="Payment Method"
            />
        </div>
      </div>
    </motion.div>
  );
}