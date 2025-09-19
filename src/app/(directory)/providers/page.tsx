import { MainLayout } from '@/components/layout/MainLayout'
import { ProvidersDirectoryClient } from '@/components/providers/ProvidersDirectoryClient'
import { listProviders } from '@server/providers'
import { getSessionUser } from '@server/auth'

interface ProvidersPageProps {
  searchParams?: {
    category?: string
    suburb?: string
  }
}

export default async function ProvidersPage({ searchParams }: ProvidersPageProps) {
  const sessionUser = await getSessionUser()
  const providers = await listProviders({ limit: 200, sessionUser })

  const initialCategory = typeof searchParams?.category === 'string' ? searchParams.category : undefined
  const initialSuburb = typeof searchParams?.suburb === 'string' ? searchParams.suburb : undefined

  return (
    <MainLayout className="py-12">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <ProvidersDirectoryClient
          providers={providers}
          initialFilters={{ category: initialCategory, suburb: initialSuburb }}
        />
      </div>
    </MainLayout>
  )
}
