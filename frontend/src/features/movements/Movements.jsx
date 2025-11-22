import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { movementService } from './movementService'
import SearchBar from '@/components/common/SearchBar'
import ViewToggle from '@/components/common/ViewToggle'
import StatusBadge from '@/components/common/StatusBadge'
import { formatDate } from '@/lib/utils/formatUtils'

const Movements = () => {
  const [view, setView] = useState('list')
  const [searchTerm, setSearchTerm] = useState('')

  const { data: movements, isLoading } = useQuery({
    queryKey: ['movements', searchTerm],
    queryFn: () => movementService.getMovements({ search: searchTerm }),
  })

  const columnDefs = [
    { field: 'reference', headerName: 'Reference', width: 150 },
    { field: 'date', headerName: 'Date', width: 150, valueFormatter: (params) => formatDate(params.value) },
    { field: 'contact', headerName: 'Contact', width: 200 },
    { field: 'from_location', headerName: 'From', flex: 1 },
    { field: 'to_location', headerName: 'To', flex: 1 },
    { field: 'quantity', headerName: 'Quantity', width: 120 },
    { 
      field: 'transaction_type', 
      headerName: 'Type', 
      width: 120,
      cellRenderer: (params) => {
        const type = params.value
        const isIn = type === 'Receipt' || type === 'In'
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            isIn ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {type}
          </span>
        )
      }
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 120,
      cellRenderer: (params) => <StatusBadge status={params.value} />
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Move History</h1>
          <p className="mt-2 text-gray-600">Track all stock movements</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-md">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by reference or content..."
          />
        </div>
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      {view === 'list' ? (
        <div className="ag-theme-alpine" style={{ height: 600, width: '100%' }}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <AgGridReact
              rowData={movements || []}
              columnDefs={columnDefs}
              pagination={true}
              paginationPageSize={20}
              defaultColDef={{
                sortable: true,
                filter: true,
                resizable: true,
              }}
            />
          )}
        </div>
      ) : (
        <div className="card">
          <p className="text-gray-600">Kanban view coming soon...</p>
        </div>
      )}
    </div>
  )
}

export default Movements

