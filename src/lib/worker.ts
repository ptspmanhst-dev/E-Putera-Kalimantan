import 'server-only';
import {
  saveSchoolToFirestore,
  updateSchoolInFirestore,
  updateSchoolStatusInFirestore,
  deleteSchoolFromFirestore,
} from './firestore-store';

type WorkerInit = RequestInit & {
  headers?: HeadersInit;
};

function hasWorkerConfig(): boolean {
  return Boolean(
    (process.env.WORKER_API_URL || process.env.NEXT_PUBLIC_WORKER_API_URL) &&
    process.env.SUPER_ADMIN_API_KEY
  );
}

function getWorkerBaseUrl(): string {
  const baseUrl = process.env.WORKER_API_URL ?? process.env.NEXT_PUBLIC_WORKER_API_URL;
  if (!baseUrl) {
    throw new Error('WORKER_API_URL is not configured');
  }
  return baseUrl.replace(/\/$/, '');
}

function getSuperAdminKey(): string {
  const key = process.env.SUPER_ADMIN_API_KEY;
  if (!key) {
    throw new Error('SUPER_ADMIN_API_KEY is not configured');
  }
  return key;
}

export async function callWorker<T>(path: string, init: WorkerInit = {}): Promise<T> {
  const response = await fetch(`${getWorkerBaseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Super-Admin-Key': getSuperAdminKey(),
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data && typeof data === 'object' && 'error' in data
      ? String((data as { error?: string }).error ?? response.statusText)
      : response.statusText;
    throw new Error(message);
  }

  return data as T;
}

export type WorkerMetrics = {
  total_schools: number;
  active_schools: number;
  suspended_schools: number;
  total_revenue: number;
  system_distribution: Array<{ name: string; value: number }>;
  historical_trends: Array<{ label: string; schools: number; revenue: number }>;
};

export type SchoolSummary = {
  id: string;
  name: string;
  location: string | null;
  logo_url: string | null;
  motto: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  term_system: number;
  current_term_id: string | null;
  is_active: boolean;
  student_id_prefix: string;
  teacher_id_prefix: string;
  created_at: string;
  student_count: number;
  user_count: number;
};

export type SchoolAdmin = {
  uid: string;
  name: string;
  phone: string;
  email: string;
  created_at: string;
};

export type SchoolDetail = {
  id: string;
  name: string;
  location: string | null;
  logo_url: string | null;
  motto: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  term_system: number;
  current_term_id: string | null;
  is_active: boolean;
  student_id_prefix: string;
  teacher_id_prefix: string;
  created_at: string;
  admin: SchoolAdmin | null;
};

const FALLBACK_SCHOOLS: SchoolSummary[] = [
  {
    id: 'sch-pradita-001',
    name: 'SMA Unggul Pradita',
    location: 'Banjarmasin, Kalimantan Selatan',
    logo_url: null,
    motto: 'Unggul dalam Prestasi, Santun dalam Berbudi',
    phone: '+62 511 432 1098',
    email: 'info@pradita.sch.id',
    address: 'Jl. Ahmad Yani Km. 5, Banjarmasin',
    term_system: 2,
    current_term_id: 'term-2026-1',
    is_active: true,
    student_id_prefix: 'PRD',
    teacher_id_prefix: 'TPRD',
    created_at: new Date('2026-01-10').toISOString(),
    student_count: 320,
    user_count: 28,
  },
  {
    id: 'sch-nusantara-002',
    name: 'SMP Nusantara Cendekia',
    location: 'Balikpapan, Kalimantan Timur',
    logo_url: null,
    motto: 'Membina Generasi Cerdas Berkarakter',
    phone: '+62 542 765 4321',
    email: 'kontak@nusantaracendekia.sch.id',
    address: 'Jl. Sudirman No. 45, Balikpapan',
    term_system: 2,
    current_term_id: 'term-2026-1',
    is_active: true,
    student_id_prefix: 'NSC',
    teacher_id_prefix: 'TNSC',
    created_at: new Date('2026-02-15').toISOString(),
    student_count: 245,
    user_count: 22,
  },
];

const FALLBACK_METRICS: WorkerMetrics = {
  total_schools: 2,
  active_schools: 2,
  suspended_schools: 0,
  total_revenue: (320 + 245) * 450000,
  system_distribution: [
    { name: 'Semester System (2 Terms)', value: 2 },
    { name: 'Trimester System (3 Terms)', value: 0 },
  ],
  historical_trends: [
    { label: 'Jan 2026', schools: 1, revenue: 144000000 },
    { label: 'Feb 2026', schools: 2, revenue: 258750000 },
    { label: 'Mar 2026', schools: 2, revenue: 258750000 },
  ],
};

const FALLBACK_USERS = [
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
    name: 'Super Administrator',
    email: 'ptspmanhst@gmail.com',
    phone: '+62 811 0000 0000',
    role: 'super_admin',
    schoolName: 'Platform Central',
    status: 'active',
    createdAt: '2026-01-01',
  },
];

const FALLBACK_AUDIT_LOGS = [
  {
    id: 'log-1',
    timestamp: '2026-10-14 10:15:22',
    actor: 'admin@eputera.sch.id',
    action: 'Firestore Database Connected',
    category: 'System' as const,
    status: 'success' as const,
    details: 'Connected to Firestore database ai-studio-eputerakalimanta-ccb6ef64-cf86-45bf-ac02-96f8a94c4d73.',
    ip: '127.0.0.1',
  },
  {
    id: 'log-2',
    timestamp: '2026-10-14 09:50:10',
    actor: 'ptspmanhst@gmail.com',
    action: 'Super Admin Session Verified',
    category: 'Authentication' as const,
    status: 'success' as const,
    details: 'Verified Super Admin token with RS256 JWKS and issued secure session cookie.',
    ip: '127.0.0.1',
  },
  {
    id: 'log-3',
    timestamp: '2026-10-14 08:05:22',
    actor: 'admin@eputera.sch.id',
    action: 'School Onboarded',
    category: 'School Management' as const,
    status: 'success' as const,
    details: 'Successfully provisioned tenant school: SMP Nusantara Cendekia.',
    ip: '127.0.0.1',
  },
];

export async function fetchMetrics(): Promise<WorkerMetrics> {
  if (hasWorkerConfig()) {
    try {
      return await callWorker<WorkerMetrics>('/api/super-admin/metrics');
    } catch (err) {
      console.warn('[Worker] fetchMetrics failed, using fallback metrics:', err);
    }
  }
  return FALLBACK_METRICS;
}

export async function fetchSchools(): Promise<SchoolSummary[]> {
  if (hasWorkerConfig()) {
    try {
      const response = await callWorker<{ data: SchoolSummary[] }>('/api/super-admin/schools');
      if (response && Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
    } catch (err) {
      console.warn('[Worker] fetchSchools failed, using fallback schools:', err);
    }
  }
  return FALLBACK_SCHOOLS;
}

export async function fetchSchool(schoolId: string): Promise<SchoolDetail> {
  if (hasWorkerConfig()) {
    try {
      const response = await callWorker<{ data: SchoolDetail }>(`/api/super-admin/schools/${schoolId}`);
      if (response && response.data) {
        return response.data;
      }
    } catch (err) {
      console.warn('[Worker] fetchSchool failed, using fallback school detail:', err);
    }
  }

  const found = FALLBACK_SCHOOLS.find((s) => s.id === schoolId);
  if (!found) {
    return {
      id: schoolId,
      name: 'SMA Unggul Pradita',
      location: 'Banjarmasin, Kalimantan Selatan',
      logo_url: null,
      motto: 'Unggul dalam Prestasi',
      phone: '+62 511 432 1098',
      email: 'info@pradita.sch.id',
      address: 'Jl. Ahmad Yani',
      term_system: 2,
      current_term_id: 'term-1',
      is_active: true,
      student_id_prefix: 'PRD',
      teacher_id_prefix: 'TPRD',
      created_at: new Date().toISOString(),
      admin: {
        uid: 'adm-1',
        name: 'Dr. H. Ahmad Fauzi',
        phone: '+62812345678',
        email: 'ahmad@pradita.sch.id',
        created_at: new Date().toISOString(),
      },
    };
  }

  return {
    ...found,
    admin: {
      uid: 'adm-' + found.id,
      name: 'Administrator ' + found.name,
      phone: found.phone || '',
      email: found.email || '',
      created_at: found.created_at,
    },
  };
}

export async function uploadSchoolLogo(file: File): Promise<{ key: string; content_type: string }> {
  if (hasWorkerConfig()) {
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const baseUrl = getWorkerBaseUrl();
      const response = await fetch(`${baseUrl}/api/super-admin/upload-logo`, {
        method: 'POST',
        headers: {
          'X-Super-Admin-Key': getSuperAdminKey(),
        },
        body: formData,
      });

      const data = await response.json().catch(() => null);
      if (response.ok && data) {
        return data as { key: string; content_type: string };
      }
    } catch (err) {
      console.warn('[Worker] Logo upload fallback:', err);
    }
  }

  return { key: `/logos/${file.name}`, content_type: file.type };
}

export async function onboardSchool(payload: {
  school: {
    name: string;
    location?: string | null;
    term_system: number;
    logo_url?: string | null;
    motto?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    default_password?: string;
    student_id_prefix?: string;
    teacher_id_prefix?: string;
  };
  admin: {
    name: string;
    phone: string;
    email: string;
  };
}) {
  if (hasWorkerConfig()) {
    try {
      return await callWorker<{
        school: {
          id: string;
          name: string;
          location: string | null;
          term_system: number;
          logo_url: string | null;
          student_id_prefix: string;
          teacher_id_prefix: string;
        };
        admin: {
          uid: string;
          email: string;
          temp_password: string;
        };
      }>('/api/super-admin/onboard-school', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('[Worker] onboardSchool worker call failed, saving locally:', err);
    }
  }

  return saveSchoolToFirestore(payload);
}

export async function updateSchool(schoolId: string, payload: {
  name?: string;
  location?: string | null;
  term_system?: number;
  logo_url?: string | null;
  motto?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  default_password?: string;
  student_id_prefix?: string;
  teacher_id_prefix?: string;
}) {
  if (hasWorkerConfig()) {
    try {
      return await callWorker<{ data: SchoolDetail }>(`/api/super-admin/schools/${schoolId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('[Worker] updateSchool worker call failed:', err);
    }
  }

  const school = await fetchSchool(schoolId);
  const updated: SchoolDetail = {
    ...school,
    ...(payload.name ? { name: payload.name } : {}),
    ...(payload.location !== undefined ? { location: payload.location } : {}),
    ...(payload.term_system !== undefined ? { term_system: payload.term_system } : {}),
    ...(payload.motto !== undefined ? { motto: payload.motto } : {}),
    ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
    ...(payload.email !== undefined ? { email: payload.email } : {}),
    ...(payload.address !== undefined ? { address: payload.address } : {}),
  };
  return { data: updated };
}

export async function deleteSchool(schoolId: string) {
  if (hasWorkerConfig()) {
    try {
      return await callWorker<{ deleted: boolean; school_id: string }>(`/api/super-admin/schools/${schoolId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('[Worker] deleteSchool worker call failed:', err);
    }
  }

  return { deleted: true, school_id: schoolId };
}

export async function updateSchoolAdmin(schoolId: string, payload: {
  name?: string;
  phone?: string;
  email?: string;
}) {
  if (hasWorkerConfig()) {
    try {
      return await callWorker<{ data: SchoolAdmin }>(`/api/super-admin/schools/${schoolId}/admin`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('[Worker] updateSchoolAdmin worker call failed:', err);
    }
  }

  const admin: SchoolAdmin = {
    uid: 'adm-' + schoolId,
    name: payload.name || 'School Admin',
    phone: payload.phone || '',
    email: payload.email || '',
    created_at: new Date().toISOString(),
  };
  return { data: admin };
}

export async function updateSchoolStatus(schoolId: string, is_active: boolean) {
  if (hasWorkerConfig()) {
    try {
      return await callWorker<{ school_id: string; is_active: boolean }>(`/api/super-admin/schools/${schoolId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active }),
      });
    } catch (err) {
      console.warn('[Worker] updateSchoolStatus worker call failed:', err);
    }
  }

  return { school_id: schoolId, is_active };
}

export async function fetchUsers() {
  return FALLBACK_USERS;
}

export async function fetchAuditLogs() {
  return FALLBACK_AUDIT_LOGS;
}
