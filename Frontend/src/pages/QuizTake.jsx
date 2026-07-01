import { useEffect, useState, useContext, useRef, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
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
  const [submittedResult, setSubmittedResult] = useState(null);
  const timerRef = useRef(null);

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
      setSubmittedResult({
        score: res.data.score,
        passed: res.data.passed,
        attemptNumber: res.data.result?.attemptNumber,
        auto
      });
      setMessage(auto ? 'Time is up. Your quiz was auto-submitted.' : 'Quiz submitted successfully.');
      if (timerRef.current) clearInterval(timerRef.current);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }, [answers, id, quiz, submitting]);

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

  const questions = quiz?.questions || [];
  const safeCurrentQuestionIndex = questions.length ? Math.min(currentQuestionIndex, questions.length - 1) : 0;
  const currentQuestion = questions[safeCurrentQuestionIndex];
  const answeredCount = Object.keys(answers).filter((key) => answers[key] !== undefined && answers[key] !== '').length;
  const progressPercent = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;
  const isFirstQuestion = safeCurrentQuestionIndex === 0;
  const isLastQuestion = safeCurrentQuestionIndex === questions.length - 1;
  const currentAnswer = currentQuestion ? answers[currentQuestion._id] || '' : '';
  const handleChange = (qId, value) => setAnswers(a => ({ ...a, [qId]: value }));

  const goToQuestion = (index) => {
    setCurrentQuestionIndex(Math.min(Math.max(index, 0), Math.max(questions.length - 1, 0)));
  };

  const handlePreviousQuestion = () => {
    goToQuestion(safeCurrentQuestionIndex - 1);
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) return;
    goToQuestion(safeCurrentQuestionIndex + 1);
  };
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

        {submittedResult && (
          <div className="alert alert-light border shadow-sm d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <div className="text-muted small fw-semibold text-uppercase">Quiz result</div>
              <div className="display-6 fw-bold mb-0">{submittedResult.score}/100</div>
              <div className={submittedResult.passed ? 'text-success fw-semibold' : 'text-danger fw-semibold'}>
                {submittedResult.passed ? 'Passed' : 'Failed'}
                {submittedResult.attemptNumber ? ` - Attempt #${submittedResult.attemptNumber}` : ''}
              </div>
            </div>
            <Link className="btn btn-primary" to="/my-learning">Back to My learning</Link>
          </div>
        )}

        {!submittedResult && questions.length > 0 && (
          <div className="quiz-progress-card">
            <div className="d-flex justify-content-between gap-3">
              <span>Question {safeCurrentQuestionIndex + 1} of {questions.length}</span>
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
                  className={`quiz-dot ${index === safeCurrentQuestionIndex ? 'quiz-dot--active' : ''} ${answers[question._id] ? 'quiz-dot--answered' : ''}`}
                  onClick={() => goToQuestion(index)}
                  aria-label={`Go to question ${index + 1}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentQuestion && !submittedResult ? (
          <div className="quiz-question-card">
            <div className="quiz-question-label">Question {safeCurrentQuestionIndex + 1}</div>
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
              <button className="btn btn-outline-secondary" type="button" disabled={isFirstQuestion} onClick={handlePreviousQuestion}>
                Previous
              </button>
              {!isLastQuestion ? (
                <button className="btn btn-primary" type="button" onClick={handleNextQuestion}>
                  Next question
                </button>
              ) : (
                <button className="btn btn-primary" type="button" disabled={submitting || answeredCount === 0} onClick={() => handleSubmit()}>
                  {submitting ? 'Submitting...' : 'Submit quiz'}
                </button>
              )}
            </div>
          </div>
        ) : !submittedResult ? (
          <div className="alert alert-secondary">This quiz has no questions yet.</div>
        ) : null}
      </div>
    </div>
  );
}
