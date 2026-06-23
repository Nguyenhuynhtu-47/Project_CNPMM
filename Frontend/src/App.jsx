import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import ProtectedLayout from './layouts/ProtectedLayout';
import PublicLayout from './layouts/PublicLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './App.css';

const RootRedirect = () => {
  const token = localStorage.getItem('token');
  return <Navigate to={token ? '/home' : '/login'} replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
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
      </Router>
    </AuthProvider>
  );
}

export default App;
