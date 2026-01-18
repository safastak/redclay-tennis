'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminPageWrapper, AdminCard } from '@/components/layout';
import { Button, Badge, Input, Select, Spinner, Modal } from '@/components/ui';
import { User, UserType, AppRole } from '@/types';
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
  user_type: string;
  app_role: string;
  is_active: string;
  search: string;
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    user_type: '',
    app_role: '',
    is_active: '',
    search: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    user_type: '',
    app_role: '',
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('page', currentPage.toString());
      params.set('per_page', '10');

      if (filters.user_type) params.set('user_type', filters.user_type);
      if (filters.app_role) params.set('app_role', filters.app_role);
      if (filters.is_active) params.set('is_active', filters.is_active);
      if (filters.search) params.set('search', filters.search);

      const res = await fetch(`/api/admin/users?${params.toString()}`);

      if (!res.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await res.json();

      if (data.success) {
        setUsers(data.data.data);
        setPagination(data.data.pagination);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      user_type: user.user_type,
      app_role: user.app_role,
      is_active: user.is_active,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    try {
      setIsSubmitting(true);

      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) {
        throw new Error('Failed to update user');
      }

      const data = await res.json();

      if (data.success) {
        // Update user in list
        setUsers((prev) =>
          prev.map((u) => (u.id === selectedUser.id ? { ...u, ...data.data.user } : u))
        );
        setIsEditModalOpen(false);
        setSelectedUser(null);
      } else {
        throw new Error(data.error?.message || 'Failed to update user');
      }
    } catch (err) {
      console.error('Error updating user:', err);
      alert(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivateUser = async (user: User) => {
    if (!confirm(`Are you sure you want to ${user.is_active ? 'deactivate' : 'activate'} ${user.full_name}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !user.is_active }),
      });

      if (!res.ok) {
        throw new Error('Failed to update user status');
      }

      const data = await res.json();

      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, is_active: !user.is_active } : u))
        );
      }
    } catch (err) {
      console.error('Error updating user status:', err);
      alert('Failed to update user status');
    }
  };

  const getRoleBadgeVariant = (role: AppRole): 'success' | 'warning' | 'info' | 'default' => {
    switch (role) {
      case 'admin':
        return 'success';
      case 'trainer':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getTypeBadgeVariant = (type: UserType): 'success' | 'info' | 'default' => {
    switch (type) {
      case 'premium':
        return 'success';
      default:
        return 'info';
    }
  };

  return (
    <AdminPageWrapper
      title="User Management"
      description="Manage all user accounts"
    >
      {/* Filters */}
      <AdminCard className="mb-6">
        <div className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by name or email..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
            </div>
            <div className="w-[150px]">
              <Select
                options={[
                  { value: '', label: 'All Types' },
                  { value: 'new', label: 'New' },
                  { value: 'premium', label: 'Premium' },
                ]}
                value={filters.user_type}
                onChange={(value) => handleFilterChange('user_type', value)}
                placeholder="User Type"
              />
            </div>
            <div className="w-[150px]">
              <Select
                options={[
                  { value: '', label: 'All Roles' },
                  { value: 'user', label: 'User' },
                  { value: 'trainer', label: 'Trainer' },
                  { value: 'admin', label: 'Admin' },
                ]}
                value={filters.app_role}
                onChange={(value) => handleFilterChange('app_role', value)}
                placeholder="Role"
              />
            </div>
            <div className="w-[150px]">
              <Select
                options={[
                  { value: '', label: 'All Status' },
                  { value: 'true', label: 'Active' },
                  { value: 'false', label: 'Inactive' },
                ]}
                value={filters.is_active}
                onChange={(value) => handleFilterChange('is_active', value)}
                placeholder="Status"
              />
            </div>
            <Button type="submit" variant="primary">
              Search
            </Button>
          </form>
        </div>
      </AdminCard>

      {/* Users Table */}
      <AdminCard>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
              <Button variant="outline" className="mt-4" onClick={() => fetchUsers()}>
                Retry
              </Button>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-[#C75B39]/10 flex items-center justify-center mr-3">
                          {user.profile_image_url ? (
                            <img
                              src={user.profile_image_url}
                              alt={user.full_name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-medium text-[#C75B39]">
                              {user.full_name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.full_name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getTypeBadgeVariant(user.user_type)} size="sm">
                        {user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getRoleBadgeVariant(user.app_role)} size="sm">
                        {user.app_role.charAt(0).toUpperCase() + user.app_role.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={user.is_active ? 'success' : 'error'} size="sm">
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(parseISO(user.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewUser(user)}
                        >
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant={user.is_active ? 'danger' : 'primary'}
                          size="sm"
                          onClick={() => handleDeactivateUser(user)}
                        >
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((currentPage - 1) * pagination.per_page) + 1} to{' '}
              {Math.min(currentPage * pagination.per_page, pagination.total)} of{' '}
              {pagination.total} users
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.has_previous}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {pagination.total_pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.has_next}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </AdminCard>

      {/* View User Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedUser(null);
        }}
        title="User Details"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#C75B39]/10 flex items-center justify-center">
                {selectedUser.profile_image_url ? (
                  <img
                    src={selectedUser.profile_image_url}
                    alt={selectedUser.full_name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-[#C75B39]">
                    {selectedUser.full_name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedUser.full_name}</h3>
                <p className="text-gray-500">{selectedUser.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <label className="text-sm text-gray-500">User Type</label>
                <p className="font-medium">
                  {selectedUser.user_type.charAt(0).toUpperCase() + selectedUser.user_type.slice(1)}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Role</label>
                <p className="font-medium">
                  {selectedUser.app_role.charAt(0).toUpperCase() + selectedUser.app_role.slice(1)}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Phone</label>
                <p className="font-medium">{selectedUser.phone_number || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Status</label>
                <p className="font-medium">
                  {selectedUser.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Created</label>
                <p className="font-medium">
                  {format(parseISO(selectedUser.created_at), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Approved At</label>
                <p className="font-medium">
                  {selectedUser.approved_at
                    ? format(parseISO(selectedUser.approved_at), 'MMM d, yyyy h:mm a')
                    : 'Not approved'}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
        }}
        title="Edit User"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedUser(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveUser}
              loading={isSubmitting}
            >
              Save Changes
            </Button>
          </div>
        }
      >
        {selectedUser && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User: {selectedUser.full_name}
              </label>
              <p className="text-sm text-gray-500">{selectedUser.email}</p>
            </div>
            <Select
              label="User Type"
              options={[
                { value: 'new', label: 'New' },
                { value: 'premium', label: 'Premium' },
              ]}
              value={editForm.user_type}
              onChange={(value) => setEditForm((prev) => ({ ...prev, user_type: value }))}
            />
            <Select
              label="Role"
              options={[
                { value: 'user', label: 'User' },
                { value: 'trainer', label: 'Trainer' },
                { value: 'admin', label: 'Admin' },
              ]}
              value={editForm.app_role}
              onChange={(value) => setEditForm((prev) => ({ ...prev, app_role: value }))}
            />
            <Select
              label="Status"
              options={[
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Inactive' },
              ]}
              value={editForm.is_active.toString()}
              onChange={(value) => setEditForm((prev) => ({ ...prev, is_active: value === 'true' }))}
            />
          </div>
        )}
      </Modal>
    </AdminPageWrapper>
  );
}
