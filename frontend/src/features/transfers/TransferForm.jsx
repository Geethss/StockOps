import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { transferService } from './transferService'
import { productService } from '@/features/products/productService'
import { warehouseService } from '@/features/settings/warehouseService'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { toast } from 'react-hot-toast'

const TransferForm = ({ transfer, onCancel }) => {
  const [items, setItems] = useState(transfer?.items || [{ product_id: '', quantity: 1 }])
  const [outOfStockItems, setOutOfStockItems] = useState([])
  const queryClient = useQueryClient()

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getProducts(),
  })

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehouseService.getWarehouses(),
  })

  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm({
    defaultValues: transfer || {
      schedule_date: new Date().toISOString().split('T')[0],
    },
    mode: 'onBlur',
  })

  const fromWarehouseId = watch('from_warehouse_id')
  const toWarehouseId = watch('to_warehouse_id')
  
  const { data: fromLocations } = useQuery({
    queryKey: ['locations', fromWarehouseId],
    queryFn: () => warehouseService.getLocations(fromWarehouseId),
    enabled: !!fromWarehouseId,
  })

  const { data: toLocations } = useQuery({
    queryKey: ['locations', toWarehouseId],
    queryFn: () => warehouseService.getLocations(toWarehouseId),
    enabled: !!toWarehouseId,
  })

  const resetForm = useCallback(() => {
    reset({
      from_warehouse_id: '',
      from_location_id: '',
      to_warehouse_id: '',
      to_location_id: '',
      schedule_date: new Date().toISOString().split('T')[0],
      notes: '',
    })
    setItems([{ product_id: '', quantity: 1 }])
    setOutOfStockItems([])
  }, [reset])

  const createMutation = useMutation({
    mutationFn: transferService.createTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries(['transfers'])
      toast.success('Transfer created successfully!')
      resetForm()
      onCancel()
    },
    onError: (error) => {
      console.error('Transfer creation error:', error)
      const detail = error.response?.data?.detail
      
      if (typeof detail === 'object' && detail !== null && detail.out_of_stock) {
        const message = detail.message || 'Insufficient stock for some products'
        toast.error(message)
        setOutOfStockItems(Array.isArray(detail.out_of_stock) ? detail.out_of_stock : [])
      } else if (typeof detail === 'object' && detail !== null) {
        const message = detail.message || JSON.stringify(detail)
        toast.error(message)
      } else {
        toast.error(typeof detail === 'string' ? detail : error.message || 'Failed to create transfer')
      }
    },
  })

  const addItem = () => {
    setItems([...items, { product_id: '', quantity: 1 }])
  }

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index, field, value) => {
    const newItems = [...items]
    newItems[index][field] = value
    setItems(newItems)
  }

  const onSubmit = (data) => {
    // Validate that from and to locations are different
    if (data.from_location_id === data.to_location_id) {
      toast.error('From and to locations must be different')
      return
    }

    // Validate that all products are selected
    const invalidItems = items.filter(item => !item.product_id || item.product_id === '')
    if (invalidItems.length > 0) {
      toast.error('Please select a product for all items')
      return
    }

    // Validate that all quantities are valid
    const invalidQuantities = items.filter(item => !item.quantity || parseFloat(item.quantity) <= 0)
    if (invalidQuantities.length > 0) {
      toast.error('Please enter valid quantities (greater than 0)')
      return
    }

    // Convert date string to ISO datetime string
    const scheduleDate = data.schedule_date
      ? new Date(data.schedule_date + 'T00:00:00').toISOString()
      : new Date().toISOString()

    const transferData = {
      from_warehouse_id: data.from_warehouse_id,
      from_location_id: data.from_location_id,
      to_warehouse_id: data.to_warehouse_id,
      to_location_id: data.to_location_id,
      schedule_date: scheduleDate,
      notes: data.notes || undefined,
      products: items
        .filter(item => item.product_id && item.product_id !== '')
        .map(item => ({
          product_id: item.product_id,
          quantity: parseFloat(item.quantity),
        })),
    }
    
    if (transferData.products.length === 0) {
      toast.error('Please add at least one product')
      return
    }

    createMutation.mutate(transferData)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {outOfStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium mb-2">Out of Stock Items:</p>
          <ul className="list-disc list-inside text-red-700">
            {outOfStockItems.map((item, index) => (
              <li key={index}>{item.product_name} - Available: {item.available_quantity}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">From</h3>
          <div className="space-y-4">
            <Select
              label="Warehouse"
              options={warehouses?.map(w => ({ value: w.id, label: w.name })) || []}
              {...register('from_warehouse_id', { required: 'From warehouse is required' })}
              error={errors.from_warehouse_id?.message}
            />
            <Select
              label="Location"
              options={fromLocations?.map(l => ({ value: l.id, label: l.name })) || []}
              {...register('from_location_id', { required: 'From location is required' })}
              error={errors.from_location_id?.message}
              disabled={!fromWarehouseId}
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">To</h3>
          <div className="space-y-4">
            <Select
              label="Warehouse"
              options={warehouses?.map(w => ({ value: w.id, label: w.name })) || []}
              {...register('to_warehouse_id', { required: 'To warehouse is required' })}
              error={errors.to_warehouse_id?.message}
            />
            <Select
              label="Location"
              options={toLocations?.map(l => ({ value: l.id, label: l.name })) || []}
              {...register('to_location_id', { required: 'To location is required' })}
              error={errors.to_location_id?.message}
              disabled={!toWarehouseId}
            />
          </div>
        </div>
      </div>

      <Input
        label="Schedule Date"
        type="date"
        {...register('schedule_date', { required: 'Schedule date is required' })}
        error={errors.schedule_date?.message}
      />

      <Input
        label="Notes (Optional)"
        {...register('notes')}
        error={errors.notes?.message}
        placeholder="Additional notes about this transfer"
      />

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Products</h3>
          <Button type="button" variant="secondary" onClick={addItem}>
            Add Product
          </Button>
        </div>
        <div className="space-y-3">
          {items.map((item, index) => {
            const isOutOfStock = outOfStockItems.some(
              outItem => outItem.product_id === item.product_id
            )
            return (
              <div 
                key={index} 
                className={`grid grid-cols-3 gap-4 items-end p-3 rounded-lg ${
                  isOutOfStock ? 'bg-red-50 border border-red-200' : ''
                }`}
              >
                <Select
                  label="Product"
                  options={products?.map(p => ({ value: p.id, label: `${p.sku} - ${p.name}` })) || []}
                  value={item.product_id}
                  onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                />
                <Input
                  label="Quantity"
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                  min="1"
                  step="0.01"
                  className={isOutOfStock ? 'border-red-500' : ''}
                />
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                >
                  Remove
                </Button>
                {isOutOfStock && (
                  <p className="col-span-3 text-sm text-red-600">
                    Insufficient stock for this product
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={createMutation.isLoading}>
          {createMutation.isLoading ? 'Creating...' : 'Create Transfer'}
        </Button>
      </div>
    </form>
  )
}

export default TransferForm

