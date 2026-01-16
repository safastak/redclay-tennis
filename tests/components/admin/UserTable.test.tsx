import { render, screen } from '@testing-library/react'
import UserTable from '@/components/admin/UserTable'

describe('UserTable Component', () => {
  const mockUsers = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
      user_type: 'premium' as const,
      role: 'user',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: null,
      user_type: 'new' as const,
      role: 'admin',
      created_at: '2024-01-02T00:00:00Z',
    },
  ]

  it('should render user names correctly', () => {
    render(
      <UserTable
        users={mockUsers}
        pagination={undefined}
        onPageChange={() => {}}
      />
    )

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
  })

  it('should render user emails correctly', () => {
    render(
      <UserTable
        users={mockUsers}
        pagination={undefined}
        onPageChange={() => {}}
      />
    )

    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
  })

  it('should render phone numbers correctly', () => {
    render(
      <UserTable
        users={mockUsers}
        pagination={undefined}
        onPageChange={() => {}}
      />
    )

    expect(screen.getByText('123-456-7890')).toBeInTheDocument()
  })

  it('should render user roles correctly', () => {
    render(
      <UserTable
        users={mockUsers}
        pagination={undefined}
        onPageChange={() => {}}
      />
    )

    expect(screen.getByText('user')).toBeInTheDocument()
    expect(screen.getByText('admin')).toBeInTheDocument()
  })

  it('should display empty state when no users', () => {
    render(
      <UserTable
        users={[]}
        pagination={undefined}
        onPageChange={() => {}}
      />
    )

    expect(screen.getByText('No users found')).toBeInTheDocument()
  })

  it('should not render undefined values', () => {
    const { container } = render(
      <UserTable
        users={mockUsers}
        pagination={undefined}
        onPageChange={() => {}}
      />
    )

    // This would fail if the component tried to render undefined fields
    expect(container.textContent).not.toContain('undefined')
  })
})

describe('UserTable API Compatibility', () => {
  it('should handle API response format', () => {
    // Simulate actual API response structure
    const apiResponseUsers = [
      {
        id: '1',
        name: 'API User',        // Aliased from full_name
        email: 'api@example.com',
        phone: '555-0100',       // Aliased from phone_number
        user_type: 'premium' as const,
        role: 'user',            // Aliased from app_role
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ]

    render(
      <UserTable
        users={apiResponseUsers}
        pagination={undefined}
        onPageChange={() => {}}
      />
    )

    // Verify all fields render correctly
    expect(screen.getByText('API User')).toBeInTheDocument()
    expect(screen.getByText('api@example.com')).toBeInTheDocument()
    expect(screen.getByText('555-0100')).toBeInTheDocument()
    expect(screen.getByText('user')).toBeInTheDocument()
  })

  it('should NOT work with database field names', () => {
    // This simulates the bug - API returning database field names
    const buggyApiResponse = [
      {
        id: '1',
        full_name: 'Buggy User',      // Database field name
        email: 'buggy@example.com',
        phone_number: '555-0200',     // Database field name
        user_type: 'premium' as const,
        app_role: 'user',             // Database field name
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ] as any // Cast to bypass TypeScript

    render(
      <UserTable
        users={buggyApiResponse}
        pagination={undefined}
        onPageChange={() => {}}
      />
    )

    // These should NOT be found because component expects 'name', not 'full_name'
    expect(screen.queryByText('Buggy User')).not.toBeInTheDocument()
    expect(screen.queryByText('555-0200')).not.toBeInTheDocument()
  })
})
