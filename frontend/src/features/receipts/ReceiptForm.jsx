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
  const [items, setItems] = useState(receipt?.items || [{ product_id: '', quantity: 1 }])
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
    const receiptData = {
      ...data,
      products: items.map(item => ({
        product_id: item.product_id,
        quantity: parseInt(item.quantity),
      })),
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
            <div key={index} className="grid grid-cols-3 gap-4 items-end">
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

