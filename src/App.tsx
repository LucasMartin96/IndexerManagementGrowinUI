import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import IndexersList from './components/IndexersList'
import IndexerDetails from './components/IndexerDetails'
import StartIndexer from './components/StartIndexer'
import ParamsManager from './components/ParamsManager'
import PrivateRoute from './components/PrivateRoute'

function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#f1f5f9',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#f1f5f9',
            },
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/indexers" replace />} />
          <Route path="indexers" element={<IndexersList />} />
          <Route path="indexers/:id" element={<IndexerDetails />} />
          <Route path="indexers/start" element={<StartIndexer />} />
          <Route path="params" element={<ParamsManager />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App

