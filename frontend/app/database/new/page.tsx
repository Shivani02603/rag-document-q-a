'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface FormData {
  name: string
  host: string
  port: string
  database_name: string
  username: string
  password: string
}

interface FormErrors {
  name?: string
  host?: string
  port?: string
  database_name?: string
  username?: string
  password?: string
}

export default function NewDatabasePage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    name: '',
    host: '',
    port: '5432',
    database_name: '',
    username: '',
    password: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.host.trim()) {
      newErrors.host = 'Host is required'
    }

    if (!formData.port.trim()) {
      newErrors.port = 'Port is required'
    } else {
      const portNum = parseInt(formData.port)
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        newErrors.port = 'Port must be a valid number between 1 and 65535'
      }
    }

    if (!formData.database_name.trim()) {
      newErrors.database_name = 'Database name is required'
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      // Note: This endpoint is not in the contract, so we'll use a placeholder
      // In a real implementation, you would need to add this endpoint to the backend
      const response = await fetch('/api/databases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          port: parseInt(formData.port),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `Failed to create database: ${response.status}`)
      }

      // Redirect to database list page on success
      router.push('/database')
      router.refresh()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create database connection')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add New Database Connection</h1>
          <p className="text-gray-600 mt-2">
            Configure a new PostgreSQL database connection for the RAG system
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {submitError && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-red-700 font-medium">Error: {submitError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Connection Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Production Database"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label htmlFor="host" className="block text-sm font-medium text-gray-700 mb-1">
                    Host *
                  </label>
                  <input
                    type="text"
                    id="host"
                    name="host"
                    value={formData.host}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.host ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g., localhost or 192.168.1.100"
                  />
                  {errors.host && (
                    <p className="mt-1 text-sm text-red-600">{errors.host}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="port" className="block text-sm font-medium text-gray-700 mb-1">
                    Port *
                  </label>
                  <input
                    type="text"
                    id="port"
                    name="port"
                    value={formData.port}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.port ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="5432"
                  />
                  {errors.port && (
                    <p className="mt-1 text-sm text-red-600">{errors.port}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="database_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Database Name *
                </label>
                <input
                  type="text"
                  id="database_name"
                  name="database_name"
                  value={formData.database_name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.database_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., rag_database"
                />
                {errors.database_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.database_name}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.username ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g., postgres"
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="••••••••"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/database')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating...' : 'Create Database Connection'}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Note about Database Connections</h3>
          <p className="text-sm text-blue-700">
            The RAG system requires a PostgreSQL database with the pgvector extension enabled.
            This connection will be used to store document embeddings and session data.
            Ensure the database user has appropriate permissions to create tables and extensions.
          </p>
        </div>
      </div>
    </div>
  )
}