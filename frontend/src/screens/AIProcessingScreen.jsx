import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { confirmTeams, getJobResult, getJobStatus, resolveVideoUrl } from '../services/api';
import './AIProcessingScreen.css';

export default function AIProcessingScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const jobId = location.state?.jobId || location.state?.uploadResult?.job_id;
  const [job, setJob] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!jobId) return;
    const controller = new AbortController();
    let timer;
    async function poll() {
      try {
        const state = await getJobStatus(jobId, controller.signal);
        if (controller.signal.aborted) return;
        setJob(state);
        if (state.status === 'failed') throw new Error(state.error || 'Analysis failed.');
        if (state.status === 'completed') {
          const result = await getJobResult(jobId, controller.signal);
          if (!controller.signal.aborted) navigate('/summary', { replace: true, state: { matchId: result.match_id, result } });
          return;
        }
        timer = setTimeout(poll, 1500);
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message);
      }
    }
    poll();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [jobId, navigate, attempt]);

  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const names = { team_1_name: form.get('team_1_name')?.trim(), team_2_name: form.get('team_2_name')?.trim() };
    if (!names.team_1_name || !names.team_2_name || names.team_1_name.toLowerCase() === names.team_2_name.toLowerCase()) {
      setError('Enter a different name for each detected team.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await confirmTeams(jobId, names);
      setJob(current => ({ ...current, status: 'queued', stage: 'Team names confirmed' }));
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  const candidates = [...(job?.team_candidates || [])].sort((a, b) => a.cluster_id - b.cluster_id);
  const awaitingTeams = job?.status === 'awaiting_team_confirmation';
  const progress = Math.max(0, Math.min(100, Math.round(job?.progress_percent || 0)));
  const active = Boolean(jobId && !awaitingTeams && !error && job?.status !== 'failed');
  const teamsConfirmed = ['queued', 'processing', 'completed'].includes(job?.status);
  const finalizing = teamsConfirmed && /summary|highlight|saving|complete/i.test(job?.stage || '');
  const hasFrameCounts = job?.status === 'processing' && !finalizing
    && Number.isInteger(job?.processed_frames) && Number.isInteger(job?.total_frames)
    && job.processed_frames >= 0 && job.total_frames > 0;
  const frameStatus = hasFrameCounts
    ? `Detecting frames — ${job.processed_frames.toLocaleString()} of ${job.total_frames.toLocaleString()}`
    : null;
  const currentStep = finalizing ? 3 : teamsConfirmed ? 2 : awaitingTeams ? 1 : 0;
  const steps = ['Detecting team kits', 'Confirming team names', 'Analysing match footage', 'Building summary & highlights'];
  return (
    <main className={`processing-screen${awaitingTeams ? ' processing-screen--teams' : ''}`}>
      <div className="processing-glow processing-glow--top" aria-hidden="true" />
      <div className="processing-glow processing-glow--bottom" aria-hidden="true" />
      <div className="processing-content">
        <header className="processing-header">
          <div className="processing-brand"><span className="processing-brand-icon" aria-hidden="true">⚽</span>Football AI</div>
          <span className="processing-badge"><span className={active ? 'is-live' : ''} />{awaitingTeams ? 'YOUR TURN' : error ? 'PAUSED' : 'LIVE ANALYSIS'}</span>
        </header>
        <div className={`processing-ring${active ? ' processing-ring--active' : ''}`} role="progressbar" aria-label="Analysis progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-valuetext={frameStatus || undefined}>
          <div className="processing-orbit" aria-hidden="true" />
          <svg className="processing-ring-track" viewBox="0 0 220 220" aria-hidden="true">
            <circle className="processing-track" cx="110" cy="110" r="84" />
            <circle className="processing-progress" cx="110" cy="110" r="84" pathLength="100" strokeDasharray={`${progress} 100`} />
          </svg>
          <div className="processing-ring-center" aria-hidden="true">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m7 14 4-4 4 3 5-7" /><path d="M16 6h4v4" /></svg>
          </div>
          {!hasFrameCounts && <span className="processing-percent">{progress}%</span>}
        </div>
        <div className="processing-copy">
          <h1>{!jobId ? 'Start a new analysis' : error ? 'Analysis needs attention' : awaitingTeams ? 'Confirm the detected teams' : 'AI is analysing match footage...'}</h1>
          <p role="status">{!jobId ? 'Upload a match video to begin.' : frameStatus || job?.stage || 'Connecting to analysis server...'}</p>
          {location.state?.fileName && <p className="processing-file">File: {location.state.fileName}</p>}
        </div>
        {awaitingTeams ? <form className="processing-team-form" onSubmit={submit}>
          <p>Name the team wearing each pictured kit to continue the analysis.</p>
          <div className="processing-team-grid">
            {candidates.map(candidate => <label key={candidate.cluster_id} className="processing-team-card">
              <img src={resolveVideoUrl(candidate.sample_image)} alt={`Representative player for kit ${candidate.cluster_id}`} />
              <span>Team wearing kit {candidate.cluster_id}</span>
              <input name={`team_${candidate.cluster_id}_name`} required maxLength={100} placeholder="Enter team name" />
            </label>)}
          </div>
          <button className="processing-confirm" disabled={saving || candidates.length !== 2}>
            {saving ? 'Confirming...' : 'Confirm teams and continue'}
          </button>
        </form> : jobId && <ol className="processing-steps">
          {steps.map((step, index) => <li key={step} className={index < currentStep ? 'is-done' : index === currentStep ? 'is-current' : ''} aria-current={index === currentStep ? 'step' : undefined}>
            <span className="processing-step-icon" aria-hidden="true">{index < currentStep ? '✓' : index + 1}</span><span>{step}</span>
          </li>)}
        </ol>}
        {error && <div className="processing-error" role="alert"><p>{error}</p><button onClick={() => { setError(''); setAttempt(value => value + 1); }}>Retry status check</button></div>}
      </div>
      <footer className="processing-footer">
        <p>POWERED BY <span aria-hidden="true" /> <strong>FOOTBALL INTELLIGENCE</strong></p>
        <button onClick={() => navigate('/upload')}>Back to upload</button>
        {jobId && <small>Leaving this page does not cancel the backend job.</small>}
      </footer>
    </main>
  );
}
