import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { deliveryService } from './deliveryService'
import { productService } from '@/features/products/productService'
import { warehouseService } from '@/features/settings/warehouseService'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { toast } from 'react-hot-toast'
import Alert from '@/components/ui/Alert'

const DeliveryForm = ({ delivery, onCancel }) => {
  const [items, setItems] = useState(delivery?.items || [{ product_id: '', quantity: 1 }])
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

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: delivery || {
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
    mutationFn: deliveryService.createDelivery,
    onSuccess: () => {
      queryClient.invalidateQueries(['deliveries'])
      toast.success('Delivery created successfully!')
      onCancel()
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to create delivery')
      if (error.response?.data?.out_of_stock) {
        setOutOfStockItems(error.response.data.out_of_stock)
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
    const deliveryData = {
      ...data,
      products: items.map(item => ({
        product_id: item.product_id,
        quantity: parseInt(item.quantity),
      })),
    }
    createMutation.mutate(deliveryData)
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
        <Input
          label="Delivery Address"
          {...register('delivery_address', { required: 'Delivery address is required' })}
          error={errors.delivery_address?.message}
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

      <Select
        label="Operation Type"
        options={[
          { value: 'sale', label: 'Sale' },
          { value: 'return', label: 'Return' },
          { value: 'transfer', label: 'Transfer' },
        ]}
        {...register('operation_type')}
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
          {createMutation.isLoading ? 'Creating...' : 'Create Delivery'}
        </Button>
      </div>
    </form>
  )
}

export default DeliveryForm

