'use client';

import { useEffect, useState } from 'react';

const rounds = [
  { key: 'r32', label: 'Round of 32 / دور 32' },
  { key: 'r16', label: 'Round of 16 / دور 16' },
  { key: 'qf', label: 'Quarter-finals / ربع النهائي' },
  { key: 'sf', label: 'Semi-finals / نصف النهائي' },
  { key: 'final', label: 'Final / النهائي' }
];

export default function AdminRewardsPage() {
  const [winners, setWinners] = useState([]);
  const [roundKey, setRoundKey] = useState('r32');
  const [employeeCode, setEmployeeCode] = useState('');
  const [points, setPoints] = useState('');
  const [message, setMessage] = useState('');

  async function loadWinners() {
    const res = await fetch('/api/admin/rewards', { cache: 'no-store' });
    const data = await res.json();
    setWinners(data.winners || []);
  }

  useEffect(() => {
    loadWinners();
  }, []);

  async function addWinner(e) {
    e.preventDefault();
    setMessage('');

    const res = await fetch('/api/admin/rewards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roundKey,
        employeeCode,
        points: Number(points || 0)
      })
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || 'Something went wrong.');
      return;
    }

    setEmployeeCode('');
    setPoints('');
    setMessage('Winner added successfully.');
    loadWinners();
  }

  async function deleteWinner(id) {
    const ok = window.confirm('Delete this winner?');
    if (!ok) return;

    await fetch(`/api/admin/rewards?id=${id}`, {
      method: 'DELETE'
    });

    loadWinners();
  }

  function getRoundLabel(key) {
    return rounds.find((r) => r.key === key)?.label || key;
  }

  return (
    <main className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold text-ink-heading">Rewards</h1>
        <p className="mt-2 text-ink-muted">
          Announce reward winners manually by Employee ID.
        </p>
      </section>

      <form
        onSubmit={addWinner}
        className="grid gap-4 rounded-[2rem] border border-card-border bg-white/80 p-6 shadow-sm md:grid-cols-4"
      >
        <div>
          <label className="mb-2 block text-sm font-bold text-ink-heading">
            Round
          </label>
          <select
            value={roundKey}
            onChange={(e) => setRoundKey(e.target.value)}
            className="w-full rounded-2xl border border-card-border bg-white px-4 py-3"
          >
            {rounds.map((round) => (
              <option key={round.key} value={round.key}>
                {round.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-ink-heading">
            Employee ID
          </label>
          <input
            value={employeeCode}
            onChange={(e) => setEmployeeCode(e.target.value)}
            placeholder="e.g. 1001"
            className="w-full rounded-2xl border border-card-border bg-white px-4 py-3"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-ink-heading">
            Points
          </label>
          <input
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            placeholder="e.g. 18"
            type="number"
            className="w-full rounded-2xl border border-card-border bg-white px-4 py-3"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded-2xl bg-brand px-5 py-3 font-bold text-white"
          >
            Add Winner
          </button>
        </div>

        {message ? (
          <p className="md:col-span-4 text-sm font-bold text-brand">
            {message}
          </p>
        ) : null}
      </form>

      <section className="overflow-hidden rounded-[2rem] border border-card-border bg-white/80 shadow-sm">
        <table className="w-full text-left">
          <thead className="border-b border-card-border text-sm text-ink-muted">
            <tr>
              <th className="px-5 py-4">Round</th>
              <th className="px-5 py-4">Name</th>
              <th className="px-5 py-4">Employee ID</th>
              <th className="px-5 py-4">Points</th>
              <th className="px-5 py-4">Action</th>
            </tr>
          </thead>

          <tbody>
            {winners.map((winner) => (
              <tr key={winner.id} className="border-b border-card-border/70">
                <td className="px-5 py-4 font-bold">{getRoundLabel(winner.roundKey)}</td>
                <td className="px-5 py-4">{winner.user?.name}</td>
                <td className="px-5 py-4">{winner.user?.employeeCode}</td>
                <td className="px-5 py-4">{winner.points}</td>
                <td className="px-5 py-4">
                  <button
                    type="button"
                    onClick={() => deleteWinner(winner.id)}
                    className="rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {!winners.length ? (
              <tr>
                <td colSpan="5" className="px-5 py-8 text-center text-ink-muted">
                  No winners announced yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </main>
  );
}
