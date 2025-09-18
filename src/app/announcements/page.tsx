import Link from 'next/link'
import { MainLayout } from '@/components/layout/MainLayout'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import { sampleAnnouncements } from '@/data/sample-content'

const announcementTypeLabels: Record<string, string> = {
  ACHIEVEMENT: 'Achievement',
  NOTICE: 'Community notice',
  BEREAVEMENT: 'Bereavement',
  WEDDING: 'Wedding',
  BIRTH: 'New arrival'
}

export default function AnnouncementsPage() {
  return (
    <MainLayout className="bg-neutral-50">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary-700 to-secondary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            <Badge variant="featured" size="sm" className="mb-4 bg-white/10 text-white border-white/20">
              UiQ Community Newsroom
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Stories that bind us together</h1>
            <p className="text-lg text-primary-100 mb-6">
              Share milestones, honour loved ones, and stay informed about the latest updates from Ugandans across Queensland.
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-primary-100">
              <span>{sampleAnnouncements.length} active announcements</span>
              <span>Updated {formatRelativeTime(sampleAnnouncements[0].publishedAt)}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Latest announcements</h2>
            <p className="text-gray-600 mt-2">
              Celebrations, condolences, and community updates curated by UiQ moderators.
            </p>
          </div>
          <Button size="lg" variant="outline">
            Share an announcement
          </Button>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          {sampleAnnouncements.map((announcement) => (
            <Card key={announcement.id} hoverable className="flex flex-col justify-between">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <Badge variant="outline" className="border-primary-200 text-primary-700">
                    {announcementTypeLabels[announcement.type] ?? announcement.type.toLowerCase()}
                  </Badge>
                  <span className="text-sm text-gray-500">{formatDate(announcement.publishedAt)}</span>
                </div>
                <CardTitle className="text-2xl leading-snug">{announcement.title}</CardTitle>
                <p className="text-sm text-gray-500">Shared by {announcement.author}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 leading-relaxed">{announcement.body}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Updated {formatRelativeTime(announcement.publishedAt)}</span>
                  <Link href={`/announcements/${announcement.id}`} className="inline-flex items-center text-primary-700 font-semibold">
                    View details
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="bg-white border border-gray-200 rounded-2xl p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Support & wellbeing resources</h2>
              <p className="text-gray-600 mt-1">
                Connect families navigating grief, mental health, or milestone celebrations with trusted UiQ support.
              </p>
            </div>
            <Link href="/community" className="text-primary-700 font-semibold">
              Community care hub →
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-700">
            <div className="p-4 rounded-xl bg-primary-50 border border-primary-100">
              <p className="font-semibold text-primary-800 mb-2">Bereavement support circles</p>
              <p>Weekly virtual gatherings offering prayer, counselling, and practical assistance.</p>
            </div>
            <div className="p-4 rounded-xl bg-primary-50 border border-primary-100">
              <p className="font-semibold text-primary-800 mb-2">Celebration planning</p>
              <p>Guides and vendor referrals for weddings, baby showers, and cultural ceremonies.</p>
            </div>
            <div className="p-4 rounded-xl bg-primary-50 border border-primary-100">
              <p className="font-semibold text-primary-800 mb-2">Emergency assistance fund</p>
              <p>Apply for short-term financial support coordinated by UiQ welfare leaders.</p>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  )
}

