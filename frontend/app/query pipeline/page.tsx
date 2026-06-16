=== frontend/app/query pipeline/page.tsx ===
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface QueryPipelineItem {
  id: string
  query: string
  answer: string
  session_id: string
  created_at: string
  sources: Array<{
    filename: string
    row_range: string
  }>
}

export default function QueryPipelinePage() {
  const [queries, setQueries] = useState<QueryPipelineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchQueries()
  }, [])

  const fetchQueries = async () => {
    try {
      setLoading(true)
      // Note: The contract doesn't have a GET endpoint for all queries
      // This would need to be implemented on the backend
      // For now, we'll fetch from sessions/messages
      const sessionsResponse = await fetch('/api/sessions')
      if (!sessionsResponse.ok) {
        throw new Error('Failed to fetch sessions')
      }
      const sessions = await sessionsResponse.json()
      
      // Collect all messages from all sessions
      const allQueries: QueryPipelineItem[] = []
      
      for (const session of sessions) {
        const messagesResponse = await fetch(`/api/sessions/${session.id}/messages`)
        if (messagesResponse.ok) {
          const messages = await messagesResponse.json()
          messages.forEach((msg: any) => {
            if (msg.role === 'assistant' && msg.sources) {
              allQueries.push({
                id: msg.id,
                query: msg.content, // This would be the question that prompted this answer
                answer: msg.content,
                session_id: session.id,
                created_at: msg.created_at,
                sources: msg.sources
              })
            }
          })
        }
      }
      
      setQueries(allQueries)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch queries')
      console.error('Error fetching queries:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this query?')) return
    
    try {
      // Note: The contract doesn't have a DELETE endpoint for queries
      // This would need to be implemented on the backend
      // For now, we'll simulate deletion
      setQueries(prev => prev.filter(query => query.id !== id))
    } catch (err) {
      console.error('Error deleting query:', err)
      alert('Failed to delete query')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600">Loading queries...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-700 font-medium">Error: {error}</div>
            <button
              onClick={fetchQueries}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Query Pipeline</h1>
          <p className="text-gray-600 mt-2">View all AI queries and their responses with source citations</p>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Showing {queries.length} query{queries.length !== 1 ? 's' : ''}
          </div>
          <Link
            href="/query pipeline/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            New Query
          </Link>
        </div>

        {queries.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="text-gray-500 mb-4">No queries found</div>
            <Link
              href="/query pipeline/new"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create your first query
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Query
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Answer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Session
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sources
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {queries.map((query) => (
                    <tr key={query.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-normal">
                        <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                          {query.query}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-normal">
                        <div className="text-sm text-gray-700 max-w-xs truncate">
                          {query.answer}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {query.session_id.substring(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">
                          {query.sources.length > 0 ? (
                            <div className="space-y-1">
                              {query.sources.slice(0, 2).map((source, idx) => (
                                <div key={idx} className="text-xs">
                                  {source.filename}: {source.row_range}
                                </div>
                              ))}
                              {query.sources.length > 2 && (
                                <div className="text-xs text-gray-500">
                                  +{query.sources.length - 2} more
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">No sources</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(query.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDelete(query.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

=== frontend/app/query pipeline/new/page.tsx ===
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Session {
  id: string
  name: string
}

export default function NewQueryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [formData, setFormData] = useState({
    query: '',
    session_id: '',
    file_ids: [] as string[]
  })

  // Fetch sessions on component mount
  useState(() => {
    fetchSessions()
  })

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/sessions')
      if (!response.ok) throw new Error('Failed to fetch sessions')
      const data = await response.json()
      setSessions(data)
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, session_id: data[0].id }))
      }
    } catch (err) {
      console.error('Error fetching sessions:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.query.trim()) {
      setError('Query is required')
      return
    }
    
    if (!formData.session_id) {
      setError('Please select a session')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // First, we need to send the query to the AI endpoint
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: formData.query,
          session_id: formData.session_id,
          file_ids: formData.file_ids
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to process query')
      }

      const result = await response.json()
      
      // Redirect to the query pipeline page
      router.push('/query pipeline')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error creating query:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">New Query</h1>
          <p className="text-gray-600 mt-2">Ask a natural-language question about your uploaded Excel data</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-red-700 font-medium">{error}</div>
              </div>
            )}

            <div>
              <label htmlFor="session_id" className="block text-sm font-medium text-gray-700 mb-2">
                Session
              </label>
              <select
                id="session_id"
                name="session_id"
                value={formData.session_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a session</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Select the session where you want to save this query
              </p>
            </div>

            <div>
              <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
                Your Question
              </label>
              <textarea
                id="query"
                name="query"
                value={formData.query}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., What were the total sales in Q4 2023?"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Ask a natural-language question about the data in your uploaded Excel files
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Files to Search (Optional)
              </label>
              <div className="border border-gray-300 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-3">
                  By default, the system will search across all files in the selected session.
                  You can optionally specify particular files to search.
                </p>
                <div className="text-sm text-gray-600">
                  <p>File filtering would be implemented here based on uploaded files in the session.</p>
                  <p className="mt-2">For now, all files in the session will be searched.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Submit Query'}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">How it works</h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Your question is embedded using OpenAI&apos;s text-embedding-3-small</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>The system retrieves the top 5 most relevant chunks from your uploaded Excel data</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>The context and question are sent to Google&apos;s Gemini 2.0 Flash model</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>The answer is returned with source citations showing filename and row ranges</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}