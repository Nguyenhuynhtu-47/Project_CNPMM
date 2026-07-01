import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { logout as logoutService } from '../services/auth';
import notificationService from '../services/notification';
import { menuItems } from '../utils/navigationConfig';
import RoleNavigation from './RoleNavigation';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') : 'http://localhost:8080');

const normalizeNotification = (notification) => ({
    ...notification,
    _id: notification?._id || notification?.id
});

const Navbar = () => {
    const navigate = useNavigate();
    const { user, logout, refreshToken } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const seenNotificationIdsRef = useRef(new Set());

    useEffect(() => {
        if (!user) {
            setUnreadCount(0);
            return undefined;
        }

        let mounted = true;

        const loadUnreadCount = async () => {
            try {
                const response = await notificationService.listNotifications();
                const notifications = response.data.notifications || [];
                if (mounted) {
                    seenNotificationIdsRef.current = new Set(notifications.map((notification) => notification._id || notification.id).filter(Boolean));
                    setUnreadCount(notifications.filter((notification) => !notification.read).length);
                }
            } catch {
                if (mounted) setUnreadCount(0);
            }
        };

        loadUnreadCount();

        const socket = io(SOCKET_URL, { auth: { token: localStorage.getItem('token') } });
        const addUnreadNotification = (data) => {
            const notification = normalizeNotification(data);
            if (notification._id && seenNotificationIdsRef.current.has(notification._id)) return;
            if (notification._id) seenNotificationIdsRef.current.add(notification._id);
            if (!notification.read) {
                setUnreadCount((current) => current + 1);
            }
        };

        const handleNotificationsChanged = () => {
            loadUnreadCount();
        };

        socket.emit('join', user._id);
        socket.on('notification', addUnreadNotification);
        socket.on('new-notification', addUnreadNotification);
        socket.on('enrollment-cancelled', addUnreadNotification);
        window.addEventListener('notifications:changed', handleNotificationsChanged);

        return () => {
            mounted = false;
            socket.off('notification', addUnreadNotification);
            socket.off('new-notification', addUnreadNotification);
            socket.off('enrollment-cancelled', addUnreadNotification);
            socket.disconnect();
            window.removeEventListener('notifications:changed', handleNotificationsChanged);
        };
    }, [user]);

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
    
    // For student navbar, Profile & Notifications are placed separately in the layout (avatar dropdown & dedicated icon)
    const centerMenuItems = visibleMenuItems.filter((item) => item.to !== '/profile' && item.to !== '/notifications');
    
    const initials = displayName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase())
        .join('') || 'TK';
    const avatarUrl = user?.avatar || '';

    return (
        <header className="app-navbar navbar navbar-expand-lg navbar-light py-2">
            <div className="container-fluid px-4 align-items-center">
                {/* Mobile Hamburg Toggle for center links */}
                <button
                    className="navbar-toggler d-lg-none border-0 p-1 me-2"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#studentNavbarLinks"
                    aria-controls="studentNavbarLinks"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                {/* Left: Logo */}
                <Link className="navbar-brand app-brand d-flex align-items-center gap-2 me-4" to="/home">
                    <span className="app-brand__mark">E</span>
                    <span className="fw-bold fs-5 text-dark logo-title">English Course Hub</span>
                </Link>

                {/* Center: Navigation Links */}
                <div className="collapse navbar-collapse justify-content-center" id="studentNavbarLinks">
                    <div className="my-3 my-lg-0">
                        <RoleNavigation items={centerMenuItems} layout="horizontal" />
                    </div>
                </div>

                {/* Right: Notifications & User Avatar */}
                <div className="d-flex align-items-center gap-3 ms-auto ms-lg-0">
                    {/* Notifications Icon Button */}
                    <Link
                        to="/notifications"
                        className="btn-notification-bell position-relative d-flex align-items-center justify-content-center"
                        title="Notifications"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="bell-icon text-muted">
                            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                        </svg>
                        {unreadCount > 0 && (
                            <span className="notification-unread-badge">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </Link>

                    {/* User Avatar Dropdown */}
                    <div className="dropdown">
                        <button
                            className="account-trigger dropdown-toggle d-flex align-items-center gap-2 border-0"
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                        >
                            <span className="account-avatar overflow-hidden">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-100 h-100" style={{ objectFit: 'cover' }} />
                                ) : initials}
                            </span>
                            <span className="d-none d-md-inline font-medium text-dark">{displayName}</span>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-4 mt-2 py-2 account-menu">
                            <li>
                                <div className="dropdown-header px-3 py-2 border-bottom mb-2">
                                    <div className="fw-semibold text-dark text-truncate">{displayName}</div>
                                    <small className="text-muted d-block text-truncate" style={{ fontSize: '0.75rem' }}>{currentRole}</small>
                                </div>
                            </li>
                            <li>
                                <Link className="dropdown-item px-3 py-2 d-flex align-items-center gap-2" to="/profile">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    <span>Profile</span>
                                </Link>
                            </li>
                            <li><hr className="dropdown-divider my-1 opacity-10" /></li>
                            <li>
                                <button
                                    className="dropdown-item text-danger px-3 py-2 d-flex align-items-center gap-2 w-100 text-start"
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
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;


