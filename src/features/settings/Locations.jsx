import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { warehouseService } from './warehouseService'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'

const Locations = () => {
  const [showForm, setShowForm] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const queryClient = useQueryClient()

  const { data: locations, isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: warehouseService.getAllLocations,
  })

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: warehouseService.getWarehouses,
  })

  const createMutation = useMutation({
    mutationFn: warehouseService.createLocation,
    onSuccess: () => {
      queryClient.invalidateQueries(['locations'])
      toast.success('Location created successfully!')
      setShowForm(false)
      setSelectedLocation(null)
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to create location')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => warehouseService.updateLocation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['locations'])
      toast.success('Location updated successfully!')
      setShowForm(false)
      setSelectedLocation(null)
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update location')
    },
  })

  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm()

  const onSubmit = (data) => {
    if (selectedLocation) {
      updateMutation.mutate({ id: selectedLocation.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleEdit = (location) => {
    setSelectedLocation(location)
    reset(location)
    setShowForm(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Locations</h1>
          <p className="mt-2 text-gray-600">Manage warehouse locations and rooms</p>
        </div>
        <Button onClick={() => {
          setSelectedLocation(null)
          reset()
          setShowForm(true)
        }}>
          Add Location
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
                    Warehouse
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {locations?.map((location) => (
                  <tr key={location.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {location.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {location.short_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {location.warehouse_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(location)}
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
          setSelectedLocation(null)
          reset()
        }}
        title={selectedLocation ? 'Edit Location' : 'Add Location'}
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
          <Select
            label="Warehouse"
            options={warehouses?.map(w => ({ value: w.id, label: w.name })) || []}
            {...register('warehouse_id', { required: 'Warehouse is required' })}
            error={errors.warehouse_id?.message}
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => {
              setShowForm(false)
              setSelectedLocation(null)
              reset()
            }}>
              Cancel
            </Button>
            <Button type="submit">
              {selectedLocation ? 'Update' : 'Create'} Location
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Locations

