import React, { createContext, useContext, useState, useEffect } from 'react';

interface Company {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  tax_number?: string;
  logo?: string;
  currency?: string;
  role: string;
}

interface CompanyContextType {
  selectedCompany: Company | null;
  setSelectedCompany: (company: Company | null) => void;
  companies: Company[];
  setCompanies: (companies: Company[]) => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [selectedCompany, setSelectedCompanyState] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    const savedCompany = localStorage.getItem('selectedCompany');
    if (savedCompany) {
      setSelectedCompanyState(JSON.parse(savedCompany));
    }
  }, []);

  const setSelectedCompany = (company: Company | null) => {
    setSelectedCompanyState(company);
    if (company) {
      localStorage.setItem('selectedCompany', JSON.stringify(company));
    } else {
      localStorage.removeItem('selectedCompany');
    }
  };

  const value = {
    selectedCompany,
    setSelectedCompany,
    companies,
    setCompanies
  };

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}