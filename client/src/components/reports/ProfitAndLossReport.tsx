import React, { useState, useEffect } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { useNavigate } from 'react-router-dom';
import { X, Printer } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

function ProfitAndLossReport() {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState<{
    categorizedData: Record<string, { account_name: string; balance: number }[]>;
    totals: Record<string, number>;
  } | null>(null);
  const { selectedCompany } = useCompany();
  const [accountTypes, setAccountTypes] = useState<string[]>([]);
  const token = localStorage.getItem('token'); // Adjust based on your auth setup

  useEffect(() => {
    if (!selectedCompany) return;

    // Set up axios with base URL and authentication
    const api = axios.create({
      baseURL: '/api',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });

    // Fetch all accounts
    api.get(`/accounts/${selectedCompany.id}`)
      .then(response => {
        const data = response.data;
        console.log('Raw data:', data); // Debug: Inspect the data
        if (!Array.isArray(data)) {
          throw new Error('Invalid account data format');
        }

        // Dynamically determine account types from the data
        const uniqueAccountTypes = [...new Set(data.map(account => account.account_type))];
        setAccountTypes(uniqueAccountTypes);

        const categorizedData = {};
        uniqueAccountTypes.forEach(type => {
          categorizedData[type] = data.filter(account => account.account_type === type);
        });

        const totals = {};
        uniqueAccountTypes.forEach(type => {
          totals[type] = categorizedData[type].reduce((sum, account) => sum + Number(account.balance) || 0, 0);
        });

        const grossProfit = (totals['Income'] || 0) - (totals['Cost of Sales'] || 0);
        const netEarnings = grossProfit - (totals['Expenses'] || 0);

        setReportData({
          categorizedData,
          totals: { ...totals, grossProfit, netEarnings }
        });
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        setReportData(null); // Reset on error
      });
  }, [selectedCompany, token]);

  if (!reportData) return <div>Loading...</div>;

  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ duration: 0.5 }}
    >
      <div>
        <div className="container mx-auto px-4 py-8">
          <div className="relative top-4 mx-auto p-5 border w-full max-w-7xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Profit and Loss
              </h3>
              <div className="flex space-x-2">
                <button onClick={handlePrint} className="text-gray-400 hover:text-gray-600">
                  <Printer className="h-6 w-6" />
                </button>
                <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">{selectedCompany?.name || 'Company Name Unavailable'}</p>
              <p className="text-sm text-gray-600">January 1 - July 2, 2025</p>
            </div>
            <table className="w-full mt-4">
              <tbody>
                <tr>
                  <td className="py-2">Account</td>
                  <td className="py-2 text-right">Total</td>
                </tr>
                {accountTypes.map((type, typeIndex) => (
                  <React.Fragment key={typeIndex}>
                    {typeIndex > 0 && <tr><td colSpan={2}><hr className="border-gray-300 my-2" /></td></tr>}
                    <tr>
                      <td className="py-2">{type}</td>
                      <td></td>
                    </tr>
                    {reportData.categorizedData[type].map((account, index) => (
                      <tr key={index}>
                        <td className="py-2 pl-4">{account.account_name}</td>
                        <td className="py-2 text-right">{(Number(account.balance) || 0).toLocaleString('en-US', { style: 'currency', currency: 'LKR', maximumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                    <tr>
                      <td className="py-2 font-bold">Total {type}</td>
                      <td className="py-2 text-right">{(reportData.totals[type] || 0).toLocaleString('en-US', { style: 'currency', currency: 'LKR', maximumFractionDigits: 2 })}</td>
                    </tr>
                  </React.Fragment>
                ))}
                <tr><td colSpan={2}><hr className="border-gray-300 my-2" /></td></tr>
                <tr>
                  <td className="py-2 font-bold">Gross Profit</td>
                  <td className="py-2 text-right">{reportData.totals.grossProfit.toLocaleString('en-US', { style: 'currency', currency: 'LKR', maximumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td className="py-2 font-bold">Net Earnings</td>
                  <td className="py-2 text-right">{reportData.totals.netEarnings.toLocaleString('en-US', { style: 'currency', currency: 'LKR', maximumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default ProfitAndLossReport;