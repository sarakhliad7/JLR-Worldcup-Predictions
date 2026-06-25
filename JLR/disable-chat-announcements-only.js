const fs = require('fs');

const newsPage = `'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLocale } from '../../lib/i18n/LocaleContext';

export default function NewsPage() {
  const { status } = useSession();
  const router = useRouter();
  const { t, locale } = useLocale();
  const [announcements, setAnnouncements] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    fetch('/api/announcements')
      .then((r) => r.json())
      .then((d) => setAnnouncements(d.announcements || []));
  }, []);

  function announcementText(a) {
    if (locale === 'ar') {
      return { title: a.titleAr || a.title, body: a.bodyAr || a.body };
    }
    return { title: a.title, body: a.body };
  }

  return (
    <div className="px-4 pt-4 flex flex-col h-[calc(100vh-56px-76px)]">
      <div className="mb-4">
        <h2 className="font-display font-bold text-2xl text-ink">{t('news_title')}</h2>
        <p className="text-ink-faint text-xs mt-1">{t('news_subtitle')}</p>
      </div>

      <div className="space-y-3 overflow-y-auto flex-1 pb-4">
        {announcements === null && (
          <p className="text-ink-faint text-center py-10 text-sm">{t('loading')}</p>
        )}

        {announcements?.length === 0 && (
          <p className="text-ink-faint text-center py-10 text-sm">{t('news_noAnnouncements')}</p>
        )}

        {announcements?.map((a) => {
          const text = announcementText(a);
          return (
            <div
              key={a.id}
              className="rounded-card bg-card-soft border border-card-border/60 shadow-sm p-4"
            >
              {a.pinned && (
                <span className="text-[11px] font-semibold text-gold-dark bg-gold/15 rounded-full px-2 py-0.5 mb-2 inline-block">
                  {t('news_pinned')}
                </span>
              )}
              <h3 className="font-bold text-ink mb-1">{text.title}</h3>
              <p className="text-ink-body text-sm leading-relaxed whitespace-pre-line">
                {text.body}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
`;

const commentsApi = `import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ comments: [] });
}

export async function POST() {
  return NextResponse.json(
    { error: 'err_forbidden' },
    { status: 403 }
  );
}
`;

fs.writeFileSync('app/news/page.js', newsPage, 'utf8');
fs.writeFileSync('app/api/comments/route.js', commentsApi, 'utf8');

console.log('Chat disabled. News page now shows admin announcements only.');
