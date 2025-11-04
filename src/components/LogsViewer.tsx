import { useState, useEffect, useRef } from 'react'
import apiClient from '../api/client'
import { FiTerminal } from 'react-icons/fi'

interface LogEntry {
  timestamp: string
  level: string
  message: string
}

interface LogsViewerProps {
  processId: number
}

const LogsViewer: React.FC<LogsViewerProps> = ({ processId }) => {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [lastTimestamp, setLastTimestamp] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const logsEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchLogs = async () => {
    try {
      const params = lastTimestamp ? `?since=${lastTimestamp}` : ''
      const response = await apiClient.get(`/api/indexers/${processId}/logs${params}`)
      const newLogs = response.data.logs as LogEntry[]
      
      if (newLogs.length > 0) {
        setLogs((prev) => [...prev, ...newLogs])
        setLastTimestamp(response.data.last_timestamp || null)
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
    const interval = setInterval(fetchLogs, 3000) // Poll every 3 seconds
    return () => clearInterval(interval)
  }, [processId, lastTimestamp])

  useEffect(() => {
    scrollToBottom()
  }, [logs])

  const getLogLevelColor = (level: string) => {
    const lowerLevel = level.toLowerCase()
    switch (lowerLevel) {
      case 'error':
        return 'text-error-light'
      case 'warning':
        return 'text-warning-light'
      case 'info':
        return 'text-primary-light'
      case 'debug':
        return 'text-dark-text-muted'
      default:
        return 'text-dark-text-secondary'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false
      })
    } catch {
      return timestamp
    }
  }

  return (
    <div className="bg-dark-surface rounded-xl shadow-xl border border-dark-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <FiTerminal className="h-5 w-5 text-dark-text-secondary" />
        <h3 className="text-lg font-semibold text-dark-text-primary">Logs</h3>
      </div>
      <div className="bg-[#0a0a0a] text-dark-text-secondary p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto border border-dark-border">
        {loading && logs.length === 0 && (
          <div className="text-dark-text-muted flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            Cargando logs...
          </div>
        )}
        {logs.map((log, index) => (
          <div key={index} className="mb-1 flex gap-3">
            <span className="text-dark-text-muted flex-shrink-0 min-w-[80px]">
              {formatTimestamp(log.timestamp)}
            </span>
            <span className={`flex-shrink-0 min-w-[70px] uppercase text-xs font-semibold ${getLogLevelColor(log.level)}`}>
              [{log.level}]
            </span>
            <span className={`flex-1 ${getLogLevelColor(log.level)}`}>
              {log.message}
            </span>
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>
    </div>
  )
}

export default LogsViewer
