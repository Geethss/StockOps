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

  // Reset form state
  const resetForm = () => {
    setItems([{ product_id: '', quantity: 1 }])
    setOutOfStockItems([])
  }

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
    mode: 'onBlur',
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
      // Reset form state
      resetForm()
      onCancel()
    },
    onError: (error) => {
      console.error('Delivery creation error:', error)
      console.error('Error response:', error.response?.data)
      
      const detail = error.response?.data?.detail
      console.error('Error detail:', detail)
      
      if (typeof detail === 'object' && detail !== null && detail.out_of_stock) {
        const message = detail.message || 'Insufficient stock for some products'
        console.log('Out of stock items:', detail.out_of_stock)
        toast.error(message)
        setOutOfStockItems(Array.isArray(detail.out_of_stock) ? detail.out_of_stock : [])
      } else if (typeof detail === 'object' && detail !== null) {
        // Handle other structured errors
        const message = detail.message || JSON.stringify(detail)
        toast.error(message)
      } else {
        // Handle string error messages
        toast.error(typeof detail === 'string' ? detail : error.message || 'Failed to create delivery')
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

    const deliveryData = {
      ...data,
      schedule_date: scheduleDate,
      products: items
        .filter(item => item.product_id && item.product_id !== '') // Filter out empty items
        .map(item => ({
          product_id: item.product_id,
          quantity: parseFloat(item.quantity),
        })),
    }
    
    // Validate products array is not empty
    if (deliveryData.products.length === 0) {
      toast.error('Please add at least one product')
      return
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

