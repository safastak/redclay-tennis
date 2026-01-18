'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminPageWrapper, AdminCard } from '@/components/layout';
import { Button, Badge, Input, Select, Spinner, Modal } from '@/components/ui';
import { UserPackageWithRelations, PackageClass, PackageStatus } from '@/types';
import { format, parseISO } from 'date-fns';

interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

interface Filters {
  user_id: string;
  status: string;
}

type SectionType = 'user-packages' | 'package-classes';

export default function PackagesManagementPage() {
  const [activeSection, setActiveSection] = useState<SectionType>('user-packages');

  // User Packages state
  const [userPackages, setUserPackages] = useState<UserPackageWithRelations[]>([]);
  const [packagesPagination, setPackagesPagination] = useState<Pagination | null>(null);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packagesError, setPackagesError] = useState<string | null>(null);
  const [packagesPage, setPackagesPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    user_id: '',
    status: '',
  });

  // Package Classes state
  const [packageClasses, setPackageClasses] = useState<PackageClass[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [classesError, setClassesError] = useState<string | null>(null);

  // Modal state
  const [selectedPackage, setSelectedPackage] = useState<UserPackageWithRelations | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
    remaining_court_only_sessions: 0,
    remaining_trainer_sessions: 0,
    admin_adjustment_notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch package classes
  useEffect(() => {
    async function fetchPackageClasses() {
      try {
        setClassesLoading(true);
        // Since there's no separate endpoint for package classes, we'll get unique ones from user packages
        // In a real app, you'd have a /api/admin/package-classes endpoint
        const res = await fetch('/api/admin/packages?per_page=100');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            // Extract unique package classes
            const classes: PackageClass[] = [];
            const seenIds = new Set<string>();
            data.data.data.forEach((pkg: UserPackageWithRelations) => {
              if (pkg.package_class && !seenIds.has(pkg.package_class.id)) {
                seenIds.add(pkg.package_class.id);
                classes.push(pkg.package_class);
              }
            });
            setPackageClasses(classes);
          }
        }
      } catch (err) {
        console.error('Error fetching package classes:', err);
        setClassesError('Failed to load package classes');
      } finally {
        setClassesLoading(false);
      }
    }
    fetchPackageClasses();
  }, []);

  // Fetch user packages
  const fetchUserPackages = useCallback(async () => {
    try {
      setPackagesLoading(true);
      setPackagesError(null);

      const params = new URLSearchParams();
      params.set('page', packagesPage.toString());
      params.set('per_page', '10');

      if (filters.user_id) params.set('user_id', filters.user_id);
      if (filters.status) params.set('status', filters.status);

      const res = await fetch(`/api/admin/packages?${params.toString()}`);

      if (!res.ok) {
        throw new Error('Failed to fetch packages');
      }

      const data = await res.json();

      if (data.success) {
        setUserPackages(data.data.data);
        setPackagesPagination(data.data.pagination);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch packages');
      }
    } catch (err) {
      console.error('Error fetching packages:', err);
      setPackagesError(err instanceof Error ? err.message : 'Failed to load packages');
    } finally {
      setPackagesLoading(false);
    }
  }, [packagesPage, filters]);

  useEffect(() => {
    if (activeSection === 'user-packages') {
      fetchUserPackages();
    }
  }, [fetchUserPackages, activeSection]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPackagesPage(1);
  };

  const handleViewPackage = (pkg: UserPackageWithRelations) => {
    setSelectedPackage(pkg);
    setIsViewModalOpen(true);
  };

  const handleAdjustSessions = (pkg: UserPackageWithRelations) => {
    setSelectedPackage(pkg);
    setAdjustForm({
      remaining_court_only_sessions: pkg.remaining_court_only_sessions,
      remaining_trainer_sessions: pkg.remaining_trainer_sessions,
      admin_adjustment_notes: '',
    });
    setIsAdjustModalOpen(true);
  };

  const handleConfirmPackage = async (pkgId: string) => {
    try {
      const res = await fetch(`/api/admin/packages/${pkgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active', payment_received: true }),
      });

      if (!res.ok) {
        throw new Error('Failed to confirm package');
      }

      const data = await res.json();

      if (data.success) {
        setUserPackages((prev) =>
          prev.map((p) => (p.id === pkgId ? { ...p, status: 'active' as PackageStatus, payment_received: true } : p))
        );
      }
    } catch (err) {
      console.error('Error confirming package:', err);
      alert('Failed to confirm package');
    }
  };

  const handleSaveAdjustment = async () => {
    if (!selectedPackage) return;

    try {
      setIsSubmitting(true);

      const res = await fetch(`/api/admin/packages/${selectedPackage.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          remaining_court_only_sessions: adjustForm.remaining_court_only_sessions,
          remaining_trainer_sessions: adjustForm.remaining_trainer_sessions,
          admin_adjustment_notes: adjustForm.admin_adjustment_notes,
          admin_adjusted: true,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to adjust sessions');
      }

      const data = await res.json();

      if (data.success) {
        setUserPackages((prev) =>
          prev.map((p) =>
            p.id === selectedPackage.id
              ? {
                  ...p,
                  remaining_court_only_sessions: adjustForm.remaining_court_only_sessions,
                  remaining_trainer_sessions: adjustForm.remaining_trainer_sessions,
                  admin_adjusted: true,
                }
              : p
          )
        );
        setIsAdjustModalOpen(false);
        setSelectedPackage(null);
      }
    } catch (err) {
      console.error('Error adjusting sessions:', err);
      alert('Failed to adjust sessions');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeVariant = (status: PackageStatus): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'expired':
        return 'error';
      case 'cancelled':
        return 'error';
      case 'exhausted':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <AdminPageWrapper
      title="Package Management"
      description="Manage package classes and user packages"
    >
      {/* Section Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeSection === 'user-packages'
              ? 'border-[#C75B39] text-[#C75B39]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveSection('user-packages')}
        >
          User Packages
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeSection === 'package-classes'
              ? 'border-[#C75B39] text-[#C75B39]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveSection('package-classes')}
        >
          Package Classes
        </button>
      </div>

      {/* User Packages Section */}
      {activeSection === 'user-packages' && (
        <>
          {/* Filters */}
          <AdminCard className="mb-6">
            <div className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="w-[200px]">
                  <Select
                    options={[
                      { value: '', label: 'All Status' },
                      { value: 'pending', label: 'Pending' },
                      { value: 'active', label: 'Active' },
                      { value: 'expired', label: 'Expired' },
                      { value: 'cancelled', label: 'Cancelled' },
                      { value: 'exhausted', label: 'Exhausted' },
                    ]}
                    value={filters.status}
                    onChange={(value) => handleFilterChange('status', value)}
                    placeholder="Status"
                  />
                </div>
              </div>
            </div>
          </AdminCard>

          {/* User Packages Table */}
          <AdminCard>
            <div className="overflow-x-auto">
              {packagesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : packagesError ? (
                <div className="text-center py-12">
                  <p className="text-red-600">{packagesError}</p>
                  <Button variant="outline" className="mt-4" onClick={() => fetchUserPackages()}>
                    Retry
                  </Button>
                </div>
              ) : userPackages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No packages found</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Package
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sessions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expires
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {userPackages.map((pkg) => (
                      <tr key={pkg.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {pkg.user?.full_name || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {pkg.user?.email || ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {pkg.package_class?.name || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-500">
                            ${pkg.price_paid.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={getStatusBadgeVariant(pkg.status)} size="sm">
                            {pkg.status.charAt(0).toUpperCase() + pkg.status.slice(1)}
                          </Badge>
                          {!pkg.payment_received && pkg.status === 'pending' && (
                            <div className="text-xs text-amber-600 mt-1">Payment pending</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div>Court: {pkg.remaining_court_only_sessions}/{pkg.total_court_only_sessions}</div>
                            <div>Trainer: {pkg.remaining_trainer_sessions}/{pkg.total_trainer_sessions}</div>
                          </div>
                          {pkg.admin_adjusted && (
                            <div className="text-xs text-blue-600 mt-1">Adjusted</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {pkg.expires_at
                            ? format(parseISO(pkg.expires_at), 'MMM d, yyyy')
                            : 'Not set'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewPackage(pkg)}
                            >
                              View
                            </Button>
                            {pkg.status === 'pending' && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleConfirmPackage(pkg.id)}
                              >
                                Confirm
                              </Button>
                            )}
                            {pkg.status === 'active' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAdjustSessions(pkg)}
                              >
                                Adjust
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {packagesPagination && packagesPagination.total_pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {((packagesPage - 1) * packagesPagination.per_page) + 1} to{' '}
                  {Math.min(packagesPage * packagesPagination.per_page, packagesPagination.total)} of{' '}
                  {packagesPagination.total} packages
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!packagesPagination.has_previous}
                    onClick={() => setPackagesPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {packagesPage} of {packagesPagination.total_pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!packagesPagination.has_next}
                    onClick={() => setPackagesPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </AdminCard>
        </>
      )}

      {/* Package Classes Section */}
      {activeSection === 'package-classes' && (
        <AdminCard>
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Package Classes</h3>
            <Button variant="primary" size="sm">
              Create Package Class
            </Button>
          </div>
          <div className="overflow-x-auto">
            {classesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : classesError ? (
              <div className="text-center py-12">
                <p className="text-red-600">{classesError}</p>
              </div>
            ) : packageClasses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No package classes found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sport
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sessions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Validity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {packageClasses.map((pkgClass) => (
                    <tr key={pkgClass.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {pkgClass.name}
                        </div>
                        {pkgClass.description && (
                          <div className="text-xs text-gray-500 truncate max-w-[200px]">
                            {pkgClass.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {pkgClass.sport_type.charAt(0).toUpperCase() + pkgClass.sport_type.slice(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div>Court: {pkgClass.court_only_sessions}</div>
                        <div>Trainer: {pkgClass.trainer_sessions}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${pkgClass.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {pkgClass.validity_days} days
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={pkgClass.is_active ? 'success' : 'error'} size="sm">
                          {pkgClass.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </AdminCard>
      )}

      {/* View Package Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedPackage(null);
        }}
        title="Package Details"
        size="lg"
      >
        {selectedPackage && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant={getStatusBadgeVariant(selectedPackage.status)}>
                {selectedPackage.status.charAt(0).toUpperCase() + selectedPackage.status.slice(1)}
              </Badge>
              {!selectedPackage.payment_received && (
                <Badge variant="warning">Payment Pending</Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <label className="text-sm text-gray-500">User</label>
                <p className="font-medium">{selectedPackage.user?.full_name || 'Unknown'}</p>
                <p className="text-sm text-gray-500">{selectedPackage.user?.email}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Package</label>
                <p className="font-medium">{selectedPackage.package_class?.name || 'Unknown'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Price Paid</label>
                <p className="font-medium">${selectedPackage.price_paid.toFixed(2)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Payment Method</label>
                <p className="font-medium">
                  {selectedPackage.payment_method
                    ? selectedPackage.payment_method.replace('_', ' ').toUpperCase()
                    : 'Not specified'}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <label className="text-sm text-gray-500">Sessions</label>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-[#C75B39]">
                    {selectedPackage.remaining_court_only_sessions}
                  </div>
                  <div className="text-sm text-gray-500">
                    of {selectedPackage.total_court_only_sessions} court sessions
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-[#C75B39]">
                    {selectedPackage.remaining_trainer_sessions}
                  </div>
                  <div className="text-sm text-gray-500">
                    of {selectedPackage.total_trainer_sessions} trainer sessions
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Requested At</label>
                <p className="font-medium">
                  {format(parseISO(selectedPackage.requested_at), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Confirmed At</label>
                <p className="font-medium">
                  {selectedPackage.confirmed_at
                    ? format(parseISO(selectedPackage.confirmed_at), 'MMM d, yyyy h:mm a')
                    : 'Not confirmed'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Expires At</label>
                <p className="font-medium">
                  {selectedPackage.expires_at
                    ? format(parseISO(selectedPackage.expires_at), 'MMM d, yyyy')
                    : 'Not set'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Last Used</label>
                <p className="font-medium">
                  {selectedPackage.last_used_at
                    ? format(parseISO(selectedPackage.last_used_at), 'MMM d, yyyy')
                    : 'Never'}
                </p>
              </div>
            </div>

            {selectedPackage.admin_notes && (
              <div className="pt-4 border-t">
                <label className="text-sm text-gray-500">Admin Notes</label>
                <p className="mt-1 text-sm">{selectedPackage.admin_notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Adjust Sessions Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => {
          setIsAdjustModalOpen(false);
          setSelectedPackage(null);
        }}
        title="Adjust Sessions"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsAdjustModalOpen(false);
                setSelectedPackage(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveAdjustment}
              loading={isSubmitting}
            >
              Save Changes
            </Button>
          </div>
        }
      >
        {selectedPackage && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Package: {selectedPackage.package_class?.name}
              </label>
              <p className="text-sm text-gray-500">
                User: {selectedPackage.user?.full_name}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Court Sessions (Total: {selectedPackage.total_court_only_sessions})
              </label>
              <Input
                type="number"
                value={adjustForm.remaining_court_only_sessions.toString()}
                onChange={(e) =>
                  setAdjustForm((prev) => ({
                    ...prev,
                    remaining_court_only_sessions: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trainer Sessions (Total: {selectedPackage.total_trainer_sessions})
              </label>
              <Input
                type="number"
                value={adjustForm.remaining_trainer_sessions.toString()}
                onChange={(e) =>
                  setAdjustForm((prev) => ({
                    ...prev,
                    remaining_trainer_sessions: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adjustment Notes
              </label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C75B39]/30 focus:border-[#C75B39]"
                rows={3}
                value={adjustForm.admin_adjustment_notes}
                onChange={(e) =>
                  setAdjustForm((prev) => ({
                    ...prev,
                    admin_adjustment_notes: e.target.value,
                  }))
                }
                placeholder="Reason for adjustment..."
              />
            </div>
          </div>
        )}
      </Modal>
    </AdminPageWrapper>
  );
}
