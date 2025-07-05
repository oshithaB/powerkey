import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCompany } from '../../contexts/CompanyContext';
import axios from 'axios';
import { Building2, ArrowLeft, Upload } from 'lucide-react';

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
    isTaxable: 'Taxable' // Must match backend expectation
  });

  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

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
                    Company Name *
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
                    Register Number *
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
                    <option value="Taxable">Yes</option>
                    <option value="Non-Taxable">No</option>
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
            </div>
          </div>

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