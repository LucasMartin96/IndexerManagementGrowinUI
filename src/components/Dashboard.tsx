import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { FiHome, FiPlay, FiSettings, FiLogOut, FiUser } from 'react-icons/fi'

const Dashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path: string) => {
    if (path === '/indexers' && location.pathname === '/indexers') return true
    if (path !== '/indexers' && location.pathname === path) return true
    if (path === '/indexers' && location.pathname.startsWith('/indexers/')) return true
    return false
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <nav className="bg-dark-surface border-b border-dark-border shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center mr-8">
                <h1 className="text-xl font-bold text-dark-text-primary">
                  Growin Indexer
                </h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-2">
                <Link
                  to="/indexers"
                  className={`${
                    isActive('/indexers')
                      ? 'bg-primary/10 text-primary border-primary'
                      : 'text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-border/50 border-transparent'
                  } inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium transition-colors`}
                >
                  <FiHome className="mr-2" />
                  Indexadores
                </Link>
                <Link
                  to="/indexers/start"
                  className={`${
                    isActive('/indexers/start')
                      ? 'bg-primary/10 text-primary border-primary'
                      : 'text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-border/50 border-transparent'
                  } inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium transition-colors`}
                >
                  <FiPlay className="mr-2" />
                  Iniciar Indexador
                </Link>
                <Link
                  to="/params"
                  className={`${
                    isActive('/params')
                      ? 'bg-primary/10 text-primary border-primary'
                      : 'text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-border/50 border-transparent'
                  } inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium transition-colors`}
                >
                  <FiSettings className="mr-2" />
                  Parámetros
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-dark-text-secondary">
                <FiUser className="h-4 w-4" />
                <span className="text-sm font-medium">{user?.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-dark-text-secondary hover:text-error transition-colors rounded-lg hover:bg-dark-border/50"
              >
                <FiLogOut className="h-4 w-4" />
                <span>Salir</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}

export default Dashboard

