import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import apiClient from '../api/client'
import { FiArrowRight, FiFilter, FiRefreshCw, FiCheckCircle, FiClock, FiXCircle, FiStopCircle } from 'react-icons/fi'

interface IndexerProcess {
  id: number
  type: string
  status: string
  params?: any
  started_at: string
  completed_at?: string
  progress?: {
    current?: number
    total?: number
    indexed?: number
    failed?: number
    message?: string
  }
  error_message?: string
}

const IndexersList = () => {
  const [processes, setProcesses] = useState<IndexerProcess[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')

  const fetchProcesses = async () => {
    try {
      const params = new URLSearchParams()
      if (filterStatus) params.append('status', filterStatus)
      if (filterType) params.append('type', filterType)
      
      const response = await apiClient.get(`/api/indexers?${params.toString()}`)
      setProcesses(response.data)
    } catch (error) {
      console.error('Failed to fetch processes:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProcesses()
    const interval = setInterval(fetchProcesses, 5000) // Poll every 5 seconds
    return () => clearInterval(interval)
  }, [filterStatus, filterType])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/20 text-success border-success/30'
      case 'running':
        return 'bg-primary/20 text-primary-light border-primary/30'
      case 'failed':
        return 'bg-error/20 text-error-light border-error/30'
      case 'stopped':
        return 'bg-dark-border text-dark-text-muted border-dark-border'
      default:
        return 'bg-dark-border text-dark-text-muted border-dark-border'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <FiCheckCircle className="h-4 w-4" />
      case 'running':
        return <FiClock className="h-4 w-4 animate-pulse" />
      case 'failed':
        return <FiXCircle className="h-4 w-4" />
      case 'stopped':
        return <FiStopCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'index-licitacion': 'Indexar Publicación',
      'index-scraper-publications': 'Indexar Scraper',
      'index-bulk': 'Indexación Masiva',
      'sync-since': 'Sincronizar desde Fecha',
    }
    return labels[type] || type
  }

  if (loading) {
    return (
      <div className="px-4 py-6">
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-dark-text-primary mb-2">Indexadores</h2>
          <p className="text-dark-text-secondary">Gestiona y monitorea los procesos de indexación</p>
        </div>
        <button
          onClick={fetchProcesses}
          className="flex items-center gap-2 px-4 py-2 bg-dark-surface border border-dark-border text-dark-text-primary rounded-lg hover:bg-dark-border transition-colors"
        >
          <FiRefreshCw className="h-4 w-4" />
          Actualizar
        </button>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="flex items-center gap-2">
          <FiFilter className="h-5 w-5 text-dark-text-muted" />
          <span className="text-sm font-medium text-dark-text-secondary">Filtros:</span>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="input-dark px-4 py-2 rounded-lg"
        >
          <option value="">Todos los Estados</option>
          <option value="running">En Ejecución</option>
          <option value="completed">Completado</option>
          <option value="failed">Fallido</option>
          <option value="stopped">Detenido</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="input-dark px-4 py-2 rounded-lg"
        >
          <option value="">Todos los Tipos</option>
          <option value="index-licitacion">Indexar Publicación</option>
          <option value="index-scraper-publications">Indexar Scraper</option>
          <option value="index-bulk">Indexación Masiva</option>
          <option value="sync-since">Sincronizar desde Fecha</option>
        </select>
      </div>

      <div className="bg-dark-surface rounded-xl shadow-xl border border-dark-border overflow-hidden">
        <ul className="divide-y divide-dark-border">
          {processes.map((process) => (
            <li key={process.id}>
              <Link
                to={`/indexers/${process.id}`}
                className="block hover:bg-dark-border/50 transition-colors px-6 py-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(process.status)}`}>
                        {getStatusIcon(process.status)}
                        <span className="capitalize">{process.status}</span>
                      </span>
                      <span className="text-base font-semibold text-dark-text-primary">
                        {getTypeLabel(process.type)}
                      </span>
                      <span className="text-sm text-dark-text-muted">#{process.id}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-dark-text-secondary mb-2">
                      <span>Inicio: {format(new Date(process.started_at), 'PPpp')}</span>
                      {process.completed_at && (
                        <span>• Completado: {format(new Date(process.completed_at), 'PPpp')}</span>
                      )}
                    </div>
                    {process.progress && (
                      <div className="flex items-center gap-4 text-sm text-dark-text-secondary">
                        {process.progress.message && (
                          <span className="text-dark-text-primary">{process.progress.message}</span>
                        )}
                        {process.progress.total !== undefined && (
                          <span>
                            Progreso: {process.progress.current || 0} / {process.progress.total}
                          </span>
                        )}
                        {process.progress.indexed !== undefined && (
                          <span className="text-success">✓ {process.progress.indexed} indexadas</span>
                        )}
                        {process.progress.failed !== undefined && process.progress.failed > 0 && (
                          <span className="text-error">✗ {process.progress.failed} fallidas</span>
                        )}
                      </div>
                    )}
                    {process.error_message && (
                      <div className="mt-2 text-sm text-error">{process.error_message}</div>
                    )}
                  </div>
                  <div className="ml-4">
                    <FiArrowRight className="h-5 w-5 text-dark-text-muted" />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        {processes.length === 0 && (
          <div className="text-center py-12 text-dark-text-muted">
            No se encontraron procesos
          </div>
        )}
      </div>
    </div>
  )
}

export default IndexersList
