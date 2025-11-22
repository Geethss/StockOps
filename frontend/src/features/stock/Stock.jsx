import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { stockService } from './stockService'
import { warehouseService } from '@/features/settings/warehouseService'
import SearchBar from '@/components/common/SearchBar'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'

const Stock = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedWarehouse, setSelectedWarehouse] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [selectedStock, setSelectedStock] = useState(null)
  const queryClient = useQueryClient()

  // Fetch warehouses and locations
  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: warehouseService.getWarehouses,
  })

  const { data: locations } = useQuery({
    queryKey: ['locations', selectedWarehouse],
    queryFn: () => warehouseService.getLocations(selectedWarehouse),
    enabled: !!selectedWarehouse,
  })

  // Fetch stock data with filters
  const { data: stockData, isLoading } = useQuery({
    queryKey: ['stock', searchTerm, selectedWarehouse, selectedLocation],
    queryFn: () => stockService.getStock({
      search: searchTerm || undefined,
      warehouse_id: selectedWarehouse || undefined,
      location_id: selectedLocation || undefined,
    }),
  })

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    mode: 'onBlur',
    defaultValues: {
      quantity: 0,
      reason: '',
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ productId, locationId, data }) => stockService.updateStock(productId, locationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['stock'])
      toast.success('Stock updated successfully!')
      setShowAdjustModal(false)
      setSelectedStock(null)
      reset()
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update stock')
    },
  })

  const handleAdjustStock = (stock) => {
    setSelectedStock(stock)
    reset({
      quantity: stock.onHand || 0,
      reason: '',
    })
    setShowAdjustModal(true)
  }

  const onSubmitAdjustment = (data) => {
    if (!selectedStock) return
    
    if (!selectedStock.location_id) {
      toast.error('Cannot adjust stock: Product has no location')
      return
    }

    updateMutation.mutate({
      productId: selectedStock.product_id,
      locationId: selectedStock.location_id,
      data: {
        quantity: parseFloat(data.quantity),
        reason: data.reason || undefined,
      },
    })
  }

  const columnDefs = [
    { field: 'product', headerName: 'Product', flex: 1 },
    { field: 'sku', headerName: 'SKU', width: 150 },
    { 
      field: 'warehouse', 
      headerName: 'Warehouse', 
      width: 150,
      valueGetter: (params) => params.data?.warehouse || '-',
    },
    { 
      field: 'location', 
      headerName: 'Location', 
      width: 150,
      valueGetter: (params) => params.data?.location || '-',
    },
    { 
      field: 'perUnitCost', 
      headerName: 'Unit Cost', 
      width: 120,
      valueFormatter: (params) => params.value ? `$${params.value.toFixed(2)}` : '-',
    },
    { 
      field: 'onHand', 
      headerName: 'On Hand', 
      width: 120,
      cellStyle: (params) => {
        if (params.value === 0) return { color: '#ef4444', fontWeight: 'bold' }
        if (params.value < 10) return { color: '#f59e0b', fontWeight: 'bold' }
        return null
      },
    },
    { 
      field: 'freeToUse', 
      headerName: 'Free to Use', 
      width: 120,
      valueGetter: (params) => params.data?.freeToUse || params.data?.onHand || 0,
    },
    {
      headerName: 'Actions',
      width: 120,
      cellRenderer: (params) => {
        if (!params.data?.location_id) return null
        return (
          <button
            onClick={() => handleAdjustStock(params.data)}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            Adjust
          </button>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stock Management</h1>
          <p className="mt-2 text-gray-600">View and manage inventory stock across locations</p>
        </div>
      </div>

      <div className="flex items-center space-x-4 flex-wrap gap-4">
        <div className="flex-1 max-w-md">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search products..."
          />
        </div>
        <div className="w-48">
          <Select
            label=""
            placeholder="All Warehouses"
            options={warehouses?.map(w => ({ value: w.id, label: w.name })) || []}
            value={selectedWarehouse}
            onChange={(e) => {
              setSelectedWarehouse(e.target.value)
              setSelectedLocation('') // Reset location when warehouse changes
            }}
          />
        </div>
        <div className="w-48">
          <Select
            label=""
            placeholder="All Locations"
            options={locations?.map(l => ({ value: l.id, label: l.name })) || []}
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            disabled={!selectedWarehouse}
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

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={showAdjustModal}
        onClose={() => {
          setShowAdjustModal(false)
          setSelectedStock(null)
          reset()
        }}
        title={selectedStock ? `Adjust Stock - ${selectedStock.product}` : 'Adjust Stock'}
      >
        {selectedStock && (
          <form onSubmit={handleSubmit(onSubmitAdjustment)} className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Product:</span>
                <span className="font-medium">{selectedStock.product}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">SKU:</span>
                <span className="font-medium">{selectedStock.sku}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span className="font-medium">{selectedStock.location || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Current Stock:</span>
                <span className="font-bold text-lg">{selectedStock.onHand || 0}</span>
              </div>
            </div>

            <Input
              label="New Quantity"
              type="number"
              step="0.01"
              {...register('quantity', { 
                required: 'Quantity is required',
                min: { value: 0, message: 'Quantity must be 0 or greater' },
                valueAsNumber: true,
              })}
              error={errors.quantity?.message}
            />

            <Input
              label="Reason (Optional)"
              {...register('reason')}
              error={errors.reason?.message}
              placeholder="e.g., Physical count adjustment"
            />

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => {
                  setShowAdjustModal(false)
                  setSelectedStock(null)
                  reset()
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Updating...' : 'Update Stock'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

export default Stock

