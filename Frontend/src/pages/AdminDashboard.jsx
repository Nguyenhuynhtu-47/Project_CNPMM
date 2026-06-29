import { useEffect, useState } from 'react';
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

    if (loading) {
        return <div className="container py-5">Loading admin dashboard...</div>;
    }

    if (error) {
        return <div className="container py-5"><div className="alert alert-danger">{error}</div></div>;
    }

    const chartData = stats?.topCourses?.length
        ? stats.topCourses
        : [{ title: 'No paid orders', totalSales: 0, revenue: 0 }];

    return (
        <div className="container py-5">
            <div className="mb-4">
                <span className="eyebrow">Admin</span>
                <h2>System overview</h2>
                <p>Revenue, enrollments, classes, completion rate, and best-selling courses.</p>
            </div>

            <div className="row gy-4 mb-4">
                <div className="col-md-3"><div className="card p-4"><span>Revenue</span><strong>{stats.revenue?.toLocaleString('vi-VN')}d</strong></div></div>
                <div className="col-md-3"><div className="card p-4"><span>Students</span><strong>{stats.newStudents}</strong></div></div>
                <div className="col-md-3"><div className="card p-4"><span>Registrations</span><strong>{stats.registrations}</strong></div></div>
                <div className="col-md-3"><div className="card p-4"><span>Completion</span><strong>{stats.completionRate}%</strong></div></div>
            </div>

            <div className="card p-4">
                <h4>Top courses</h4>
                <div style={{ height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="title" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="totalSales" fill="#0d6efd" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
