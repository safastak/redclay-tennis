'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PackageCard } from '@/components/packages/PackageCard'
import { ActivePackageCard } from '@/components/packages/ActivePackageCard'
import { Package } from '@/types/database'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, Package as PackageIcon } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function PackagesPage() {
  const [activeTab, setActiveTab] = useState('browse')
  const queryClient = useQueryClient()

  // Fetch available packages
  const { data: packagesData, isLoading: packagesLoading } = useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      const response = await fetch('/api/packages')
      if (!response.ok) throw new Error('Failed to fetch packages')
      return response.json()
    },
  })

  // Fetch user's packages
  const { data: userPackagesData, isLoading: userPackagesLoading } = useQuery({
    queryKey: ['user-packages'],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/user-packages', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch user packages')
      return response.json()
    },
  })

  // Request package mutation
  const requestPackageMutation = useMutation({
    mutationFn: async (packageId: string) => {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/user-packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ package_id: packageId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to request package')
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success('Package request submitted!', {
        description: 'Your package purchase request has been sent. Complete payment to activate.',
      })
      queryClient.invalidateQueries({ queryKey: ['user-packages'] })
      setActiveTab('my-packages')
    },
    onError: (error: Error) => {
      toast.error('Request failed', {
        description: error.message,
      })
    },
  })

  const handleRequestPackage = (pkg: Package) => {
    requestPackageMutation.mutate(pkg.id)
  }

  const handleViewDetails = (id: string) => {
    // TODO: Navigate to package details page or open modal
    toast.info('Package details coming soon')
  }

  const handleBookNow = (id: string) => {
    // TODO: Navigate to booking page with package pre-selected
    toast.info('Booking with package coming soon')
  }

  const packages = packagesData?.packages || []
  const userPackages = userPackagesData?.packages || []

  // Determine featured package (highest price or most sessions)
  const featuredPackageId = packages.length > 0
    ? packages.reduce((max: Package, pkg: Package) =>
        (pkg.court_only_sessions + pkg.trainer_sessions) >
        (max.court_only_sessions + max.trainer_sessions)
          ? pkg
          : max
      ).id
    : null

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Packages</h1>
        <p className="text-muted-foreground">
          Browse and purchase session packages for better value
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="browse">Buy Packages</TabsTrigger>
          <TabsTrigger value="my-packages">
            My Packages
            {userPackages.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                {userPackages.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Browse Packages Tab */}
        <TabsContent value="browse" className="mt-0">
          {packagesLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[400px] rounded-lg" />
              ))}
            </div>
          ) : packages.length === 0 ? (
            <Alert>
              <PackageIcon className="h-4 w-4" />
              <AlertDescription>
                No packages available at the moment. Check back soon!
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg: Package) => (
                <PackageCard
                  key={pkg.id}
                  package={pkg}
                  onRequestPackage={handleRequestPackage}
                  isFeatured={pkg.id === featuredPackageId}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* My Packages Tab */}
        <TabsContent value="my-packages" className="mt-0">
          {userPackagesLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-[300px] rounded-lg" />
              ))}
            </div>
          ) : userPackages.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You don't have any packages yet. Browse available packages to get started!
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {userPackages.map((userPkg: any) => (
                <ActivePackageCard
                  key={userPkg.id}
                  userPackage={userPkg}
                  onViewDetails={handleViewDetails}
                  onBookNow={handleBookNow}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
