'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminPageWrapper, AdminCard } from '@/components/layout';
import { Button, Badge, Input, Select, Spinner, Modal } from '@/components/ui';
import { Court, SportType, CourtSurface } from '@/types';

export default function CourtsManagementPage() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<{
    name: string;
    sport_type: SportType;
    surface: CourtSurface;
    hourly_rate: number;
    peak_hour_rate: number;
    is_active: boolean;
    maintenance_mode: boolean;
    maintenance_notes: string;
    capacity: number;
  }>({
    name: '',
    sport_type: 'tennis',
    surface: 'clay',
    hourly_rate: 0,
    peak_hour_rate: 0,
    is_active: true,
    maintenance_mode: false,
    maintenance_notes: '',
    capacity: 4,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCourts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch('/api/courts');

      if (!res.ok) {
        throw new Error('Failed to fetch courts');
      }

      const data = await res.json();

      if (data.success) {
        setCourts(data.data.courts);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch courts');
      }
    } catch (err) {
      console.error('Error fetching courts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load courts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourts();
  }, [fetchCourts]);

  const handleEditCourt = (court: Court) => {
    setSelectedCourt(court);
    setEditForm({
      name: court.name,
      sport_type: court.sport_type,
      surface: court.surface,
      hourly_rate: court.hourly_rate,
      peak_hour_rate: court.peak_hour_rate,
      is_active: court.is_active,
      maintenance_mode: court.maintenance_mode,
      maintenance_notes: court.maintenance_notes || '',
      capacity: court.capacity,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveCourt = async () => {
    if (!selectedCourt) return;

    try {
      setIsSubmitting(true);

      const res = await fetch(`/api/courts/${selectedCourt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) {
        throw new Error('Failed to update court');
      }

      const data = await res.json();

      if (data.success) {
        // Update court with data from API response if available, otherwise use editForm
        const updatedCourt = data.data?.court || {
          ...selectedCourt,
          name: editForm.name,
          sport_type: editForm.sport_type,
          surface: editForm.surface,
          hourly_rate: editForm.hourly_rate,
          peak_hour_rate: editForm.peak_hour_rate,
          is_active: editForm.is_active,
          maintenance_mode: editForm.maintenance_mode,
          maintenance_notes: editForm.maintenance_notes,
          capacity: editForm.capacity,
        };
        setCourts((prev) =>
          prev.map((c) => (c.id === selectedCourt.id ? updatedCourt : c))
        );
        setIsEditModalOpen(false);
        setSelectedCourt(null);
      } else {
        throw new Error(data.error?.message || 'Failed to update court');
      }
    } catch (err) {
      console.error('Error updating court:', err);
      alert(err instanceof Error ? err.message : 'Failed to update court');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (court: Court) => {
    try {
      const res = await fetch(`/api/courts/${court.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !court.is_active }),
      });

      if (!res.ok) {
        throw new Error('Failed to update court status');
      }

      const data = await res.json();

      if (data.success) {
        setCourts((prev) =>
          prev.map((c) => (c.id === court.id ? { ...c, is_active: !court.is_active } : c))
        );
      }
    } catch (err) {
      console.error('Error updating court status:', err);
      alert('Failed to update court status');
    }
  };

  const handleToggleMaintenance = async (court: Court) => {
    try {
      const res = await fetch(`/api/courts/${court.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maintenance_mode: !court.maintenance_mode }),
      });

      if (!res.ok) {
        throw new Error('Failed to update maintenance status');
      }

      const data = await res.json();

      if (data.success) {
        setCourts((prev) =>
          prev.map((c) =>
            c.id === court.id ? { ...c, maintenance_mode: !court.maintenance_mode } : c
          )
        );
      }
    } catch (err) {
      console.error('Error updating maintenance status:', err);
      alert('Failed to update maintenance status');
    }
  };

  const getStatusBadge = (court: Court) => {
    if (court.maintenance_mode) {
      return <Badge variant="warning" size="sm">Maintenance</Badge>;
    }
    if (!court.is_active) {
      return <Badge variant="error" size="sm">Inactive</Badge>;
    }
    return <Badge variant="success" size="sm">Active</Badge>;
  };

  const getSurfaceLabel = (surface: CourtSurface) => {
    const labels: Record<CourtSurface, string> = {
      clay: 'Clay',
      hard: 'Hard',
      grass: 'Grass',
      artificial_grass: 'Artificial Grass',
      carpet: 'Carpet',
    };
    return labels[surface] || surface;
  };

  const getSportLabel = (sport: SportType) => {
    const labels: Record<SportType, string> = {
      tennis: 'Tennis',
      padel: 'Padel',
      pickleball: 'Pickleball',
    };
    return labels[sport] || sport;
  };

  return (
    <AdminPageWrapper
      title="Court Management"
      description="Manage courts and pricing"
      actions={
        <Button variant="primary">
          Add Court
        </Button>
      }
    >
      <AdminCard>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
              <Button variant="outline" className="mt-4" onClick={() => fetchCourts()}>
                Retry
              </Button>
            </div>
          ) : courts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No courts found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Court
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sport
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Surface
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pricing
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
                {courts.map((court) => (
                  <tr key={court.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-lg bg-[#C75B39]/10 flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-[#C75B39]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{court.name}</div>
                          <div className="text-xs text-gray-500">Capacity: {court.capacity}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getSportLabel(court.sport_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getSurfaceLabel(court.surface)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div>Standard: ${court.hourly_rate.toFixed(2)}/hr</div>
                        <div className="text-gray-500">Peak: ${court.peak_hour_rate.toFixed(2)}/hr</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(court)}
                      {court.maintenance_notes && (
                        <div className="text-xs text-gray-500 mt-1 truncate max-w-[150px]" title={court.maintenance_notes}>
                          {court.maintenance_notes}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCourt(court)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant={court.maintenance_mode ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => handleToggleMaintenance(court)}
                        >
                          {court.maintenance_mode ? 'End Maint.' : 'Maintenance'}
                        </Button>
                        <Button
                          variant={court.is_active ? 'danger' : 'primary'}
                          size="sm"
                          onClick={() => handleToggleActive(court)}
                        >
                          {court.is_active ? 'Deactivate' : 'Activate'}
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

      {/* Court Summary Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <AdminCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Courts</p>
              <p className="text-2xl font-bold text-gray-900">{courts.length}</p>
            </div>
            <div className="p-3 bg-[#C75B39]/10 rounded-full">
              <svg className="w-6 h-6 text-[#C75B39]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
              </svg>
            </div>
          </div>
        </AdminCard>
        <AdminCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Courts</p>
              <p className="text-2xl font-bold text-green-600">
                {courts.filter((c) => c.is_active && !c.maintenance_mode).length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </AdminCard>
        <AdminCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Under Maintenance</p>
              <p className="text-2xl font-bold text-amber-600">
                {courts.filter((c) => c.maintenance_mode).length}
              </p>
            </div>
            <div className="p-3 bg-amber-100 rounded-full">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Edit Court Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCourt(null);
        }}
        title="Edit Court"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedCourt(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveCourt}
              loading={isSubmitting}
            >
              Save Changes
            </Button>
          </div>
        }
      >
        {selectedCourt && (
          <div className="space-y-4">
            <Input
              label="Court Name"
              value={editForm.name}
              onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Sport Type"
                options={[
                  { value: 'tennis', label: 'Tennis' },
                  { value: 'padel', label: 'Padel' },
                  { value: 'pickleball', label: 'Pickleball' },
                ]}
                value={editForm.sport_type}
                onChange={(value) => setEditForm((prev) => ({ ...prev, sport_type: value as SportType }))}
              />
              <Select
                label="Surface"
                options={[
                  { value: 'clay', label: 'Clay' },
                  { value: 'hard', label: 'Hard' },
                  { value: 'grass', label: 'Grass' },
                  { value: 'artificial_grass', label: 'Artificial Grass' },
                  { value: 'carpet', label: 'Carpet' },
                ]}
                value={editForm.surface}
                onChange={(value) => setEditForm((prev) => ({ ...prev, surface: value as CourtSurface }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Standard Rate ($/hour)"
                type="number"
                value={editForm.hourly_rate.toString()}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    hourly_rate: parseFloat(e.target.value) || 0,
                  }))
                }
              />
              <Input
                label="Peak Rate ($/hour)"
                type="number"
                value={editForm.peak_hour_rate.toString()}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    peak_hour_rate: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <Input
              label="Capacity"
              type="number"
              value={editForm.capacity.toString()}
              onChange={(e) =>
                setEditForm((prev) => ({
                  ...prev,
                  capacity: parseInt(e.target.value) || 0,
                }))
              }
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Status"
                options={[
                  { value: 'true', label: 'Active' },
                  { value: 'false', label: 'Inactive' },
                ]}
                value={editForm.is_active.toString()}
                onChange={(value) =>
                  setEditForm((prev) => ({ ...prev, is_active: value === 'true' }))
                }
              />
              <Select
                label="Maintenance Mode"
                options={[
                  { value: 'false', label: 'No' },
                  { value: 'true', label: 'Yes' },
                ]}
                value={editForm.maintenance_mode.toString()}
                onChange={(value) =>
                  setEditForm((prev) => ({ ...prev, maintenance_mode: value === 'true' }))
                }
              />
            </div>
            {editForm.maintenance_mode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maintenance Notes
                </label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C75B39]/30 focus:border-[#C75B39]"
                  rows={3}
                  value={editForm.maintenance_notes}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, maintenance_notes: e.target.value }))
                  }
                  placeholder="Describe the maintenance being performed..."
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </AdminPageWrapper>
  );
}
