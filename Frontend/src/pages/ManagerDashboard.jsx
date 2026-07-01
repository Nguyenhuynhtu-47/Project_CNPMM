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
import { createClass, deleteClass, getClasses, updateClass } from '../services/class';
import { getCourses } from '../services/course';
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

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')} VND`;
const emptyClass = { code: '', course: '', teacher: '', startDate: '', endDate: '', maxStudents: 20, status: 'OPEN' };

const ManagerDashboard = () => {
    const [stats, setStats] = useState(null);
    const [orders, setOrders] = useState([]);
    const [classes, setClasses] = useState([]);
    const [courses, setCourses] = useState([]);
    const [students, setStudents] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [classForm, setClassForm] = useState(emptyClass);
    const [editingClassId, setEditingClassId] = useState('');
    const [dateRange, setDateRange] = useState({ from: thirtyDaysAgo, to: today });
    const [filters, setFilters] = useState({ search: '', status: '' });
    const [pages, setPages] = useState({});
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const loadManagerData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = {
                from: dateRange.from || undefined,
                to: dateRange.to || undefined
            };
            const [statsRes, orderRes, classRes, courseRes, studentRes, teacherRes, enrollmentRes] = await Promise.all([
                getStatisticsOverview(params),
                getAllOrders(params),
                getClasses(),
                getCourses({ limit: 200 }),
                getAdminUsers({ role: 'STUDENT', limit: 200 }),
                getAdminUsers({ role: 'TEACHER', limit: 200 }),
                getAllEnrollments()
            ]);

            setStats(statsRes.data);
            setOrders(orderRes.data.orders || []);
            setClasses(classRes.data.classes || []);
            setCourses(courseRes.data.courses || []);
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

    const submitClass = async (event) => {
        event.preventDefault();
        setError('');
        setMessage('');
        try {
            const payload = { ...classForm, maxStudents: Number(classForm.maxStudents || 1) };
            if (editingClassId) {
                await updateClass(editingClassId, payload);
            } else {
                await createClass(payload);
            }
            setClassForm(emptyClass);
            setEditingClassId('');
            await loadManagerData();
            setMessage(editingClassId ? 'Class updated.' : 'Class created.');
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Cannot save class.');
        }
    };

    const startEditClass = (classItem) => {
        setEditingClassId(classItem._id);
        setClassForm({
            code: classItem.code || '',
            course: classItem.course?._id || classItem.course || '',
            teacher: classItem.teacher?._id || classItem.teacher || '',
            startDate: classItem.startDate ? classItem.startDate.slice(0, 10) : '',
            endDate: classItem.endDate ? classItem.endDate.slice(0, 10) : '',
            maxStudents: classItem.maxStudents || 20,
            status: classItem.status || 'OPEN'
        });
        setActiveTab('classes');
    };

    const resetClassForm = () => {
        setClassForm(emptyClass);
        setEditingClassId('');
    };

    const handleDeleteClass = async (classItem) => {
        if (!window.confirm(`Delete class "${classItem.code}"?`)) return;
        setError('');
        setMessage('');
        try {
            await deleteClass(classItem._id);
            await loadManagerData();
            setMessage('Class deleted.');
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Cannot delete class.');
        }
    };

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
            <div className="table-responsive rounded-3 border">
                <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                        <tr>
                            <th className="ps-4">Name</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Role</th>
                            <th className="pe-4">Joined</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pagedResult.items.map((item) => (
                            <tr key={item._id}>
                                <td className="ps-4 fw-semibold text-dark">{item.fullName || '-'}</td>
                                <td>{item.email}</td>
                                <td><span className="badge text-bg-light px-2.5 py-1.5">{item.status || 'ACTIVE'}</span></td>
                                <td>{item.roleRef?.code || item.role || roleLabel}</td>
                                <td className="pe-4 text-muted">{item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-3">
                <PaginationControls pagination={pagedResult.pagination} onPageChange={(page) => setPage(pageKey, page)} itemLabel={pageKey} />
            </div>
        </>
    );

    if (loading) {
        return <div className="container-fluid py-5 text-center text-muted fw-semibold">Loading manager workspace...</div>;
    }

    return (
        <div className="container-fluid px-0 py-3">
            {/* Header Block */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4 p-4 bg-white rounded-4 border">
                <div>
                    <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-1.5 mb-2 text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>Manager</span>
                    <h2 className="fw-bold mb-1 text-dark">Operations workspace</h2>
                    <p className="text-muted mb-0 small">Students, teachers, enrollments, payments, classes, and date-range reports.</p>
                </div>
                <div className="d-flex align-items-center gap-2 bg-light p-2.5 rounded-3 border flex-shrink-0">
                    <span className="text-muted small fw-semibold px-1">Period:</span>
                    <input className="form-control form-control-sm border-0 bg-transparent fw-semibold text-dark p-0" style={{ width: '120px' }} type="date" value={dateRange.from} onChange={(event) => setDateRange((current) => ({ ...current, from: event.target.value }))} />
                    <span className="text-muted small">to</span>
                    <input className="form-control form-control-sm border-0 bg-transparent fw-semibold text-dark p-0" style={{ width: '120px' }} type="date" value={dateRange.to} onChange={(event) => setDateRange((current) => ({ ...current, to: event.target.value }))} />
                </div>
            </div>

            {message && <div className="alert alert-success py-2.5 mb-4">{message}</div>}
            {error && <div className="alert alert-danger py-2.5 mb-4">{error}</div>}

            {/* Metric Summary Cards */}
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
                            <span className="text-muted small fw-semibold text-uppercase" style={{ letterSpacing: '0.04em', fontSize: '0.75rem' }}>Revenue</span>
                            <strong className="text-dark d-block fs-5 mt-0.5 text-truncate fw-bold">{formatCurrency(stats?.revenue)}</strong>
                        </div>
                    </div>
                </div>

                <div className="col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm rounded-4 p-4 d-flex flex-row align-items-center gap-3 h-100">
                        <div className="bg-primary-subtle p-3 rounded-4 flex-shrink-0 d-flex align-items-center justify-content-center text-primary" style={{ width: '56px', height: '56px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                        <div className="overflow-hidden">
                            <span className="text-muted small fw-semibold text-uppercase" style={{ letterSpacing: '0.04em', fontSize: '0.75rem' }}>Students</span>
                            <strong className="text-dark d-block fs-4 mt-0.5 fw-bold">{students.length}</strong>
                        </div>
                    </div>
                </div>

                <div className="col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm rounded-4 p-4 d-flex flex-row align-items-center gap-3 h-100">
                        <div className="bg-info-subtle p-3 rounded-4 flex-shrink-0 d-flex align-items-center justify-content-center text-info" style={{ width: '56px', height: '56px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 3h20v14H2z" />
                                <path d="M8 21h8M12 17v4" />
                            </svg>
                        </div>
                        <div className="overflow-hidden">
                            <span className="text-muted small fw-semibold text-uppercase" style={{ letterSpacing: '0.04em', fontSize: '0.75rem' }}>Teachers</span>
                            <strong className="text-dark d-block fs-4 mt-0.5 fw-bold">{teachers.length}</strong>
                        </div>
                    </div>
                </div>

                <div className="col-sm-6 col-xl-3">
                    <div className="card border-0 shadow-sm rounded-4 p-4 d-flex flex-row align-items-center gap-3 h-100">
                        <div className="bg-warning-subtle p-3 rounded-4 flex-shrink-0 d-flex align-items-center justify-content-center text-warning" style={{ width: '56px', height: '56px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                                <path d="M6 6h10M6 10h10" />
                            </svg>
                        </div>
                        <div className="overflow-hidden">
                            <span className="text-muted small fw-semibold text-uppercase" style={{ letterSpacing: '0.04em', fontSize: '0.75rem' }}>Classes</span>
                            <strong className="text-dark d-block fs-4 mt-0.5 fw-bold">{classes.length}</strong>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sub-Navigation pill bar */}
            <div className="nav nav-pills gap-2 mb-4 p-2 bg-white rounded-4 border">
                {tabs.map(([key, label]) => (
                    <button
                        key={key}
                        type="button"
                        className={`nav-link px-4 py-2.5 fw-semibold rounded-3 transition-all border-0 ${activeTab === key ? 'active bg-primary text-white shadow-sm' : 'text-muted bg-transparent'}`}
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

            {/* Search toolbar */}
            {activeTab !== 'dashboard' && (
                <div className="card border-0 shadow-sm rounded-4 p-3 mb-4">
                    <div className="row g-3">
                        <div className="col-md-8">
                            <div className="input-group">
                                <span className="input-group-text bg-light border-end-0 text-muted ps-3 rounded-start-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="11" cy="11" r="8" />
                                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                    </svg>
                                </span>
                                <input
                                    className="form-control bg-light border-start-0 ps-1 rounded-end-3"
                                    placeholder="Search by name, email, course, class..."
                                    value={filters.search}
                                    onChange={(event) => {
                                        setFilters((current) => ({ ...current, search: event.target.value }));
                                        setPages({});
                                    }}
                                />
                            </div>
                        </div>
                        <div className="col-md-4">
                            <input
                                className="form-control bg-light"
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

            {/* TAB: Dashboard Overview */}
            {activeTab === 'dashboard' && (
                <div className="row g-4">
                    {/* Charts Card */}
                    <div className="col-lg-8">
                        <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                            <h4 className="fw-bold text-dark mb-4 fs-5">Best-selling courses</h4>
                            <div style={{ height: 320 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={topCourseData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="title" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip formatter={(value, name) => name === 'revenue' ? formatCurrency(value) : value} />
                                        <Legend />
                                        <Bar dataKey="totalSales" fill="#198754" name="Sales" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="revenue" fill="#0d6efd" name="Revenue" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Completion rate & top teachers */}
                    <div className="col-lg-4 d-flex flex-column gap-4">
                        <div className="card border-0 shadow-sm rounded-4 p-4 bg-gradient" style={{ background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(20, 184, 166, 0.05) 100%)' }}>
                            <h4 className="fw-bold text-dark mb-2 fs-5">Completion rate</h4>
                            <div className="display-4 fw-bold text-primary">{stats?.completionRate || 0}%</div>
                            <p className="text-muted mb-0 small">Average enrollment progress in selected period.</p>
                        </div>
                        <div className="card border-0 shadow-sm rounded-4 p-4 flex-grow-1">
                            <h4 className="fw-bold text-dark mb-3 fs-5">Top teachers</h4>
                            <div className="d-flex flex-column gap-3">
                                {(stats?.topTeachers || []).length === 0 ? (
                                    <p className="text-muted mb-0 small">No teacher data yet.</p>
                                ) : stats.topTeachers.map((teacher, idx) => (
                                    <div key={teacher.teacherId || teacher.email} className={`d-flex justify-content-between align-items-center ${idx > 0 ? 'border-top pt-3' : ''}`}>
                                        <div>
                                            <div className="fw-semibold text-dark small">{teacher.fullName || teacher.email || 'Unassigned'}</div>
                                            <small className="text-muted" style={{ fontSize: '0.75rem' }}>{teacher.classCount} classes</small>
                                        </div>
                                        <span className="badge text-bg-light rounded-pill px-2.5 py-1.5 fw-semibold">{teacher.currentStudents} students</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Secondary Status Charts */}
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                            <h4 className="fw-bold text-dark mb-4 fs-6">Payments by status</h4>
                            <div style={{ height: 220 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={paymentChart}>
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                        <YAxis tick={{ fontSize: 10 }} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#0d6efd" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                            <h4 className="fw-bold text-dark mb-4 fs-6">Enrollments by status</h4>
                            <div style={{ height: 220 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={enrollmentChart}>
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                        <YAxis tick={{ fontSize: 10 }} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#198754" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                            <h4 className="fw-bold text-dark mb-4 fs-6">Classes by status</h4>
                            <div style={{ height: 220 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={classChart}>
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                        <YAxis tick={{ fontSize: 10 }} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#ffc107" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: Students */}
            {activeTab === 'students' && (
                <section className="card border-0 shadow-sm rounded-4 p-4">
                    <h4 className="fw-bold text-dark mb-4 fs-5">Student management</h4>
                    {filteredStudents.length === 0 ? <p className="text-muted mb-0 small">No student found.</p> : renderUserTable(pagedStudents, 'STUDENT', 'students')}
                </section>
            )}

            {/* TAB: Teachers */}
            {activeTab === 'teachers' && (
                <section className="card border-0 shadow-sm rounded-4 p-4">
                    <h4 className="fw-bold text-dark mb-4 fs-5">Teacher management</h4>
                    {filteredTeachers.length === 0 ? <p className="text-muted mb-0 small">No teacher found.</p> : renderUserTable(pagedTeachers, 'TEACHER', 'teachers')}
                </section>
            )}

            {/* TAB: Enrollments */}
            {activeTab === 'enrollments' && (
                <section className="card border-0 shadow-sm rounded-4 p-4">
                    <h4 className="fw-bold text-dark mb-4 fs-5">Enrollment management</h4>
                    {filteredEnrollments.length === 0 ? (
                        <p className="text-muted mb-0 small">No enrollments found.</p>
                    ) : (
                        <>
                            <div className="table-responsive rounded-3 border">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th className="ps-4">Student</th>
                                            <th>Course</th>
                                            <th>Class</th>
                                            <th>Status</th>
                                            <th className="pe-4">Progress</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pagedEnrollments.items.map((enrollment) => (
                                            <tr key={enrollment._id}>
                                                <td className="ps-4 fw-semibold text-dark">{enrollment.user?.fullName || enrollment.user?.email || '-'}</td>
                                                <td>{enrollment.course?.title || '-'}</td>
                                                <td><span className="font-monospace fw-bold text-secondary">{enrollment.class?.code || '-'}</span></td>
                                                <td><span className="badge text-bg-light px-2.5 py-1.5">{enrollment.status}</span></td>
                                                <td className="pe-4 fw-bold text-primary">{enrollment.progress || 0}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-3">
                                <PaginationControls pagination={pagedEnrollments.pagination} onPageChange={(page) => setPage('enrollments', page)} itemLabel="enrollments" />
                            </div>
                        </>
                    )}
                </section>
            )}

            {/* TAB: Payments */}
            {activeTab === 'payments' && (
                <section className="card border-0 shadow-sm rounded-4 p-4">
                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-4">
                        <h4 className="fw-bold text-dark mb-0 fs-5">Payment and order report</h4>
                        <span className="badge bg-success-subtle text-success px-3 py-2 rounded-3 fs-6">
                            Total: <strong className="ms-1">{formatCurrency(filteredOrders.reduce((sum, order) => sum + Number(order.amount || 0), 0))}</strong> ({filteredOrders.length} orders)
                        </span>
                    </div>
                    {filteredOrders.length === 0 ? (
                        <p className="text-muted mb-0 small">No orders found.</p>
                    ) : (
                        <>
                            <div className="table-responsive rounded-3 border">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th className="ps-4">Student</th>
                                            <th>Course</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th className="pe-4">Created</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pagedOrders.items.map((order) => (
                                            <tr key={order._id}>
                                                <td className="ps-4 fw-semibold text-dark">{order.user?.fullName || order.user?.email || '-'}</td>
                                                <td>{order.course?.title || '-'}</td>
                                                <td className="fw-bold text-dark">{formatCurrency(order.amount)}</td>
                                                <td><span className="badge text-bg-light px-2.5 py-1.5">{order.status}</span></td>
                                                <td className="pe-4 text-muted">{order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-3">
                                <PaginationControls pagination={pagedOrders.pagination} onPageChange={(page) => setPage('payments', page)} itemLabel="orders" />
                            </div>
                        </>
                    )}
                </section>
            )}

            {/* TAB: Classes */}
            {activeTab === 'classes' && (
                <section className="card border-0 shadow-sm rounded-4 p-4">
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
                        <div>
                            <h4 className="fw-bold text-dark mb-1 fs-5">{editingClassId ? 'Update class' : 'Create class'}</h4>
                            <p className="text-muted mb-0 small">Assign a course and teacher. The teacher will manage this class workspace.</p>
                        </div>
                        {editingClassId && <button className="btn btn-outline-secondary px-3 py-1.5 rounded-3 btn-sm" type="button" onClick={resetClassForm}>Cancel edit</button>}
                    </div>

                    <form className="row g-3 mb-4 p-4 bg-light rounded-4 border" onSubmit={submitClass}>
                        <div className="col-md-4 col-xl-2">
                            <label className="form-label small fw-semibold text-dark">Class Code</label>
                            <input className="form-control bg-white py-2 rounded-3" placeholder="Class code" value={classForm.code} onChange={(event) => setClassForm({ ...classForm, code: event.target.value })} required />
                        </div>
                        <div className="col-md-4 col-xl-3">
                            <label className="form-label small fw-semibold text-dark">Course</label>
                            <select className="form-select bg-white py-2 rounded-3" value={classForm.course} onChange={(event) => setClassForm({ ...classForm, course: event.target.value })} required>
                                <option value="">Select Course</option>
                                {courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}
                            </select>
                        </div>
                        <div className="col-md-4 col-xl-3">
                            <label className="form-label small fw-semibold text-dark">Teacher</label>
                            <select className="form-select bg-white py-2 rounded-3" value={classForm.teacher} onChange={(event) => setClassForm({ ...classForm, teacher: event.target.value })} required>
                                <option value="">Select Teacher</option>
                                {teachers.map((teacher) => <option key={teacher._id} value={teacher._id}>{teacher.fullName || teacher.email}</option>)}
                            </select>
                        </div>
                        <div className="col-md-6 col-xl-2">
                            <label className="form-label small fw-semibold text-dark">Start Date</label>
                            <input className="form-control bg-white py-2 rounded-3" type="date" value={classForm.startDate} onChange={(event) => setClassForm({ ...classForm, startDate: event.target.value })} required />
                        </div>
                        <div className="col-md-6 col-xl-2">
                            <label className="form-label small fw-semibold text-dark">End Date</label>
                            <input className="form-control bg-white py-2 rounded-3" type="date" value={classForm.endDate} onChange={(event) => setClassForm({ ...classForm, endDate: event.target.value })} required />
                        </div>
                        <div className="col-md-4 col-xl-2">
                            <label className="form-label small fw-semibold text-dark">Max Students</label>
                            <input className="form-control bg-white py-2 rounded-3" type="number" min="1" placeholder="Max students" value={classForm.maxStudents} onChange={(event) => setClassForm({ ...classForm, maxStudents: event.target.value })} required />
                        </div>
                        <div className="col-md-4 col-xl-3">
                            <label className="form-label small fw-semibold text-dark">Status</label>
                            <select className="form-select bg-white py-2 rounded-3" value={classForm.status} onChange={(event) => setClassForm({ ...classForm, status: event.target.value })}>
                                {['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'].map((status) => <option key={status} value={status}>{status}</option>)}
                            </select>
                        </div>
                        <div className="col-md-4 col-xl-2 d-flex align-items-end">
                            <button className="btn btn-primary py-2.5 rounded-3 w-100 fw-bold auth-primary-btn" type="submit">{editingClassId ? 'Update' : 'Create'}</button>
                        </div>
                    </form>

                    <h5 className="fw-bold text-dark mb-3">Class status tracking</h5>
                    <div className="row g-3 mb-4">
                        {Object.entries(statusCount(classes)).map(([status, count]) => (
                            <div className="col-sm-6 col-md-3" key={status}>
                                <div className="p-3 bg-light rounded-3 border d-flex justify-content-between align-items-center">
                                    <span className="text-muted small fw-semibold text-uppercase">{status}</span>
                                    <strong className="text-dark fs-5">{count}</strong>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="table-responsive rounded-3 border mb-3">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="ps-4">Code</th>
                                    <th>Course</th>
                                    <th>Teacher</th>
                                    <th>Students</th>
                                    <th>Status</th>
                                    <th>Dates</th>
                                    <th className="pe-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagedClasses.items.map((classItem) => (
                                    <tr key={classItem._id}>
                                        <td className="ps-4"><span className="badge bg-secondary-subtle text-secondary rounded-2 px-2 py-1 font-monospace fw-bold">{classItem.code}</span></td>
                                        <td className="fw-semibold text-dark">{classItem.course?.title || '-'}</td>
                                        <td>{classItem.teacher?.fullName || '-'}</td>
                                        <td className="fw-bold">{classItem.currentStudents || 0}/{classItem.maxStudents || 0}</td>
                                        <td><span className="badge text-bg-light px-2.5 py-1.5">{classItem.status}</span></td>
                                        <td className="text-muted" style={{ fontSize: '0.85rem' }}>{classItem.startDate ? new Date(classItem.startDate).toLocaleDateString('vi-VN') : '-'} - {classItem.endDate ? new Date(classItem.endDate).toLocaleDateString('vi-VN') : '-'}</td>
                                        <td className="pe-4">
                                            <div className="d-flex gap-2">
                                                <button className="btn btn-sm btn-outline-primary px-2.5" type="button" onClick={() => startEditClass(classItem)}>Edit</button>
                                                <button className="btn btn-sm btn-outline-danger px-2.5" type="button" onClick={() => handleDeleteClass(classItem)}>Delete</button>
                                            </div>
                                        </td>
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
