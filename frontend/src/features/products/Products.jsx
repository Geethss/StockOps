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
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const queryClient = useQueryClient()

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products', searchTerm],
    queryFn: () => productService.getProducts({ search: searchTerm }),
  })

  // Debug: Check what we're receiving
  console.log('Products data:', products)
  console.log('Is loading:', isLoading)
  console.log('Error:', error)

  const createMutation = useMutation({
    mutationFn: productService.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries(['products'])
      setShowForm(false)
      setEditingProduct(null)
      toast.success('Product created successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to create product')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => productService.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['products'])
      setShowForm(false)
      setEditingProduct(null)
      toast.success('Product updated successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update product')
    },
  })

  const handleEdit = (product) => {
    setEditingProduct(product)
    setShowForm(true)
  }

  const handleFormSubmit = (data) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingProduct(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="mt-2 text-gray-600">Manage product catalog</p>
        </div>
        <Button onClick={() => {
          setEditingProduct(null)
          setShowForm(true)
        }}>Add Product</Button>
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

      {/* Products list/table */}
      <div className="card">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">Error loading products: {error.message}</p>
            <p className="text-sm text-gray-500 mt-2">Please check your backend connection.</p>
          </div>
        ) : products && Array.isArray(products) && products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit of Measure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.sku}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{product.category_id || '—'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.unit_of_measure}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">${product.unit_cost?.toFixed(2) || '0.00'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {product.created_at ? new Date(product.created_at).toLocaleDateString() : '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-primary-600 hover:text-primary-900"
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending ? 'Updating...' : 'Edit'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">No products found.</p>
            <p className="text-sm text-gray-500 mt-2">Click "Add Product" to create your first product.</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={showForm}
        onClose={handleCloseForm}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
      >
        <ProductForm
          onSubmit={handleFormSubmit}
          onCancel={handleCloseForm}
          initialData={editingProduct}
        />
      </Modal>
    </div>
  )
}

export default Products

