import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { stockService } from './stockService'
import SearchBar from '@/components/common/SearchBar'
import Button from '@/components/ui/Button'

const Stock = () => {
  const [searchTerm, setSearchTerm] = useState('')

  const { data: stockData, isLoading } = useQuery({
    queryKey: ['stock', searchTerm],
    queryFn: () => stockService.getStock({ search: searchTerm }),
  })

  const columnDefs = [
    { field: 'product', headerName: 'Product', flex: 1 },
    { field: 'sku', headerName: 'SKU', width: 150 },
    { field: 'perUnitCost', headerName: 'Per Unit Cost', width: 150, valueFormatter: (params) => `$${params.value?.toFixed(2) || 0}` },
    { field: 'onHand', headerName: 'On Hand', width: 120 },
    { field: 'freeToUse', headerName: 'Free to Use', width: 120 },
    { field: 'location', headerName: 'Location', width: 150 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stock Management</h1>
          <p className="mt-2 text-gray-600">View and manage inventory stock</p>
        </div>
        <Button onClick={() => {/* Open update modal */}}>Update Stock</Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-md">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search products..."
          />
        </div>
      </div>

      <div className="ag-theme-alpine" style={{ height: 600, width: '100%' }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <AgGridReact
            rowData={stockData || []}
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
    </div>
  )
}

export default Stock

