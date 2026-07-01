import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEnrollments } from '../services/enrollment';
import { getOrders } from '../services/order';

const Dashboard = () => {
    const { user } = useAuth();
    const [enrollments, setEnrollments] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadDashboard = async () => {
            setLoading(true);
            setError(null);
            try {
                const [enrollmentRes, orderRes] = await Promise.all([getEnrollments(), getOrders()]);
                setEnrollments(enrollmentRes.data.enrollments || []);
                setOrders(orderRes.data.orders || []);
            } catch {
                setError('Không thể tải bảng điều khiển.');
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, []);

    // Calculate metrics
    const completedCoursesCount = enrollments.filter(e => e.status === 'COMPLETED' || e.progress === 100).length;
    const avgProgress = enrollments.length ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length) : 0;
    const lastActiveEnrollment = enrollments.find(e => (e.progress || 0) < 100) || enrollments[0];

    return (
        <div className="container-fluid px-0 py-3">
            {/* Welcome Banner Header */}
            <div className="p-4 p-md-5 mb-4 rounded-4 text-white position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--brand) 0%, #1e40af 100%)' }}>
                <div className="col-lg-8 p-0 position-relative" style={{ zIndex: 2 }}>
                    <span className="badge bg-white-subtle text-white rounded-pill px-3 py-1.5 mb-3 text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.05em', backgroundColor: 'rgba(255,255,255,0.15)' }}>Learner Dashboard</span>
                    <h1 className="display-6 fw-bold mb-2">Welcome back, {user?.fullName || 'Learner'}!</h1>
                    <p className="lead mb-4 opacity-90" style={{ fontSize: '1rem' }}>Resume your active courses, check quiz grades, track order receipts, and discover next lessons.</p>
                    <div className="d-flex flex-wrap gap-2.5">
                        <Link className="btn btn-light px-4 py-2.5 rounded-3 fw-bold text-primary" to="/my-learning">Go to My Learning</Link>
                        <Link className="btn btn-outline-light px-4 py-2.5 rounded-3 fw-bold" style={{ backdropFilter: 'blur(4px)' }} to="/courses">Explore Courses</Link>
                    </div>
                </div>
                {/* Visual decoration overlay */}
                <div className="position-absolute end-0 bottom-0 opacity-10" style={{ transform: 'translate(10%, 20%)', zIndex: 1 }}>
                    <svg width="350" height="350" viewBox="0 0 100 100" fill="currentColor">
                        <circle cx="50" cy="50" r="50" />
                    </svg>
                </div>
            </div>

            {error && <div className="alert alert-danger py-2.5 mb-4">{error}</div>}

            {loading ? (
                <div className="text-center text-muted fw-semibold py-5">Loading dashboard workspace...</div>
            ) : (
                <>
                    {/* Learning Overview Stat Cards */}
                    <div className="row g-3 mb-4">
                        <div className="col-sm-6 col-md-3">
                            <div className="card border-0 shadow-sm rounded-4 p-4 d-flex flex-row align-items-center gap-3 h-100">
                                <div className="bg-primary-subtle p-3 rounded-4 flex-shrink-0 d-flex align-items-center justify-content-center text-primary" style={{ width: '52px', height: '52px' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                                        <path d="M6 6h10M6 10h10" />
                                    </svg>
                                </div>
                                <div>
                                    <span className="text-muted small fw-semibold text-uppercase" style={{ letterSpacing: '0.04em', fontSize: '0.7rem' }}>Enrolled Courses</span>
                                    <strong className="text-dark d-block fs-4 mt-0.5 fw-bold">{enrollments.length}</strong>
                                </div>
                            </div>
                        </div>

                        <div className="col-sm-6 col-md-3">
                            <div className="card border-0 shadow-sm rounded-4 p-4 d-flex flex-row align-items-center gap-3 h-100">
                                <div className="bg-success-subtle p-3 rounded-4 flex-shrink-0 d-flex align-items-center justify-content-center text-success" style={{ width: '52px', height: '52px' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                </div>
                                <div>
                                    <span className="text-muted small fw-semibold text-uppercase" style={{ letterSpacing: '0.04em', fontSize: '0.7rem' }}>Completed</span>
                                    <strong className="text-dark d-block fs-4 mt-0.5 fw-bold">{completedCoursesCount}</strong>
                                </div>
                            </div>
                        </div>

                        <div className="col-sm-6 col-md-3">
                            <div className="card border-0 shadow-sm rounded-4 p-4 d-flex flex-row align-items-center gap-3 h-100">
                                <div className="bg-info-subtle p-3 rounded-4 flex-shrink-0 d-flex align-items-center justify-content-center text-info" style={{ width: '52px', height: '52px' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="20" x2="18" y2="10" />
                                        <line x1="12" y1="20" x2="12" y2="4" />
                                        <line x1="6" y1="20" x2="6" y2="14" />
                                    </svg>
                                </div>
                                <div>
                                    <span className="text-muted small fw-semibold text-uppercase" style={{ letterSpacing: '0.04em', fontSize: '0.7rem' }}>Avg Progress</span>
                                    <strong className="text-dark d-block fs-4 mt-0.5 fw-bold">{avgProgress}%</strong>
                                </div>
                            </div>
                        </div>

                        <div className="col-sm-6 col-md-3">
                            <div className="card border-0 shadow-sm rounded-4 p-4 d-flex flex-row align-items-center gap-3 h-100">
                                <div className="bg-warning-subtle p-3 rounded-4 flex-shrink-0 d-flex align-items-center justify-content-center text-warning" style={{ width: '52px', height: '52px' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
                                        <line x1="12" y1="17" x2="12" y2="17" />
                                        <line x1="2" y1="10" x2="22" y2="10" />
                                    </svg>
                                </div>
                                <div>
                                    <span className="text-muted small fw-semibold text-uppercase" style={{ letterSpacing: '0.04em', fontSize: '0.7rem' }}>Receipts & Orders</span>
                                    <strong className="text-dark d-block fs-4 mt-0.5 fw-bold">{orders.length}</strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row g-4 mb-4">
                        {/* Resume / Continue Learning Section */}
                        <div className="col-lg-8">
                            {lastActiveEnrollment ? (
                                <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <div>
                                            <h4 className="fw-bold text-dark mb-0 fs-5">Continue learning</h4>
                                            <p className="text-muted mb-0 small">Resume where you left off and keep building your skills.</p>
                                        </div>
                                        <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-1.5 fw-bold" style={{ fontSize: '0.7rem' }}>LATEST ACTIVITY</span>
                                    </div>

                                    <div className="p-4 bg-light rounded-4 border mb-4 flex-grow-1 d-flex flex-column justify-content-center">
                                        <h5 className="fw-bold text-dark mb-2">{lastActiveEnrollment.course?.title || 'Course'}</h5>
                                        <p className="text-muted small mb-4">Learn sections, take exams, and unlock your credentials inside the workspace.</p>

                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <span className="text-muted small fw-semibold">Current Progress</span>
                                            <span className="fw-bold text-primary small">{lastActiveEnrollment.progress || 0}%</span>
                                        </div>
                                        <div className="progress rounded-pill" style={{ height: '10px' }}>
                                            <div className="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style={{ width: `${lastActiveEnrollment.progress || 0}%` }}></div>
                                        </div>
                                    </div>

                                    <Link className="btn btn-primary py-2.5 rounded-3 fw-bold w-100 auth-primary-btn" to="/my-learning">
                                        Resume course
                                    </Link>
                                </div>
                            ) : (
                                <div className="card border-0 shadow-sm rounded-4 p-4 text-center h-100 d-flex flex-column justify-content-center align-items-center">
                                    <div className="bg-light p-3.5 rounded-circle mb-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                                            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                                            <path d="M6 6h10M6 10h10" />
                                        </svg>
                                    </div>
                                    <h5 className="fw-bold text-dark mb-1">No active courses</h5>
                                    <p className="text-muted small px-md-5 mb-4">You haven't enrolled or started learning yet. Check out our high-quality courses catalog to kickstart your career goals.</p>
                                    <Link className="btn btn-primary px-4 py-2.5 rounded-3 fw-bold auth-primary-btn" to="/courses">Browse courses</Link>
                                </div>
                            )}
                        </div>

                        {/* Quick actions sidebar card */}
                        <div className="col-lg-4">
                            <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                                <h4 className="fw-bold text-dark mb-3 fs-5">Quick links</h4>
                                <p className="text-muted small mb-4">Navigate quickly to important segments of your profile.</p>

                                <div className="d-flex flex-column gap-2">
                                    <Link className="btn btn-outline-secondary text-start px-3 py-2.5 rounded-3 border-light-subtle d-flex align-items-center justify-content-between transition-all" to="/my-learning">
                                        <span className="fw-semibold small text-dark">Study Workspace</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                                    </Link>
                                    <Link className="btn btn-outline-secondary text-start px-3 py-2.5 rounded-3 border-light-subtle d-flex align-items-center justify-content-between transition-all" to="/wishlist">
                                        <span className="fw-semibold small text-dark">My Wishlist</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                                    </Link>
                                    <Link className="btn btn-outline-secondary text-start px-3 py-2.5 rounded-3 border-light-subtle d-flex align-items-center justify-content-between transition-all" to="/orders">
                                        <span className="fw-semibold small text-dark">Order History</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                                    </Link>
                                    <Link className="btn btn-outline-secondary text-start px-3 py-2.5 rounded-3 border-light-subtle d-flex align-items-center justify-content-between transition-all" to="/profile">
                                        <span className="fw-semibold small text-dark">Account Profile</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Orders Section */}
                    <div className="row g-4">
                        <div className="col-12">
                            <div className="card border-0 shadow-sm rounded-4 p-4">
                                <div className="d-flex flex-sm-row flex-column justify-content-between align-items-start align-items-sm-center gap-2 mb-4">
                                    <div>
                                        <h4 className="fw-bold text-dark mb-0 fs-5">Recent purchases</h4>
                                        <p className="text-muted mb-0 small">Latest transaction details and invoices for course orders.</p>
                                    </div>
                                    <Link className="btn btn-sm btn-outline-primary px-3 rounded-3" to="/orders">View all</Link>
                                </div>

                                {orders.length === 0 ? (
                                    <p className="text-muted mb-0 small ps-1">No orders have been recorded yet.</p>
                                ) : (
                                    <div className="table-responsive rounded-3 border">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th className="ps-4">Course</th>
                                                    <th>Price</th>
                                                    <th>Status</th>
                                                    <th className="pe-4">Purchase Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {orders.slice(0, 3).map((order) => (
                                                    <tr key={order._id}>
                                                        <td className="ps-4 fw-semibold text-dark">{order.course?.title || 'Course'}</td>
                                                        <td className="fw-bold text-dark">{order.amount?.toLocaleString('vi-VN')} VND</td>
                                                        <td><span className="badge text-bg-light px-2.5 py-1.5">{order.status}</span></td>
                                                        <td className="pe-4 text-muted small">{order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Dashboard;
