import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, roles = [] }) => {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    const currentRole = user?.roleRef?.code || user?.role;
    if (roles.length > 0 && !roles.includes(currentRole)) {
        return <Navigate to="/home" replace />;
    }

    return children;
};

export default ProtectedRoute;
