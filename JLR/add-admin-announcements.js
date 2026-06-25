const fs = require('fs');

fs.mkdirSync('app/api/admin/announcements', { recursive: true });
fs.mkdirSync('app/admin/announcements', { recursive: true });

const api = `import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'err_forbidden' }, { status: 403 });
  }

  const announcements = await prisma.announcement.findMany({
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    take: 100,
  });

  return NextResponse.json({ announcements });
}

export async function POST(req) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'err_forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const title = (body.title || '').trim();
  const titleAr = (body.titleAr || '').trim();
  const announcementBody = (body.body || '').trim();
  const bodyAr = (body.bodyAr || '').trim();
  const pinned = Boolean(body.pinned);

  if (!title || !announcementBody) {
    return NextResponse.json({ error: 'admin_err_missingFields' }, { status: 400 });
  }

  const announcement = await prisma.announcement.create({
    data: {
      title,
      titleAr: titleAr || title,
      body: announcementBody,
      bodyAr: bodyAr || announcementBody,
      pinned,
    },
  });

  return NextResponse.json({ announcement });
}

export async function DELETE(req) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'err_forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'admin_err_missingFields' }, { status: 400 });
  }

  await prisma.announcement.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
`;

const page = `'use client';

import { useEffect, useState } from 'react';

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    titleAr: '',
    body: '',
    bodyAr: '',
    pinned: true,
  });

  async function loadAnnouncements() {
    setLoading(true);
    const res = await fetch('/api/admin/announcements');
    const data = await res.json();
    setAnnouncements(data.announcements || []);
    setLoading(false);
  }

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function submit(e) {
    e.preventDefault();

    if (!form.title.trim() || !form.body.trim()) {
      alert('Please fill English title and body.');
      return;
    }

    setSaving(true);

    const res = await fetch('/api/admin/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    setSaving(false);

    if (!res.ok) {
      alert('Failed to save announcement.');
      return;
    }

    setForm({
      title: '',
      titleAr: '',
      body: '',
      bodyAr: '',
      pinned: true,
    });

    await loadAnnouncements();
  }

  async function remove(id) {
    if (!confirm('Delete this announcement?')) return;

    const res = await fetch(\\\`/api/admin/announcements?id=\\\${id}\\\`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      alert('Failed to delete announcement.');
      return;
    }

    await loadAnnouncements();
  }

  return (
    <div className="px-4 pt-4 space-y-5">
      <div>
        <h2 className="font-display font-bold text-2xl text-ink">Announcements</h2>
        <p className="text-ink-faint text-xs mt-1">
          Add official announcements for employees. Employees can view only.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="rounded-card bg-card-soft border border-card-border/60 shadow-sm p-4 space-y-3"
      >
        <div>
          <label className="block text-xs font-semibold text-ink mb-1">Title English</label>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full rounded-xl border border-card-border bg-white/70 px-3 py-2 text-sm text-ink focus-ring"
            placeholder="Announcement title"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink mb-1">Title Arabic</label>
          <input
            value={form.titleAr}
            onChange={(e) => setForm((f) => ({ ...f, titleAr: e.target.value }))}
            className="w-full rounded-xl border border-card-border bg-white/70 px-3 py-2 text-sm text-ink focus-ring"
            placeholder="عنوان التعميم"
            dir="rtl"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink mb-1">Body English</label>
          <textarea
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            className="w-full min-h-28 rounded-xl border border-card-border bg-white/70 px-3 py-2 text-sm text-ink focus-ring"
            placeholder="Write the announcement..."
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink mb-1">Body Arabic</label>
          <textarea
            value={form.bodyAr}
            onChange={(e) => setForm((f) => ({ ...f, bodyAr: e.target.value }))}
            className="w-full min-h-28 rounded-xl border border-card-border bg-white/70 px-3 py-2 text-sm text-ink focus-ring"
            placeholder="اكتبي التعميم..."
            dir="rtl"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={form.pinned}
            onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.checked }))}
          />
          Pin this announcement
        </label>

        <button
          disabled={saving}
          className="w-full rounded-xl bg-gold text-white font-semibold py-3 focus-ring disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Publish Announcement'}
        </button>
      </form>

      <div className="space-y-3">
        <h3 className="font-bold text-ink">Published Announcements</h3>

        {loading && (
          <p className="text-ink-faint text-sm">Loading...</p>
        )}

        {!loading && announcements.length === 0 && (
          <p className="text-ink-faint text-sm">No announcements yet.</p>
        )}

        {announcements.map((a) => (
          <div
            key={a.id}
            className="rounded-card bg-white/50 border border-card-border/60 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                {a.pinned && (
                  <span className="text-[11px] font-semibold text-gold-dark bg-gold/15 rounded-full px-2 py-0.5 mb-2 inline-block">
                    Pinned
                  </span>
                )}
                <h4 className="font-bold text-ink">{a.title}</h4>
                <p className="text-ink-faint text-xs mt-1" dir="rtl">{a.titleAr}</p>
              </div>

              <button
                onClick={() => remove(a.id)}
                className="text-flare text-xs font-semibold"
              >
                Delete
              </button>
            </div>

            <p className="text-sm text-ink-body mt-3 whitespace-pre-line">{a.body}</p>
            <p className="text-sm text-ink-body mt-3 whitespace-pre-line" dir="rtl">{a.bodyAr}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
`;

fs.writeFileSync('app/api/admin/announcements/route.js', api, 'utf8');
fs.writeFileSync('app/admin/announcements/page.js', page, 'utf8');

console.log('Admin announcements page and API created.');
