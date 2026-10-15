import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseFirestore } from './firebase';
import type { SchoolSummary, SchoolDetail, WorkerMetrics, SchoolAdmin } from './worker';

export type FirestoreAuditLog = {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  category: 'Authentication' | 'School Management' | 'System';
  status: 'success' | 'warning' | 'info';
  details: string;
  ip: string;
};

export type FirestoreUserItem = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'super_admin' | 'school_admin' | 'teacher' | 'student' | 'parent';
  schoolId?: string;
  schoolName: string;
  status: 'active' | 'suspended';
  createdAt: string;
};

const SEED_SCHOOLS: SchoolDetail[] = [
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
    admin: {
      uid: 'adm-pradita-001',
      name: 'Dr. H. Ahmad Fauzi, M.Pd',
      phone: '+62 812 3456 7890',
      email: 'ahmad.fauzi@pradita.sch.id',
      created_at: new Date('2026-01-10').toISOString(),
    },
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
    admin: {
      uid: 'adm-nsc-002',
      name: 'Hj. Mardiana, S.Pd',
      phone: '+62 813 8877 6655',
      email: 'mardiana@nusantaracendekia.sch.id',
      created_at: new Date('2026-02-15').toISOString(),
    },
  },
];

/**
 * Ensures initial school and admin data exists in Firestore if collection is empty
 */
export async function ensureFirestoreInitialSeed(): Promise<void> {
  try {
    const db = getFirebaseFirestore();
    const schoolsRef = collection(db, 'schools');
    const snapshot = await getDocs(schoolsRef);

    if (snapshot.empty) {
      for (const school of SEED_SCHOOLS) {
        await setDoc(doc(db, 'schools', school.id), {
          ...school,
          student_count: 320,
          user_count: 28,
        });

        if (school.admin) {
          await setDoc(doc(db, 'users', school.admin.uid), {
            id: school.admin.uid,
            name: school.admin.name,
            email: school.admin.email,
            phone: school.admin.phone,
            role: 'school_admin',
            schoolId: school.id,
            schoolName: school.name,
            status: 'active',
            createdAt: school.created_at,
          });
        }
      }

      // Add audit log for system initialization
      await addAuditLogToFirestore({
        actor: 'system@eputera.sch.id',
        action: 'Database Initialized',
        category: 'System',
        status: 'success',
        details: 'Initial school data and collections seeded in Firestore.',
        ip: '127.0.0.1',
      });
    }
  } catch (err) {
    console.warn('[Firestore] Seed check skipped or offline:', err);
  }
}

export async function getSchoolsFromFirestore(): Promise<SchoolSummary[]> {
  try {
    await ensureFirestoreInitialSeed();
    const db = getFirebaseFirestore();
    const schoolsRef = collection(db, 'schools');
    const snapshot = await getDocs(schoolsRef);

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name ?? 'Unnamed School',
        location: data.location ?? null,
        logo_url: data.logo_url ?? null,
        motto: data.motto ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        address: data.address ?? null,
        term_system: Number(data.term_system ?? 2),
        current_term_id: data.current_term_id ?? null,
        is_active: Boolean(data.is_active ?? true),
        student_id_prefix: data.student_id_prefix ?? 'STD',
        teacher_id_prefix: data.teacher_id_prefix ?? 'TCH',
        created_at: data.created_at ?? new Date().toISOString(),
        student_count: Number(data.student_count ?? 0),
        user_count: Number(data.user_count ?? 0),
      };
    });
  } catch (err) {
    console.error('[Firestore] getSchoolsFromFirestore error:', err);
    return [];
  }
}

export async function getSchoolFromFirestore(schoolId: string): Promise<SchoolDetail | null> {
  try {
    const db = getFirebaseFirestore();
    const docSnap = await getDoc(doc(db, 'schools', schoolId));
    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name ?? 'Unnamed School',
      location: data.location ?? null,
      logo_url: data.logo_url ?? null,
      motto: data.motto ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      address: data.address ?? null,
      term_system: Number(data.term_system ?? 2),
      current_term_id: data.current_term_id ?? null,
      is_active: Boolean(data.is_active ?? true),
      student_id_prefix: data.student_id_prefix ?? 'STD',
      teacher_id_prefix: data.teacher_id_prefix ?? 'TCH',
      created_at: data.created_at ?? new Date().toISOString(),
      admin: (data.admin as SchoolAdmin) ?? null,
    };
  } catch (err) {
    console.error('[Firestore] getSchoolFromFirestore error:', err);
    return null;
  }
}

export async function saveSchoolToFirestore(payload: {
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
}): Promise<{
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
}> {
  const db = getFirebaseFirestore();
  const schoolId = 'sch-' + Math.random().toString(36).substring(2, 10);
  const adminUid = 'usr-' + Math.random().toString(36).substring(2, 10);
  const tempPassword = payload.school.default_password || 'Welcome@2026';
  const now = new Date().toISOString();

  const newSchool: SchoolDetail = {
    id: schoolId,
    name: payload.school.name,
    location: payload.school.location ?? null,
    logo_url: payload.school.logo_url ?? null,
    motto: payload.school.motto ?? null,
    phone: payload.school.phone ?? null,
    email: payload.school.email ?? null,
    address: payload.school.address ?? null,
    term_system: payload.school.term_system,
    current_term_id: 'term-1',
    is_active: true,
    student_id_prefix: payload.school.student_id_prefix || 'STD',
    teacher_id_prefix: payload.school.teacher_id_prefix || 'TCH',
    created_at: now,
    admin: {
      uid: adminUid,
      name: payload.admin.name,
      phone: payload.admin.phone,
      email: payload.admin.email,
      created_at: now,
    },
  };

  await setDoc(doc(db, 'schools', schoolId), {
    ...newSchool,
    student_count: 0,
    user_count: 1,
  });

  await setDoc(doc(db, 'users', adminUid), {
    id: adminUid,
    name: payload.admin.name,
    email: payload.admin.email,
    phone: payload.admin.phone,
    role: 'school_admin',
    schoolId,
    schoolName: payload.school.name,
    status: 'active',
    createdAt: now,
  });

  await addAuditLogToFirestore({
    actor: 'admin@eputera.sch.id',
    action: 'School Onboarded',
    category: 'School Management',
    status: 'success',
    details: `Successfully onboarded school tenant: ${payload.school.name} (ID: ${schoolId}).`,
    ip: '127.0.0.1',
  });

  return {
    school: {
      id: schoolId,
      name: payload.school.name,
      location: payload.school.location ?? null,
      term_system: payload.school.term_system,
      logo_url: payload.school.logo_url ?? null,
      student_id_prefix: newSchool.student_id_prefix,
      teacher_id_prefix: newSchool.teacher_id_prefix,
    },
    admin: {
      uid: adminUid,
      email: payload.admin.email,
      temp_password: tempPassword,
    },
  };
}

export async function updateSchoolStatusInFirestore(schoolId: string, is_active: boolean): Promise<void> {
  const db = getFirebaseFirestore();
  await updateDoc(doc(db, 'schools', schoolId), { is_active });
  await addAuditLogToFirestore({
    actor: 'admin@eputera.sch.id',
    action: is_active ? 'School Activated' : 'School Suspended',
    category: 'School Management',
    status: is_active ? 'success' : 'warning',
    details: `Updated active status to ${is_active} for school ID: ${schoolId}.`,
    ip: '127.0.0.1',
  });
}

export async function updateSchoolInFirestore(
  schoolId: string,
  payload: Partial<SchoolDetail>
): Promise<SchoolDetail> {
  const db = getFirebaseFirestore();
  await updateDoc(doc(db, 'schools', schoolId), payload as Record<string, unknown>);

  const updated = await getSchoolFromFirestore(schoolId);
  if (!updated) {
    throw new Error('School not found after update');
  }

  await addAuditLogToFirestore({
    actor: 'admin@eputera.sch.id',
    action: 'School Details Updated',
    category: 'School Management',
    status: 'success',
    details: `Updated profile details for school ID: ${schoolId}.`,
    ip: '127.0.0.1',
  });

  return updated;
}

export async function deleteSchoolFromFirestore(schoolId: string): Promise<void> {
  const db = getFirebaseFirestore();
  await deleteDoc(doc(db, 'schools', schoolId));
  await addAuditLogToFirestore({
    actor: 'admin@eputera.sch.id',
    action: 'School Deleted',
    category: 'School Management',
    status: 'warning',
    details: `Deleted school tenant ID: ${schoolId}.`,
    ip: '127.0.0.1',
  });
}

export async function getMetricsFromFirestore(): Promise<WorkerMetrics> {
  try {
    const schools = await getSchoolsFromFirestore();
    const activeSchools = schools.filter((s) => s.is_active).length;
    const suspendedSchools = schools.length - activeSchools;
    const totalStudents = schools.reduce((acc, s) => acc + (s.student_count || 0), 0);
    const estimatedRevenue = totalStudents * 450000;

    return {
      total_schools: schools.length,
      active_schools: activeSchools,
      suspended_schools: suspendedSchools,
      total_revenue: estimatedRevenue,
      system_distribution: [
        { name: 'Semester System (2 Terms)', value: schools.filter((s) => s.term_system === 2).length },
        { name: 'Trimester System (3 Terms)', value: schools.filter((s) => s.term_system === 3).length },
      ],
      historical_trends: [
        { label: 'Jan 2026', schools: Math.max(1, schools.length - 2), revenue: estimatedRevenue * 0.7 },
        { label: 'Feb 2026', schools: Math.max(1, schools.length - 1), revenue: estimatedRevenue * 0.85 },
        { label: 'Mar 2026', schools: schools.length, revenue: estimatedRevenue },
      ],
    };
  } catch (err) {
    console.error('[Firestore] getMetricsFromFirestore error:', err);
    return {
      total_schools: 0,
      active_schools: 0,
      suspended_schools: 0,
      total_revenue: 0,
      system_distribution: [],
      historical_trends: [],
    };
  }
}

export async function addAuditLogToFirestore(
  log: Omit<FirestoreAuditLog, 'id' | 'timestamp'>
): Promise<void> {
  try {
    const db = getFirebaseFirestore();
    const logId = 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    await setDoc(doc(db, 'audit_logs', logId), {
      ...log,
      id: logId,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    });
  } catch (err) {
    console.warn('[Firestore] Failed to write audit log:', err);
  }
}

export async function getAuditLogsFromFirestore(): Promise<FirestoreAuditLog[]> {
  try {
    const db = getFirebaseFirestore();
    const snapshot = await getDocs(collection(db, 'audit_logs'));
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map((d) => d.data() as FirestoreAuditLog);
  } catch (err) {
    console.warn('[Firestore] Failed to read audit logs:', err);
    return [];
  }
}

export async function getUsersFromFirestore(): Promise<FirestoreUserItem[]> {
  try {
    const db = getFirebaseFirestore();
    const snapshot = await getDocs(collection(db, 'users'));
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map((d) => d.data() as FirestoreUserItem);
  } catch (err) {
    console.warn('[Firestore] Failed to read users:', err);
    return [];
  }
}
