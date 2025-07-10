import React, { useState, useEffect } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import axios from 'axios';
import { Plus, Search, Edit, Trash2, Mail, Phone } from 'lucide-react';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  credit_limit: number;
  balance: number;
  is_active: boolean;
  created_at: string;
}

export default function CustomersPage() {
  const { selectedCompany } = useCompany();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    is_active: true,
    credit_limit: 0,
    balance: 0
  });

  const [billingAddress, setBillingAddress] = useState({
    address: '',
    city: '',
    province: '',
    postalCode: '',
    country: ''
  });

  const [showShipping, setShowShipping] = useState(false);
    const [shippingAddress, setShippingAddress] = useState({ ...billingAddress });

    const handleBillingChange = (e) => {
        const { name, value } = e.target;
        setBillingAddress(prev => ({ ...prev, [name]: value }));
    };

    const handleShippingChange = (e) => {
        const { name, value } = e.target;
        setShippingAddress(prev => ({ ...prev, [name]: value }));
    };

    const renderAddress = (address) => {
        return Object.values(address).filter(Boolean).join(', ');
    };

  useEffect(() => {
    fetchCustomers();
  }, [selectedCompany]);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`/api/customers/${selectedCompany?.company_id}`);
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await axios.put(`/api/customers/${selectedCompany?.company_id}/${editingCustomer.id}`, formData);
      } else {
        await axios.post(`/api/customers/${selectedCompany?.company_id}`, formData);
      }
      fetchCustomers();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      zip_code: customer.zip_code || '',
      country: customer.country || '',
      is_active: customer.is_active,
      credit_limit: customer.credit_limit || 0,
      balance: customer.balance || 0
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await axios.delete(`/api/customers/${selectedCompany?.company_id}/${id}`);
        fetchCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      country: '',
      is_active: false,
      credit_limit: 0,
      balance: 0
    });
    setEditingCustomer(null);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn btn-primary btn-md"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Search customers..."
          className="input pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Customers Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credit Limit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {customer.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {/* {customer.tax_number || '-'} */}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {customer.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-2" />
                          {customer.email}
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2" />
                          {customer.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {customer.city && customer.state
                        ? `${customer.city}, ${customer.state}`
                        : customer.city || customer.state || '-'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {customer.country || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${customer.credit_limit?.toLocaleString() || '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${customer.balance?.toLocaleString() || '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(customer)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(customer.id)}
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"  style={{marginTop: "-1px"}}>
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      className="input"
                      placeholder='Enter Customer Name'
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      className="input"
                      placeholder="Enter Email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Is Taxable
                    </label>
                    <select
                      className="input"
                      value={formData.is_active ? 'Yes' : 'No'}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'Yes' })}
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax Number
                    </label>
                    <input
                      type="text"
                      className="input"
                      name="taxId"
                      // value={formData.taxId || ''}
                      // onChange={handleInputChange}
                      placeholder="Enter Tax Number"
                      disabled={!formData.is_active}
                    />
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        className="input"
                        placeholder="Enter Phone Number"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Vehicle Number
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Enter Vehicle Number"
                        // value={formData.vehicleNumber || ''}
                        // onChange={handleInputChange}
                      />
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Credit Limit
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      value={formData.credit_limit}
                      onChange={(e) => setFormData({ ...formData, credit_limit: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Balance
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      value={formData.balance}
                      onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <hr />

                <h3 className='text-lg font-medium text-gray-900 mb-4'>Addresses - Billing</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <input type="text" id="address" className="input" name="address" value={billingAddress.address} onChange={handleBillingChange} required />
                  </div>

                  <div className="col-md-6">
                      <label htmlFor="city" className="form-label">City</label>
                      <input type="text" id="city" className="input" name="city" value={billingAddress.city} onChange={handleBillingChange} required />
                  </div>

                  <div className="col-md-6">
                      <label htmlFor="province" className="form-label">Province</label>
                      <select id="province" className="input" name="province" value={billingAddress.province} onChange={handleBillingChange} required>
                          <option value="">Select Province</option>
                          <option value="Central">Central Province</option>
                          <option value="Eastern">Eastern Province</option>
                          <option value="Northern">Northern Province</option>
                          <option value="Southern">Southern Province</option>
                          <option value="Western">Western Province</option>
                          <option value="North Western">North Western Province</option>
                          <option value="North Central">North Central Province</option>
                          <option value="Uva">Uva Province</option>
                          <option value="Sabaragamuwa">Sabaragamuwa Province</option>
                      </select>
                  </div>

                  <div className="col-md-6">
                      <label htmlFor="postalCode" className="form-label">Postal Code</label>
                      <input type="text" id="postalCode" className="input" name="postalCode" value={billingAddress.postalCode} onChange={handleBillingChange} required />
                  </div>

                  <div className="col-md-6">
                      <label htmlFor="country" className="form-label">Country</label>
                      <input type="text" id="country" className="input" name="country" value={billingAddress.country} onChange={handleBillingChange} required />
                  </div>
                </div>

                <div className="col-12">
                    <p className="mt-3"><strong>Entered Billing Address:</strong> {renderAddress(billingAddress)}</p>
                </div>

                <h3 className='text-lg font-medium text-gray-900 mb-4'>Addresses - Shipping</h3>
                <div className="col-12 mb-4">
                    <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="sameAsBilling" checked={!showShipping} onChange={() => setShowShipping(!showShipping)} />
                        <label className="form-check-label" htmlFor="sameAsBilling">
                            Shipping address same as billing address
                        </label>
                    </div>
                </div>

                {showShipping && (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {['Address', 'City', 'Province', 'PostalCode', 'Country'].map((field, idx) => (
                            <div className="col-md-6" key={idx}>
                                <label htmlFor={`shipping-${field}`} className="form-label">{field.replace(/([A-Z])/g, ' $1')}</label>
                                <input
                                    type="text"
                                    id={`shipping-${field}`}
                                    className="input"
                                    name={field}
                                    value={shippingAddress[field]}
                                    onChange={handleShippingChange}
                                />
                            </div>
                        ))}
                      </div>
                      <div className="col-12">
                          <p className="mt-3"><strong>Entered Shipping Address:</strong> {renderAddress(shippingAddress)}</p>
                      </div>
                    </div>
                
                )}

                <hr />

                <h3 className='text-lg font-medium text-gray-900 mb-4'>Payments</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label htmlFor="primaryPaymentMethod" className="form-label">Primary Payment Method</label>
                      <select id="primaryPaymentMethod" className="input" name="primaryPaymentMethod" required>
                          <option value={""}>Select Payment Method</option>
                          <option value="cash">Cash</option>
                          <option value="cashdeposit">Cash Deposit</option>
                          <option value="cheque">Cheque</option>
                          <option value="creditcard">Credit Card</option>
                          <option value="creditnote">Credit Note</option>
                          <option value="debitcard">Debit Card</option>
                          <option value="directdebit">Direct Debit</option>
                          <option value="other">Other</option>
                          <option value="salesreturn">Sales Return</option>
                      </select>
                  </div>

                  <div>
                      <label htmlFor='terms' className='form-label'>Terms</label>
                      <select id="terms" className="input" name="terms" required>
                          <option value={""}>Select Terms</option>
                          <option value="dueonreceipt">Due on Receipt</option>
                          <option value="net30">Net 15</option>
                          <option value="net60">Net 30</option>
                          <option value="net90">Net 60</option>
                      </select>
                  </div>

                  <div>
                      <label htmlFor='salesFromDeliveryOptions' className='form-label'>Sales From Delivery Options</label>
                      <select id="salesFromDeliveryOptions" className="input" name="salesFromDeliveryOptions" required>
                          <option value={""}>Select Delivery Option</option>
                          <option value="printLater">Print Later</option>
                          <option value="sendLater">Send Later</option>
                          <option value="none">None</option>
                          <option value="useCompanyDefault">Use Company Default</option>
                      </select>
                  </div>

                  <div>
                      <label htmlFor='language' className='form-label'>Language to use when you send invoices</label>
                      <select id="language" className="input" name="language" required>
                          <option value={""}>Select Language</option>
                          <option value="english">English</option>
                          <option value="spanish">Spanish</option>
                          <option value="french">French</option>
                          <option value="italian">Italian</option>
                          <option value="chinese">Chinese (taditional)</option>
                          <option value="portuguese">Portuguese (Brazil)</option>
                      </select>
                  </div>
                </div>

                <hr />

                <h3 className='text-lg font-medium text-gray-900 mb-4'>Aditional Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label htmlFor='salesTaxRegistration' className='form-label'>Sales Tax Registration</label>
                      <input
                          type="text"
                          id="salesTaxRegistration"
                          className="input"
                          name="salesTaxRegistration"
                          placeholder="Enter Sales Tax Registration"
                          required
                      />
                  </div>

                  <div>
                  
                  </div>

                  <div>
                      <label htmlFor='openingBalance' className='form-label'>Opening Balance</label>
                      <input
                          type="number"
                          id="openingBalance"
                          className="input"
                          name="openingBalance"
                          placeholder="Enter Opening Balance"
                          required
                      />
                  </div>

                  <div>
                      <label htmlFor='asOfDate' className='form-label'>As of Date</label>
                      <input
                          type="date"
                          id="asOfDate"
                          className="input"
                          name="asOfDate"
                          required
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
                  <button
                    type="submit"
                    className="btn btn-primary btn-md"
                  >
                    {editingCustomer ? 'Update' : 'Create'} Customer
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