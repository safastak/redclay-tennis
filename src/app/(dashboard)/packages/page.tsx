'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, Badge, Spinner, Modal } from '@/components/ui';
import { UserPackageWithRelations, PackageClass } from '@/types';
import { format, parseISO } from 'date-fns';

interface PackageWithUsage extends UserPackageWithRelations {
  totalRemaining: number;
  totalSessions: number;
  usagePercentage: number;
  daysUntilExpiry: number | null;
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<PackageWithUsage[]>([]);
  const [availablePackages, setAvailablePackages] = useState<PackageClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedPackageClass, setSelectedPackageClass] = useState<PackageClass | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        // Note: These API endpoints would need to be implemented
        // For now, we'll show an empty state with placeholder data

        // Simulating no packages for the user
        setPackages([]);
        setAvailablePackages([]);
      } catch (err) {
        console.error('Error fetching packages:', err);
        setError('Failed to load packages');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const getStatusBadgeVariant = (
    status: string
  ): 'success' | 'warning' | 'error' | 'info' | 'default' => {
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
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handlePurchase = async () => {
    if (!selectedPackageClass) return;

    try {
      setIsPurchasing(true);
      // This would call the packages API to purchase
      // For now, show a message
      alert('Package purchase feature coming soon! Please contact us directly to purchase a package.');
      setIsPurchaseModalOpen(false);
      setSelectedPackageClass(null);
    } catch (err) {
      console.error('Error purchasing package:', err);
      setError('Failed to purchase package');
    } finally {
      setIsPurchasing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Packages</h1>
          <p className="text-gray-500 mt-1">
            Manage your session packages and view remaining credits
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsPurchaseModalOpen(true)}
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Buy New Package
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Active Packages */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Active Packages</h2>

        {packages.filter((p) => p.status === 'active').length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {packages
              .filter((p) => p.status === 'active')
              .map((pkg) => (
                <Card key={pkg.id} variant="bordered" className="relative overflow-hidden">
                  {/* Progress bar at top */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
                    <div
                      className="h-full bg-[#C75B39] transition-all duration-300"
                      style={{ width: `${100 - pkg.usagePercentage}%` }}
                    />
                  </div>

                  <div className="pt-3">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {pkg.package_class?.name || 'Package'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {pkg.package_class?.sport_type &&
                            pkg.package_class.sport_type.charAt(0).toUpperCase() +
                              pkg.package_class.sport_type.slice(1)}{' '}
                          Package
                        </p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(pkg.status)}>
                        {getStatusLabel(pkg.status)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-[#C75B39]">
                          {pkg.remaining_court_only_sessions}
                        </div>
                        <div className="text-xs text-gray-500">Court Sessions</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-[#C75B39]">
                          {pkg.remaining_trainer_sessions}
                        </div>
                        <div className="text-xs text-gray-500">Trainer Sessions</div>
                      </div>
                    </div>

                    {pkg.expires_at && (
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {pkg.daysUntilExpiry !== null && pkg.daysUntilExpiry > 0 ? (
                          <span>
                            Expires in {pkg.daysUntilExpiry} day
                            {pkg.daysUntilExpiry !== 1 ? 's' : ''}
                          </span>
                        ) : pkg.daysUntilExpiry === 0 ? (
                          <span className="text-amber-600">Expires today</span>
                        ) : (
                          <span className="text-red-600">Expired</span>
                        )}
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <Link href="/bookings/new">
                        <Button variant="outline" size="sm" fullWidth>
                          Use Package
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        ) : (
          <Card variant="bordered">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Active Packages
              </h3>
              <p className="text-gray-500 mb-4 max-w-sm mx-auto">
                You do not have any active packages. Purchase a package to save on your court bookings.
              </p>
              <Button
                variant="primary"
                onClick={() => setIsPurchaseModalOpen(true)}
              >
                Browse Packages
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Expired/Used Packages */}
      {packages.filter((p) => p.status !== 'active' && p.status !== 'pending').length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Past Packages</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {packages
              .filter((p) => p.status !== 'active' && p.status !== 'pending')
              .map((pkg) => (
                <Card key={pkg.id} variant="bordered" className="opacity-60">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {pkg.package_class?.name || 'Package'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Purchased {format(parseISO(pkg.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge variant={getStatusBadgeVariant(pkg.status)}>
                      {getStatusLabel(pkg.status)}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    Used {pkg.totalSessions - pkg.totalRemaining} of {pkg.totalSessions} sessions
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Package Benefits */}
      <Card variant="bordered">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Why Buy a Package?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-[#C75B39]/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-[#C75B39]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Save Money</h3>
              <p className="text-sm text-gray-500">
                Packages offer significant savings compared to single bookings
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-[#C75B39]/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-[#C75B39]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Quick Booking</h3>
              <p className="text-sm text-gray-500">
                Book courts instantly without payment at checkout
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-[#C75B39]/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-[#C75B39]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Flexible Use</h3>
              <p className="text-sm text-gray-500">
                Use sessions anytime within the validity period
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Purchase Modal */}
      <Modal
        isOpen={isPurchaseModalOpen}
        onClose={() => {
          if (!isPurchasing) {
            setIsPurchaseModalOpen(false);
            setSelectedPackageClass(null);
          }
        }}
        title="Purchase a Package"
      >
        <div className="space-y-4">
          {availablePackages.length > 0 ? (
            <>
              <p className="text-gray-600">
                Select a package to purchase:
              </p>
              <div className="space-y-3">
                {availablePackages.map((pkgClass) => (
                  <div
                    key={pkgClass.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedPackageClass?.id === pkgClass.id
                        ? 'border-[#C75B39] bg-[#C75B39]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPackageClass(pkgClass)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{pkgClass.name}</h4>
                        <p className="text-sm text-gray-500">{pkgClass.description}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {pkgClass.court_only_sessions} court + {pkgClass.trainer_sessions} trainer sessions
                        </p>
                      </div>
                      <div className="text-lg font-semibold text-[#C75B39]">
                        ${pkgClass.price}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsPurchaseModalOpen(false);
                    setSelectedPackageClass(null);
                  }}
                  disabled={isPurchasing}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handlePurchase}
                  disabled={!selectedPackageClass}
                  loading={isPurchasing}
                >
                  Purchase Package
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Coming Soon
              </h3>
              <p className="text-gray-500 mb-4">
                Online package purchases will be available soon. Please contact us directly to purchase a package.
              </p>
              <Button
                variant="outline"
                onClick={() => setIsPurchaseModalOpen(false)}
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
