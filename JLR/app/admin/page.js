'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '../../lib/i18n/LocaleContext';

export default function AdminDashboardPage() {
  const { t } = useLocale();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const statsRes = await fetch('/api/admin/stats');
        const statsData = await statsRes.json();

        const empRes = await fetch('/api/admin/employees');
        const empData = await empRes.json();

        const employeeCount =
          Array.isArray(empData?.employees)
            ? empData.employees.length
            : statsData?.employeeCount;

        setStats({
          employeeCount,
          departmentCount: statsData?.departmentCount ?? 0,
          matchCount: statsData?.matchCount ?? 0,
          predictionCount: statsData?.predictionCount ?? 0,
        });
      } catch (e) {
        setStats({
          employeeCount: 0,
          departmentCount: 0,
          matchCount: 0,
          predictionCount: 0,
        });
      }
    }

    loadStats();
  }, []);

  const cards = [
    { key: 'admin_dashboard_employees', value: stats?.employeeCount },
    { key: 'admin_dashboard_departments', value: stats?.departmentCount },
    { key: 'admin_dashboard_matches', value: stats?.matchCount },
    { key: 'admin_dashboard_predictions', value: stats?.predictionCount },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink">
          {t('admin_title')}
        </h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div
            key={c.key}
            className="rounded-card bg-card-soft border border-card-border/60 shadow-sm p-5"
          >
            <p className="font-tabular text-3xl font-bold text-gold-dark">
              {c.value ?? '–'}
            </p>
            <p className="text-ink-faint text-sm mt-1">
              {t(c.key)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}