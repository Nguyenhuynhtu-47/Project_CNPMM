import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import { getAdminUsers } from '../services/adminUser';
import { getClasses } from '../services/class';
import { getAllEnrollments } from '../services/enrollment';
import { getAllOrders } from '../services/order';
import { getStatisticsOverview } from '../services/statistics';
import PaginationControls from '../components/PaginationControls';
import { createPagination } from '../utils/pagination';

const today = new Date().toISOString().slice(0, 10);
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const statusCount = (items = [], field = 'status') => items.reduce((acc, item) => {
    const key = item[field] || 'UNKNOWN';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
}, {});

const toChartData = (breakdown = [], labelKey = 'status') => breakdown.map((item) => ({
    name: item[labelKey] || item.status || 'UNKNOWN',
    count: item.count || 0
}));

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')}d`;

const ManagerDashboard = () => {
    const [stats, setStats] = useState(null);
    const [orders, setOrders] = useState([]);
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [dateRange, setDateRange] = useState({ from: thirtyDaysAgo, to: today });
    const [filters, setFilters] = useState({ search: '', status: '' });
    const [pages, setPages] = useState({});
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadManagerData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = {
                from: dateRange.from || undefined,
                to: dateRange.to || undefined
            };
            const [statsRes, orderRes, classRes, studentRes, teacherRes, enrollmentRes] = await Promise.all([
                getStatisticsOverview(params),
                getAllOrders(params),
                getClasses(),
                getAdminUsers({ role: 'STUDENT', limit: 200 }),
                getAdminUsers({ role: 'TEACHER', limit: 200 }),
                getAllEnrollments()
            ]);

            setStats(statsRes.data);
            setOrders(orderRes.data.orders || []);
            setClasses(classRes.data.classes || []);
            setStudents(studentRes.data.users || []);
            setTeachers(teacherRes.data.users || []);
            setEnrollments(enrollmentRes.data.enrollments || []);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Cannot load manager workspace.');
        } finally {
            setLoading(false);
        }
    }, [dateRange.from, dateRange.to]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            loadManagerData();
        }, 0);
        return () => window.clearTimeout(timer);
    }, [loadManagerData]);

    const searchTerm = filters.search.trim().toLowerCase();

    const filteredStudents = useMemo(() => students.filter((student) => {
        const text = `${student.fullName || ''} ${student.email || ''}`.toLowerCase();
        const matchesSearch = !searchTerm || text.includes(searchTerm);
        const matchesStatus = !filters.status || student.status === filters.status;
        return matchesSearch && matchesStatus;
    }), [filters.status, searchTerm, students]);

    const filteredTeachers = useMemo(() => teachers.filter((teacher) => {
        const text = `${teacher.fullName || ''} ${teacher.email || ''}`.toLowerCase();
        const matchesSearch = !searchTerm || text.includes(searchTerm);
        const matchesStatus = !filters.status || teacher.status === filters.status;
        return matchesSearch && matchesStatus;
    }), [filters.status, searchTerm, teachers]);

    const filteredEnrollments = useMemo(() => enrollments.filter((enrollment) => {
        const text = `${enrollment.user?.fullName || ''} ${enrollment.user?.email || ''} ${enrollment.course?.title || ''}`.toLowerCase();
        const matchesSearch = !searchTerm || text.includes(searchTerm);
        const matchesStatus = !filters.status || enrollment.status === filters.status;
        return matchesSearch && matchesStatus;
    }), [enrollments, filters.status, searchTerm]);

    const filteredOrders = useMemo(() => orders.filter((order) => {
        const text = `${order.user?.fullName || ''} ${order.user?.email || ''} ${order.course?.title || ''}`.toLowerCase();
        const matchesSearch = !searchTerm || text.includes(searchTerm);
        const matchesStatus = !filters.status || order.status === filters.status;
        return matchesSearch && matchesStatus;
    }), [filters.status, orders, searchTerm]);

    const filteredClasses = useMemo(() => classes.filter((classItem) => {
        const text = `${classItem.code || ''} ${classItem.course?.title || ''} ${classItem.teacher?.fullName || ''}`.toLowerCase();
        const matchesSearch = !searchTerm || text.includes(searchTerm);
        const matchesStatus = !filters.status || classItem.status === filters.status;
        return matchesSearch && matchesStatus;
    }), [classes, filters.status, searchTerm]);

    const topCourseData = stats?.topCourses?.length ? stats.topCourses : [{ title: 'No sales', totalSales: 0, revenue: 0 }];
    const paymentChart = toChartData(stats?.statusBreakdown?.payments || []);
    const enrollmentChart = toChartData(stats?.statusBreakdown?.enrollments || []);
    const classChart = toChartData(stats?.statusBreakdown?.classes || []);
    const paginate = (key, items) => createPagination(items, pages[key] || 1, 10);
    const setPage = (key, page) => setPages((current) => ({ ...current, [key]: page }));
    const pagedStudents = paginate('students', filteredStudents);
    const pagedTeachers = paginate('teachers', filteredTeachers);
    const pagedEnrollments = paginate('enrollments', filteredEnrollments);
    const pagedOrders = paginate('payments', filteredOrders);
    const pagedClasses = paginate('classes', filteredClasses);

    const tabs = [
        ['dashboard', 'Dashboard'],
        ['students', 'Students'],
        ['teachers', 'Teachers'],
        ['enrollments', 'Enrollments'],
        ['payments', 'Payments'],
        ['classes', 'Classes']
    ];

    const renderUserTable = (pagedResult, roleLabel, pageKey) => (
        <>
            <div className="table-responsive">
                <table className="table align-middle">
                    <thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Role</th><th>Joined</th></tr></thead>
                    <tbody>
                        {pagedResult.items.map((item) => (
                            <tr key={item._id}>
                                <td>{item.fullName || '-'}</td>
                                <td>{item.email}</td>
                                <td><span className="badge text-bg-light">{item.status || 'ACTIVE'}</span></td>
                                <td>{item.roleRef?.code || item.role || roleLabel}</td>
                                <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <PaginationControls pagination={pagedResult.pagination} onPageChange={(page) => setPage(pageKey, page)} itemLabel={pageKey} />
        </>
    );

    if (loading) {
        return <div className="container py-5">Loading manager workspace...</div>;
    }

    return (
        <div className="container py-5">
            <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
                <div>
                    <span className="eyebrow">Manager</span>
                    <h2>Operations workspace</h2>
                    <p className="text-muted mb-0">Students, teachers, enrollments, payments, classes, and date-range reports.</p>
                </div>
                <div className="d-flex flex-wrap gap-2">
                    <input className="form-control" type="date" value={dateRange.from} onChange={(event) => setDateRange((current) => ({ ...current, from: event.target.value }))} />
                    <input className="form-control" type="date" value={dateRange.to} onChange={(event) => setDateRange((current) => ({ ...current, to: event.target.value }))} />
                </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <div className="row gy-4 mb-4">
                <div className="col-md-3"><div className="card p-4"><span>Revenue</span><strong>{formatCurrency(stats?.revenue)}</strong></div></div>
                <div className="col-md-3"><div className="card p-4"><span>Students</span><strong>{students.length}</strong></div></div>
                <div className="col-md-3"><div className="card p-4"><span>Teachers</span><strong>{teachers.length}</strong></div></div>
                <div className="col-md-3"><div className="card p-4"><span>Classes</span><strong>{classes.length}</strong></div></div>
            </div>

            <div className="btn-group flex-wrap mb-4" role="group" aria-label="Manager sections">
                {tabs.map(([key, label]) => (
                    <button
                        key={key}
                        type="button"
                        className={`btn ${activeTab === key ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => {
                            setActiveTab(key);
                            setFilters({ search: '', status: '' });
                            setPages({});
                        }}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {activeTab !== 'dashboard' && (
                <div className="card p-3 mb-4">
                    <div className="row gy-3">
                        <div className="col-md-8">
                            <input
                                className="form-control"
                                placeholder="Search by name, email, course, class..."
                                value={filters.search}
                                onChange={(event) => {
                                    setFilters((current) => ({ ...current, search: event.target.value }));
                                    setPages({});
                                }}
                            />
                        </div>
                        <div className="col-md-4">
                            <input
                                className="form-control"
                                placeholder="Status filter"
                                value={filters.status}
                                onChange={(event) => {
                                    setFilters((current) => ({ ...current, status: event.target.value }));
                                    setPages({});
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'dashboard' && (
                <div className="row gy-4">
                    <div className="col-lg-8">
                        <div className="card p-4">
                            <h4>Best-selling courses</h4>
                            <div style={{ height: 320 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={topCourseData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="title" />
                                        <YAxis />
                                        <Tooltip formatter={(value, name) => name === 'revenue' ? formatCurrency(value) : value} />
                                        <Legend />
                                        <Bar dataKey="totalSales" fill="#198754" name="Sales" />
                                        <Bar dataKey="revenue" fill="#0d6efd" name="Revenue" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-4">
                        <div className="card p-4 mb-4">
                            <h4>Completion</h4>
                            <div className="display-5">{stats?.completionRate || 0}%</div>
                            <p className="text-muted mb-0">Average enrollment progress in selected period.</p>
                        </div>
                        <div className="card p-4">
                            <h4>Top teachers</h4>
                            {(stats?.topTeachers || []).length === 0 ? <p className="text-muted">No teacher data yet.</p> : stats.topTeachers.map((teacher) => (
                                <div key={teacher.teacherId || teacher.email} className="border-top py-2">
                                    <strong>{teacher.fullName || teacher.email || 'Unassigned'}</strong>
                                    <div className="text-muted">{teacher.classCount} classes - {teacher.currentStudents} students</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card p-4">
                            <h4>Payments by status</h4>
                            <div style={{ height: 220 }}>
                                <ResponsiveContainer width="100%" height="100%"><BarChart data={paymentChart}><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="count" fill="#0d6efd" /></BarChart></ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card p-4">
                            <h4>Enrollments by status</h4>
                            <div style={{ height: 220 }}>
                                <ResponsiveContainer width="100%" height="100%"><BarChart data={enrollmentChart}><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="count" fill="#198754" /></BarChart></ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card p-4">
                            <h4>Classes by status</h4>
                            <div style={{ height: 220 }}>
                                <ResponsiveContainer width="100%" height="100%"><BarChart data={classChart}><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="count" fill="#ffc107" /></BarChart></ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'students' && (
                <section className="card p-4">
                    <h4>Student management</h4>
                    {filteredStudents.length === 0 ? <p className="text-muted">No student found.</p> : renderUserTable(pagedStudents, 'STUDENT', 'students')}
                </section>
            )}

            {activeTab === 'teachers' && (
                <section className="card p-4">
                    <h4>Teacher management</h4>
                    {filteredTeachers.length === 0 ? <p className="text-muted">No teacher found.</p> : renderUserTable(pagedTeachers, 'TEACHER', 'teachers')}
                </section>
            )}

            {activeTab === 'enrollments' && (
                <section className="card p-4">
                    <h4>Enrollment management</h4>
                    <div className="table-responsive">
                        <table className="table align-middle">
                            <thead><tr><th>Student</th><th>Course</th><th>Class</th><th>Status</th><th>Progress</th></tr></thead>
                            <tbody>
                                {pagedEnrollments.items.map((enrollment) => (
                                    <tr key={enrollment._id}>
                                        <td>{enrollment.user?.fullName || enrollment.user?.email || '-'}</td>
                                        <td>{enrollment.course?.title || '-'}</td>
                                        <td>{enrollment.class?.code || '-'}</td>
                                        <td><span className="badge text-bg-light">{enrollment.status}</span></td>
                                        <td>{enrollment.progress || 0}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredEnrollments.length > 0 && <PaginationControls pagination={pagedEnrollments.pagination} onPageChange={(page) => setPage('enrollments', page)} itemLabel="enrollments" />}
                </section>
            )}

            {activeTab === 'payments' && (
                <section className="card p-4">
                    <h4>Payment and order report</h4>
                    <div className="mb-3">
                        <strong>Total:</strong> {filteredOrders.length} orders - {formatCurrency(filteredOrders.reduce((sum, order) => sum + Number(order.amount || 0), 0))}
                    </div>
                    <div className="table-responsive">
                        <table className="table align-middle">
                            <thead><tr><th>Student</th><th>Course</th><th>Amount</th><th>Status</th><th>Created</th></tr></thead>
                            <tbody>
                                {pagedOrders.items.map((order) => (
                                    <tr key={order._id}>
                                        <td>{order.user?.fullName || order.user?.email || '-'}</td>
                                        <td>{order.course?.title || '-'}</td>
                                        <td>{formatCurrency(order.amount)}</td>
                                        <td><span className="badge text-bg-light">{order.status}</span></td>
                                        <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredOrders.length > 0 && <PaginationControls pagination={pagedOrders.pagination} onPageChange={(page) => setPage('payments', page)} itemLabel="orders" />}
                </section>
            )}

            {activeTab === 'classes' && (
                <section className="card p-4">
                    <h4>Class status tracking</h4>
                    <div className="row gy-3 mb-3">
                        {Object.entries(statusCount(classes)).map(([status, count]) => (
                            <div className="col-md-3" key={status}>
                                <div className="border rounded p-3">
                                    <span>{status}</span>
                                    <strong className="d-block">{count}</strong>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="table-responsive">
                        <table className="table align-middle">
                            <thead><tr><th>Code</th><th>Course</th><th>Teacher</th><th>Students</th><th>Status</th><th>Dates</th></tr></thead>
                            <tbody>
                                {pagedClasses.items.map((classItem) => (
                                    <tr key={classItem._id}>
                                        <td>{classItem.code}</td>
                                        <td>{classItem.course?.title || '-'}</td>
                                        <td>{classItem.teacher?.fullName || '-'}</td>
                                        <td>{classItem.currentStudents || 0}/{classItem.maxStudents || 0}</td>
                                        <td><span className="badge text-bg-light">{classItem.status}</span></td>
                                        <td>{classItem.startDate ? new Date(classItem.startDate).toLocaleDateString('vi-VN') : '-'} - {classItem.endDate ? new Date(classItem.endDate).toLocaleDateString('vi-VN') : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredClasses.length > 0 && <PaginationControls pagination={pagedClasses.pagination} onPageChange={(page) => setPage('classes', page)} itemLabel="classes" />}
                </section>
            )}
        </div>
    );
};

export default ManagerDashboard;
