import { Hono } from 'hono';
import type { AppEnv } from '../app-env';
import { requireAdmin, requireRoles } from '../lib/auth-guards';
import { createPrefixedId } from '../lib/id';
import { jsonError, jsonOk } from '../lib/response';
import { z } from 'zod';

const createNoticeSchema = z.object({
  title: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  body: z.string().trim().min(1),
  category: z.string().trim().default('general'),
  parent_uid: z.string().trim().optional().nullable(),
});

const notices = new Hono<AppEnv>();

notices.get('/unread-count', requireRoles('parent'), async (c) => {
  const user = c.get('user');
  const row = await c.env.DB.prepare(
    `
    SELECT COUNT(*) AS cnt FROM Notices n
    LEFT JOIN NoticeReads nr ON nr.notice_id = n.id AND nr.user_uid = ?
    WHERE n.school_id = ? AND (n.parent_uid IS NULL OR n.parent_uid = ?)
      AND nr.notice_id IS NULL
  `
  )
    .bind(user.uid, user.schoolId, user.uid)
    .first<{ cnt: number }>();

  const cnt = Number(row?.cnt ?? 0);
  return jsonOk(c, { unread_count: cnt });
});

notices.get('/', requireRoles('admin', 'teacher', 'parent', 'student'), async (c) => {
  const user = c.get('user');

  if (user.role === 'admin' || user.role === 'teacher') {
    const { results } = await c.env.DB.prepare(
      `
      SELECT
        n.id,
        n.school_id,
        n.parent_uid,
        n.title,
        n.summary,
        n.body,
        n.category,
        n.created_at,
        1 AS read_flag
      FROM Notices n
      WHERE n.school_id = ?
      ORDER BY n.created_at DESC
      LIMIT 100
    `
    )
      .bind(user.schoolId)
      .all();

    return jsonOk(c, { data: results });
  }

  const { results } = await c.env.DB.prepare(
    `
    SELECT
      n.id,
      n.school_id,
      n.parent_uid,
      n.title,
      n.summary,
      n.body,
      n.category,
      n.created_at,
      CASE WHEN nr.notice_id IS NOT NULL THEN 1 ELSE 0 END AS read_flag
    FROM Notices n
    LEFT JOIN NoticeReads nr ON nr.notice_id = n.id AND nr.user_uid = ?
    WHERE n.school_id = ? AND (n.parent_uid IS NULL OR n.parent_uid = ?)
    ORDER BY n.created_at DESC
    LIMIT 100
  `
  )
    .bind(user.uid, user.schoolId, user.uid)
    .all();

  return jsonOk(c, { data: results });
});

notices.post('/', requireAdmin, async (c) => {
  const user = c.get('user');
  const parsed = createNoticeSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(c, 'Invalid notice payload', 400, parsed.error.flatten());
  }

  const noticeId = createPrefixedId('ntc');
  const { title, summary, body, category, parent_uid } = parsed.data;

  await c.env.DB.prepare(
    `
    INSERT INTO Notices (id, school_id, parent_uid, title, summary, body, category)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `
  )
    .bind(noticeId, user.schoolId, parent_uid ?? null, title, summary, body, category || 'general')
    .run();

  return jsonOk(c, {
    data: {
      id: noticeId,
      school_id: user.schoolId,
      parent_uid: parent_uid ?? null,
      title,
      summary,
      body,
      category,
      created_at: new Date().toISOString(),
    },
  }, 201);
});

notices.delete('/:id', requireAdmin, async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const result = await c.env.DB.prepare(
    'DELETE FROM Notices WHERE id = ? AND school_id = ?'
  )
    .bind(id, user.schoolId)
    .run();

  if (result.meta.changes === 0) {
    return jsonError(c, 'Notice not found', 404);
  }

  return jsonOk(c, { deleted: true, id });
});

notices.post('/:id/read', requireRoles('parent', 'student'), async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const notice = await c.env.DB.prepare(
    `
    SELECT id FROM Notices
    WHERE id = ? AND school_id = ? AND (parent_uid IS NULL OR parent_uid = ?)
    LIMIT 1
  `
  )
    .bind(id, user.schoolId, user.uid)
    .first<{ id: string }>();

  if (!notice) {
    return jsonError(c, 'Notice not found', 404);
  }

  await c.env.DB.prepare(
    'INSERT OR IGNORE INTO NoticeReads (notice_id, user_uid) VALUES (?, ?)'
  )
    .bind(id, user.uid)
    .run();

  return jsonOk(c, { ok: true });
});

export default notices;
