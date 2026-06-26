'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale } from '../../../lib/i18n/LocaleContext';

export default function AdminEmployeesPage() {
  const { t, locale } = useLocale();
  const [employees, setEmployees] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    
    idNumber: '',
    employeeCode: '',
    departmentId: '',
    role: 'EMPLOYEE',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [credentialModal, setCredentialModal] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  function deptName(d) {
    if (!d) return '';
    return locale === 'ar' ? d.nameAr || d.name : d.name;
  }

  const filteredEmployees = useMemo(() => {
    const list = employees || [];
    const term = search.trim().toLowerCase();

    return list.filter((e) => {
      const department = deptName(e.department);

      const matchesSearch =
        !term ||
        e.name?.toLowerCase().includes(term) ||
        e.idNumber?.toLowerCase().includes(term) ||
        e.employeeCode?.toLowerCase().includes(term) ||
        department?.toLowerCase().includes(term);

      const matchesDepartment =
        !departmentFilter || e.department?.id === departmentFilter;

      return matchesSearch && matchesDepartment;
    });
  }, [employees, search, departmentFilter, locale]);

  async function load() {
    const [empRes, deptRes] = await Promise.all([
      fetch('/api/admin/employees').then((r) => r.json()),
      fetch('/api/departments').then((r) => r.json()),
    ]);

    setEmployees(empRes.employees || []);
    setDepartments(deptRes.departments || []);
  }

  useEffect(() => {
    load();
  }, []);

  function startAdd() {
    setForm({
      name: '',
      
      employeeCode: '',
      departmentId: '',
      role: 'EMPLOYEE',
    });
    setEditingId(null);
    setShowAddForm(true);
    setError('');
  }

  function startEdit(emp) {
    setForm({
      name: emp.name,
      email: emp.email,
      idNumber: emp.idNumber || '',
      employeeCode: emp.employeeCode,
      departmentId: emp.department?.id || '',
      role: emp.role,
    });
    setEditingId(emp.id);
    setShowAddForm(true);
    setError('');
  }

  async function save() {
    setSaving(true);
    setError('');

    try {
      const url = editingId
        ? `/api/admin/employees/${editingId}`
        : '/api/admin/employees';

      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(t(data.error));

      setShowAddForm(false);

      if (data.plainPassword) {
        setCredentialModal({ ...data.employee, password: data.plainPassword });
      }

      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function resetPassword(emp) {
    const res = await fetch(`/api/admin/employees/${emp.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetPassword: true }),
    });

    const data = await res.json();

    if (res.ok && data.plainPassword) {
      setCredentialModal({ ...data.employee, password: data.plainPassword });
    }
  }

  async function remove(emp) {
    if (!confirm(t('admin_employees_deleteConfirm'))) return;

    await fetch(`/api/admin/employees/${emp.id}`, { method: 'DELETE' });
    load();
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/employees/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(t(data.error));

      setImportResult(data);
      load();
    } catch (err) {
      setImportResult({ error: err.message });
    } finally {
      setImporting(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink">
            {t('admin_employees_title')}
          </h1>
          <p className="text-ink-faint text-sm mt-1">
            {t('admin_employees_subtitle')}
          </p>
        </div>

        <div className="flex gap-2">
          <label className="cursor-pointer rounded-xl bg-card-soft border border-card-border/60 px-4 py-2.5 text-sm font-semibold text-ink-body hover:bg-white/60 focus-ring">
            {importing ? t('admin_employees_importing') : t('admin_employees_import')}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
              disabled={importing}
            />
          </label>

          <button
            onClick={startAdd}
            className="rounded-xl bg-gold text-white px-4 py-2.5 text-sm font-semibold hover:bg-gold-dark focus-ring"
          >
            {t('admin_employees_addManually')}
          </button>
        </div>
      </div>

      <p className="text-ink-faint text-xs">
        {t('admin_employees_importHint')}
      </p>

      <div className="rounded-card bg-card-soft border border-card-border/60 p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID number, employee ID, or department..."
              className="w-full md:max-w-md rounded-xl border border-card-border/60 bg-white/70 px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus-ring"
            />

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full md:w-64 rounded-xl border border-card-border/60 bg-white/70 px-4 py-3 text-sm text-ink focus-ring"
            >
              <option value="">All Departments</option>

              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {deptName(d)}
                </option>
              ))}
            </select>

            {(search || departmentFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setDepartmentFilter('');
                }}
                className="rounded-xl bg-white/60 border border-card-border/60 px-4 py-3 text-sm font-semibold text-ink-body focus-ring"
              >
                Clear
              </button>
            )}
          </div>

          <p className="text-sm text-ink-faint">
            Showing{' '}
            <span className="font-semibold text-ink">
              {filteredEmployees.length}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-ink">
              {employees?.length || 0}
            </span>{' '}
            employees
          </p>
        </div>
      </div>

      {importResult && (
        <div className="rounded-xl border border-card-border/60 bg-card-soft p-4 text-sm">
          {importResult.error ? (
            <p className="text-flare">{importResult.error}</p>
          ) : (
            <>
              <p className="text-ink font-semibold">
                {importResult.imported} {t('admin_employees_importSuccess')}
                {importResult.skipped > 0 &&
                  `, ${importResult.skipped} ${t('admin_employees_importErrors')}`}
              </p>

              {importResult.createdCredentials?.length > 0 && (
                <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-card-border/50 divide-y divide-card-border/40">
                  {importResult.createdCredentials.map((c) => (
                    <div
                      key={c.email}
                      className="px-3 py-2 text-xs flex items-center justify-between gap-2"
                    >
                      <span className="text-ink-body truncate">
                        {c.name} ({c.email})
                      </span>
                      <span className="font-tabular text-gold-dark shrink-0">
                        {c.password}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {showAddForm && (
        <div className="rounded-card bg-card-soft border border-card-border/60 shadow-sm p-5 space-y-4 max-w-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label={t('admin_employees_name')}>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-card-border/60 bg-white/60 px-3 py-2 text-sm focus-ring"
              />
            </Field>

            <Field label={t('admin_employees_email')}>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-card-border/60 bg-white/60 px-3 py-2 text-sm focus-ring"
              />
            </Field>

            <Field label="ID Number">
              <input
                value={form.idNumber}
                onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
                className="w-full rounded-lg border border-card-border/60 bg-white/60 px-3 py-2 text-sm focus-ring"
              />
            </Field>

            <Field label={t('admin_employees_employeeId')}>
              <input
                value={form.employeeCode}
                onChange={(e) => setForm({ ...form, employeeCode: e.target.value })}
                className="w-full rounded-lg border border-card-border/60 bg-white/60 px-3 py-2 text-sm focus-ring"
              />
            </Field>

            <Field label={t('admin_employees_department')}>
              <select
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                className="w-full rounded-lg border border-card-border/60 bg-white/60 px-3 py-2 text-sm focus-ring"
              >
                <option value="">—</option>

                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {deptName(d)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={t('admin_employees_role')}>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full rounded-lg border border-card-border/60 bg-white/60 px-3 py-2 text-sm focus-ring"
              >
                <option value="EMPLOYEE">EMPLOYEE</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </Field>
          </div>

          {error && <p className="text-flare text-sm">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="rounded-xl bg-gold text-white px-4 py-2 text-sm font-semibold hover:bg-gold-dark focus-ring disabled:opacity-60"
            >
              {t('admin_employees_save')}
            </button>

            <button
              onClick={() => setShowAddForm(false)}
              className="rounded-xl bg-white/60 border border-card-border/60 px-4 py-2 text-sm font-semibold text-ink-body focus-ring"
            >
              {t('admin_employees_cancel')}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-card bg-card-soft border border-card-border/60 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border/60 text-ink-faint text-start">
              <th className="px-4 py-3 text-start font-semibold">
                {t('admin_employees_name')}
              </th>
              <th className="px-4 py-3 text-start font-semibold">
                ID Number
              </th>
              <th className="px-4 py-3 text-start font-semibold">
                {t('admin_employees_employeeId')}
              </th>
              <th className="px-4 py-3 text-start font-semibold">
                {t('admin_employees_department')}
              </th>
              <th className="px-4 py-3 text-start font-semibold">
                {t('profile_points')}
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-card-border/40">
            {filteredEmployees.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3 text-ink font-medium">{e.name}</td>
                <td className="px-4 py-3 text-ink-body font-tabular">
                  {e.idNumber || '-'}
                </td>
                <td className="px-4 py-3 text-ink-body font-tabular">
                  {e.employeeCode}
                </td>
                <td className="px-4 py-3 text-ink-body">
                  {deptName(e.department)}
                </td>
                <td className="px-4 py-3 font-tabular text-gold-dark font-semibold">
                  {e.totalPoints}
                </td>
                <td className="px-4 py-3 text-end whitespace-nowrap">
                  <button
                    onClick={() => startEdit(e)}
                    className="text-gold-dark text-xs font-semibold me-3 focus-ring"
                  >
                    {t('edit')}
                  </button>

                  <button
                    onClick={() => resetPassword(e)}
                    className="text-ink-body text-xs font-semibold me-3 focus-ring"
                  >
                    {t('admin_employees_resetPassword')}
                  </button>

                  <button
                    onClick={() => remove(e)}
                    className="text-flare text-xs font-semibold focus-ring"
                  >
                    {t('admin_employees_delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {employees && filteredEmployees.length === 0 && (
          <p className="text-ink-faint text-center py-10 text-sm">
            No employees found.
          </p>
        )}
      </div>

      {credentialModal && (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-5 z-50">
          <div className="bg-cream rounded-card border border-card-border/60 shadow-card p-6 max-w-sm w-full">
            <h3 className="font-bold text-ink mb-1">
              {t('admin_employees_newPasswordFor')} {credentialModal.name}
            </h3>

            <p className="text-ink-faint text-xs mb-4">
              {t('admin_employees_passwordNote')}
            </p>

            <div className="rounded-xl bg-card-soft border border-card-border/60 px-4 py-3 flex items-center justify-between mb-4">
              <span className="font-tabular text-lg font-bold text-gold-dark">
                {credentialModal.password}
              </span>
              <CopyButton text={credentialModal.password} t={t} />
            </div>

            <button
              onClick={() => setCredentialModal(null)}
              className="w-full rounded-xl bg-gold text-white py-2.5 text-sm font-semibold hover:bg-gold-dark focus-ring"
            >
              {t('save')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-ink-label mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}

function CopyButton({ text, t }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="text-xs font-semibold text-ink-body hover:text-ink focus-ring shrink-0"
    >
      {copied ? t('admin_employees_copied') : t('admin_employees_copy')}
    </button>
  );
}