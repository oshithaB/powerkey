import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'

export default function ChequesPage() {
    const navigate = useNavigate()
  return (
    <div className='space-y-6'>
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Cheques</h1>
            <button
                onClick={() => { navigate('/cheque/create')}}
                className="btn btn-primary btn-md"
            >
                <Plus className="h-4 w-4 mr-2" />
                Create Cheque
            </button>
        </div>
    </div>
  )
}