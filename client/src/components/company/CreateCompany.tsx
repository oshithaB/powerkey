import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCompany } from '../../contexts/CompanyContext';
import axios from 'axios';
import { Building2, ArrowLeft, Upload, Plus, Trash2 } from 'lucide-react';

interface TaxRate {
  name: string;
  rate: number;
}

export default function CreateCompany() {
  const navigate = useNavigate();
  const { setSelectedCompany } = useCompany();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companyRegistrationNumber: '',
    isTaxable: 'Not Taxable',
    taxType: '',
  });

  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  const [taxRates, setTaxRates] = useState<TaxRate[]>([
    { name: 'VAT', rate: 10 },
    { name: 'Sales Tax', rate: 8.5}
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
    setTaxRates([...taxRates, { name: '', rate: 0 }]);
  };

  const updateTaxRate = (index: number, field: keyof TaxRate, value: string | number) => {
    const updated = [...taxRates];
    updated[index] = { ...updated[index], [field]: value };
    setTaxRates(updated);
  };

  const removeTaxRate = (index: number) => {
    setTaxRates(taxRates.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitData = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        submitData.append(key, value);
      });

      if (logo) {
        submitData.append('logo', logo);
      }

      const response = await axios.post('/api/createCompany', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Update token and set selected company
      const { token, company } = response.data;
      localStorage.setItem('authToken', token);
      
      if (company) {
        setSelectedCompany(company);
      }

      navigate('/dashboard');
    } catch (err: any) {
      console.error('Error creating company:', err);
      setError(err.response?.data?.message || 'Failed to create company');
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

          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold">Basic Information</h2>
            </div>
            <div className="card-content space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    required
                    className="input"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder="Enter company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Register Number
                  </label>
                  <input
                    type="text"
                    name="companyRegistrationNumber"
                    required
                    className="input"
                    value={formData.companyRegistrationNumber}
                    onChange={handleInputChange}
                    placeholder="Enter registration number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  name="companyAddress"
                  className="input"
                  value={formData.companyAddress}
                  onChange={handleInputChange}
                  placeholder="Enter address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="companyPhone"
                    className="input"
                    value={formData.companyPhone}
                    onChange={handleInputChange}
                    placeholder="Enter phone"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Is Taxable?
                  </label>
                  <select
                    name="isTaxable"
                    className="input"
                    value={formData.isTaxable}
                    onChange={handleInputChange}
                  >
                    <option value="Not Taxable">Not Taxable</option>
                    <option value="Taxable">Taxable</option>
                  </select>
                </div>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    className="input"
                    // value={formData.notes || ''}
                    // onChange={handleInputChange}
                    placeholder="Enter any additional notes"
                    style={{ height: '100px' }}
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Terms & Conditions
                  </label>
                  <textarea
                    name="terms"
                    className="input"
                    // value={formData.terms || ''}
                    // onChange={handleInputChange}
                    placeholder="Enter terms and conditions"
                    style={{ height: '100px' }}
                  ></textarea>
                </div>
              </div>
            </div>
          </div>

          {/* Tax adding section  */}
          {formData.isTaxable === 'Taxable' && (
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

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Tax Number
                  </label>
                  <input
                    type="text"
                    name="taxNumber"
                    className="input"
                    placeholder="Enter tax number"
                    required
                  />
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
                          onChange={(e) =>
                            updateTaxRate(index, 'rate', parseFloat(e.target.value) || 0)
                          }
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Is default?
                        </label>
                        <input 
                          type="checkbox"
                          className="checkbox"
                          
                        />
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
          )}


          <div className="flex justify-end space-x-4">
            <Link to="/companies" className="btn btn-secondary btn-lg">
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