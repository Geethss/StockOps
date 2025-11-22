import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { receiptService } from './receiptService'
import { productService } from '@/features/products/productService'
import { warehouseService } from '@/features/settings/warehouseService'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { toast } from 'react-hot-toast'

const ReceiptForm = ({ receipt, onCancel }) => {
  const [items, setItems] = useState(receipt?.items || [{ product_id: '', quantity: 1, unit_cost: null }])
  const queryClient = useQueryClient()

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getProducts(),
  })

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehouseService.getWarehouses(),
  })

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: receipt || {
      schedule_date: new Date().toISOString().split('T')[0],
    },
  })

  const warehouseId = watch('warehouse_id')
  
  const { data: locations } = useQuery({
    queryKey: ['locations', warehouseId],
    queryFn: () => warehouseService.getLocations(warehouseId),
    enabled: !!warehouseId,
  })

  const createMutation = useMutation({
    mutationFn: receiptService.createReceipt,
    onSuccess: () => {
      queryClient.invalidateQueries(['receipts'])
      toast.success('Receipt created successfully!')
      onCancel()
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to create receipt')
    },
  })

  const addItem = () => {
    setItems([...items, { product_id: '', quantity: 1, unit_cost: null }])
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

    const receiptData = {
      ...data,
      schedule_date: scheduleDate,
      products: items
        .filter(item => item.product_id && item.product_id !== '') // Filter out empty items
        .map(item => ({
          product_id: item.product_id,
          quantity: parseFloat(item.quantity),
          unit_cost: item.unit_cost ? parseFloat(item.unit_cost) : null,
        })),
    }
    
    // Validate products array is not empty
    if (receiptData.products.length === 0) {
      toast.error('Please add at least one product')
      return
    }

    createMutation.mutate(receiptData)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Receive From"
          {...register('receive_from', { required: 'Supplier name is required' })}
          error={errors.receive_from?.message}
        />
        <Input
          label="Schedule Date"
          type="date"
          {...register('schedule_date', { required: 'Schedule date is required' })}
          error={errors.schedule_date?.message}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Warehouse"
          options={warehouses?.map(w => ({ value: w.id, label: w.name })) || []}
          {...register('warehouse_id', { required: 'Warehouse is required' })}
          error={errors.warehouse_id?.message}
        />
        <Select
          label="Location"
          options={locations?.map(l => ({ value: l.id, label: l.name })) || []}
          {...register('location_id', { required: 'Location is required' })}
          error={errors.location_id?.message}
          disabled={!warehouseId}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Products</h3>
          <Button type="button" variant="secondary" onClick={addItem}>
            Add Product
          </Button>
        </div>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-4 gap-4 items-end">
              <Select
                label="Product"
                options={products?.map(p => ({ value: p.id, label: `${p.sku} - ${p.name}` })) || []}
                value={item.product_id}
                onChange={(e) => updateItem(index, 'product_id', e.target.value)}
              />
              <Input
                label="Quantity"
                type="number"
                step="0.01"
                value={item.quantity}
                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                min="0.01"
              />
              <Input
                label="Unit Cost (optional)"
                type="number"
                step="0.01"
                value={item.unit_cost || ''}
                onChange={(e) => updateItem(index, 'unit_cost', e.target.value || null)}
                min="0"
              />
              <Button
                type="button"
                variant="danger"
                onClick={() => removeItem(index)}
                disabled={items.length === 1}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={createMutation.isLoading}>
          {createMutation.isLoading ? 'Creating...' : 'Create Receipt'}
        </Button>
      </div>
    </form>
  )
}

export default ReceiptForm

