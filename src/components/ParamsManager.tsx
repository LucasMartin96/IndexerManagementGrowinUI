import { useState, useEffect } from 'react'
import apiClient from '../api/client'
import { FiPlus, FiEdit, FiTrash2, FiSave, FiX, FiSettings } from 'react-icons/fi'
import toast from 'react-hot-toast'

interface Param {
  id: number
  key: string
  value: string
  description?: string
  category?: string
  created_at?: string
  updated_at?: string
}

const ParamsManager = () => {
  const [params, setParams] = useState<Param[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingParam, setEditingParam] = useState<Param | null>(null)
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    description: '',
    category: '',
  })

  const fetchParams = async () => {
    try {
      const response = await apiClient.get('/api/params')
      setParams(response.data)
    } catch (error) {
      console.error('Failed to fetch params:', error)
      toast.error('Error al cargar los parámetros')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchParams()
  }, [])

  const handleEdit = (param: Param) => {
    setEditingParam(param)
    setFormData({
      key: param.key,
      value: param.value,
      description: param.description || '',
      category: param.category || '',
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingParam) {
        await apiClient.put(`/api/params/${formData.key}`, {
          value: formData.value,
          description: formData.description || undefined,
          category: formData.category || undefined,
        })
        toast.success('Parámetro actualizado correctamente')
      } else {
        await apiClient.post('/api/params', formData)
        toast.success('Parámetro creado correctamente')
      }
      
      setShowForm(false)
      setEditingParam(null)
      setFormData({ key: '', value: '', description: '', category: '' })
      fetchParams()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al guardar el parámetro')
    }
  }

  const handleDelete = async (key: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el parámetro "${key}"?`)) return

    try {
      await apiClient.delete(`/api/params/${key}`)
      toast.success('Parámetro eliminado correctamente')
      fetchParams()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Error al eliminar el parámetro')
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingParam(null)
    setFormData({ key: '', value: '', description: '', category: '' })
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-dark-text-primary mb-2 flex items-center gap-2">
            <FiSettings className="h-7 w-7" />
            Parámetros
          </h2>
          <p className="text-dark-text-secondary">Gestiona la configuración del sistema</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true)
            setEditingParam(null)
            setFormData({ key: '', value: '', description: '', category: '' })
          }}
          className="btn-primary flex items-center gap-2 px-6 py-3"
        >
          <FiPlus className="h-5 w-5" />
          Agregar Parámetro
        </button>
      </div>

      {showForm && (
        <div className="bg-dark-surface rounded-xl shadow-xl border border-dark-border p-6 mb-6">
          <h3 className="text-lg font-semibold text-dark-text-primary mb-4">
            {editingParam ? 'Editar Parámetro' : 'Agregar Parámetro'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-dark-text-primary mb-2">
                  Clave
                </label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  disabled={!!editingParam}
                  required
                  className="input-dark w-full px-4 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="nombre-del-parametro"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-text-primary mb-2">
                  Valor
                </label>
                <textarea
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  required
                  rows={3}
                  className="input-dark w-full px-4 py-3 rounded-lg"
                  placeholder="Valor del parámetro"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-text-primary mb-2">
                  Descripción
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-dark w-full px-4 py-3 rounded-lg"
                  placeholder="Descripción opcional"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark-text-primary mb-2">
                  Categoría
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input-dark w-full px-4 py-3 rounded-lg"
                  placeholder="Categoría opcional"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                className="btn-primary flex items-center gap-2 px-6 py-3"
              >
                <FiSave className="h-5 w-5" />
                Guardar
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="btn-secondary flex items-center gap-2 px-6 py-3"
              >
                <FiX className="h-5 w-5" />
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-dark-surface rounded-xl shadow-xl border border-dark-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-dark-border">
            <thead className="bg-dark-border/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">
                  Clave
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-dark-surface divide-y divide-dark-border">
              {params.map((param) => (
                <tr key={param.id} className="hover:bg-dark-border/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-text-primary">
                    {param.key}
                  </td>
                  <td className="px-6 py-4 text-sm text-dark-text-secondary truncate max-w-xs">
                    {param.value}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-text-secondary">
                    {param.category || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-dark-text-secondary">
                    {param.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => handleEdit(param)}
                        className="text-primary hover:text-primary-light transition-colors"
                        title="Editar"
                      >
                        <FiEdit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(param.key)}
                        className="text-error hover:text-error-light transition-colors"
                        title="Eliminar"
                      >
                        <FiTrash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {params.length === 0 && (
          <div className="text-center py-12 text-dark-text-muted">
            No se encontraron parámetros
          </div>
        )}
      </div>
    </div>
  )
}

export default ParamsManager
