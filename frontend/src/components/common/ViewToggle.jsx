const ViewToggle = ({ view, onViewChange }) => {
  return (
    <div className="flex items-center space-x-2 border border-gray-300 rounded-lg p-1">
      <button
        onClick={() => onViewChange('list')}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          view === 'list'
            ? 'bg-primary-600 text-white'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        List
      </button>
      <button
        onClick={() => onViewChange('kanban')}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          view === 'kanban'
            ? 'bg-primary-600 text-white'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        Kanban
      </button>
    </div>
  )
}

export default ViewToggle

