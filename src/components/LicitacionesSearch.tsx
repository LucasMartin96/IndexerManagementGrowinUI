import { useState, useEffect, useMemo, useCallback } from 'react'
import { format, parse, isValid } from 'date-fns'
import apiClient from '../api/client'
import toast from 'react-hot-toast'
import {
  FiSearch,
  FiFilter,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiCalendar,
  FiCheckCircle,
  FiXCircle,
  FiChevronDown,
  FiChevronUp,
} from 'react-icons/fi'

interface Publicacion {
  id: number
  scraper?: number
  objeto: string
  agencia: string
  pais: string
  pais_id?: number
  tags?: Array<{ id: number; descripcion: string }>
  tag_ids?: number[]
  apertura: string
  vigente: boolean
  [key: string]: any
}

interface SearchResponse {
  publicaciones: Publicacion[]
  total: number
  pagina: number
  paginas: number
}

interface FilterState {
  page: number
  page_size: number
  search: string
  incluirVencidos: string
  soloVigentes: string | null
  objeto: string
  agencia: string
  pais: string
  rubro: string
  apertura_fr: string
  apertura_to: string
  user_tag_ids: number[]
  filter_mode: string
}

const LicitacionesSearch = () => {
  const [filters, setFilters] = useState<FilterState>({
    page: 1,
    page_size: 15,
    search: '',
    incluirVencidos: '0',
    soloVigentes: null,
    objeto: '',
    agencia: '',
    pais: '',
    rubro: '',
    apertura_fr: '',
    apertura_to: '',
    user_tag_ids: [],
    filter_mode: 'all',
  })

  const [results, setResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['quick', 'status'])
  )

  // Convert DD/MM/YYYY to YYYY-MM-DD for date input, or keep as is
  const formatDateForInput = (dateStr: string): string => {
    if (!dateStr) return ''
    try {
      const parsed = parse(dateStr, 'dd/MM/yyyy', new Date())
      if (isValid(parsed)) {
        return format(parsed, 'yyyy-MM-dd')
      }
    } catch {
      // Try YYYY-MM-DD format
      try {
        const parsed = parse(dateStr, 'yyyy-MM-dd', new Date())
        if (isValid(parsed)) {
          return format(parsed, 'yyyy-MM-dd')
        }
      } catch {
        // Return as is if parsing fails
      }
    }
    return dateStr
  }

  // Convert YYYY-MM-DD to DD/MM/YYYY for API
  const formatDateForAPI = (dateStr: string): string => {
    if (!dateStr) return ''
    try {
      const parsed = parse(dateStr, 'yyyy-MM-dd', new Date())
      if (isValid(parsed)) {
        return format(parsed, 'dd/MM/yyyy')
      }
    } catch {
      return dateStr
    }
    return dateStr
  }

  const buildSearchParams = useCallback((): any => {
    const params: any = {
      page: filters.page,
      page_size: filters.page_size,
    }

    if (filters.search.trim()) {
      params.search = filters.search.trim()
    }

    if (filters.incluirVencidos) {
      params.incluirVencidos = filters.incluirVencidos
    }

    if (filters.soloVigentes) {
      params.soloVigentes = filters.soloVigentes
    }

    if (filters.objeto.trim()) {
      params.objeto = filters.objeto.trim()
    }

    if (filters.agencia.trim()) {
      params.agencia = filters.agencia.trim()
    }

    if (filters.pais.trim() && filters.pais !== 'all') {
      params.pais = filters.pais.trim()
    }

    if (filters.rubro.trim() && filters.rubro !== 'all') {
      params.rubro = filters.rubro.trim()
    }

    if (filters.apertura_fr) {
      params.apertura_fr = formatDateForAPI(filters.apertura_fr)
    }

    if (filters.apertura_to) {
      params.apertura_to = formatDateForAPI(filters.apertura_to)
    }

    if (filters.user_tag_ids.length > 0) {
      params.user_tag_ids = filters.user_tag_ids
    }

    if (filters.filter_mode) {
      params.filter_mode = filters.filter_mode
    }

    return params
  }, [filters])

  const performSearch = useCallback(async () => {
    setLoading(true)
    try {
      const params = buildSearchParams()
      const response = await apiClient.post<SearchResponse>('/api/search-licitaciones', params)
      setResults(response.data)
    } catch (error: any) {
      console.error('Search failed:', error)
      const errorMsg =
        error.response?.status === 503
          ? 'Elasticsearch no está disponible'
          : error.response?.status === 500
          ? 'Error en la búsqueda de Elasticsearch'
          : error.response?.data?.detail || 'Error al realizar la búsqueda'
      toast.error(errorMsg)
      setResults(null)
    } finally {
      setLoading(false)
    }
  }, [buildSearchParams])

  // Debounced search effect for search field
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    const timer = setTimeout(() => {
      performSearch()
    }, 500)

    setDebounceTimer(timer)

    return () => {
      if (timer) clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search])

  // Immediate search for page and page_size changes
  useEffect(() => {
    performSearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.page_size])

  // Initial load
  useEffect(() => {
    performSearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1, // Reset to first page when filters change (except page itself)
    }))
  }

  // Search when filters change (except search, page, page_size which have their own effects)
  useEffect(() => {
    const filterKeysToIgnore = ['search', 'page', 'page_size']
    const hasNonIgnoredFilter = Object.entries(filters).some(
      ([key, value]) =>
        !filterKeysToIgnore.includes(key) &&
        (value !== '' && value !== null && value !== 'all' && (!Array.isArray(value) || value.length > 0))
    )

    // Only trigger search if we're not on initial state and have active filters
    if (hasNonIgnoredFilter || filters.incluirVencidos !== '0' || filters.filter_mode !== 'all') {
      const timer = setTimeout(() => {
        performSearch()
      }, 300)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.incluirVencidos,
    filters.soloVigentes,
    filters.objeto,
    filters.agencia,
    filters.pais,
    filters.rubro,
    filters.apertura_fr,
    filters.apertura_to,
    filters.user_tag_ids,
    filters.filter_mode,
  ])

  const handleSearchChange = (value: string) => {
    handleFilterChange('search', value)
  }

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      page_size: 15,
      search: '',
      incluirVencidos: '0',
      soloVigentes: null,
      objeto: '',
      agencia: '',
      pais: '',
      rubro: '',
      apertura_fr: '',
      apertura_to: '',
      user_tag_ids: [],
      filter_mode: 'all',
    })
    // Search will be triggered by useEffect
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.search) count++
    if (filters.incluirVencidos !== '0') count++
    if (filters.soloVigentes) count++
    if (filters.objeto) count++
    if (filters.agencia) count++
    if (filters.pais && filters.pais !== 'all') count++
    if (filters.rubro && filters.rubro !== 'all') count++
    if (filters.apertura_fr) count++
    if (filters.apertura_to) count++
    if (filters.user_tag_ids.length > 0) count++
    if (filters.filter_mode !== 'all') count++
    return count
  }, [filters])

  const truncateText = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-dark-text-primary mb-2 flex items-center gap-2">
            <FiSearch className="h-7 w-7" />
            Búsqueda de Licitaciones
          </h2>
          <p className="text-dark-text-secondary">Busca y filtra publicaciones indexadas</p>
        </div>
        {activeFiltersCount > 0 && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-2 px-4 py-2 bg-dark-surface border border-dark-border text-dark-text-secondary hover:text-dark-text-primary rounded-lg hover:bg-dark-border transition-colors"
          >
            <FiX className="h-4 w-4" />
            Limpiar Filtros ({activeFiltersCount})
          </button>
        )}
      </div>

      <div className="flex gap-6">
        {/* Filter Sidebar */}
        <div
          className={`${
            sidebarCollapsed ? 'w-0 overflow-hidden' : 'w-80'
          } transition-all duration-300 flex-shrink-0`}
        >
          <div className="bg-dark-surface rounded-xl shadow-xl border border-dark-border p-6 sticky top-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dark-text-primary flex items-center gap-2">
                <FiFilter className="h-5 w-5" />
                Filtros
              </h3>
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="lg:hidden text-dark-text-muted hover:text-dark-text-primary"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Search */}
            <div className="mb-6">
              <div
                className="flex items-center justify-between mb-3 cursor-pointer"
                onClick={() => toggleSection('quick')}
              >
                <label className="text-sm font-semibold text-dark-text-primary">Búsqueda General</label>
                {expandedSections.has('quick') ? (
                  <FiChevronUp className="h-4 w-4 text-dark-text-muted" />
                ) : (
                  <FiChevronDown className="h-4 w-4 text-dark-text-muted" />
                )}
              </div>
              {expandedSections.has('quick') && (
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Buscar en objeto, agencia, oficina..."
                  className="input-dark w-full px-4 py-3 rounded-lg"
                />
              )}
            </div>

            {/* Status Filters */}
            <div className="mb-6">
              <div
                className="flex items-center justify-between mb-3 cursor-pointer"
                onClick={() => toggleSection('status')}
              >
                <label className="text-sm font-semibold text-dark-text-primary">Estado</label>
                {expandedSections.has('status') ? (
                  <FiChevronUp className="h-4 w-4 text-dark-text-muted" />
                ) : (
                  <FiChevronDown className="h-4 w-4 text-dark-text-muted" />
                )}
              </div>
              {expandedSections.has('status') && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-dark-text-secondary mb-2">
                      Incluir Vencidos
                    </label>
                    <select
                      value={filters.incluirVencidos}
                      onChange={(e) => handleFilterChange('incluirVencidos', e.target.value)}
                      className="input-dark w-full px-4 py-2 rounded-lg text-sm"
                    >
                      <option value="0">Solo Vigentes</option>
                      <option value="1">Todos</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-dark-text-secondary mb-2">
                      Solo Vigentes
                    </label>
                    <select
                      value={filters.soloVigentes || ''}
                      onChange={(e) =>
                        handleFilterChange('soloVigentes', e.target.value || null)
                      }
                      className="input-dark w-full px-4 py-2 rounded-lg text-sm"
                    >
                      <option value="">Todos</option>
                      <option value="1">Solo Vigentes</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Field Filters */}
            <div className="mb-6">
              <div
                className="flex items-center justify-between mb-3 cursor-pointer"
                onClick={() => toggleSection('fields')}
              >
                <label className="text-sm font-semibold text-dark-text-primary">Filtros de Campos</label>
                {expandedSections.has('fields') ? (
                  <FiChevronUp className="h-4 w-4 text-dark-text-muted" />
                ) : (
                  <FiChevronDown className="h-4 w-4 text-dark-text-muted" />
                )}
              </div>
              {expandedSections.has('fields') && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-dark-text-secondary mb-2">Objeto</label>
                    <input
                      type="text"
                      value={filters.objeto}
                      onChange={(e) => handleFilterChange('objeto', e.target.value)}
                      placeholder="Buscar en objeto..."
                      className="input-dark w-full px-4 py-2 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-dark-text-secondary mb-2">Agencia</label>
                    <input
                      type="text"
                      value={filters.agencia}
                      onChange={(e) => handleFilterChange('agencia', e.target.value)}
                      placeholder="Buscar en agencia..."
                      className="input-dark w-full px-4 py-2 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-dark-text-secondary mb-2">País</label>
                    <input
                      type="text"
                      value={filters.pais}
                      onChange={(e) => handleFilterChange('pais', e.target.value)}
                      placeholder="ID o nombre (o 'all')"
                      className="input-dark w-full px-4 py-2 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-dark-text-secondary mb-2">Rubro</label>
                    <input
                      type="text"
                      value={filters.rubro}
                      onChange={(e) => handleFilterChange('rubro', e.target.value)}
                      placeholder="ID o nombre (o 'all')"
                      className="input-dark w-full px-4 py-2 rounded-lg text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Date Range */}
            <div className="mb-6">
              <div
                className="flex items-center justify-between mb-3 cursor-pointer"
                onClick={() => toggleSection('dates')}
              >
                <label className="text-sm font-semibold text-dark-text-primary flex items-center gap-2">
                  <FiCalendar className="h-4 w-4" />
                  Rango de Fechas
                </label>
                {expandedSections.has('dates') ? (
                  <FiChevronUp className="h-4 w-4 text-dark-text-muted" />
                ) : (
                  <FiChevronDown className="h-4 w-4 text-dark-text-muted" />
                )}
              </div>
              {expandedSections.has('dates') && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-dark-text-secondary mb-2">
                      Fecha Desde (DD/MM/YYYY)
                    </label>
                    <input
                      type="date"
                      value={formatDateForInput(filters.apertura_fr)}
                      onChange={(e) => handleFilterChange('apertura_fr', e.target.value)}
                      className="input-dark w-full px-4 py-2 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-dark-text-secondary mb-2">
                      Fecha Hasta (DD/MM/YYYY)
                    </label>
                    <input
                      type="date"
                      value={formatDateForInput(filters.apertura_to)}
                      onChange={(e) => handleFilterChange('apertura_to', e.target.value)}
                      className="input-dark w-full px-4 py-2 rounded-lg text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Advanced Filters */}
            <div className="mb-6">
              <div
                className="flex items-center justify-between mb-3 cursor-pointer"
                onClick={() => toggleSection('advanced')}
              >
                <label className="text-sm font-semibold text-dark-text-primary">Avanzados</label>
                {expandedSections.has('advanced') ? (
                  <FiChevronUp className="h-4 w-4 text-dark-text-muted" />
                ) : (
                  <FiChevronDown className="h-4 w-4 text-dark-text-muted" />
                )}
              </div>
              {expandedSections.has('advanced') && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-dark-text-secondary mb-2">
                      Modo de Filtro
                    </label>
                    <select
                      value={filters.filter_mode}
                      onChange={(e) => handleFilterChange('filter_mode', e.target.value)}
                      className="input-dark w-full px-4 py-2 rounded-lg text-sm"
                    >
                      <option value="all">Todos</option>
                      <option value="user_tags">Por Tags de Usuario</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-dark-text-secondary mb-2">
                      IDs de Tags (separados por coma)
                    </label>
                    <input
                      type="text"
                      value={filters.user_tag_ids.join(', ')}
                      onChange={(e) => {
                        const ids = e.target.value
                          .split(',')
                          .map((id) => parseInt(id.trim()))
                          .filter((id) => !isNaN(id))
                        handleFilterChange('user_tag_ids', ids)
                      }}
                      placeholder="1, 2, 3"
                      className="input-dark w-full px-4 py-2 rounded-lg text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 min-w-0">
          {/* Results Header */}
          <div className="bg-dark-surface rounded-xl shadow-xl border border-dark-border p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-dark-text-secondary">
                {loading ? (
                  <span>Buscando...</span>
                ) : results ? (
                  <span>
                    Mostrando {results.publicaciones.length} de {results.total} resultados
                    {results.paginas > 1 && ` • Página ${results.pagina} de ${results.paginas}`}
                  </span>
                ) : (
                  <span>No hay resultados</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs text-dark-text-secondary">Resultados por página:</label>
                <select
                  value={filters.page_size}
                  onChange={(e) => handleFilterChange('page_size', parseInt(e.target.value))}
                  className="input-dark px-3 py-1 rounded-lg text-sm"
                >
                  <option value={15}>15</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-dark-surface rounded-xl shadow-xl border border-dark-border overflow-hidden">
            {loading && !results ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : results && results.publicaciones.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-dark-border">
                    <thead className="bg-dark-border/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">
                          Objeto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">
                          Agencia
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">
                          País
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">
                          Tags
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">
                          Apertura
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">
                          Vigente
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-dark-surface divide-y divide-dark-border">
                      {results.publicaciones.map((pub) => (
                        <tr
                          key={pub.id}
                          className="hover:bg-dark-border/30 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-text-primary">
                            {pub.id}
                          </td>
                          <td className="px-6 py-4 text-sm text-dark-text-secondary max-w-xs">
                            <div
                              className="truncate"
                              title={pub.objeto}
                            >
                              {truncateText(pub.objeto || '', 60)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-dark-text-secondary max-w-xs">
                            <div className="truncate" title={pub.agencia}>
                              {truncateText(pub.agencia || '', 40)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-text-secondary">
                            {pub.pais || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex flex-wrap gap-1">
                              {pub.tags && pub.tags.length > 0 ? (
                                pub.tags.slice(0, 3).map((tag) => (
                                  <span
                                    key={tag.id}
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-primary/20 text-primary-light border border-primary/30"
                                  >
                                    {tag.descripcion}
                                  </span>
                                ))
                              ) : (
                                <span className="text-dark-text-muted">-</span>
                              )}
                              {pub.tags && pub.tags.length > 3 && (
                                <span className="text-xs text-dark-text-muted">
                                  +{pub.tags.length - 3}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-text-secondary">
                            {pub.apertura
                              ? format(new Date(pub.apertura), 'dd/MM/yyyy HH:mm')
                              : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {pub.vigente ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-success/20 text-success border border-success/30">
                                <FiCheckCircle className="h-3 w-3" />
                                Vigente
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-error/20 text-error-light border border-error/30">
                                <FiXCircle className="h-3 w-3" />
                                Vencido
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {results.paginas > 1 && (
                  <div className="bg-dark-border/50 px-6 py-4 border-t border-dark-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleFilterChange('page', 1)}
                          disabled={results.pagina === 1 || loading}
                          className="p-2 rounded-lg bg-dark-surface border border-dark-border text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <FiChevronsLeft className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleFilterChange('page', results.pagina - 1)}
                          disabled={results.pagina === 1 || loading}
                          className="p-2 rounded-lg bg-dark-surface border border-dark-border text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <FiChevronLeft className="h-5 w-5" />
                        </button>
                        <span className="px-4 text-sm text-dark-text-secondary">
                          Página{' '}
                          <input
                            type="number"
                            min={1}
                            max={results.paginas}
                            value={filters.page}
                            onChange={(e) => {
                              const page = parseInt(e.target.value)
                              if (page >= 1 && page <= results.paginas) {
                                handleFilterChange('page', page)
                              }
                            }}
                            className="w-16 px-2 py-1 mx-1 text-center input-dark rounded-lg text-sm"
                          />{' '}
                          de {results.paginas}
                        </span>
                        <button
                          onClick={() => handleFilterChange('page', results.pagina + 1)}
                          disabled={results.pagina === results.paginas || loading}
                          className="p-2 rounded-lg bg-dark-surface border border-dark-border text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <FiChevronRight className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleFilterChange('page', results.paginas)}
                          disabled={results.pagina === results.paginas || loading}
                          className="p-2 rounded-lg bg-dark-surface border border-dark-border text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <FiChevronsRight className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-dark-text-muted">
                No se encontraron publicaciones
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sidebar toggle */}
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="fixed bottom-6 right-6 lg:hidden btn-primary p-4 rounded-full shadow-lg z-50"
        >
          <FiFilter className="h-6 w-6" />
        </button>
      )}
    </div>
  )
}

export default LicitacionesSearch

