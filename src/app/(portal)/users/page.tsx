import { fetchSchools } from '@/lib/worker';
import { UsersClient } from '@/components/users/users-client';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  let schools: any[] = [];
  try {
    schools = await fetchSchools();
  } catch (err) {
    console.error('Failed to fetch schools for users page:', err);
  }

  return (
    <div className="space-y-8 p-8 lg:p-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1a1c21]">User Management</h1>
        <p className="mt-2 text-sm text-[#7c8b9a]">
          Manage system users, school administrators, teachers, and student profiles across all tenants.
        </p>
      </div>

      <UsersClient schools={schools} />
    </div>
  );
}
