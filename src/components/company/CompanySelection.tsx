import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import axios from 'axios';
import { Building2, Plus, LogOut, Users, Calendar } from 'lucide-react';

export default function CompanySelection() {
  const { user, logout } = useAuth();
  const { companies, setCompanies, setSelectedCompany } = useCompany();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await axios.get('/api/companies');
      setCompanies(response.data);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySelect = (company: any) => {
    setSelectedCompany(company);
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {user?.firstName}!
            </h1>
            <p className="text-gray-600 mt-2">
              Select a company to access your ERP dashboard
            </p>
          </div>
          <button
            onClick={logout}
            className="btn btn-secondary btn-sm flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create New Company Card */}
          <Link
            to="/create-company"
            className="card hover:shadow-lg transition-shadow duration-200 border-2 border-dashed border-gray-300 hover:border-primary-400"
          >
            <div className="card-content flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <Plus className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Create New Company
              </h3>
              <p className="text-gray-600 text-center text-sm">
                Set up a new company with all the necessary details
              </p>
            </div>
          </Link>

          {/* Existing Companies */}
          {companies.map((company) => (
            <div
              key={company.id}
              onClick={() => handleCompanySelect(company)}
              className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer hover:border-primary-300"
            >
              <div className="card-content p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    {company.logo ? (
                      <img
                        src={company.logo}
                        alt={company.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-primary-600" />
                      </div>
                    )}
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {company.name}
                      </h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {company.role}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  {company.address && (
                    <p className="truncate">{company.address}</p>
                  )}
                  {company.email && (
                    <p className="truncate">{company.email}</p>
                  )}
                  {company.phone && (
                    <p>{company.phone}</p>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      <span>Multi-user</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {companies.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No companies</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first company.
            </p>
            <div className="mt-6">
              <Link
                to="/create-company"
                className="btn btn-primary btn-md"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Company
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}