=== frontend/app/session management/page.tsx ===
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { listSessions, createSession, deleteSession } from '@/api/client'

interface Session {
  id: string
  name: string
  user_id: string
  created_at: string
  updated_at: string
}

export default function SessionManagementPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newSessionName, setNewSessionName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const data = await listSessions()
      setSessions(data)
      setError(null)
    } catch (err) {
      setError('Failed to fetch sessions')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) {
      setError('Session name is required')
      return
    }

    try {
      setIsCreating(true)
      const newSession = await createSession(newSessionName)
      setSessions([...sessions, newSession])
      setNewSessionName('')
      setError(null)
    } catch (err) {
      setError('Failed to create session')
      console.error(err)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) {
      return
    }

    try {
      await deleteSession(sessionId)
      setSessions(sessions.filter(session => session.id !== sessionId))
    } catch (err) {
      setError('Failed to delete session')
      console.error(err)
    }
  }

  const handleNavigateToSession = (sessionId: string) => {
    router.push(`/session management/${sessionId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Loading sessions...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Session Management</h1>
          <p className="text-gray-600 mt-2">Manage your chat sessions</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Create New Session</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              placeholder="Enter session name"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateSession()
                }
              }}
            />
            <button
              onClick={handleCreateSession}
              disabled={isCreating}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">All Sessions</h2>
          </div>
          
          {sessions.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No sessions found. Create your first session above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Updated At
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {session.id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {session.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {session.user_id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(session.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(session.updated_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleNavigateToSession(session.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

=== frontend/app/session management/new/page.tsx ===
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSession } from '@/api/client'

export default function NewSessionPage() {
  const router = useRouter()
  const [sessionName, setSessionName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!sessionName.trim()) {
      setError('Session name is required')
      return
    }

    if (sessionName.length > 100) {
      setError('Session name must be less than 100 characters')
      return
    }

    if (description.length > 500) {
      setError('Description must be less than 500 characters')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const newSession = await createSession(sessionName)
      
      router.push(`/session management/${newSession.id}`)
    } catch (err) {
      setError('Failed to create session. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Create New Session</h1>
            <p className="text-gray-600 mt-2">Start a new chat session for your document Q&A</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="sessionName" className="block text-sm font-medium text-gray-700 mb-2">
                Session Name *
              </label>
              <input
                type="text"
                id="sessionName"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="e.g., Quarterly Report Analysis"
                maxLength={100}
                required
              />
              <div className="mt-1 text-sm text-gray-500">
                {sessionName.length}/100 characters
              </div>
            </div>

            <div className="mb-8">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none min-h-[100px]"
                placeholder="Describe what this session will be used for..."
                maxLength={500}
              />
              <div className="mt-1 text-sm text-gray-500">
                {description.length}/500 characters
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Session'}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Tips:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Give your session a descriptive name</li>
              <li>• You can upload Excel files after creating the session</li>
              <li>• Each session maintains its own conversation history</li>
              <li>• You can switch between sessions at any time</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}