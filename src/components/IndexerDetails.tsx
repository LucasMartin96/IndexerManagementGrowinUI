import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import apiClient from '../api/client'
import LogsViewer from './LogsViewer'
import { FiArrowLeft, FiStopCircle, FiCheckCircle, FiClock, FiXCircle, FiStopCircle as FiStop, FiInfo } from 'react-icons/fi'
import toast from 'react-hot-toast'

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

const IndexerDetails = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [process, setProcess] = useState<IndexerProcess | null>(null)
  const [loading, setLoading] = useState(true)
  const [stopping, setStopping] = useState(false)

  const fetchProcess = async () => {
    try {
      const response = await apiClient.get(`/api/indexers/${id}`)
      setProcess(response.data)
    } catch (error) {
      console.error('Failed to fetch process:', error)
      toast.error('Error al cargar el proceso')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProcess()
    if (process?.status === 'running') {
      const interval = setInterval(fetchProcess, 5000)
      return () => clearInterval(interval)
    }
  }, [id, process?.status])

  const handleStop = async () => {
    if (!confirm('¿Estás seguro de que deseas detener este proceso?')) return
    
    setStopping(true)
    try {
      await apiClient.post(`/api/indexers/${id}/stop`)
      toast.success('Proceso detenido correctamente')
      await fetchProcess()
    } catch (error: any) {
      console.error('Failed to stop process:', error)
      toast.error(error.response?.data?.detail || 'Error al detener el proceso')
    } finally {
      setStopping(false)
    }
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

  if (!process) {
    return (
      <div className="px-4 py-6">
        <div className="text-center py-12 text-dark-text-secondary">
          Proceso no encontrado
        </div>
      </div>
    )
  }

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
        return <FiCheckCircle className="h-5 w-5" />
      case 'running':
        return <FiClock className="h-5 w-5 animate-pulse" />
      case 'failed':
        return <FiXCircle className="h-5 w-5" />
      case 'stopped':
        return <FiStop className="h-5 w-5" />
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

  const progressPercentage = process.progress?.total 
    ? ((process.progress.current || 0) / process.progress.total) * 100 
    : 0

  return (
    <div className="px-4 py-6">
      <button
        onClick={() => navigate('/indexers')}
        className="mb-6 flex items-center gap-2 text-dark-text-secondary hover:text-dark-text-primary transition-colors"
      >
        <FiArrowLeft className="h-5 w-5" />
        <span>Volver a Indexadores</span>
      </button>

      <div className="bg-dark-surface rounded-xl shadow-xl border border-dark-border p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-dark-text-primary mb-2">
              Proceso #{process.id}
            </h2>
            <p className="text-dark-text-secondary">{getTypeLabel(process.type)}</p>
          </div>
          <span className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full border ${getStatusColor(process.status)}`}>
            {getStatusIcon(process.status)}
            <span className="capitalize">{process.status}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <dt className="text-sm font-semibold text-dark-text-secondary mb-2">Fecha de Inicio</dt>
            <dd className="text-base text-dark-text-primary">
              {format(new Date(process.started_at), 'PPpp')}
            </dd>
          </div>
          {process.completed_at && (
            <div>
              <dt className="text-sm font-semibold text-dark-text-secondary mb-2">Fecha de Finalización</dt>
              <dd className="text-base text-dark-text-primary">
                {format(new Date(process.completed_at), 'PPpp')}
              </dd>
            </div>
          )}
        </div>

        {process.progress && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <dt className="text-sm font-semibold text-dark-text-secondary">Progreso</dt>
              <dd className="text-sm text-dark-text-primary">
                {process.progress.current || 0} / {process.progress.total || 0}
                {process.progress.total && (
                  <span className="ml-2 text-dark-text-muted">
                    ({Math.round(progressPercentage)}%)
                  </span>
                )}
              </dd>
            </div>
            {process.progress.total && (
              <div className="w-full bg-dark-border rounded-full h-3 mb-4">
                <div
                  className={`h-3 rounded-full transition-all ${
                    process.status === 'completed' ? 'bg-success' :
                    process.status === 'failed' ? 'bg-error' :
                    process.status === 'stopped' ? 'bg-dark-text-muted' :
                    'bg-primary'
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            )}
            {process.progress.indexed !== undefined && (
              <div className="flex items-center gap-6 text-sm mb-2">
                <span className="text-success flex items-center gap-1">
                  <FiCheckCircle className="h-4 w-4" />
                  {process.progress.indexed} indexadas
                </span>
                {process.progress.failed !== undefined && process.progress.failed > 0 && (
                  <span className="text-error flex items-center gap-1">
                    <FiXCircle className="h-4 w-4" />
                    {process.progress.failed} fallidas
                  </span>
                )}
              </div>
            )}
            {process.progress.message && (
              <div className="flex items-start gap-2 text-sm text-dark-text-secondary mt-3">
                <FiInfo className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{process.progress.message}</span>
              </div>
            )}
          </div>
        )}

        {process.error_message && (
          <div className="mb-6 bg-error/10 border border-error/30 text-error px-4 py-3 rounded-lg">
            <div className="flex items-start gap-2">
              <FiXCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-semibold mb-1">Error</div>
                <div className="text-sm">{process.error_message}</div>
              </div>
            </div>
          </div>
        )}

        {process.params && (
          <div className="mb-6">
            <dt className="text-sm font-semibold text-dark-text-secondary mb-2">Parámetros</dt>
            <dd className="mt-1">
              <pre className="bg-dark-bg border border-dark-border p-4 rounded-lg text-xs text-dark-text-secondary overflow-auto font-mono">
                {JSON.stringify(process.params, null, 2)}
              </pre>
            </dd>
          </div>
        )}

        {process.status === 'running' && (
          <div className="mt-6">
            <button
              onClick={handleStop}
              disabled={stopping}
              className="btn-primary bg-error hover:bg-error-hover px-6 py-3 flex items-center gap-2"
            >
              {stopping ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Deteniendo...
                </>
              ) : (
                <>
                  <FiStopCircle className="h-5 w-5" />
                  Detener Proceso
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <LogsViewer processId={parseInt(id!)} />
    </div>
  )
}

export default IndexerDetails
