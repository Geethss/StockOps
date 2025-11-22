import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { movementService } from './movementService'
import { warehouseService } from '@/features/settings/warehouseService'
import { productService } from '@/features/products/productService'
import SearchBar from '@/components/common/SearchBar'
import ViewToggle from '@/components/common/ViewToggle'
import StatusBadge from '@/components/common/StatusBadge'
import KanbanBoard from '@/components/common/KanbanBoard'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import { formatDate } from '@/lib/utils/formatUtils'

const Movements = () => {
  const [view, setView] = useState('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTransactionType, setSelectedTransactionType] = useState('')
  const [selectedWarehouse, setSelectedWarehouse] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Fetch transaction types, warehouses, and products for filters
  const { data: transactionTypes } = useQuery({
    queryKey: ['movements', 'transaction-types'],
    queryFn: () => movementService.getTransactionTypes(),
    initialData: [],
  })

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: warehouseService.getWarehouses,
  })

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: productService.getProducts,
  })

  const { data: movements, isLoading } = useQuery({
    queryKey: ['movements', searchTerm, selectedTransactionType, selectedWarehouse, selectedProduct, dateFrom, dateTo],
    queryFn: () => movementService.getMovements({
      search: searchTerm || undefined,
      transaction_type: selectedTransactionType || undefined,
      warehouse_id: selectedWarehouse || undefined,
      product_id: selectedProduct || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }),
  })

  const columnDefs = [
    { field: 'reference', headerName: 'Reference', width: 150 },
    { field: 'date', headerName: 'Date', width: 150, valueFormatter: (params) => formatDate(params.value) },
    { 
      field: 'transaction_type', 
      headerName: 'Type', 
      width: 120,
      cellRenderer: (params) => {
        const type = params.value
        const isIn = type === 'Receipt'
        const isAdjustment = type === 'Adjustment'
        const colorClass = isIn 
          ? 'bg-green-100 text-green-800' 
          : isAdjustment 
          ? 'bg-blue-100 text-blue-800'
          : 'bg-red-100 text-red-800'
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
            {type}
          </span>
        )
      }
    },
    { field: 'product_name', headerName: 'Product', flex: 1 },
    { field: 'product_sku', headerName: 'SKU', width: 120 },
    { field: 'warehouse', headerName: 'Warehouse', width: 150 },
    { field: 'from_location', headerName: 'From', width: 120 },
    { field: 'to_location', headerName: 'To', width: 120 },
    { field: 'contact', headerName: 'Contact/Address', flex: 1 },
    { 
      field: 'quantity_abs', 
      headerName: 'Quantity', 
      width: 120,
      cellRenderer: (params) => {
        const quantity = params.data?.quantity || 0
        const isPositive = quantity >= 0
        return (
          <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
            {isPositive ? '+' : ''}{params.value || 0}
          </span>
        )
      }
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 100,
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

      <div className="space-y-4">
        <div className="flex items-center space-x-4 flex-wrap gap-4">
          <div className="flex-1 max-w-md">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by reference or product..."
            />
          </div>
          <ViewToggle view={view} onViewChange={setView} />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 p-4 bg-gray-50 rounded-lg">
          <Select
            label="Transaction Type"
            placeholder="All Types"
            options={transactionTypes?.map(t => ({ value: t.value, label: t.label })) || []}
            value={selectedTransactionType}
            onChange={(e) => setSelectedTransactionType(e.target.value)}
          />
          <Select
            label="Warehouse"
            placeholder="All Warehouses"
            options={warehouses?.map(w => ({ value: w.id, label: w.name })) || []}
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
          />
          <Select
            label="Product"
            placeholder="All Products"
            options={products?.map(p => ({ value: p.id, label: `${p.sku} - ${p.name}` })) || []}
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
          />
          <Input
            label="Date From"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <Input
            label="Date To"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
          {(selectedTransactionType || selectedWarehouse || selectedProduct || dateFrom || dateTo) && (
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedTransactionType('')
                  setSelectedWarehouse('')
                  setSelectedProduct('')
                  setDateFrom('')
                  setDateTo('')
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
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
        <KanbanBoard
          items={movements || []}
          columns={[
            { value: 'Receipt', label: 'Receipts', icon: '📥' },
            { value: 'Delivery', label: 'Deliveries', icon: '📤' },
            { value: 'Transfer', label: 'Transfers', icon: '🔄' },
            { value: 'Adjustment', label: 'Adjustments', icon: '⚙️' },
          ]}
          getStatusValue={(item) => item.transaction_type}
          onItemClick={(item) => {
            // Could open a detail modal here
            console.log('Movement clicked:', item)
          }}
          isLoading={isLoading}
          renderItem={(item) => (
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm">{item.reference}</h4>
                  <p className="text-xs text-gray-600 mt-1">{item.product_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">SKU: {item.product_sku}</p>
                </div>
              </div>
              <div className="space-y-1 text-xs text-gray-500">
                <div className="flex items-center justify-between">
                  <span>Quantity:</span>
                  <span className={`font-medium ${item.quantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.quantity >= 0 ? '+' : ''}{item.quantity_abs}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Warehouse:</span>
                  <span>{item.warehouse || '-'}</span>
                </div>
                {item.contact && item.contact !== '-' && (
                  <div className="text-xs text-gray-400 truncate" title={item.contact}>
                    {item.contact}
                  </div>
                )}
              </div>
              {item.date && (
                <div className="text-xs text-gray-400 border-t pt-2">
                  {formatDate(item.date)}
                </div>
              )}
            </div>
          )}
        />
      )}
    </div>
  )
}

export default Movements

