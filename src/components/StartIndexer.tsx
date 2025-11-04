import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/client'
import { FiDatabase, FiCalendar, FiHash, FiPlay } from 'react-icons/fi'
import toast from 'react-hot-toast'

const StartIndexer = () => {
  const navigate = useNavigate()
  const [type, setType] = useState('index-licitacion')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form fields based on indexer type
  const [publicacionId, setPublicacionId] = useState('')
  const [scraperId, setScraperId] = useState('')
  const [sinceDate, setSinceDate] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let params: any = {}

      // Build params based on type
      if (type === 'index-licitacion') {
        if (!publicacionId || isNaN(Number(publicacionId))) {
          throw new Error('Por favor ingresa un ID de publicación válido')
        }
        params.publicacion_id = Number(publicacionId)
      } else if (type === 'index-scraper-publications') {
        if (!scraperId || isNaN(Number(scraperId))) {
          throw new Error('Por favor ingresa un ID de scraper válido')
        }
        if (!sinceDate) {
          throw new Error('Por favor selecciona una fecha')
        }
        // Convert datetime-local to MySQL format
        const date = new Date(sinceDate)
        params.scraper_id = Number(scraperId)
        params.since = date.toISOString().slice(0, 19).replace('T', ' ')
      } else if (type === 'sync-since') {
        if (!sinceDate) {
          throw new Error('Por favor selecciona una fecha')
        }
        const date = new Date(sinceDate)
        params.since = date.toISOString().slice(0, 19).replace('T', ' ')
      }
      // index-bulk doesn't need params

      const response = await apiClient.post('/api/indexers/start', {
        type,
        params,
      })

      toast.success('Indexador iniciado correctamente')
      navigate(`/indexers/${response.data.id}`)
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Error al iniciar el indexador'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleTypeChange = (newType: string) => {
    setType(newType)
    setError('')
    // Reset form fields
    setPublicacionId('')
    setScraperId('')
    setSinceDate('')
  }

  const getTypeDescription = () => {
    switch (type) {
      case 'index-licitacion':
        return 'Indexa una publicación específica por su ID'
      case 'index-scraper-publications':
        return 'Indexa todas las publicaciones de un scraper desde una fecha específica'
      case 'sync-since':
        return 'Sincroniza todas las publicaciones actualizadas desde una fecha específica'
      case 'index-bulk':
        return 'Indexa todas las publicaciones del sistema (operación que puede tardar)'
      default:
        return ''
    }
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-dark-text-primary mb-2">Iniciar Indexador</h2>
        <p className="text-dark-text-secondary">Selecciona el tipo de indexación que deseas ejecutar</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-dark-surface rounded-xl shadow-xl border border-dark-border p-6">
        {error && (
          <div className="mb-6 bg-error/10 border border-error/30 text-error px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Indexer Type Selection */}
        <div className="mb-6">
          <label htmlFor="type" className="block text-sm font-semibold text-dark-text-primary mb-3">
            Tipo de Indexador
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="input-dark w-full px-4 py-3 rounded-lg text-base"
          >
            <option value="index-licitacion">Indexar Publicación Específica</option>
            <option value="index-scraper-publications">Indexar Publicaciones de Scraper</option>
            <option value="sync-since">Sincronizar desde Fecha</option>
            <option value="index-bulk">Indexación Masiva (Todas las Publicaciones)</option>
          </select>
          <p className="mt-2 text-sm text-dark-text-secondary">{getTypeDescription()}</p>
        </div>

        {/* Dynamic Form Fields */}
        {type === 'index-licitacion' && (
          <div className="mb-6">
            <label htmlFor="publicacion_id" className="block text-sm font-semibold text-dark-text-primary mb-2">
              ID de Publicación
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiHash className="h-5 w-5 text-dark-text-muted" />
              </div>
              <input
                id="publicacion_id"
                type="number"
                value={publicacionId}
                onChange={(e) => setPublicacionId(e.target.value)}
                placeholder="Ingresa el ID de la publicación"
                required
                className="input-dark pl-10 w-full px-4 py-3 rounded-lg"
              />
            </div>
            <p className="mt-2 text-xs text-dark-text-muted">
              Ingresa el ID numérico de la publicación que deseas indexar
            </p>
          </div>
        )}

        {type === 'index-scraper-publications' && (
          <>
            <div className="mb-6">
              <label htmlFor="scraper_id" className="block text-sm font-semibold text-dark-text-primary mb-2">
                ID de Scraper
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiDatabase className="h-5 w-5 text-dark-text-muted" />
                </div>
                <input
                  id="scraper_id"
                  type="number"
                  value={scraperId}
                  onChange={(e) => setScraperId(e.target.value)}
                  placeholder="Ingresa el ID del scraper"
                  required
                  className="input-dark pl-10 w-full px-4 py-3 rounded-lg"
                />
              </div>
            </div>
            <div className="mb-6">
              <label htmlFor="since_date_scraper" className="block text-sm font-semibold text-dark-text-primary mb-2">
                Fecha Desde
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCalendar className="h-5 w-5 text-dark-text-muted" />
                </div>
                <input
                  id="since_date_scraper"
                  type="datetime-local"
                  value={sinceDate}
                  onChange={(e) => setSinceDate(e.target.value)}
                  required
                  className="input-dark pl-10 w-full px-4 py-3 rounded-lg"
                />
              </div>
              <p className="mt-2 text-xs text-dark-text-muted">
                Selecciona la fecha y hora desde la cual indexar las publicaciones
              </p>
            </div>
          </>
        )}

        {type === 'sync-since' && (
          <div className="mb-6">
            <label htmlFor="since_date_sync" className="block text-sm font-semibold text-dark-text-primary mb-2">
              Fecha Desde
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiCalendar className="h-5 w-5 text-dark-text-muted" />
              </div>
              <input
                id="since_date_sync"
                type="datetime-local"
                value={sinceDate}
                onChange={(e) => setSinceDate(e.target.value)}
                required
                className="input-dark pl-10 w-full px-4 py-3 rounded-lg"
              />
            </div>
            <p className="mt-2 text-xs text-dark-text-muted">
              Sincroniza todas las publicaciones actualizadas desde esta fecha
            </p>
          </div>
        )}

        {type === 'index-bulk' && (
          <div className="mb-6 p-4 bg-warning/10 border border-warning/30 rounded-lg">
            <p className="text-sm text-warning-light">
              <strong>Advertencia:</strong> Este proceso indexará todas las publicaciones del sistema. 
              Esta operación puede tardar varios minutos dependiendo de la cantidad de datos.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-6 py-3 text-base font-semibold flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Iniciando...
              </>
            ) : (
              <>
                <FiPlay className="h-5 w-5" />
                Iniciar Indexador
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default StartIndexer
