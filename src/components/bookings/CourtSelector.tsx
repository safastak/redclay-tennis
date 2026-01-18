'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Court, SportType } from '@/types';
import { Card, CardBody } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';

export interface CourtSelectorProps {
  selectedCourtId: string | null;
  onSelect: (court: Court) => void;
  sportType?: SportType;
}

/**
 * Format currency amount
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Capitalize first letter of a string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

/**
 * CourtSelector component displays available courts as cards.
 * Fetches courts from /api/courts and allows filtering by sport type.
 */
export const CourtSelector: React.FC<CourtSelectorProps> = ({
  selectedCourtId,
  onSelect,
  sportType: initialSportType,
}) => {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSportType, setActiveSportType] = useState<SportType | 'all'>(
    initialSportType || 'all'
  );

  const fetchCourts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ is_active: 'true' });
      if (activeSportType !== 'all') {
        params.set('sport_type', activeSportType);
      }

      const response = await fetch(`/api/courts?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setCourts(data.data.courts);
      } else {
        setError(data.error?.message || 'Failed to fetch courts');
      }
    } catch (err) {
      console.error('Error fetching courts:', err);
      setError('Failed to fetch courts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeSportType]);

  useEffect(() => {
    fetchCourts();
  }, [fetchCourts]);

  // Filter tabs - only show tennis and pickleball as per requirements
  const sportTabs: { value: SportType | 'all'; label: string }[] = [
    { value: 'all', label: 'All Courts' },
    { value: 'tennis', label: 'Tennis' },
    { value: 'pickleball', label: 'Pickleball' },
  ];

  // If initialSportType is provided, don't show tabs
  const showTabs = !initialSportType;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-gray-500">Loading courts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <svg
          className="w-12 h-12 text-red-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <p className="text-red-600 font-medium mb-2">Error Loading Courts</p>
        <p className="text-gray-500 text-sm mb-4">{error}</p>
        <button
          onClick={fetchCourts}
          className="text-[#C75B39] hover:text-[#B54E2F] font-medium text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sport Type Tabs */}
      {showTabs && (
        <div className="flex border-b border-gray-200">
          {sportTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveSportType(tab.value)}
              className={`
                px-4 py-2 text-sm font-medium border-b-2 transition-colors
                ${
                  activeSportType === tab.value
                    ? 'border-[#C75B39] text-[#C75B39]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Courts Grid */}
      {courts.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="w-12 h-12 text-gray-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <p className="text-gray-500">No courts available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courts.map((court) => {
            const isSelected = selectedCourtId === court.id;
            const isUnavailable = court.maintenance_mode;

            return (
              <Card
                key={court.id}
                variant={isSelected ? 'elevated' : 'bordered'}
                hoverable={!isUnavailable}
                className={`
                  cursor-pointer transition-all duration-200
                  ${isSelected ? 'ring-2 ring-[#C75B39] border-[#C75B39]' : ''}
                  ${isUnavailable ? 'opacity-60 cursor-not-allowed' : ''}
                `}
                onClick={() => {
                  if (!isUnavailable) {
                    onSelect(court);
                  }
                }}
              >
                <CardBody>
                  {/* Court name and status */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{court.name}</h4>
                      <p className="text-sm text-gray-500">
                        {capitalize(court.sport_type)}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 bg-[#C75B39] rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Court details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium">Surface:</span>
                      <span>{capitalize(court.surface)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium">Capacity:</span>
                      <span>{court.capacity} players</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="text-sm text-gray-600">Hourly Rate</span>
                      <span className="font-semibold text-[#C75B39]">
                        {formatCurrency(court.hourly_rate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Peak Rate</span>
                      <span className="font-medium text-gray-700">
                        {formatCurrency(court.peak_hour_rate)}
                      </span>
                    </div>
                  </div>

                  {/* Maintenance badge */}
                  {isUnavailable && (
                    <div className="mt-3">
                      <Badge variant="warning" size="sm">
                        Under Maintenance
                      </Badge>
                    </div>
                  )}

                  {/* Amenities */}
                  {court.amenities && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {court.amenities.lighting && (
                        <Badge variant="default" size="sm">
                          Lighting
                        </Badge>
                      )}
                      {court.amenities.covered && (
                        <Badge variant="default" size="sm">
                          Covered
                        </Badge>
                      )}
                      {court.amenities.air_conditioned && (
                        <Badge variant="default" size="sm">
                          A/C
                        </Badge>
                      )}
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

CourtSelector.displayName = 'CourtSelector';

export default CourtSelector;
