import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { calculatePoints } from '../../../lib/scoring';
import { recomputeAllUserTotals, checkChampionBonuses, evaluateAchievements } from '../../../lib/recompute';

// Public, free, no-key World Cup 2026 data feed (public domain / CC0).
// Updated roughly daily by the openfootball maintainers during the tournament.
const FEED_URL =
  'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json';

// Parses "2026-06-24" + "19:00 UTC-6" into a UTC Date.
function parseKickoff(dateStr, timeStr) {
  const [time, utcOffset] = timeStr.split(' '); // e.g. "UTC-6" or "UTC+2"
  const match = utcOffset.match(/UTC([+-])(\d+)/);
  const sign = match ? match[1] : '+';
  const hours = (match ? match[2] : '0').padStart(2, '0');
  const iso = `${dateStr}T${time}:00${sign}${hours}:00`;
  return new Date(iso);
}

// Maps the feed's English team names to Arabic for bilingual display.
// Extend as needed -- falls back to the English name if a team is missing here.
const TEAM_NAME_AR = {
  Mexico: 'المكسيك', 'South Africa': 'جنوب أفريقيا', 'South Korea': 'كوريا الجنوبية',
  'Czech Republic': 'التشيك', Canada: 'كندا', 'Bosnia & Herzegovina': 'البوسنة والهرسك',
  Qatar: 'قطر', Switzerland: 'سويسرا', Brazil: 'البرازيل', Morocco: 'المغرب',
  Haiti: 'هايتي', Scotland: 'اسكتلندا', USA: 'أمريكا', Paraguay: 'باراغواي',
  Australia: 'أستراليا', Turkey: 'تركيا', Germany: 'ألمانيا', 'Curaçao': 'كوراساو',
  'Ivory Coast': 'ساحل العاج', Ecuador: 'الإكوادور', Netherlands: 'هولندا', Japan: 'اليابان',
  Sweden: 'السويد', Tunisia: 'تونس', Belgium: 'بلجيكا', Egypt: 'مصر', Iran: 'إيران',
  'New Zealand': 'نيوزيلندا', Spain: 'إسبانيا', 'Cape Verde': 'الرأس الأخضر',
  'Saudi Arabia': 'السعودية', Uruguay: 'الأوروغواي', France: 'فرنسا', Senegal: 'السنغال',
  Iraq: 'العراق', Norway: 'النرويج', Argentina: 'الأرجنتين', Algeria: 'الجزائر',
  Austria: 'النمسا', Jordan: 'الأردن', Portugal: 'البرتغال', 'DR Congo': 'الكونغو الديمقراطية',
  Uzbekistan: 'أوزبكستان', Colombia: 'كولومبيا', England: 'إنجلترا', Croatia: 'كرواتيا',
  Ghana: 'غانا', Panama: 'بنما',
};

function teamNameAr(en) {
  return TEAM_NAME_AR[en] || en;
}

async function getOrCreateTeam(nameEn, group) {
  if (!nameEn) return null;
  return prisma.team.upsert({
    where: { nameEn },
    update: group ? { group } : {},
    create: { nameEn, nameAr: teamNameAr(nameEn), group: group || null },
  });
}

export async function GET(req) {
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const res = await fetch(FEED_URL, { cache: 'no-store' });
  if (!res.ok) {
    return NextResponse.json({ error: 'err_fetchFailed' }, { status: 502 });
  }
  const data = await res.json();

  let createdOrUpdated = 0;
  let finishedNow = [];

  for (const m of data.matches) {
    const isKnockout = !!m.num;
    const externalRef = isKnockout ? `wc26-${m.num}` : `wc26-${m.round}-${m.team1}-${m.team2}-${m.date}`;
    const isRealTeamName = (s) => !!s && !/^[0-9WL]/.test(s) && s.length > 1;

    const homeTeam = isRealTeamName(m.team1) ? await getOrCreateTeam(m.team1, m.group) : null;
    const awayTeam = isRealTeamName(m.team2) ? await getOrCreateTeam(m.team2, m.group) : null;

    const kickoffAt = parseKickoff(m.date, m.time);
    const homeScore = m.score?.ft?.[0] ?? null;
    const awayScore = m.score?.ft?.[1] ?? null;
    const status = homeScore != null ? 'FINISHED' : (new Date() >= kickoffAt ? 'LIVE' : 'SCHEDULED');

    const existing = await prisma.match.findUnique({ where: { externalRef } });

    // Don't overwrite a result an admin already entered by hand -- the public
    // feed can lag or briefly disagree right after full time / a shootout.
    const adminHasSetResult = existing?.resultSource === 'ADMIN';

    const match = await prisma.match.upsert({
      where: { externalRef },
      update: adminHasSetResult
        ? {
            homeTeamId: homeTeam?.id ?? undefined,
            awayTeamId: awayTeam?.id ?? undefined,
            venue: m.ground || null,
            kickoffAt,
          }
        : {
            homeTeamId: homeTeam?.id ?? undefined,
            awayTeamId: awayTeam?.id ?? undefined,
            homeTeamLabel: isRealTeamName(m.team1) ? null : m.team1,
            awayTeamLabel: isRealTeamName(m.team2) ? null : m.team2,
            homeScore,
            awayScore,
            status,
            resultSource: 'AUTO',
            venue: m.ground || null,
            kickoffAt,
          },
      create: {
        externalRef,
        round: m.round,
        group: m.group || null,
        kickoffAt,
        lockAt: kickoffAt,
        venue: m.ground || null,
        homeTeamId: homeTeam?.id ?? null,
        awayTeamId: awayTeam?.id ?? null,
        homeTeamLabel: isRealTeamName(m.team1) ? null : m.team1,
        awayTeamLabel: isRealTeamName(m.team2) ? null : m.team2,
        homeScore,
        awayScore,
        status,
        resultSource: 'AUTO',
      },
    });

    createdOrUpdated += 1;

    const justFinished = !adminHasSetResult && status === 'FINISHED' && existing?.status !== 'FINISHED';
    if (justFinished) finishedNow.push(match.id);
  }

  let predictionsScored = 0;
  for (const matchId of finishedNow) {
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    const predictions = await prisma.prediction.findMany({ where: { matchId } });

    for (const p of predictions) {
      const points = calculatePoints(p.predHomeScore, p.predAwayScore, match.homeScore, match.awayScore);
      await prisma.prediction.update({
        where: { id: p.id },
        data: { pointsAwarded: points },
      });
      predictionsScored += 1;
    }
  }

  if (finishedNow.length > 0) {
    await recomputeAllUserTotals();
    await checkChampionBonuses();
    await evaluateAchievements();
  }

  return NextResponse.json({
    ok: true,
    matchesProcessed: createdOrUpdated,
    matchesNewlyFinished: finishedNow.length,
    predictionsScored,
  });
}
