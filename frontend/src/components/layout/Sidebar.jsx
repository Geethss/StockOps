import { Link, useLocation } from 'react-router-dom'

const Sidebar = () => {
  const location = useLocation()

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/products', label: 'Products', icon: '📦' },
    { path: '/stock', label: 'Stock', icon: '📋' },
    { 
      label: 'Operations',
      icon: '⚙️',
      children: [
        { path: '/receipts', label: 'Receipts' },
        { path: '/deliveries', label: 'Deliveries' },
        { path: '/transfers', label: 'Transfers' },
        { path: '/movements', label: 'Move History' },
      ]
    },
    {
      label: 'Settings',
      icon: '⚙️',
      children: [
        { path: '/warehouses', label: 'Warehouses' },
        { path: '/locations', label: 'Locations' },
      ]
    },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <nav className="p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.label}>
              {item.children ? (
                <div>
                  <div className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700">
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  <ul className="ml-6 space-y-1">
                    {item.children.map((child) => (
                      <li key={child.path}>
                        <Link
                          to={child.path}
                          className={`block px-4 py-2 text-sm rounded-lg transition-colors ${
                            isActive(child.path)
                              ? 'bg-primary-100 text-primary-700'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <Link
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 text-sm rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar

