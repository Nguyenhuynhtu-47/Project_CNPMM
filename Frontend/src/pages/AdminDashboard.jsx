import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getStatisticsOverview } from '../services/statistics';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadStats = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await getStatisticsOverview();
                setStats(response.data);
            } catch (requestError) {
                setError(requestError.response?.data?.message || 'Cannot load statistics');
            } finally {
                setLoading(false);
            }
        };

        loadStats();
    }, []);

    const currentDate = new Date().toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    if (loading) {
        return <div className="container-fluid py-5 text-center text-muted fw-semibold">Loading admin dashboard...</div>;
    }

    if (error) {
        return (
            <div className="container-fluid px-0 py-3">
                <div className="alert alert-danger py-2.5">{error}</div>
            </div>
        );
    }

    const chartData = stats?.topCourses?.length
        ? stats.topCourses
        : [{ title: 'No paid orders', totalSales: 0, revenue: 0 }];

    const formatCurrency = (val) => `${Number(val || 0).toLocaleString('vi-VN')} VND`;

    return (
        <div className="container-fluid px-0 py-3">
            {/* Header Block */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4 p-4 bg-white rounded-4 border">
                <div>
                    <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-1.5 mb-2 text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>Overview</span>
                    <h2 className="fw-bold mb-1 text-dark">Administrator console</h2>
                    <p className="text-muted mb-0 small">System health, financial summary statistics, registrations, and courses.</p>
                </div>
                <div className="d-flex flex-wrap align-items-center gap-3 flex-shrink-0">
                    <span className="badge bg-light text-secondary border px-3 py-2 rounded-3 fw-semibold small">
                        {currentDate}
                    </span>
                    <Link className="btn btn-primary px-4 py-2 rounded-3 fw-bold auth-primary-btn" to="/admin/manage">
                        Manage console
                    </Link>
                </div>
            </div>

            {/* KPI Metrics row */}
            <div className="row g-3 mb-4">
                <div className="col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm rounded-4 p-4 d-flex flex-row align-items-center gap-3 h-100">
                        <div className="bg-success-subtle p-3 rounded-4 flex-shrink-0 d-flex align-items-center justify-content-center text-success" style={{ width: '56px', height: '56px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" x2="12" y1="1" y2="23" />
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                        </div>
                        <div className="overflow-hidden">
                            <span className="text-muted small fw-semibold text-uppercase" style={{ letterSpacing: '0.05em', fontSize: '0.72rem' }}>Total Revenue</span>
                            <strong className="text-dark d-block fs-5 mt-0.5 text-truncate fw-bold">{formatCurrency(stats?.revenue)}</strong>
                        </div>
                    </div>
                </div>

                <div className="col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm rounded-4 p-4 d-flex flex-row align-items-center gap-3 h-100">
                        <div className="bg-primary-subtle p-3 rounded-4 flex-shrink-0 d-flex align-items-center justify-content-center text-primary" style={{ width: '56px', height: '56px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                        <div className="overflow-hidden">
                            <span className="text-muted small fw-semibold text-uppercase" style={{ letterSpacing: '0.05em', fontSize: '0.72rem' }}>Active Students</span>
                            <strong className="text-dark d-block fs-4 mt-0.5 fw-bold">{stats?.newStudents ?? 0}</strong>
                        </div>
                    </div>
                </div>

                <div className="col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm rounded-4 p-4 d-flex flex-row align-items-center gap-3 h-100">
                        <div className="bg-info-subtle p-3 rounded-4 flex-shrink-0 d-flex align-items-center justify-content-center text-info" style={{ width: '56px', height: '56px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                            </svg>
                        </div>
                        <div className="overflow-hidden">
                            <span className="text-muted small fw-semibold text-uppercase" style={{ letterSpacing: '0.05em', fontSize: '0.72rem' }}>New Registrations</span>
                            <strong className="text-dark d-block fs-4 mt-0.5 fw-bold">{stats?.registrations ?? 0}</strong>
                        </div>
                    </div>
                </div>

                <div className="col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm rounded-4 p-4 d-flex flex-row align-items-center gap-3 h-100">
                        <div className="bg-warning-subtle p-3 rounded-4 flex-shrink-0 d-flex align-items-center justify-content-center text-warning" style={{ width: '56px', height: '56px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                        <div className="overflow-hidden">
                            <span className="text-muted small fw-semibold text-uppercase" style={{ letterSpacing: '0.05em', fontSize: '0.72rem' }}>Completion Rate</span>
                            <strong className="text-dark d-block fs-4 mt-0.5 fw-bold">{stats?.completionRate ?? 0}%</strong>
                        </div>
                    </div>
                </div>
            </div>

            {/* Analytics and Top Courses Section */}
            <div className="row g-4 mb-4">
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4 className="fw-bold text-dark mb-0 fs-5">Best-selling courses</h4>
                            <span className="text-muted small">Analytics overview</span>
                        </div>
                        <div style={{ height: 320 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="title" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip formatter={(value, name) => name === 'revenue' ? formatCurrency(value) : value} />
                                    <Bar dataKey="totalSales" fill="#0d6efd" radius={[4, 4, 0, 0]} name="Paid orders count" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Quick management shortcuts & system info */}
                <div className="col-lg-4 d-flex flex-column gap-4">
                    <div className="card border-0 shadow-sm rounded-4 p-4 flex-grow-1">
                        <h4 className="fw-bold text-dark mb-3 fs-5">Quick navigation</h4>
                        <div className="d-flex flex-column gap-2">
                            <Link className="btn btn-outline-secondary text-start px-3 py-2 rounded-3 border-light-subtle d-flex align-items-center justify-content-between" to="/admin/manage">
                                <span className="small text-dark fw-semibold">User management</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                            </Link>
                            <Link className="btn btn-outline-secondary text-start px-3 py-2 rounded-3 border-light-subtle d-flex align-items-center justify-content-between" to="/courses">
                                <span className="small text-dark fw-semibold">Course catalog</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                            </Link>
                            <Link className="btn btn-outline-secondary text-start px-3 py-2 rounded-3 border-light-subtle d-flex align-items-center justify-content-between" to="/profile">
                                <span className="small text-dark fw-semibold">Admin profile</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                            </Link>
                        </div>
                    </div>

                    <div className="card border-0 shadow-sm rounded-4 p-4">
                        <h4 className="fw-bold text-dark mb-3 fs-5">System status</h4>
                        <div className="d-flex flex-column gap-2.5">
                            <div className="d-flex justify-content-between align-items-center">
                                <span className="text-muted small">LMS Core Version</span>
                                <span className="badge text-bg-light fw-bold font-monospace">v2.4.0-stable</span>
                            </div>
                            <div className="d-flex justify-content-between align-items-center border-top pt-2">
                                <span className="text-muted small">API Gateway</span>
                                <span className="badge bg-success-subtle text-success fw-bold">ONLINE</span>
                            </div>
                            <div className="d-flex justify-content-between align-items-center border-top pt-2">
                                <span className="text-muted small">Active Services</span>
                                <span className="badge bg-info-subtle text-info fw-bold">12 CONNECTED</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;