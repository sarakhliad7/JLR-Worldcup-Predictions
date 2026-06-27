'use client';

import { useEffect, useState } from 'react';

export default function AdminRewardsPage() {
  const [rounds, setRounds] = useState([]);
  const [winners, setWinners] = useState([]);
  const [roundKey, setRoundKey] = useState('Group Stage');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingRounds, setLoadingRounds] = useState(true);

  async function loadWinners() {
    try {
      const res = await fetch('/api/admin/rewards', { cache: 'no-store' });
      const data = await res.json();
      setWinners(data.winners || []);
    } catch (error) {
      console.error(error);
      setMessage('Failed to load winners.');
    }
  }

  async function loadRounds() {
    try {
      const res = await fetch('/api/admin/rounds', { cache: 'no-store' });
      const data = await res.json();
      const dynamicRounds = data.rounds || [];

      setRounds(dynamicRounds);

      if (dynamicRounds.length > 0) {
        setRoundKey(dynamicRounds[0].key);
      }
    } catch (error) {
      console.error(error);
      setMessage('Failed to load stages.');
    } finally {
      setLoadingRounds(false);
    }
  }

  useEffect(() => {
    loadWinners();
    loadRounds();
  }, []);

  async function generateWinner(e) {
    e.preventDefault();
    setMessage('');

    const selectedRound = roundKey || rounds[0]?.key;

    if (!selectedRound) {
      setMessage('Please select a stage first.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/rewards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundKey: selectedRound }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || 'Something went wrong.');
        return;
      }

      setMessage(
        data.alreadyExists
          ? 'Winner already exists for this stage.'
          : 'Winner generated successfully.'
      );

      await loadWinners();
    } catch (error) {
      console.error(error);
      setMessage('Failed to generate winner.');
    } finally {
      setLoading(false);
    }
  }

  async function deleteWinner(id) {
    const ok = window.confirm('Delete this winner?');
    if (!ok) return;

    try {
      await fetch(`/api/admin/rewards?id=${id}`, {
        method: 'DELETE',
      });

      await loadWinners();
    } catch (error) {
      console.error(error);
      setMessage('Failed to delete winner.');
    }
  }

  function getRoundLabel(key) {
    return rounds.find((r) => r.key === key)?.label || key;
  }

  return (
    <main className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold text-ink-heading">Rewards</h1>
        <p className="mt-2 text-ink-muted">
          Generate one winner automatically for each stage based on stage points.
        </p>
      </section>

      <form
        onSubmit={generateWinner}
        className="grid gap-4 rounded-[2rem] border border-card-border bg-white/80 p-6 shadow-sm md:grid-cols-2"
      >
        <div>
          <label className="mb-2 block text-sm font-bold text-ink-heading">
            Stage
          </label>

          <select
            value={roundKey}
            onChange={(e) => setRoundKey(e.target.value)}
            className="w-full rounded-2xl border border-card-border bg-white px-4 py-3"
          >
            {loadingRounds ? (
              <option value="">Loading stages...</option>
            ) : rounds.length === 0 ? (
              <option value="">No stages found</option>
            ) : (
              rounds.map((round) => (
                <option key={round.key} value={round.key}>
                  {round.label}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded-2xl bg-[#9B6A43] px-5 py-3 font-bold text-white shadow-sm hover:opacity-90"
          >
            {loading ? 'Generating...' : 'Generate Winner'}
          </button>
        </div>

        {message ? (
          <p className="md:col-span-2 text-sm font-bold text-[#9B6A43]">
            {message}
          </p>
        ) : null}
      </form>

      <section className="overflow-hidden rounded-[2rem] border border-card-border bg-white/80 shadow-sm">
        <table className="w-full text-left">
          <thead className="border-b border-card-border text-sm text-ink-muted">
            <tr>
              <th className="px-5 py-4">Stage</th>
              <th className="px-5 py-4">Name</th>
              <th className="px-5 py-4">Employee ID</th>
              <th className="px-5 py-4">Stage Points</th>
              <th className="px-5 py-4">Action</th>
            </tr>
          </thead>

          <tbody>
            {winners.map((winner) => (
              <tr key={winner.id} className="border-b border-card-border/70">
                <td className="px-5 py-4 font-bold">
                  {getRoundLabel(winner.roundKey)}
                </td>
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
                  No winners generated yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </main>
  );
}