'use client'

import { useState, useEffect } from 'react'
import { AccessibleButton } from '@/components/ui/AccessibleButton'
import { AccessibleModal } from '@/components/ui/AccessibleModal'

interface ModerationItem {
  id: string
  type: 'report' | 'flagged_content' | 'image_scan'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'in_progress' | 'resolved'
  createdAt: string
  metadata?: ModerationMetadata
}

interface ModerationMetadata {
  reportType?: string;
  reportedBy?: string;
  keywords?: string[];
  autoFlagged?: boolean;
  confidence?: number;
  categories?: string[];
}

interface ModerationDashboardProps {
  userRole: 'admin' | 'moderator' | 'user'
}

export function ModerationDashboard({ userRole }: ModerationDashboardProps) {
  const [items, setItems] = useState<ModerationItem[]>([])
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null)
  const [filter, setFilter] = useState<{
    status: string
    priority: string
    type: string
  }>({
    status: 'all',
    priority: 'all',
    type: 'all'
  })
  const [loading, setLoading] = useState(true)

  // Mock data - replace with real API calls
  useEffect(() => {
    // Simulate loading moderation items
    setTimeout(() => {
      setItems([
        {
          id: '1',
          type: 'report',
          title: 'Spam Business Listing',
          description: 'User reported a fake business offering guaranteed money-making schemes',
          priority: 'high',
          status: 'pending',
          createdAt: new Date().toISOString(),
          metadata: { reportType: 'spam', reportedBy: 'user123' }
        },
        {
          id: '2',
          type: 'flagged_content',
          title: 'Inappropriate Language',
          description: 'Message content flagged for hate speech keywords',
          priority: 'critical',
          status: 'pending',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          metadata: { keywords: ['hate', 'discrimination'], autoFlagged: true }
        },
        {
          id: '3',
          type: 'image_scan',
          title: 'Potentially NSFW Image',
          description: 'Image flagged by content scanning system',
          priority: 'medium',
          status: 'in_progress',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          metadata: { confidence: 0.8, categories: ['nsfw'] }
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'report':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'flagged_content':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
          </svg>
        )
      case 'image_scan':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )
      default:
        return null
    }
  }

  const filteredItems = items.filter(item => {
    return (
      (filter.status === 'all' || item.status === filter.status) &&
      (filter.priority === 'all' || item.priority === filter.priority) &&
      (filter.type === 'all' || item.type === filter.type)
    )
  })

  const handleItemAction = async (itemId: string, action: 'approve' | 'reject' | 'escalate') => {
    // TODO: Implement API calls for moderation actions
    console.log(`Action ${action} on item ${itemId}`)
    
    // Update local state
    setItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, status: action === 'approve' ? 'resolved' : 'in_progress' }
        : item
    ))
    
    setSelectedItem(null)
  }

  // Only show dashboard to admins and moderators
  if (userRole === 'user') {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-6V7m0 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600">You don&apos;t have permission to access the moderation dashboard.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading moderation queue...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Moderation Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Review and moderate community content to maintain platform safety
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <AccessibleButton variant="primary">
            View Guidelines
          </AccessibleButton>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900">
                {items.filter(item => item.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">High Priority</p>
              <p className="text-2xl font-bold text-gray-900">
                {items.filter(item => item.priority === 'critical' || item.priority === 'high').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {items.filter(item => item.status === 'in_progress').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resolved Today</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status-filter"
              value={filter.status}
              onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div>
            <label htmlFor="priority-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              id="priority-filter"
              value={filter.priority}
              onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              id="type-filter"
              value={filter.type}
              onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="report">User Reports</option>
              <option value="flagged_content">Flagged Content</option>
              <option value="image_scan">Image Scans</option>
            </select>
          </div>
        </div>
      </div>

      {/* Moderation Queue */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Moderation Queue</h3>
          <p className="text-sm text-gray-600 mt-1">
            {filteredItems.length} items requiring review
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredItems.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">All Clear!</h3>
              <p className="text-gray-600">No items match your current filters.</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div key={item.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                        {getTypeIcon(item.type)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {item.title}
                        </h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 ml-4">
                    <AccessibleButton
                      onClick={() => setSelectedItem(item)}
                      variant="outline"
                      size="sm"
                    >
                      Review
                    </AccessibleButton>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedItem && (
        <AccessibleModal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title={`Review: ${selectedItem.title}`}
          size="lg"
        >
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedItem.priority)}`}>
                {selectedItem.priority} priority
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-sm text-gray-600 capitalize">
                {selectedItem.type.replace('_', ' ')}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
              <p className="text-gray-700">{selectedItem.description}</p>
            </div>

            {selectedItem.metadata && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Details</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(selectedItem.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <AccessibleButton
                onClick={() => handleItemAction(selectedItem.id, 'reject')}
                variant="outline"
              >
                Reject
              </AccessibleButton>
              <AccessibleButton
                onClick={() => handleItemAction(selectedItem.id, 'escalate')}
                variant="secondary"
              >
                Escalate
              </AccessibleButton>
              <AccessibleButton
                onClick={() => handleItemAction(selectedItem.id, 'approve')}
                variant="primary"
              >
                Approve
              </AccessibleButton>
            </div>
          </div>
        </AccessibleModal>
      )}
    </div>
  )
}