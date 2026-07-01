import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout as logoutService } from '../services/auth';
import { menuItems } from '../utils/navigationConfig';
import RoleNavigation from './RoleNavigation';

const Sidebar = () => {
    const navigate = useNavigate();
    const { user, logout, refreshToken } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

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
    const rawRole = user?.roleRef?.code || user?.role || 'STUDENT';
    const currentRole = String(rawRole).toUpperCase();
    
    // Filter according to role permissions
    const visibleMenuItems = menuItems.filter((item) => !item.roles || item.roles.includes(currentRole));

    const initials = displayName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase())
        .join('') || 'TK';

    const toggleSidebar = () => setIsOpen(!isOpen);
    const closeSidebar = () => setIsOpen(false);

    return (
        <>
            {/* Mobile Header (visible only on screen < 992px) */}
            <header className="mobile-admin-header d-lg-none d-flex align-items-center justify-content-between px-3 py-2 border-bottom bg-white sticky-top">
                <button className="btn btn-link text-dark p-1 d-flex align-items-center" onClick={toggleSidebar}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="4" x2="20" y1="12" y2="12" />
                        <line x1="4" x2="20" y1="6" y2="6" />
                        <line x1="4" x2="20" y1="18" y2="18" />
                    </svg>
                </button>
                <Link className="app-brand d-flex align-items-center gap-2" to="/home">
                    <span className="app-brand__mark">E</span>
                    <span className="fw-bold fs-5 text-dark">English Hub</span>
                </Link>
                <div className="mobile-avatar d-flex align-items-center justify-content-center account-avatar" style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}>
                    {initials}
                </div>
            </header>

            {/* Sidebar container */}
            <aside className={`app-sidebar d-flex flex-column bg-white border-end ${isOpen ? 'show' : ''}`}>
                {/* Top Section: Logo */}
                <div className="sidebar-brand-wrapper px-4 py-4 d-flex align-items-center justify-content-between border-bottom">
                    <Link className="app-brand d-flex align-items-center gap-2" to="/home" onClick={closeSidebar}>
                        <span className="app-brand__mark">E</span>
                        <span className="fw-bold fs-5 text-dark">English Hub</span>
                    </Link>
                    <button className="btn-close d-lg-none text-dark" onClick={closeSidebar} aria-label="Close"></button>
                </div>

                {/* Middle Section: Scrollable menu items */}
                <div className="sidebar-menu-wrapper flex-grow-1 overflow-y-auto px-3 py-3">
                    <RoleNavigation items={visibleMenuItems} layout="vertical" onItemClick={closeSidebar} />
                </div>

                {/* Bottom Section: User profile and fixed Logout */}
                <div className="sidebar-footer-wrapper p-3 border-top bg-light">
                    <div className="d-flex align-items-center gap-3 mb-3 px-2">
                        <div className="account-avatar d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: '40px', height: '40px' }}>
                            {initials}
                        </div>
                        <div className="overflow-hidden">
                            <div className="fw-semibold text-dark text-truncate" style={{ fontSize: '0.9rem' }}>{displayName}</div>
                            <small className="text-muted d-block text-truncate" style={{ fontSize: '0.75rem' }}>{currentRole}</small>
                        </div>
                    </div>
                    <button
                        className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2 py-2 rounded-3"
                        type="button"
                        onClick={handleLogout}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" x2="9" y1="12" y2="12" />
                        </svg>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Sidebar backdrop */}
            {isOpen && <div className="sidebar-backdrop d-lg-none" onClick={closeSidebar}></div>}
        </>
    );
};

export default Sidebar;
