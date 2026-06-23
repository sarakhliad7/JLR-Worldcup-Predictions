'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLocale } from '../../lib/i18n/LocaleContext';

export default function NewsPage() {
  const { status } = useSession();
  const router = useRouter();
  const { t, locale } = useLocale();
  const [tab, setTab] = useState('general'); // general | announcements
  const [announcements, setAnnouncements] = useState(null);
  const [comments, setComments] = useState(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    fetch('/api/announcements').then((r) => r.json()).then((d) => setAnnouncements(d.announcements || []));
    loadComments();
  }, []);

  async function loadComments() {
    const res = await fetch('/api/comments');
    const data = await res.json();
    setComments(data.comments || []);
  }

  async function send() {
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      if (res.ok) {
        setDraft('');
        loadComments();
      }
    } finally {
      setSending(false);
    }
  }

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

      <div className="flex gap-2 bg-card-soft rounded-full p-1 border border-card-border/60 mb-4 shrink-0">
        <button
          onClick={() => setTab('general')}
          className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors focus-ring ${
            tab === 'general' ? 'bg-gold text-white' : 'text-ink-body'
          }`}
        >
          {t('news_general')}
        </button>
        <button
          onClick={() => setTab('announcements')}
          className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors focus-ring ${
            tab === 'announcements' ? 'bg-gold text-white' : 'text-ink-body'
          }`}
        >
          {t('news_announcements')}
        </button>
      </div>

      {tab === 'announcements' && (
        <div className="space-y-3 overflow-y-auto flex-1 pb-4">
          {announcements === null && <p className="text-ink-faint text-center py-10 text-sm">{t('loading')}</p>}
          {announcements?.length === 0 && (
            <p className="text-ink-faint text-center py-10 text-sm">{t('news_noAnnouncements')}</p>
          )}
          {announcements?.map((a) => {
            const text = announcementText(a);
            return (
              <div key={a.id} className="rounded-card bg-card-soft border border-card-border/60 shadow-sm p-4">
                {a.pinned && (
                  <span className="text-[11px] font-semibold text-gold-dark bg-gold/15 rounded-full px-2 py-0.5 mb-2 inline-block">
                    {t('news_pinned')}
                  </span>
                )}
                <h3 className="font-bold text-ink mb-1">{text.title}</h3>
                <p className="text-ink-body text-sm leading-relaxed whitespace-pre-line">{text.body}</p>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'general' && (
        <>
          <div ref={listRef} className="space-y-3 overflow-y-auto flex-1 pb-4">
            {comments === null && <p className="text-ink-faint text-center py-10 text-sm">{t('loading')}</p>}
            {comments?.length === 0 && (
              <p className="text-ink-faint text-center py-10 text-sm">{t('news_noMessages')}</p>
            )}
            {comments?.map((c) => (
              <div key={c.id} className="flex gap-2.5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                  style={{ backgroundColor: `${c.user.colorHex}26`, color: '#3A2C22' }}
                >
                  {c.user.avatarLabel}
                </div>
                <div className="flex-1 bg-card-soft border border-card-border/60 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
                  <div className="flex items-baseline justify-between gap-2 mb-0.5">
                    <span className="text-ink text-sm font-semibold">{c.user.name}</span>
                    <span className="text-ink-faint text-[11px] shrink-0">
                      {timeAgo(c.createdAt, t)}
                    </span>
                  </div>
                  <p className="text-ink-body text-sm leading-relaxed">{c.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-card-border/60 shrink-0">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder={t('news_placeholder')}
              className="flex-1 rounded-full bg-card-soft border border-card-border/60 text-ink px-4 py-2.5 text-sm focus-ring placeholder:text-ink-placeholder"
            />
            <button
              onClick={send}
              disabled={sending || !draft.trim()}
              className="w-10 h-10 rounded-full bg-gold flex items-center justify-center text-white shrink-0 focus-ring disabled:opacity-50"
              aria-label={t('news_send')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M21 11 3 3l8 18 2-8 8-2Z" fill="currentColor" />
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function timeAgo(dateStr, t) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return t('news_now');
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}
