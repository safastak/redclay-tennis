'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchAdminPackages, createPackage, updatePackage } from '@/lib/api/admin'
import PackageRequestCard from '@/components/admin/PackageRequestCard'
import PackageCard from '@/components/admin/PackageCard'
import PackageFormDialog from '@/components/admin/PackageFormDialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function AdminPackagesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<any>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-packages'],
    queryFn: fetchAdminPackages,
  })

  const createMutation = useMutation({
    mutationFn: createPackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-packages'] })
      setIsModalOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updatePackage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-packages'] })
      setIsModalOpen(false)
      setEditingPackage(null)
    },
  })

  const handleSubmit = (formData: any) => {
    if (editingPackage) {
      updateMutation.mutate({ id: editingPackage.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleEdit = (pkg: any) => {
    setEditingPackage(pkg)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingPackage(null)
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading packages...</p>
      </div>
    )
  }

  const pendingRequests = data?.requests || []
  const packages = data?.packages || []

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold">Packages</h1>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">
            Pending Requests ({pendingRequests.length})
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pendingRequests.map((request: any) => (
              <PackageRequestCard key={request.id} request={request} />
            ))}
          </div>
        </div>
      )}

      {/* Active Packages */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Active Packages</h2>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="hidden lg:inline-flex min-h-[48px]"
          >
            <Plus className="h-4 w-4" />
            Create Package
          </Button>
        </div>

        {packages.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border">
            <p className="text-sm text-muted-foreground">No packages yet</p>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 min-h-[48px]"
            >
              <Plus className="h-4 w-4" />
              Create First Package
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg: any) => (
              <PackageCard key={pkg.id} pkg={pkg} onEdit={handleEdit} />
            ))}
          </div>
        )}
      </div>

      {/* Sticky Create Button (Mobile Only) */}
      <div className="lg:hidden fixed bottom-20 right-4 z-40">
        <Button
          onClick={() => setIsModalOpen(true)}
          size="icon"
          className="rounded-full p-4 shadow-lg min-w-[56px] min-h-[56px]"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Package Form Dialog */}
      <PackageFormDialog
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        initialData={editingPackage}
      />
    </div>
  )
}
