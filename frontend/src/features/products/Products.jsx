import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productService } from './productService'
import ProductForm from './ProductForm'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import SearchBar from '@/components/common/SearchBar'
import { toast } from 'react-hot-toast'

const Products = () => {
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const queryClient = useQueryClient()

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', searchTerm],
    queryFn: () => productService.getProducts({ search: searchTerm }),
  })

  const createMutation = useMutation({
    mutationFn: productService.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries(['products'])
      setShowForm(false)
      toast.success('Product created successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to create product')
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="mt-2 text-gray-600">Manage product catalog</p>
        </div>
        <Button onClick={() => setShowForm(true)}>Add Product</Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-md">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search products..."
          />
        </div>
      </div>

      {/* Products list/table will go here */}
      <div className="card">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="text-gray-600">Products list coming soon...</div>
        )}
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Add New Product"
      >
        <ProductForm
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  )
}

export default Products

