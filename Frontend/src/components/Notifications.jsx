import { useEffect, useState, useContext, useMemo } from 'react';
import notificationService from '../services/notification';
import { AuthContext } from '../context/AuthContext';
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') : 'http://localhost:8080');

const normalizeNotification = (notification) => ({
  ...notification,
  _id: notification._id || notification.id
});

const renderNotificationIcon = (type = 'info') => {
  const normType = String(type).toLowerCase();
  const baseClasses = "w-4 h-4 shrink-0";
  switch (normType) {
    case 'success':
      return (
        <span className="p-1 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
          <svg className={baseClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
      );
    case 'warning':
      return (
        <span className="p-1 rounded bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
          <svg className={baseClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </span>
      );
    case 'error':
      return (
        <span className="p-1 rounded bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
          <svg className={baseClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
      );
    default:
      return (
        <span className="p-1 rounded bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
          <svg className={baseClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </span>
      );
  }
};

export default function Notifications() {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);

  // filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // load initial notifications
  useEffect(() => {
    if (!user) return;

    const load = async () => {
      try {
        const res = await notificationService.listNotifications();
        setItems(res.data.notifications || []);
        window.dispatchEvent(new Event('notifications:changed'));
      } catch (e) {
        console.error(e);
      }
    };

    load();
  }, [user]);

  // realtime socket
  useEffect(() => {
    if (!user) return;

    const socket = io(SOCKET_URL, { auth: { token: localStorage.getItem('token') } });
    const addNotification = (data) => {
      const notification = normalizeNotification(data);
      setItems((prev) => {
        if (notification._id && prev.some((item) => item._id === notification._id)) return prev;
        return [notification, ...prev];
      });
    };

    socket.emit("join", user._id);

    socket.on("notification", addNotification);
    socket.on("new-notification", addNotification);

    socket.on("enrollment-cancelled", (data) => {
      addNotification({
          _id: data._id || data.id || `enrollment-${data.enrollmentId || Date.now()}`,
          title: data.title,
          message: data.message,
          createdAt: data.createdAt || new Date(),
          read: false
      });
    });

    return () => {
      socket.off("notification", addNotification);
      socket.off("new-notification");
      socket.off("enrollment-cancelled");
      socket.disconnect();
    };
  }, [user]);

  const mark = async (id) => {
    try {
      await notificationService.markRead(id);
      setItems((s) =>
        s.map((x) => (x._id === id ? { ...x, read: true } : x))
      );
      window.dispatchEvent(new Event('notifications:changed'));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllRead = async () => {
    const unreadItems = items.filter((item) => !item.read);
    if (unreadItems.length === 0) return;
    try {
      await Promise.all(unreadItems.map((n) => notificationService.markRead(n._id)));
      setItems((prev) => prev.map((item) => ({ ...item, read: true })));
      window.dispatchEvent(new Event('notifications:changed'));
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setSortBy('newest');
  };

  const filteredItems = useMemo(() => {
    let result = [...items];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          (n.title && n.title.toLowerCase().includes(q)) ||
          (n.message && n.message.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter === 'unread') {
      result = result.filter((n) => !n.read);
    } else if (statusFilter === 'read') {
      result = result.filter((n) => n.read);
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(
        (n) => {
          const type = (n.type || n.meta?.type || 'info').toLowerCase();
          return type === typeFilter;
        }
      );
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [items, searchQuery, statusFilter, typeFilter, sortBy]);

  const isFilterActive = searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || sortBy !== 'newest';

  return (
    <div className="container mx-auto py-5 max-w-4xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 mb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">Stay updated with system announcements, courses, and updates.</p>
        </div>
        <button
          type="button"
          className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={markAllRead}
          disabled={!items.some((n) => !n.read)}
        >
          Mark all as read
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-5 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-grow">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            className="w-full h-8 bg-white border border-slate-200 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="h-8 bg-white border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer min-w-[110px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>

          <select
            className="h-8 bg-white border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer min-w-[110px]"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="success">Success</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>

          <select
            className="h-8 bg-white border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer min-w-[110px]"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>

          {isFilterActive && (
            <button
              type="button"
              className="h-8 px-3 text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-md transition cursor-pointer"
              onClick={handleClearFilters}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg border border-slate-200 p-6 text-slate-500 text-sm">
            No notifications found.
          </div>
        ) : (
          filteredItems.map((n) => {
            const isUnread = !n.read;
            const notificationType = n.type || n.meta?.type || 'info';
            return (
              <div
                key={n._id}
                className={`flex items-center gap-3 p-3.5 border border-slate-200 rounded-lg shadow-sm transition-all duration-150 relative bg-white ${
                  isUnread ? 'bg-blue-50/15 border-blue-100' : 'hover:bg-slate-50/50'
                }`}
              >
                {/* Left side type icon */}
                {renderNotificationIcon(notificationType)}

                {/* Main body content */}
                <div className="flex-grow min-w-0 space-y-3 pr-2">
                  <div className="flex items-start gap-2">
                    {isUnread && (
                      <span
                        className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0"
                        title="Unread"
                      />
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-slate-900 leading-tight font-medium" style={{ fontSize: '15px' }}>
                          {n.title}
                        </h3>

                        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                          {notificationType}
                        </span>
                      </div>

                      <p className="mt-2 text-slate-800 break-words font-normal" style={{ fontSize: '20px', lineHeight: '32px' }}>
                        {n.message}
                      </p>

                      <span className="mt-2 block text-xs text-slate-400 font-medium">
                        {new Date(n.createdAt).toLocaleString("vi-VN")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side ghost actions button */}
                {isUnread && (
                  <div className="shrink-0">
                    <button
                      type="button"
                      className="px-2 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 rounded transition cursor-pointer"
                      onClick={() => mark(n._id)}
                    >
                      Mark read
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
