import { useEffect, useState, useContext, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
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
    if (!auto && quiz?.questions?.length && Object.keys(answers).length < quiz.questions.length) {
      const confirmed = window.confirm('Some questions are unanswered. Submit anyway?');
      if (!confirmed) return;
    }
    setSubmitting(true);
    setMessage('');
    setError('');
    try {
      const payload = Object.keys(answers).map(k => ({ questionId: k, answer: answers[k] }));
      const res = await quizService.submitQuiz(id, payload);
      setMessage(`${auto ? 'Auto-submitted' : 'Submitted'}. Score: ${res.data.score}`);
      window.setTimeout(() => navigate('/my-learning'), 1200);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }, [answers, id, navigate, quiz, submitting]);

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

  const questions = quiz?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).filter((key) => answers[key] !== undefined && answers[key] !== '').length;
  const progressPercent = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const currentAnswer = currentQuestion ? answers[currentQuestion._id] || '' : '';
  const formatTime = (seconds) => {
    const safeSeconds = Math.max(0, Number(seconds || 0));
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;
    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  if (!quiz) return <div>Loading...</div>;

  return (
    <div className="quiz-take-page container py-5">
      <div className="quiz-shell">
        <div className="quiz-header">
          <div>
            <span className="eyebrow">Quiz</span>
            <h2>{quiz.title}</h2>
            {quiz.description && <p>{quiz.description}</p>}
            <div className="d-flex flex-wrap gap-2 mt-3">
              <Link className="btn btn-outline-secondary" to="/my-learning">
                Back to My learning
              </Link>
            </div>
          </div>
          <div className="quiz-meta">
            {attempt && <span>Attempt #{attempt.attemptNumber}</span>}
            {timeLeft != null && <strong>{formatTime(timeLeft)}</strong>}
          </div>
        </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

        <div className="quiz-progress-card">
          <div className="d-flex justify-content-between gap-3">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>{answeredCount}/{questions.length} answered</span>
          </div>
          <div className="progress mt-2">
            <div className="progress-bar" style={{ width: `${progressPercent}%` }} aria-valuenow={progressPercent} aria-valuemin="0" aria-valuemax="100" />
          </div>
          <div className="quiz-question-dots" aria-label="Question navigation">
            {questions.map((question, index) => (
              <button
                key={question._id}
                type="button"
                className={`quiz-dot ${index === currentQuestionIndex ? 'quiz-dot--active' : ''} ${answers[question._id] ? 'quiz-dot--answered' : ''}`}
                onClick={() => setCurrentQuestionIndex(index)}
                aria-label={`Go to question ${index + 1}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        {currentQuestion ? (
          <form className="quiz-question-card" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <div className="quiz-question-label">Question {currentQuestionIndex + 1}</div>
            <h3>{currentQuestion.text}</h3>

            {currentQuestion.type === 'MULTIPLE_CHOICE' && (
              <div className="quiz-options">
                {currentQuestion.options.map(opt => {
                  const selected = currentAnswer === opt.key;
                  return (
                    <button
                      className={`quiz-option ${selected ? 'quiz-option--selected' : ''}`}
                      key={opt.key}
                      type="button"
                      onClick={() => handleChange(currentQuestion._id, opt.key)}
                    >
                      <span>{opt.key}</span>
                      <strong>{opt.text}</strong>
                    </button>
                  );
                })}
              </div>
            )}

            {currentQuestion.type === 'ESSAY' && (
              <textarea
                className="form-control quiz-essay"
                rows="7"
                placeholder="Type your answer here..."
                value={currentAnswer}
                onChange={(e) => handleChange(currentQuestion._id, e.target.value)}
              />
            )}

            <div className="quiz-actions">
              <button className="btn btn-outline-secondary" type="button" disabled={isFirstQuestion} onClick={() => setCurrentQuestionIndex((index) => Math.max(index - 1, 0))}>
                Previous
              </button>
              {!isLastQuestion ? (
                <button className="btn btn-primary" type="button" onClick={() => setCurrentQuestionIndex((index) => Math.min(index + 1, questions.length - 1))}>
                  Next question
                </button>
              ) : (
                <button className="btn btn-primary" type="submit" disabled={submitting || answeredCount === 0}>
                  {submitting ? 'Submitting...' : 'Submit quiz'}
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="alert alert-secondary">This quiz has no questions yet.</div>
        )}
      </div>
    </div>
  );
}
