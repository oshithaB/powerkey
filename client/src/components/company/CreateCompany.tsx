import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCompany } from '../../contexts/CompanyContext';
import axios from 'axios';
import { Building2, ArrowLeft, Plus, Trash2, Upload } from 'lucide-react';

interface TaxRate {
  name: string;
  rate: number;
  type: 'sales' | 'purchase' | 'both';
}

interface Employee {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  salary: number;
  hireDate: string;
}

export default function CreateCompany() {
  const navigate = useNavigate();
  const { setSelectedCompany } = useCompany();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    taxNumber: '',
    currency: 'USD',
    fiscalYearStart: new Date().getFullYear() + '-01-01'
  });
  
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  
  const [taxRates, setTaxRates] = useState<TaxRate[]>([
    { name: 'Sales Tax', rate: 8.5, type: 'sales' },
    { name: 'VAT', rate: 10, type: 'both' }
  ]);
  
  const [employees, setEmployees] = useState<Employee[]>([
    {
      employeeId: 'EMP001',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      salary: 0,
      hireDate: new Date().toISOString().split('T')[0]
    }
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addTaxRate = () => {
    setTaxRates([...taxRates, { name: '', rate: 0, type: 'both' }]);
  };

  const updateTaxRate = (index: number, field: keyof TaxRate, value: string | number) => {
    const updated = [...taxRates];
    updated[index] = { ...updated[index], [field]: value };
    setTaxRates(updated);
  };

  const removeTaxRate = (index: number) => {
    setTaxRates(taxRates.filter((_, i) => i !== index));
  };

  const addEmployee = () => {
    setEmployees([...employees, {
      employeeId: `EMP${String(employees.length + 1).padStart(3, '0')}`,
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      salary: 0,
      hireDate: new Date().toISOString().split('T')[0]
    }]);
  };

  const updateEmployee = (index: number, field: keyof Employee, value: string | number) => {
    const updated = [...employees];
    updated[index] = { ...updated[index], [field]: value };
    setEmployees(updated);
  };

  const removeEmployee = (index: number) => {
    setEmployees(employees.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitData = new FormData();
      
      // Add basic company data
      Object.entries(formData).forEach(([key, value]) => {
        submitData.append(key, value);
      });
      
      // Add logo if selected
      if (logo) {
        submitData.append('logo', logo);
      }
      
      // Add tax rates and employees as JSON
      submitData.append('taxRates', JSON.stringify(taxRates.filter(tr => tr.name && tr.rate > 0)));
      submitData.append('employees', JSON.stringify(employees.filter(emp => emp.firstName && emp.lastName)));

      const response = await axios.post('/api/companies', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Create a company object to set as selected
      const newCompany = {
        id: response.data.id,
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        tax_number: formData.taxNumber,
        logo: logoPreview,
        currency: formData.currency,
        role: 'admin'
      };

      setSelectedCompany(newCompany);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <Link
            to="/companies"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Companies
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create New Company</h1>
          <p className="text-gray-600 mt-2">
            Set up your company with all the necessary details to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Basic Company Information */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold">Basic Information</h2>
            </div>
            <div className="card-content space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="input"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter company name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax Number
                  </label>
                  <input
                    type="text"
                    name="taxNumber"
                    className="input"
                    value={formData.taxNumber}
                    onChange={handleInputChange}
                    placeholder="Enter tax identification number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  className="input"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter company address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    className="input"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="input"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter company email"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    name="currency"
                    className="input"
                    value={formData.currency}
                    onChange={handleInputChange}
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fiscal Year Start
                  </label>
                  <input
                    type="date"
                    name="fiscalYearStart"
                    className="input"
                    value={formData.fiscalYearStart}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Logo
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="btn btn-secondary btn-sm cursor-pointer"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                    </label>
                    {logoPreview && (
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="h-12 w-12 object-cover rounded-lg"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tax Rates */}
          <div className="card">
            <div className="card-header">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Tax Rates</h2>
                <button
                  type="button"
                  onClick={addTaxRate}
                  className="btn btn-secondary btn-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tax Rate
                </button>
              </div>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                {taxRates.map((taxRate, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tax Name
                      </label>
                      <input
                        type="text"
                        className="input"
                        value={taxRate.name}
                        onChange={(e) => updateTaxRate(index, 'name', e.target.value)}
                        placeholder="e.g., Sales Tax"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rate (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="input"
                        value={taxRate.rate}
                        onChange={(e) => updateTaxRate(index, 'rate', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <select
                        className="input"
                        value={taxRate.type}
                        onChange={(e) => updateTaxRate(index, 'type', e.target.value as 'sales' | 'purchase' | 'both')}
                      >
                        <option value="both">Both</option>
                        <option value="sales">Sales Only</option>
                        <option value="purchase">Purchase Only</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeTaxRate(index)}
                        className="btn btn-secondary btn-sm text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Employees */}
          <div className="card">
            <div className="card-header">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Initial Employees</h2>
                <button
                  type="button"
                  onClick={addEmployee}
                  className="btn btn-secondary btn-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Employee
                </button>
              </div>
            </div>
            <div className="card-content">
              <div className="space-y-6">
                {employees.map((employee, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium">Employee {index + 1}</h3>
                      {employees.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEmployee(index)}
                          className="btn btn-secondary btn-sm text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Employee ID
                        </label>
                        <input
                          type="text"
                          className="input"
                          value={employee.employeeId}
                          onChange={(e) => updateEmployee(index, 'employeeId', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          className="input"
                          value={employee.firstName}
                          onChange={(e) => updateEmployee(index, 'firstName', e.target.value)}
                          placeholder="First name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          className="input"
                          value={employee.lastName}
                          onChange={(e) => updateEmployee(index, 'lastName', e.target.value)}
                          placeholder="Last name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          className="input"
                          value={employee.email}
                          onChange={(e) => updateEmployee(index, 'email', e.target.value)}
                          placeholder="Email address"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          className="input"
                          value={employee.phone}
                          onChange={(e) => updateEmployee(index, 'phone', e.target.value)}
                          placeholder="Phone number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Position
                        </label>
                        <input
                          type="text"
                          className="input"
                          value={employee.position}
                          onChange={(e) => updateEmployee(index, 'position', e.target.value)}
                          placeholder="Job position"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Department
                        </label>
                        <input
                          type="text"
                          className="input"
                          value={employee.department}
                          onChange={(e) => updateEmployee(index, 'department', e.target.value)}
                          placeholder="Department"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Salary
                        </label>
                        <input
                          type="number"
                          className="input"
                          value={employee.salary}
                          onChange={(e) => updateEmployee(index, 'salary', parseFloat(e.target.value) || 0)}
                          placeholder="Annual salary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Hire Date
                        </label>
                        <input
                          type="date"
                          className="input"
                          value={employee.hireDate}
                          onChange={(e) => updateEmployee(index, 'hireDate', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link
              to="/companies"
              className="btn btn-secondary btn-lg"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Company...
                </div>
              ) : (
                <>
                  <Building2 className="h-4 w-4 mr-2" />
                  Create Company
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}