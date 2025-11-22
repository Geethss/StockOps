import { useForm } from 'react-hook-form'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'

const ProductForm = ({ onSubmit, onCancel, initialData }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData || {},
    mode: 'onBlur', // Only validate on blur, not on change or mount
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Product Name"
        {...register('name', { required: 'Product name is required' })}
        error={errors.name?.message}
      />

      <Input
        label="SKU / Code"
        {...register('sku', { required: 'SKU is required' })}
        error={errors.sku?.message}
      />

      <Input
        label="Category"
        {...register('category_id')}
      />

      <Input
        label="Unit of Measure"
        {...register('unit_of_measure', { required: 'Unit of measure is required' })}
        error={errors.unit_of_measure?.message}
      />

      <Input
        label="Unit Cost"
        type="number"
        step="0.01"
        {...register('unit_cost', { valueAsNumber: true })}
      />

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initialData ? 'Update' : 'Create'} Product
        </Button>
      </div>
    </form>
  )
}

export default ProductForm

