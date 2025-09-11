'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Star, ThumbsUp, Camera, X, ChevronDown, Flag, Shield } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Modal } from '../ui/Modal'
import { cn } from '@/lib/utils'

// Review data interfaces
interface ReviewPhoto {
  id: string
  url: string
  alt: string
  reviewId: string
}

interface Review {
  id: string
  businessId: string
  userId: string
  userName: string
  userAvatar?: string
  rating: number
  title: string
  content: string
  photos: ReviewPhoto[]
  helpfulCount: number
  timestamp: Date
  verified: boolean
  response?: {
    content: string
    timestamp: Date
    businessName: string
  }
}

interface ReviewStats {
  totalReviews: number
  averageRating: number
  ratingBreakdown: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
}

interface ReviewWidgetProps {
  businessId: string
  reviews: Review[]
  stats: ReviewStats
  onSubmitReview?: (review: Omit<Review, 'id' | 'timestamp' | 'helpfulCount'>) => void
  onMarkHelpful?: (reviewId: string) => void
  className?: string
  allowPhotos?: boolean
  maxPhotos?: number
}

// Sort options
const SORT_OPTIONS = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'helpful', label: 'Most Helpful' },
  { value: 'highest', label: 'Highest Rating' },
  { value: 'lowest', label: 'Lowest Rating' }
]

// Profanity filter (basic implementation)
const containsProfanity = (text: string): boolean => {
  const profanityWords = ['spam', 'fake', 'scam'] // Simplified list
  const lowerText = text.toLowerCase()
  return profanityWords.some(word => lowerText.includes(word))
}

// Safety check for inappropriate content
const performSafetyCheck = (content: string): { safe: boolean; issues: string[] } => {
  const issues: string[] = []
  
  if (containsProfanity(content)) {
    issues.push('Inappropriate language detected')
  }
  
  if (content.length < 10) {
    issues.push('Review content too short')
  }
  
  if (content.length > 2000) {
    issues.push('Review content too long')
  }
  
  // Check for promotional content
  if (content.toLowerCase().includes('http') || content.toLowerCase().includes('www.')) {
    issues.push('External links not allowed')
  }
  
  return {
    safe: issues.length === 0,
    issues
  }
}

export function ReviewWidget({
  businessId,
  reviews,
  stats,
  onSubmitReview,
  onMarkHelpful,
  className = '',
  allowPhotos = true,
  maxPhotos = 5
}: ReviewWidgetProps) {
  const [sortBy, setSortBy] = useState('recent')
  const [showWriteModal, setShowWriteModal] = useState(false)
  const [showPhotoGrid, setShowPhotoGrid] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState<ReviewPhoto[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // New review form state
  const [newReview, setNewReview] = useState({
    rating: 0,
    title: '',
    content: '',
    photos: [] as File[]
  })
  const [reviewErrors, setReviewErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sort reviews based on selected option
  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case 'helpful':
        return b.helpfulCount - a.helpfulCount
      case 'highest':
        return b.rating - a.rating
      case 'lowest':
        return a.rating - b.rating
      case 'recent':
      default:
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    }
  })

  // Get all photos from reviews
  const allPhotos = reviews.flatMap(review => review.photos)

  // Rating stars component
  const RatingStars = ({ 
    rating, 
    interactive = false, 
    onRatingChange,
    size = 'sm' 
  }: { 
    rating: number
    interactive?: boolean
    onRatingChange?: (rating: number) => void
    size?: 'sm' | 'md' | 'lg'
  }) => {
    const sizes = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    }

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            disabled={!interactive}
            onClick={() => interactive && onRatingChange && onRatingChange(star)}
            className={cn(
              sizes[size],
              interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default',
              rating >= star ? 'text-yellow-400' : 'text-gray-300'
            )}
          >
            <Star className="w-full h-full fill-current" />
          </button>
        ))}
      </div>
    )
  }

  // Rating histogram component
  const RatingHistogram = () => (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map((rating) => {
        const count = stats.ratingBreakdown[rating as keyof typeof stats.ratingBreakdown]
        const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0

        return (
          <div key={rating} className="flex items-center gap-3">
            <div className="flex items-center gap-1 w-8">
              <span className="text-sm text-gray-700">{rating}</span>
              <Star className="w-3 h-3 text-yellow-400 fill-current" />
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
          </div>
        )
      })}
    </div>
  )

  // Handle photo upload
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const remainingSlots = maxPhotos - newReview.photos.length
    const filesToAdd = files.slice(0, remainingSlots)

    // Basic validation
    const validFiles = filesToAdd.filter(file => {
      const isValidType = file.type.startsWith('image/')
      const isValidSize = file.size <= 5 * 1024 * 1024 // 5MB limit
      return isValidType && isValidSize
    })

    setNewReview(prev => ({
      ...prev,
      photos: [...prev.photos, ...validFiles]
    }))
  }

  // Remove photo from new review
  const removePhoto = (index: number) => {
    setNewReview(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }))
  }

  // Submit new review
  const handleSubmitReview = async () => {
    setIsSubmitting(true)
    setReviewErrors([])

    // Validate review
    const errors: string[] = []
    
    if (newReview.rating === 0) {
      errors.push('Please select a rating')
    }
    
    if (!newReview.title.trim()) {
      errors.push('Please provide a review title')
    }
    
    if (!newReview.content.trim()) {
      errors.push('Please write your review')
    }

    // Safety check
    const safetyCheck = performSafetyCheck(newReview.content + ' ' + newReview.title)
    if (!safetyCheck.safe) {
      errors.push(...safetyCheck.issues)
    }

    if (errors.length > 0) {
      setReviewErrors(errors)
      setIsSubmitting(false)
      return
    }

    // Convert photos to URLs (in real app, upload to server)
    const photoUrls: ReviewPhoto[] = newReview.photos.map((file, index) => ({
      id: `temp-${Date.now()}-${index}`,
      url: URL.createObjectURL(file),
      alt: `Review photo ${index + 1}`,
      reviewId: 'temp'
    }))

    const reviewData = {
      businessId,
      userId: 'current-user', // Would come from auth
      userName: 'Current User', // Would come from auth
      rating: newReview.rating,
      title: newReview.title,
      content: newReview.content,
      photos: photoUrls,
      verified: false
    }

    if (onSubmitReview) {
      onSubmitReview(reviewData)
    }

    // Reset form
    setNewReview({
      rating: 0,
      title: '',
      content: '',
      photos: []
    })
    setShowWriteModal(false)
    setIsSubmitting(false)
  }

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  return (
    <>
      <Card className={cn("p-6", className)}>
        {/* Header with stats */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Reviews & Ratings</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="text-3xl font-bold text-gray-900">
                  {stats.averageRating.toFixed(1)}
                </div>
                <div>
                  <RatingStars rating={Math.round(stats.averageRating)} size="md" />
                  <p className="text-sm text-gray-600">
                    {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <Button onClick={() => setShowWriteModal(true)}>
            Write Review
          </Button>
        </div>

        {/* Rating histogram */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Breakdown</h3>
          <RatingHistogram />
        </div>

        {/* Photos section */}
        {allPhotos.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Photos ({allPhotos.length})</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPhotoGrid(true)}
              >
                View All
              </Button>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {allPhotos.slice(0, 6).map((photo) => (
                <div
                  key={photo.id}
                  className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setShowPhotoGrid(true)}
                >
                  <Image
                    src={photo.url}
                    alt={photo.alt}
                    width={100}
                    height={100}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sort controls */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Reviews ({sortedReviews.length})
          </h3>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Reviews list */}
        <div className="space-y-6">
          {sortedReviews.map((review) => (
            <div key={review.id} className="border-b border-gray-200 last:border-b-0 pb-6 last:pb-0">
              {/* Review header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    {review.userAvatar ? (
                      <Image src={review.userAvatar} alt={review.userName} width={40} height={40} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-sm font-semibold text-gray-600">
                        {review.userName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{review.userName}</p>
                      {review.verified && (
                        <Shield className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <RatingStars rating={review.rating} />
                      <span className="text-sm text-gray-500">{formatDate(review.timestamp)}</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Flag className="w-4 h-4" />
                </Button>
              </div>

              {/* Review content */}
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
                <p className="text-gray-700 leading-relaxed">{review.content}</p>
              </div>

              {/* Review photos */}
              {review.photos.length > 0 && (
                <div className="mb-4">
                  <div className="flex gap-2 overflow-x-auto">
                    {review.photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                        onClick={() => {
                          setSelectedPhotos(review.photos)
                          setShowPhotoG(true)
                        }}
                      >
                        <Image
                          src={photo.url}
                          alt={photo.alt}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Review actions */}
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onMarkHelpful && onMarkHelpful(review.id)}
                  className="flex items-center gap-2"
                >
                  <ThumbsUp className="w-4 h-4" />
                  Helpful ({review.helpfulCount})
                </Button>
              </div>

              {/* Business response */}
              {review.response && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-l-blue-500">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-medium text-blue-900">Response from {review.response.businessName}</p>
                    <span className="text-sm text-blue-600">{formatDate(review.response.timestamp)}</span>
                  </div>
                  <p className="text-blue-800">{review.response.content}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty state */}
        {sortedReviews.length === 0 && (
          <div className="text-center py-12">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
            <p className="text-gray-600 mb-4">Be the first to share your experience!</p>
            <Button onClick={() => setShowWriteModal(true)}>
              Write First Review
            </Button>
          </div>
        )}
      </Card>

      {/* Write Review Modal */}
      <Modal
        isOpen={showWriteModal}
        onClose={() => setShowWriteModal(false)}
        title="Write a Review"
        className="max-w-2xl"
      >
        <div className="space-y-6">
          {/* Rating selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Rating *
            </label>
            <RatingStars
              rating={newReview.rating}
              interactive
              onRatingChange={(rating) => setNewReview(prev => ({ ...prev, rating }))}
              size="lg"
            />
          </div>

          {/* Review title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Title *
            </label>
            <input
              type="text"
              value={newReview.title}
              onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Summarize your experience"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              maxLength={100}
            />
          </div>

          {/* Review content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Review *
            </label>
            <textarea
              value={newReview.content}
              onChange={(e) => setNewReview(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Share details about your experience..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              maxLength={2000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {newReview.content.length}/2000 characters
            </p>
          </div>

          {/* Photo upload */}
          {allowPhotos && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Photos (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <div className="text-center">
                  <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={newReview.photos.length >= maxPhotos}
                  >
                    Add Photos ({newReview.photos.length}/{maxPhotos})
                  </Button>
                </div>
              </div>

              {/* Photo previews */}
              {newReview.photos.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {newReview.photos.map((file, index) => (
                    <div key={index} className="relative">
                      <Image
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        width={80}
                        height={80}
                        className="w-full h-20 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Error messages */}
          {reviewErrors.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <ul className="text-sm text-red-600 space-y-1">
                {reviewErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Submit buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowWriteModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmitReview}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Photo Grid Modal */}
      <Modal
        isOpen={showPhotoGrid}
        onClose={() => setShowPhotoGrid(false)}
        title="Review Photos"
        className="max-w-4xl"
      >
        <div className="grid grid-cols-3 gap-4">
          {(selectedPhotos.length > 0 ? selectedPhotos : allPhotos).map((photo) => (
            <div key={photo.id} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={photo.url}
                alt={photo.alt}
                width={200}
                height={200}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </Modal>
    </>
  )
}