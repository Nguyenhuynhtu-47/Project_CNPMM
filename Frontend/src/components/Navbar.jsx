import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout as logoutService } from '../services/auth';

const menuItems = [
    { label: 'Home', to: '/home' },
    { label: 'Courses', to: '/courses' },
    { label: 'Orders', to: '/orders', roles: ['STUDENT', 'USER', 'ADMIN'] },
    { label: 'Enrollments', to: '/enrollments', roles: ['STUDENT', 'USER', 'ADMIN'] },
    { label: 'My learning', to: '/my-learning', roles: ['STUDENT', 'USER', 'ADMIN'] },
    { label: 'Wishlist', to: '/wishlist', roles: ['STUDENT', 'USER', 'ADMIN'] },
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Admin dashboard', to: '/admin', roles: ['ADMIN'] },
    { label: 'Admin management', to: '/admin/manage', roles: ['ADMIN'] },
    { label: 'Manager dashboard', to: '/manager', roles: ['MANAGER', 'ADMIN'] },
    { label: 'Teacher dashboard', to: '/teacher', roles: ['TEACHER', 'ADMIN'] },
    { label: 'Profile', to: '/profile' },
    { label: 'Notifications', to: '/notifications' }
];

const Navbar = () => {
    const navigate = useNavigate();
    const { user, logout, refreshToken } = useAuth();

    const handleLogout = async () => {
        try {
            if (refreshToken) {
                await logoutService({ refreshToken });
            }
        } catch {
            // Ignore logout errors; still clear local state.
        }
        logout();
        navigate('/login');
    };

    const displayName = user?.fullName?.trim() || user?.email || 'My account';
    const currentRole = user?.roleRef?.code || user?.role || 'STUDENT';
    const visibleMenuItems = menuItems.filter((item) => !item.roles || item.roles.includes(currentRole));
    const initials = displayName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase())
        .join('') || 'TK';

    return (
        <header className="app-navbar navbar navbar-expand-lg navbar-light">
            <div className="container-fluid px-4">
                <div className="dropdown">
                    <button
                        className="account-trigger dropdown-toggle"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                    >
                        <span className="account-avatar">{initials}</span>
                        <span className="d-none d-md-inline">My account</span>
                    </button>
                    <ul className="dropdown-menu shadow-lg account-menu">
                        <li>
                            <div className="dropdown-header">
                                <div className="fw-semibold">{displayName}</div>
                                <small className="text-muted">Manage account</small>
                            </div>
                        </li>
                        {visibleMenuItems.map((item) => (
                            <li key={item.to}><Link className="dropdown-item" to={item.to}>{item.label}</Link></li>
                        ))}
                        <li><hr className="dropdown-divider" /></li>
                        <li><button className="dropdown-item text-danger" type="button" onClick={handleLogout}>Logout</button></li>
                    </ul>
                </div>

                <Link className="navbar-brand app-brand mx-auto" to="/home">
                    <span className="app-brand__mark">E</span>
                    <span>English Course Hub</span>
                </Link>

                <div className="nav-cta d-none d-lg-flex align-items-center gap-3">
                    <span className="nav-cta__pill">Learn faster</span>
                    <span className="nav-cta__pill nav-cta__pill--accent">Speak English</span>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
