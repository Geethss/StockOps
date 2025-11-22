import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const Header = () => {
  const { user, logout } = useAuth()

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-primary-600">StockMaster</h1>
        </Link>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">{user?.full_name || user?.email}</span>
          <button
            onClick={logout}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header

