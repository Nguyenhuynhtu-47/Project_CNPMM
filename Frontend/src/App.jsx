import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import ProtectedLayout from './layouts/ProtectedLayout';
import PublicLayout from './layouts/PublicLayout';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './App.css';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const VerifyOtp = lazy(() => import('./pages/VerifyOtp'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Profile = lazy(() => import('./pages/Profile'));
const Courses = lazy(() => import('./pages/Courses'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const Checkout = lazy(() => import('./pages/Checkout'));
const QuizTake = lazy(() => import('./pages/QuizTake'));
const Notifications = lazy(() => import('./components/Notifications'));
const Enrollments = lazy(() => import('./pages/Enrollments'));
const StudentLearning = lazy(() => import('./pages/StudentLearning'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Orders = lazy(() => import('./pages/Orders'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminManagement = lazy(() => import('./pages/AdminManagement'));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'));
const ManagerDashboard = lazy(() => import('./pages/ManagerDashboard'));

const RootRedirect = () => {
  const token = localStorage.getItem('token');
  return <Navigate to={token ? '/home' : '/login'} replace />;
};

const PageFallback = () => <div className="container py-5">Loading page...</div>;

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<RootRedirect />} />

          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <PublicLayout>
                  <Login />
                </PublicLayout>
              </PublicOnlyRoute>
            }
          />

          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <PublicLayout>
                  <Register />
                </PublicLayout>
              </PublicOnlyRoute>
            }
          />

          <Route
            path="/verify-email"
            element={
              <PublicOnlyRoute>
                <PublicLayout>
                  <VerifyOtp />
                </PublicLayout>
              </PublicOnlyRoute>
            }
          />

          <Route
            path="/forgot-password"
            element={
              <PublicOnlyRoute>
                <PublicLayout>
                  <ForgotPassword />
                </PublicLayout>
              </PublicOnlyRoute>
            }
          />

          <Route
            path="/reset-password"
            element={
              <PublicOnlyRoute>
                <PublicLayout>
                  <ResetPassword />
                </PublicLayout>
              </PublicOnlyRoute>
            }
          />

          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <Home />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/courses"
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <Courses />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/courses/:id"
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <CourseDetail />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/checkout/:courseId"
            element={
              <ProtectedRoute roles={['STUDENT', 'USER', 'ADMIN']}>
                <ProtectedLayout>
                  <Checkout />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/quizzes/:id"
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <QuizTake />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <Notifications />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <Dashboard />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/enrollments"
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <Enrollments />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-learning"
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <StudentLearning />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/wishlist"
            element={
              <ProtectedRoute roles={['STUDENT', 'USER', 'ADMIN']}>
                <ProtectedLayout>
                  <Wishlist />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <Orders />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <ProtectedLayout>
                  <AdminDashboard />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/manage"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <ProtectedLayout>
                  <AdminManagement />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher"
            element={
              <ProtectedRoute roles={['TEACHER', 'ADMIN']}>
                <ProtectedLayout>
                  <TeacherDashboard />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager"
            element={
              <ProtectedRoute roles={['MANAGER', 'ADMIN']}>
                <ProtectedLayout>
                  <ManagerDashboard />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <Profile />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<RootRedirect />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
