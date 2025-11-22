import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { warehouseService } from './warehouseService'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'

const Warehouses = () => {
  const [showForm, setShowForm] = useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = useState(null)
  const queryClient = useQueryClient()

  const { data: warehouses, isLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: warehouseService.getWarehouses,
  })

  const createMutation = useMutation({
    mutationFn: warehouseService.createWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries(['warehouses'])
      toast.success('Warehouse created successfully!')
      setShowForm(false)
      setSelectedWarehouse(null)
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to create warehouse')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => warehouseService.updateWarehouse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['warehouses'])
      toast.success('Warehouse updated successfully!')
      setShowForm(false)
      setSelectedWarehouse(null)
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update warehouse')
    },
  })

  const { register, handleSubmit, formState: { errors }, reset } = useForm()

  const onSubmit = (data) => {
    if (selectedWarehouse) {
      updateMutation.mutate({ id: selectedWarehouse.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleEdit = (warehouse) => {
    setSelectedWarehouse(warehouse)
    reset(warehouse)
    setShowForm(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Warehouses</h1>
          <p className="mt-2 text-gray-600">Manage warehouse details and locations</p>
        </div>
        <Button onClick={() => {
          setSelectedWarehouse(null)
          reset()
          setShowForm(true)
        }}>
          Add Warehouse
        </Button>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Short Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {warehouses?.map((warehouse) => (
                  <tr key={warehouse.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {warehouse.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {warehouse.short_code}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {warehouse.address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(warehouse)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false)
          setSelectedWarehouse(null)
          reset()
        }}
        title={selectedWarehouse ? 'Edit Warehouse' : 'Add Warehouse'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Name"
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
          />
          <Input
            label="Short Code"
            {...register('short_code', { required: 'Short code is required' })}
            error={errors.short_code?.message}
          />
          <Input
            label="Address"
            {...register('address', { required: 'Address is required' })}
            error={errors.address?.message}
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => {
              setShowForm(false)
              setSelectedWarehouse(null)
              reset()
            }}>
              Cancel
            </Button>
            <Button type="submit">
              {selectedWarehouse ? 'Update' : 'Create'} Warehouse
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Warehouses

