import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import quizService from '../services/quiz';
import PaginationControls from '../components/PaginationControls';
import { createPagination } from '../utils/pagination';

export default function QuizList() {
  const params = useParams();
  const courseId = params.id;
  const [quizzes, setQuizzes] = useState([]);
  const [page, setPage] = useState(1);
  const pagedQuizzes = createPagination(quizzes, page, 10);

  useEffect(() => {
    if (!courseId) return;
    (async () => {
      try {
        const res = await quizService.getQuizzesByCourse(courseId);
        setQuizzes(res.data.quizzes);
      } catch (e) { console.error(e); }
    })();
  }, [courseId]);

  return (
    <div>
      <h3>Quizzes</h3>
      <ul className="list-group">
        {pagedQuizzes.items.map(q => (
          <li key={q._id} className="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <strong>{q.title}</strong>
              <div className="small text-muted">{q.description}</div>
            </div>
            <Link to={`/quizzes/${q._id}`} className="btn btn-primary btn-sm">Take</Link>
          </li>
        ))}
      </ul>
      {quizzes.length > 0 && <PaginationControls pagination={pagedQuizzes.pagination} onPageChange={setPage} itemLabel="quizzes" />}
    </div>
  );
}
