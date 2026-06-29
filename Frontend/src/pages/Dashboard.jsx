import { useEffect, useState } from 'react';
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

    return (
        <div className="dashboard-page container py-5">
            <div className="mb-4">
                <span className="eyebrow">Dashboard</span>
                <h2>Welcome back, {user?.fullName || 'Learner'}</h2>
                <p>Overview of your current course activity and payment history.</p>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            {loading ? (
                <div>Loading dashboard...</div>
            ) : (
                <div className="row gy-4">
                    <div className="col-md-4">
                        <div className="card p-4 h-100">
                            <h3>Enrollments</h3>
                            <p className="display-6 mb-1">{enrollments.length}</p>
                            <p>Active enrollments in your account.</p>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card p-4 h-100">
                            <h3>Orders</h3>
                            <p className="display-6 mb-1">{orders.length}</p>
                            <p>Payment records and course purchases.</p>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card p-4 h-100">
                            <h3>Role</h3>
                            <p className="display-6 mb-1">{user?.role || 'USER'}</p>
                            <p>Access level for this account.</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="row gy-4 mt-4">
                <div className="col-lg-8">
                    <div className="card p-4">
                        <h4>Latest Orders</h4>
                        {orders.length === 0 ? (
                            <p>No orders yet.</p>
                        ) : (
                            <ul className="list-group list-group-flush">
                                {orders.slice(0, 3).map((order) => (
                                    <li key={order._id} className="list-group-item">
                                        <strong>{order.course?.title || 'Course'}</strong>
                                        <div>Status: {order.status}</div>
                                        <div>Amount: {order.amount?.toLocaleString('vi-VN')}đ</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className="card p-4">
                        <h4>Quick actions</h4>
                        <ul className="list-unstyled">
                            <li>• Browse courses</li>
                            <li>• Check enrollment status</li>
                            <li>• Track progress</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
