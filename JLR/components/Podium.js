'use client';

const STEP_HEIGHT = { 1: 'h-24', 2: 'h-20', 3: 'h-16' };
const ORDER = [2, 1, 3];

function rankBadge(rank) {
  if (rank === 1) return '#1';
  if (rank === 2) return '#2';
  if (rank === 3) return '#3';
  return `#${rank}`;
}

export default function Podium({ top3 }) {
  if (!top3 || top3.length === 0) return null;

  const byRank = Object.fromEntries(top3.map((u) => [u.rank, u]));

  return (
    <div className="flex items-end justify-center gap-2 px-1">
      {ORDER.map((rank) => {
        const u = byRank[rank];

        if (!u) return <div key={rank} className="flex-1" />;

        return (
          <div key={rank} className="flex-1 flex flex-col items-center min-w-0">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center font-extrabold text-base mb-2 border-2 shadow-sm"
              style={{
                backgroundColor: `${u.department?.colorHex || '#9B6A43'}26`,
                borderColor: u.department?.colorHex || '#9B6A43',
                color: '#3A2C22',
              }}
            >
              {u.avatarLabel}
            </div>

            <p className="text-xs text-ink text-center font-bold leading-tight mb-2 line-clamp-2 max-w-[100px] min-h-[32px]">
              {u.name}
            </p>

            <div
              className={`w-full rounded-t-2xl flex flex-col items-center justify-start pt-2 ${STEP_HEIGHT[rank]} ${
                rank === 1
                  ? 'bg-gold'
                  : rank === 2
                  ? 'bg-terracotta'
                  : 'bg-card-border'
              }`}
            >
              <span className="font-display font-extrabold text-lg text-white">
                {rankBadge(rank)}
              </span>

              <span className="text-white text-xs font-bold mt-1">
                {u.totalPoints} pts
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}