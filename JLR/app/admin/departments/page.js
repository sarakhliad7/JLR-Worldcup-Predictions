'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '../../../lib/i18n/LocaleContext';

const DEFAULT_FORM = { name: '', nameAr: '', shortCode: '', colorHex: '#9B6A43' };

export default function AdminDepartmentsPage() {
  const { t, locale } = useLocale();
  const [departments, setDepartments] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const res = await fetch('/api/admin/departments').then((r) => r.json());
    setDepartments(res.departments || []);
  }

  useEffect(() => {
    load();
  }, []);

  function startAdd() {
    setForm(DEFAULT_FORM);
    setEditingId(null);
    setShowForm(true);
    setError('');
  }

  function startEdit(d) {
    setForm({ name: d.name, nameAr: d.nameAr || '', shortCode: d.shortCode, colorHex: d.colorHex });
    setEditingId(d.id);
    setShowForm(true);
    setError('');
  }

  async function save() {
    setSaving(true);
    setError('');
    try {
      const url = editingId ? `/api/admin/departments/${editingId}` : '/api/admin/departments';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(t(data.error));
      setShowForm(false);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(d) {
    if (!confirm(t('admin_departments_deleteConfirm'))) return;
    await fetch(`/api/admin/departments/${d.id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink">{t('admin_departments_title')}</h1>
          <p className="text-ink-faint text-sm mt-1">{t('admin_departments_subtitle')}</p>
        </div>
        <button
          onClick={startAdd}
          className="rounded-xl bg-gold text-white px-4 py-2.5 text-sm font-semibold hover:bg-gold-dark focus-ring"
        >
          {t('admin_departments_add')}
        </button>
      </div>

      {showForm && (
        <div className="rounded-card bg-card-soft border border-card-border/60 shadow-sm p-5 space-y-4 max-w-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label={t('admin_departments_nameEn')}>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-card-border/60 bg-white/60 px-3 py-2 text-sm focus-ring"
              />
            </Field>
            <Field label={t('admin_departments_nameAr')}>
              <input
                value={form.nameAr}
                onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                dir="rtl"
                className="w-full rounded-lg border border-card-border/60 bg-white/60 px-3 py-2 text-sm focus-ring"
              />
            </Field>
            <Field label={t('admin_departments_shortCode')}>
              <input
                value={form.shortCode}
                onChange={(e) => setForm({ ...form, shortCode: e.target.value })}
                className="w-full rounded-lg border border-card-border/60 bg-white/60 px-3 py-2 text-sm focus-ring"
              />
            </Field>
            <Field label={t('admin_departments_color')}>
              <input
                type="color"
                value={form.colorHex}
                onChange={(e) => setForm({ ...form, colorHex: e.target.value })}
                className="w-full h-9 rounded-lg border border-card-border/60 bg-white/60 px-1 focus-ring"
              />
            </Field>
          </div>
          {error && <p className="text-flare text-sm">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="rounded-xl bg-gold text-white px-4 py-2 text-sm font-semibold hover:bg-gold-dark focus-ring disabled:opacity-60"
            >
              {t('save')}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-xl bg-white/60 border border-card-border/60 px-4 py-2 text-sm font-semibold text-ink-body focus-ring"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {departments?.map((d) => (
          <div key={d.id} className="rounded-card bg-card-soft border border-card-border/60 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-6 h-6 rounded-full shrink-0"
                style={{ backgroundColor: d.colorHex }}
              />
              <span className="font-semibold text-ink">{locale === 'ar' ? d.nameAr || d.name : d.name}</span>
            </div>
            <p className="text-ink-faint text-xs mb-3">
              {d.shortCode} · {d.userCount} {t('admin_departments_employeeCount')}
            </p>
            <div className="flex gap-3">
              <button onClick={() => startEdit(d)} className="text-gold-dark text-xs font-semibold focus-ring">
                {t('edit')}
              </button>
              <button onClick={() => remove(d)} className="text-flare text-xs font-semibold focus-ring">
                {t('admin_employees_delete')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-ink-label mb-1">{label}</span>
      {children}
    </label>
  );
}
