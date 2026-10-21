"use client";

import { useState, useMemo } from 'react';
import { Search, Shield, UserCheck, UserX, Mail, Phone, Building2, Plus, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type School = {
  id: string;
  name: string;
};

type UserItem = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'super_admin' | 'school_admin' | 'teacher' | 'student' | 'parent';
  schoolName: string;
  status: 'active' | 'suspended';
  createdAt: string;
};

const MOCK_USERS: UserItem[] = [
  {
    id: 'u-1',
    name: 'Dr. H. Ahmad Fauzi, M.Pd',
    email: 'ahmad.fauzi@pradita.sch.id',
    phone: '+62 812 3456 7890',
    role: 'school_admin',
    schoolName: 'SMA Unggul Pradita',
    status: 'active',
    createdAt: '2026-01-15',
  },
  {
    id: 'u-2',
    name: 'Siti Rahma, S.Pd',
    email: 'siti.rahma@pradita.sch.id',
    phone: '+62 813 9876 5432',
    role: 'teacher',
    schoolName: 'SMA Unggul Pradita',
    status: 'active',
    createdAt: '2026-02-01',
  },
  {
    id: 'u-3',
    name: 'Budi Santoso',
    email: 'budi.student@pradita.sch.id',
    phone: '+62 811 2233 4455',
    role: 'student',
    schoolName: 'SMA Unggul Pradita',
    status: 'active',
    createdAt: '2026-02-10',
  },
  {
    id: 'u-4',
    name: 'Super Administrator',
    email: 'ptspmanhst@gmail.com',
    phone: '+62 811 0000 0000',
    role: 'super_admin',
    schoolName: 'Platform Central (System Wide)',
    status: 'active',
    createdAt: '2026-01-01',
  },
  {
    id: 'u-5',
    name: 'Dewi Lestari, M.Sc',
    email: 'dewi.lestari@nusantara.sch.id',
    phone: '+62 815 8899 0011',
    role: 'school_admin',
    schoolName: 'SMP Nusantara Cendekia',
    status: 'active',
    createdAt: '2026-03-01',
  },
];

export function UsersClient({ schools, initialUsers }: { schools: School[]; initialUsers?: UserItem[] }) {
  const [users, setUsers] = useState<UserItem[]>(
    initialUsers && initialUsers.length > 0 ? initialUsers : MOCK_USERS
  );
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [schoolFilter, setSchoolFilter] = useState<string>('all');

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.phone.includes(search);
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchSchool = schoolFilter === 'all' || u.schoolName === schoolFilter;
      return matchSearch && matchRole && matchSchool;
    });
  }, [users, search, roleFilter, schoolFilter]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter((u) => u.role.includes('admin')).length,
      teachers: users.filter((u) => u.role === 'teacher').length,
      students: users.filter((u) => u.role === 'student').length,
    };
  }, [users]);

  function toggleStatus(id: string) {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const nextStatus = u.status === 'active' ? 'suspended' : 'active';
          toast.success(`User ${u.name} status changed to ${nextStatus}`);
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  }

  function handleResetPassword(email: string) {
    toast.success(`Password reset instructions sent to ${email}`);
  }

  function handleImpersonate(user: UserItem) {
    toast.success(`Memulai sesi impersonasi sebagai ${user.name} (${user.role})...`);
    setTimeout(() => {
      window.location.href = `/dashboard?impersonate=${user.id}&role=${user.role}&name=${encodeURIComponent(user.name)}`;
    }, 800);
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardContent className="p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-[#7c8b9a]">Total Users</p>
            <p className="mt-2 text-3xl font-extrabold text-[#1a1c21]">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardContent className="p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-[#7c8b9a]">Administrators</p>
            <p className="mt-2 text-3xl font-extrabold text-[#1a1c21]">{stats.admins}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardContent className="p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-[#7c8b9a]">Teachers</p>
            <p className="mt-2 text-3xl font-extrabold text-[#1a1c21]">{stats.teachers}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardContent className="p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-[#7c8b9a]">Students</p>
            <p className="mt-2 text-3xl font-extrabold text-[#1a1c21]">{stats.students}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="rounded-2xl border-slate-100 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#7c8b9a]" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 rounded-xl pl-11 border-slate-200"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-[#1a1c21] focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Roles</option>
                <option value="super_admin">Super Admin</option>
                <option value="school_admin">School Admin</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
                <option value="parent">Parent</option>
              </select>

              <select
                value={schoolFilter}
                onChange={(e) => setSchoolFilter(e.target.value)}
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-[#1a1c21] focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Schools</option>
                <option value="System Wide">System Wide</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden rounded-2xl border-slate-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-[#7c8b9a]">
                <th className="py-4 pl-6 pr-4">User</th>
                <th className="py-4 px-4">Role</th>
                <th className="py-4 px-4">School</th>
                <th className="py-4 px-4">Contact</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 pl-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-[#7c8b9a]">
                    No users found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="py-4 pl-6 pr-4">
                      <div className="font-bold text-[#1a1c21]">{u.name}</div>
                      <div className="text-xs text-[#7c8b9a]">Joined {u.createdAt}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold capitalize ${
                          u.role.includes('admin')
                            ? 'bg-purple-50 text-purple-700'
                            : u.role === 'teacher'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        <Shield className="size-3" />
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 text-sm text-[#1a1c21]">
                        <Building2 className="size-4 text-[#7c8b9a]" />
                        {u.schoolName}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1 text-xs text-[#7c8b9a]">
                        <span className="flex items-center gap-1.5">
                          <Mail className="size-3" /> {u.email}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Phone className="size-3" /> {u.phone}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase ${
                          u.status === 'active'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        {u.status === 'active' ? <UserCheck className="size-3" /> : <UserX className="size-3" />}
                        {u.status}
                      </span>
                    </td>
                    <td className="py-4 pl-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleImpersonate(u)}
                          className="h-9 rounded-lg text-xs font-semibold bg-rose-50/70 text-rose-700 hover:bg-rose-100 border-rose-200"
                        >
                          <LogIn className="mr-1.5 size-3" />
                          Impersonate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResetPassword(u.email)}
                          className="h-9 rounded-lg text-xs font-semibold"
                        >
                          Reset Password
                        </Button>
                        <Button
                          size="sm"
                          variant={u.status === 'active' ? 'destructive' : 'default'}
                          onClick={() => toggleStatus(u.id)}
                          className="h-9 rounded-lg text-xs font-semibold"
                        >
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
