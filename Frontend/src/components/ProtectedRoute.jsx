import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const normalizeRole = (role) => String(role || '').trim().toUpperCase();

const ProtectedRoute = ({ children, roles = [] }) => {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    const currentRole = normalizeRole(user?.roleRef?.code || user?.role);
    const allowedRoles = roles.map(normalizeRole);

    if (allowedRoles.length > 0 && !allowedRoles.includes(currentRole)) {
        return <Navigate to="/home" replace />;
    }

    return children;
};

export default ProtectedRoute;
