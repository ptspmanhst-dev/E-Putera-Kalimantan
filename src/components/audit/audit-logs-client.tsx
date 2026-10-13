"use client";

import { useState, useMemo } from 'react';
import { Search, ShieldAlert, CheckCircle2, AlertTriangle, Info, Download, RefreshCw, Trash2, Clock, User } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type AuditLogItem = {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  category: 'Authentication' | 'School Management' | 'System';
  status: 'success' | 'warning' | 'info';
  details: string;
  ip: string;
};

const INITIAL_LOGS: AuditLogItem[] = [
  {
    id: 'log-1',
    timestamp: '2026-10-13 14:02:15',
    actor: 'admin@edumanager.edu',
    action: 'Demo Quick Login (Auth Bypass)',
    category: 'Authentication',
    status: 'success',
    details: 'User successfully logged in via demo bypass fallback session.',
    ip: '127.0.0.1',
  },
  {
    id: 'log-2',
    timestamp: '2026-10-13 13:50:10',
    actor: 'system@edumanager.edu',
    action: 'Session Token Verified',
    category: 'Authentication',
    status: 'success',
    details: 'Issued HttpOnly session cookie sa_session (lifetime 7 days).',
    ip: '127.0.0.1',
  },
  {
    id: 'log-3',
    timestamp: '2026-10-13 12:15:44',
    actor: 'ahmad.fauzi@pradita.sch.id',
    action: 'School Details Updated',
    category: 'School Management',
    status: 'success',
    details: 'Updated motto and phone for SMA Unggul Pradita.',
    ip: '192.168.1.45',
  },
  {
    id: 'log-4',
    timestamp: '2026-10-13 11:05:22',
    actor: 'admin@edumanager.edu',
    action: 'School Onboarded',
    category: 'School Management',
    status: 'success',
    details: 'Successfully provisioned new tenant school: SMP Nusantara Cendekia.',
    ip: '127.0.0.1',
  },
  {
    id: 'log-5',
    timestamp: '2026-10-13 10:00:01',
    actor: 'system',
    action: 'Database Schema Synchronized',
    category: 'System',
    status: 'info',
    details: 'SQLite / Drizzle migrations checked successfully.',
    ip: 'localhost',
  },
  {
    id: 'log-6',
    timestamp: '2026-10-13 09:30:12',
    actor: 'unknown',
    action: 'Login Attempt Bottleneck / Retry',
    category: 'Authentication',
    status: 'warning',
    details: 'Multiple rapid sign-in attempts detected from IP 203.0.113.42.',
    ip: '203.0.113.42',
  },
];

export function AuditLogsClient() {
  const [logs, setLogs] = useState<AuditLogItem[]>(INITIAL_LOGS);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        log.actor.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.details.toLowerCase().includes(search.toLowerCase()) ||
        log.ip.includes(search);
      const matchCategory = categoryFilter === 'all' || log.category === categoryFilter;
      const matchStatus = statusFilter === 'all' || log.status === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [logs, search, categoryFilter, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: logs.length,
      auth: logs.filter((l) => l.category === 'Authentication').length,
      schools: logs.filter((l) => l.category === 'School Management').length,
      warnings: logs.filter((l) => l.status === 'warning').length,
    };
  }, [logs]);

  function handleClearLogs() {
    setLogs([]);
    toast.success('Audit logs cleared');
  }

  function handleExportCSV() {
    const headers = ['ID,Timestamp,Actor,Action,Category,Status,Details,IP\n'];
    const rows = logs.map(
      (l) => `"${l.id}","${l.timestamp}","${l.actor}","${l.action}","${l.category}","${l.status}","${l.details}","${l.ip}"\n`
    );
    const blob = new Blob([...headers, ...rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Audit logs exported as CSV');
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardContent className="p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-[#7c8b9a]">Total Log Events</p>
            <p className="mt-2 text-3xl font-extrabold text-[#1a1c21]">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardContent className="p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-[#7c8b9a]">Auth & Login Events</p>
            <p className="mt-2 text-3xl font-extrabold text-[#1a1c21]">{stats.auth}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardContent className="p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-[#7c8b9a]">School Management</p>
            <p className="mt-2 text-3xl font-extrabold text-[#1a1c21]">{stats.schools}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardContent className="p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-[#7c8b9a]">Bottleneck Warnings</p>
            <p className="mt-2 text-3xl font-extrabold text-amber-600">{stats.warnings}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Actions Bar */}
      <Card className="rounded-2xl border-slate-100 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#7c8b9a]" />
              <Input
                placeholder="Search audit trail by actor, action, or details..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 rounded-xl pl-11 border-slate-200"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-[#1a1c21] focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Categories</option>
                <option value="Authentication">Authentication</option>
                <option value="School Management">School Management</option>
                <option value="System">System</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-[#1a1c21] focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>

              <Button
                variant="outline"
                onClick={handleExportCSV}
                className="h-12 rounded-xl px-4 font-semibold border-slate-200"
              >
                <Download className="mr-2 size-4" /> Export CSV
              </Button>

              <Button
                variant="outline"
                onClick={handleClearLogs}
                className="h-12 rounded-xl px-4 font-semibold text-rose-600 hover:bg-rose-50 border-slate-200"
              >
                <Trash2 className="mr-2 size-4" /> Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="overflow-hidden rounded-2xl border-slate-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-[#7c8b9a]">
                <th className="py-4 pl-6 pr-4">Timestamp</th>
                <th className="py-4 px-4">Actor</th>
                <th className="py-4 px-4">Action</th>
                <th className="py-4 px-4">Category</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 pl-4 pr-6">Details & IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-[#7c8b9a]">
                    No audit log records found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="py-4 pl-6 pr-4 font-mono text-xs text-[#7c8b9a]">
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        {log.timestamp}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="flex items-center gap-1.5 font-medium text-[#1a1c21]">
                        <User className="size-3.5 text-[#7c8b9a]" />
                        {log.actor}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-bold text-[#1a1c21]">{log.action}</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {log.category}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase ${
                          log.status === 'success'
                            ? 'bg-emerald-50 text-emerald-600'
                            : log.status === 'warning'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-blue-50 text-blue-600'
                        }`}
                      >
                        {log.status === 'success' && <CheckCircle2 className="size-3" />}
                        {log.status === 'warning' && <AlertTriangle className="size-3" />}
                        {log.status === 'info' && <Info className="size-3" />}
                        {log.status}
                      </span>
                    </td>
                    <td className="py-4 pl-4 pr-6">
                      <div className="text-xs text-[#1a1c21]">{log.details}</div>
                      <div className="mt-0.5 font-mono text-[10px] text-[#7c8b9a]">IP: {log.ip}</div>
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
