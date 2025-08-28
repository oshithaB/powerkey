import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function CreateCheque() {
    const navigate = useNavigate()
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [cheque, setCheque] = useState(null);
    const [chequeNumber, setChequeNumber] = useState(`CHEQ-${Date.now()}`);

    useEffect(() => {
        setChequeNumber(`CHEQ-${Date.now()}`);
    }, []);

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
                        <h3 className="text-lg font-medium text-gray-900">Add New Cheque</h3>
                        <button
                            onClick={() => navigate(-1)}
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

                    <form className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cheque Number *
                                </label>
                                <input
                                    type="text"
                                    className="input w-full border rounded-md p-2"
                                    placeholder="Enter cheque number"
                                    value={chequeNumber}
                                    onChange={(e) => setChequeNumber(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Bank Name
                                </label>
                                <input
                                    type="text"
                                    className="input w-full border rounded-md p-2"
                                    placeholder="Enter bank name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Branch Name
                                </label>
                                <input
                                    type="text"
                                    className="input w-full border rounded-md p-2"
                                    placeholder="Enter branch name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cheque Date *
                                </label>
                                <input
                                    type="date"
                                    className="input w-full border rounded-md p-2"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Payee Name
                                </label>
                                <input
                                    type="text"
                                    className="input w-full border rounded-md p-2"
                                    placeholder="Enter payee name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Amount *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="input w-full border rounded-md p-2"
                                    placeholder="Enter amount"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={() => navigate("/dashboard/expenses", { state: { activeTab: 'bills' } })}
                                className="btn btn-secondary btn-md"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary btn-md"
                            >
                                {loading ? 'Saving...' : cheque ? 'Update Cheque' : 'Create Cheque'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </motion.div>
    )
}