import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const displayName = user?.fullName?.trim() || user?.email || 'Tài khoản của mình';
    const initials = displayName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase())
        .join('') || 'TK';

    return (
        <header className="app-navbar navbar navbar-expand-lg navbar-dark">
            <div className="container-fluid px-4">
                <div className="dropdown">
                    <button
                        className="account-trigger dropdown-toggle"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                    >
                        <span className="account-avatar">{initials}</span>
                        <span className="d-none d-md-inline">Tài khoản của mình</span>
                    </button>
                    <ul className="dropdown-menu dropdown-menu-dark shadow-lg account-menu">
                        <li>
                            <div className="dropdown-header">
                                <div className="fw-semibold text-white">{displayName}</div>
                                <small className="text-white-50">Quản lý tài khoản</small>
                            </div>
                        </li>
                        <li><Link className="dropdown-item" to="/home">Home</Link></li>
                        <li><Link className="dropdown-item" to="/profile">Profile</Link></li>
                        <li><hr className="dropdown-divider border-secondary" /></li>
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