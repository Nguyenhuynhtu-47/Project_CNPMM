import { useEffect, useState, useContext, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import quizService from '../services/quiz';
import { AuthContext } from '../context/AuthContext';
import useSocket from '../hooks/useSocket';

export default function QuizTake() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  useSocket(user);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [attempt, setAttempt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await quizService.getQuiz(id);
        if (mounted) setQuiz(res.data.quiz);
      } catch (e) { console.error(e); }
    })();
    return () => { mounted = false; };
  }, [id]);

  const handleSubmit = useCallback(async (auto = false) => {
    if (submitting) return;
    setSubmitting(true);
    setMessage('');
    setError('');
    try {
      const payload = Object.keys(answers).map(k => ({ questionId: k, answer: answers[k] }));
      const res = await quizService.submitQuiz(id, payload);
      setMessage(`${auto ? 'Auto-submitted' : 'Submitted'}. Score: ${res.data.score}`);
      window.setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }, [answers, id, navigate, submitting]);

  useEffect(() => {
    if (!quiz) return;
    let mounted = true;
    if ((quiz.timeLimitSeconds || quiz.durationMinutes) > 0) {
      (async () => {
        try {
          const res = await quizService.startAttempt(id);
          if (!mounted) return;
          setAttempt(res.data.attempt);
          const limit = quiz.timeLimitSeconds && quiz.timeLimitSeconds > 0 ? quiz.timeLimitSeconds : (quiz.durationMinutes || 0) * 60;
          setTimeLeft(limit);
          timerRef.current = setInterval(() => setTimeLeft(t => (t != null ? t - 1 : null)), 1000);
        } catch (e) { console.error(e); }
      })();
    }
    return () => { mounted = false; if (timerRef.current) clearInterval(timerRef.current); };
  }, [quiz, id]);

  useEffect(() => {
    if (timeLeft === 0) {
      const timer = window.setTimeout(() => {
        handleSubmit(true);
      }, 0);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [timeLeft, handleSubmit]);

  const handleChange = (qId, value) => setAnswers(a => ({ ...a, [qId]: value }));

  if (!quiz) return <div>Loading...</div>;

  return (
    <div>
      <h3>{quiz.title}</h3>
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      {attempt && <div className="small text-muted">Attempt #{attempt.attemptNumber}</div>}
      {timeLeft != null && <div className="mb-2">Time left: {Math.max(0, timeLeft)}s</div>}
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        {quiz.questions.map(q => (
          <div key={q._id} className="mb-3">
            <div><strong>{q.text}</strong></div>
            {q.type === 'MULTIPLE_CHOICE' && q.options.map(opt => (
              <div className="form-check" key={opt.key}>
                <input className="form-check-input" type="radio" name={q._id} id={`${q._id}_${opt.key}`} onChange={() => handleChange(q._id, opt.key)} />
                <label className="form-check-label" htmlFor={`${q._id}_${opt.key}`}>{opt.text}</label>
              </div>
            ))}
            {q.type === 'ESSAY' && (
              <textarea className="form-control" onChange={(e) => handleChange(q._id, e.target.value)} />
            )}
          </div>
        ))}

        <button className="btn btn-primary" type="submit" disabled={submitting || Object.keys(answers).length === 0}>
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
}
