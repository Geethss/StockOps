import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { receiptService } from './receiptService'
import ReceiptForm from './ReceiptForm'
import SearchBar from '@/components/common/SearchBar'
import ViewToggle from '@/components/common/ViewToggle'
import StatusBadge from '@/components/common/StatusBadge'
import KanbanBoard from '@/components/common/KanbanBoard'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { toast } from 'react-hot-toast'
import { formatDate } from '@/lib/utils/formatUtils'

const Receipts = () => {
  const [showForm, setShowForm] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState(null)
  const [view, setView] = useState('list')
  const [searchTerm, setSearchTerm] = useState('')
  const queryClient = useQueryClient()

  const { data: receipts, isLoading } = useQuery({
    queryKey: ['receipts', searchTerm],
    queryFn: () => receiptService.getReceipts({ search: searchTerm }),
  })

  const validateMutation = useMutation({
    mutationFn: (id) => receiptService.validateReceipt(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['receipts'])
      toast.success('Receipt validated successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to validate receipt')
    },
  })

  const columnDefs = [
    { field: 'reference', headerName: 'Reference', width: 150 },
    { field: 'receive_from', headerName: 'From', flex: 1 },
    { field: 'warehouse_name', headerName: 'To', width: 150 },
    { field: 'schedule_date', headerName: 'Schedule Date', width: 150, valueFormatter: (params) => formatDate(params.value) },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 120,
      cellRenderer: (params) => <StatusBadge status={params.value} />
    },
    {
      headerName: 'Actions',
      width: 120,
      cellRenderer: (params) => (
        <div className="flex space-x-2">
          {params.data.status === 'Ready' && (
            <button
              onClick={() => validateMutation.mutate(params.data.id)}
              className="text-primary-600 hover:text-primary-700 text-sm"
            >
              Validate
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Receipts</h1>
          <p className="mt-2 text-gray-600">Manage incoming stock receipts</p>
        </div>
        <Button onClick={() => setShowForm(true)}>NEW</Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-md">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search receipts..."
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
              rowData={receipts || []}
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
          items={receipts || []}
          columns={[
            { value: 'Draft', label: 'Draft', icon: '📝' },
            { value: 'Ready', label: 'Ready', icon: '✅' },
            { value: 'Done', label: 'Done', icon: '✔️' },
          ]}
          getStatusValue={(item) => item.status}
          onItemClick={(item) => {
            setSelectedReceipt(item)
            setShowForm(true)
          }}
          isLoading={isLoading}
          renderItem={(item) => (
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm">{item.reference}</h4>
                  <p className="text-xs text-gray-600 mt-1">{item.receive_from}</p>
                </div>
                <StatusBadge status={item.status} />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{item.warehouse_name || '-'}</span>
                {item.schedule_date && (
                  <span>{formatDate(item.schedule_date)}</span>
                )}
              </div>
              {item.status === 'Ready' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    validateMutation.mutate(item.id)
                  }}
                  className="w-full mt-2 px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded hover:bg-primary-700 disabled:opacity-50"
                  disabled={validateMutation.isPending}
                >
                  {validateMutation.isPending ? 'Validating...' : 'Validate'}
                </button>
              )}
            </div>
          )}
        />
      )}

      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false)
          setSelectedReceipt(null)
        }}
        title={selectedReceipt ? 'Edit Receipt' : 'New Receipt'}
        size="lg"
      >
        <ReceiptForm
          receipt={selectedReceipt}
          onCancel={() => {
            setShowForm(false)
            setSelectedReceipt(null)
          }}
        />
      </Modal>
    </div>
  )
}

export default Receipts

