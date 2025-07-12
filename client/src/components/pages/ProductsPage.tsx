import React, { useState, useEffect } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import axios from 'axios';
import { Plus, Search, Edit, Trash2, Package, AlertTriangle } from 'lucide-react';

interface Product {
  id: number;
  sku: string;
  name: string;
  image?: string;
  description: string;
  category_id?: number;
  category_name?: string;
  preferred_vendor_id?: number;
  vendor_name?: string;
  added_employee_id?: number;
  employee_name?: string;
  unit_price: number;
  cost_price: number;
  quantity_on_hand: number;
  reorder_level: number;
  is_active: boolean;
  created_at: string;
}

interface Category {
  id: number;
  name: string;
}

interface Vendor {
  vendor_id: number;
  name: string;
}

interface Employee {
  id: number;
  name: string;
}

export default function ProductsPage() {
  const { selectedCompany } = useCompany();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    image: '',
    description: '',
    category_id: '',
    preferred_vendor_id: '',
    added_employee_id: '',
    unit_price: 0,
    cost_price: 0,
    quantity_on_hand: 0,
    reorder_level: 0,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (selectedCompany?.company_id) {
      fetchProducts();
      fetchCategories();
      fetchVendors();
      fetchEmployees();
    }
  }, [selectedCompany]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`/api/products/${selectedCompany?.company_id}`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`/api/products/${selectedCompany?.company_id}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await axios.get(`/api/products/${selectedCompany?.company_id}/vendors`);
      setVendors(response.data);
    } catch (error) {
      console.error('Error fetching vendors:', error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('sku', formData.sku);
      data.append('name', formData.name);
      if (imageFile) {
        data.append('image', imageFile);
      }
      data.append('description', formData.description);
      if (formData.category_id) {
        data.append('category_id', formData.category_id);
      }
      if (formData.preferred_vendor_id) {
        data.append('preferred_vendor_id', formData.preferred_vendor_id);
      }
      if (formData.added_employee_id) {
        data.append('added_employee_id', formData.added_employee_id);
      }
      data.append('unit_price', formData.unit_price.toString());
      data.append('cost_price', formData.cost_price.toString());
      data.append('quantity_on_hand', formData.quantity_on_hand.toString());
      data.append('reorder_level', formData.reorder_level.toString());

      if (editingProduct) {
        await axios.put(`/api/products/${selectedCompany?.company_id}/${editingProduct.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await axios.post(`/api/products/${selectedCompany?.company_id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      fetchProducts();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku || '',
      name: product.name,
      image: product.image || '',
      description: product.description || '',
      category_id: product.category_id ? product.category_id.toString() : '',
      preferred_vendor_id: product.preferred_vendor_id ? product.preferred_vendor_id.toString() : '',
      added_employee_id: product.added_employee_id ? product.added_employee_id.toString() : '',
      unit_price: product.unit_price || 0,
      cost_price: product.cost_price || 0,
      quantity_on_hand: product.quantity_on_hand || 0,
      reorder_level: product.reorder_level || 0,
    });
    setImageFile(null);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`/api/products/${selectedCompany?.company_id}/${id}`);
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      sku: '',
      name: '',
      image: '',
      description: '',
      category_id: '',
      preferred_vendor_id: '',
      added_employee_id: '',
      unit_price: 0,
      cost_price: 0,
      quantity_on_hand: 0,
      reorder_level: 0,
    });
    setImageFile(null);
    setEditingProduct(null);
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockProducts = products.filter(
    (product) => product.quantity_on_hand <= product.reorder_level
  );

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
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn btn-primary btn-md"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </button>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <h3 className="text-sm font-medium text-yellow-800">
              Low Stock Alert
            </h3>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            {lowStockProducts.length} product(s) are running low on stock and need to be restocked.
          </p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Search products..."
          className="input pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Products Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pricing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
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
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">SKU: {product.sku || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.category_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.vendor_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      Sale: ${Number(product.unit_price).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Cost: ${Number(product.cost_price).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      On Hand: {product.quantity_on_hand || 0}
                    </div>
                    <div className="text-sm text-gray-500">
                      Reorder: {product.reorder_level || 0}
                    </div>
                    {product.quantity_on_hand <= product.reorder_level && (
                      <div className="flex items-center text-xs text-yellow-600 mt-1">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Low Stock
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-900"
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" style={{ marginTop: '-1px' }}>
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="Product SKU"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      required
                      className="input"
                      placeholder="Product name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="input"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImageFile(file);
                      }
                    }}
                  />
                  {formData.image && (
                    <div className="mt-2">
                      <img src={formData.image} alt="Product preview" className="h-20 w-20 object-cover rounded" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    className="input min-h-[80px]"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Product description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      className="input"
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Vendor</label>
                    <select
                      className="input"
                      value={formData.preferred_vendor_id}
                      onChange={(e) => setFormData({ ...formData, preferred_vendor_id: e.target.value })}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Added Employee</label>
                    <select
                      className="input"
                      value={formData.added_employee_id}
                      onChange={(e) => setFormData({ ...formData, added_employee_id: e.target.value })}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      value={formData.unit_price}
                      onChange={(e) =>
                        setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      value={formData.cost_price}
                      onChange={(e) =>
                        setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity on Hand</label>
                    <input
                      type="number"
                      className="input"
                      value={formData.quantity_on_hand}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity_on_hand: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                    <input
                      type="number"
                      className="input"
                      value={formData.reorder_level}
                      onChange={(e) =>
                        setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary btn-md"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-md">
                    {editingProduct ? 'Update' : 'Create'} Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}