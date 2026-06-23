'use client';

const STEP_HEIGHT = { 1: 'h-28', 2: 'h-20', 3: 'h-14' };
const ORDER = [2, 1, 3]; // classic podium layout, left to right: 2nd, 1st, 3rd

export default function Podium({ top3 }) {
  if (!top3 || top3.length === 0) return null;

  const byRank = Object.fromEntries(top3.map((u) => [u.rank, u]));

  return (
    <div className="flex items-end justify-center gap-3 px-2">
      {ORDER.map((rank) => {
        const u = byRank[rank];
        if (!u) return <div key={rank} className="flex-1" />;
        return (
          <div key={rank} className="flex-1 flex flex-col items-center">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm mb-2 border-2"
              style={{
                backgroundColor: `${u.department?.colorHex || '#9B6A43'}26`,
                borderColor: u.department?.colorHex || '#9B6A43',
                color: '#3A2C22',
              }}
            >
              {u.avatarLabel}
            </div>
            <p className="text-xs text-ink text-center font-semibold leading-tight mb-0.5 line-clamp-1 max-w-[90px]">
              {u.name}
            </p>
            <p className="font-tabular text-gold-dark font-bold text-sm mb-2">{u.totalPoints}</p>
            <div
              className={`w-full rounded-t-xl flex items-start justify-center pt-2 ${STEP_HEIGHT[rank]} ${
                rank === 1 ? 'bg-gold' : rank === 2 ? 'bg-terracotta' : 'bg-card-border'
              }`}
            >
              <span className="font-display font-extrabold text-xl text-white">
                {rank}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
