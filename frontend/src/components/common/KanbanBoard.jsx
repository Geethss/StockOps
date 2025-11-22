import { useState } from 'react'
import { formatDate } from '@/lib/utils/formatUtils'
import StatusBadge from './StatusBadge'

const KanbanBoard = ({ 
  items = [], 
  columns = [], 
  onItemClick,
  onStatusChange,
  getStatusValue = (item) => item.status,
  renderItem,
  isLoading = false 
}) => {
  const [draggedItem, setDraggedItem] = useState(null)

  const handleDragStart = (e, item) => {
    setDraggedItem(item)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e, targetStatus) => {
    e.preventDefault()
    if (draggedItem && onStatusChange) {
      const currentStatus = getStatusValue(draggedItem)
      if (currentStatus !== targetStatus) {
        onStatusChange(draggedItem, targetStatus)
      }
    }
    setDraggedItem(null)
  }

  const itemsByStatus = columns.reduce((acc, col) => {
    acc[col.value] = items.filter(item => getStatusValue(item) === col.value)
    return acc
  }, {})

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '600px' }}>
      {columns.map((column) => {
        const columnItems = itemsByStatus[column.value] || []
        const columnCount = columnItems.length
        
        return (
          <div
            key={column.value}
            className="flex-shrink-0 w-80"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.value)}
          >
            <div className="bg-gray-50 rounded-lg p-4 h-full">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{column.label}</h3>
                  <span className="bg-gray-200 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
                    {columnCount}
                  </span>
                </div>
                {column.icon && (
                  <span className="text-gray-400">{column.icon}</span>
                )}
              </div>

              {/* Column Items */}
              <div className="space-y-3 min-h-[500px]">
                {columnItems.length === 0 ? (
                  <div className="text-center text-gray-400 py-8 text-sm">
                    No items
                  </div>
                ) : (
                  columnItems.map((item) => (
                    <div
                      key={item.id}
                      draggable={!!onStatusChange}
                      onDragStart={(e) => handleDragStart(e, item)}
                      onClick={() => onItemClick && onItemClick(item)}
                      className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow ${
                        draggedItem?.id === item.id ? 'opacity-50' : ''
                      }`}
                    >
                      {/* Item Content - to be customized by parent */}
                      {renderItem ? renderItem(item) : (
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium text-gray-900 text-sm">{item.reference || item.id}</h4>
                            <StatusBadge status={getStatusValue(item)} />
                          </div>
                          {item.schedule_date && (
                            <p className="text-xs text-gray-500">
                              {formatDate(item.schedule_date)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default KanbanBoard

