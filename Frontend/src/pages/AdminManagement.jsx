import { useCallback, useEffect, useMemo, useState } from 'react';
import { createStaffUser, getAdminUsers, resetAdminUserPassword, updateAdminUser, updateAdminUserStatus } from '../services/adminUser';
import { createCategory, createCourse, deleteCourse, getCategories, getCourses, updateCourse, uploadCourseImage } from '../services/course';
import { createClass, deleteClass, getClasses, updateClass } from '../services/class';
import { getAllEnrollments } from '../services/enrollment';
import { broadcastNotification, listAllNotifications } from '../services/notification';
import { getAllOrders } from '../services/order';
import { createRole, getPermissions, getRoles } from '../services/rbac';
import { getAllBanners as loadBanners, createBanner as addBanner, deleteBanner as removeBanner, getSettings as loadSettings, upsertSetting as saveSetting, deleteSetting as removeSetting } from '../services/site';
import { createCoupon, getCoupons, updateCoupon } from '../services/coupon';
import CourseImage from '../components/CourseImage';
import PaginationControls from '../components/PaginationControls';
import { createPagination } from '../utils/pagination';

const emptyCourse = { title: '', description: '', price: '', category: '', durationWeeks: 0, sessionCount: 0, status: 'PUBLISHED' };
const emptyClass = { code: '', course: '', teacher: '', startDate: '', endDate: '', maxStudents: 20, status: 'OPEN' };
const emptyUser = { email: '', password: '123456', role: 'TEACHER', fullName: '', status: 'ACTIVE' };
const emptyBanner = { title: '', subtitle: '', imageUrl: '', linkUrl: '', position: 0, active: true };
const emptyNotification = { title: '', message: '', role: '', status: 'ACTIVE' };
const emptyCoupon = { code: '', name: '', discountType: 'PERCENT', discountValue: '', maxDiscountAmount: '', minOrderAmount: '', usageLimit: '', perUserLimit: 1, startsAt: '', expiresAt: '', active: true };
const fallbackRoles = [
    { code: 'ADMIN', name: 'Admin' },
    { code: 'MANAGER', name: 'Manager' },
    { code: 'TEACHER', name: 'Teacher' },
    { code: 'STUDENT', name: 'Student' }
];
const roleAliases = { USER: 'STUDENT' };
const getUserRoleCode = (user = {}) => {
    const rawRole = user.role || user.roleRef?.code || 'STUDENT';
    const normalizedRole = String(rawRole).toUpperCase();
    return roleAliases[normalizedRole] || normalizedRole;
};

const AdminManagement = () => {
    const [activeTab, setActiveTab] = useState('users');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [courses, setCourses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [classes, setClasses] = useState([]);
    const [orders, setOrders] = useState([]);
    const [banners, setBanners] = useState([]);
    const [settings, setSettings] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [userForm, setUserForm] = useState(emptyUser);
    const [userFilters, setUserFilters] = useState({ q: '', role: '', status: '' });
    const [courseFilters, setCourseFilters] = useState({ q: '', category: '', minPrice: '', maxPrice: '', sort: '' });
    const [appliedCourseFilters, setAppliedCourseFilters] = useState({ q: '', category: '', minPrice: '', maxPrice: '', sort: '' });
    const [classFilters, setClassFilters] = useState({ code: '', course: '', teacher: '', status: '' });
    const [appliedClassFilters, setAppliedClassFilters] = useState({ code: '', course: '', teacher: '', status: '' });
    const [notificationFilters, setNotificationFilters] = useState({ startDate: '', endDate: '', role: '' });
    const [appliedNotificationFilters, setAppliedNotificationFilters] = useState({ startDate: '', endDate: '', role: '' });
    const [userPagination, setUserPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [roleForm, setRoleForm] = useState({ code: '', name: '', permissions: [] });
    const [courseForm, setCourseForm] = useState(emptyCourse);
    const [editingCourseId, setEditingCourseId] = useState('');
    const [courseImageUrl, setCourseImageUrl] = useState('');
    const [courseImageFile, setCourseImageFile] = useState(null);
    const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
    const [classForm, setClassForm] = useState(emptyClass);
    const [editingClassId, setEditingClassId] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [bannerForm, setBannerForm] = useState(emptyBanner);
    const [settingForm, setSettingForm] = useState({ key: '', value: '', description: '' });
    const [notificationForm, setNotificationForm] = useState(emptyNotification);
    const [couponForm, setCouponForm] = useState(emptyCoupon);
    const [listPages, setListPages] = useState({});
    const listLimit = 5;

    const roleOptions = useMemo(() => {
        const roleMap = new Map();
        [...fallbackRoles, ...roles].forEach((role) => {
            const code = role.code || role.value || role.role;
            if (!code) return;
            roleMap.set(code, { code, name: role.name || code });
        });
        return Array.from(roleMap.values());
    }, [roles]);
    const teachers = useMemo(() => users.filter((user) => getUserRoleCode(user) === 'TEACHER'), [users]);
    const selectedClassStudents = useMemo(
        () => enrollments.filter((enrollment) => enrollment.class?._id === selectedClassId || enrollment.class === selectedClassId),
        [enrollments, selectedClassId]
    );
    const paginateList = (key, items, limit = listLimit) => createPagination(items, listPages[key] || 1, limit);
    const setListPage = (key, page) => setListPages((current) => ({ ...current, [key]: page }));

    const showSuccess = (value) => {
        setMessage(value);
        setError('');
    };

    const showError = useCallback((requestError, fallback) => {
        setError(requestError.response?.data?.message || fallback);
        setMessage('');
    }, []);

    const updateUserFilter = useCallback((nextFilter) => {
        setUserFilters((current) => ({ ...current, ...nextFilter }));
        setUserPagination((current) => ({ ...current, page: 1 }));
    }, []);

    const updateCourseFilter = useCallback((nextFilter) => {
        setCourseFilters((current) => ({ ...current, ...nextFilter }));
    }, []);

    const applyCourseFilters = () => {
        setAppliedCourseFilters(courseFilters);
        setListPages((current) => ({ ...current, courses: 1 }));
    };

    const clearCourseFilters = () => {
        const emptyFilters = { q: '', category: '', minPrice: '', maxPrice: '', sort: '' };
        setCourseFilters(emptyFilters);
        setAppliedCourseFilters(emptyFilters);
        setListPages((current) => ({ ...current, courses: 1 }));
    };

    const updateClassFilter = useCallback((nextFilter) => {
        setClassFilters((current) => ({ ...current, ...nextFilter }));
    }, []);

    const applyClassFilters = () => {
        setAppliedClassFilters(classFilters);
        setListPages((current) => ({ ...current, classes: 1 }));
    };

    const clearClassFilters = () => {
        const emptyFilters = { code: '', course: '', teacher: '', status: '' };
        setClassFilters(emptyFilters);
        setAppliedClassFilters(emptyFilters);
        setListPages((current) => ({ ...current, classes: 1 }));
    };

    const updateNotificationFilter = useCallback((nextFilter) => {
        setNotificationFilters((current) => ({ ...current, ...nextFilter }));
    }, []);

    const applyNotificationFilters = () => {
        if (notificationFilters.startDate && notificationFilters.endDate) {
            const start = new Date(notificationFilters.startDate);
            const end = new Date(notificationFilters.endDate);
            if (start > end) {
                setError('Start date cannot be after end date');
                return;
            }
        }
        setError('');
        setAppliedNotificationFilters(notificationFilters);
        setListPages((current) => ({ ...current, notifications: 1 }));
    };

    const clearNotificationFilters = () => {
        const emptyFilters = { startDate: '', endDate: '', role: '' };
        setNotificationFilters(emptyFilters);
        setAppliedNotificationFilters(emptyFilters);
        setError('');
        setListPages((current) => ({ ...current, notifications: 1 }));
    };

    const changeUserPage = (nextPage) => {
        setUserPagination((current) => ({
            ...current,
            page: Math.min(Math.max(nextPage, 1), current.totalPages || 1)
        }));
    };

    const changeUserLimit = (nextLimit) => {
        setUserPagination((current) => ({ ...current, limit: nextLimit, page: 1 }));
    };

    const loadAll = useCallback(async () => {
        try {
            const [userRes, roleRes, permissionRes, courseRes, categoryRes, classRes, enrollmentRes, orderRes, bannerRes, settingRes, notificationRes, couponRes] = await Promise.all([
                getAdminUsers({ ...userFilters, page: userPagination.page, limit: userPagination.limit }),
                getRoles(),
                getPermissions(),
                getCourses({ limit: 100, ...appliedCourseFilters }),
                getCategories(),
                getClasses(appliedClassFilters),
                getAllEnrollments(),
                getAllOrders(),
                loadBanners(),
                loadSettings(),
                listAllNotifications(appliedNotificationFilters),
                getCoupons()
            ]);
            setUsers(userRes.data.users || []);
            setUserPagination((current) => {
                const pagination = userRes.data.pagination || {};
                return {
                    ...current,
                    page: pagination.page || current.page,
                    limit: pagination.limit || current.limit,
                    total: pagination.total || 0,
                    totalPages: Math.max(pagination.totalPages || 1, 1)
                };
            });
            setRoles(roleRes.data.roles || []);
            setPermissions(permissionRes.data.permissions || []);
            setCourses(courseRes.data.courses || []);
            setCategories(categoryRes.data.categories || []);
            setClasses(classRes.data.classes || []);
            setEnrollments(enrollmentRes.data.enrollments || []);
            setOrders(orderRes.data.orders || []);
            setBanners(bannerRes.data.banners || []);
            setSettings(settingRes.data.settings || []);
            setNotifications(notificationRes.data.notifications || []);
            setCoupons(couponRes.data.coupons || []);
        } catch (requestError) {
            showError(requestError, 'Cannot load admin data');
        }
    }, [showError, userFilters, userPagination.limit, userPagination.page, appliedCourseFilters, appliedClassFilters, appliedNotificationFilters]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadAll();
        }, 0);
        return () => clearTimeout(timer);
    }, [loadAll]);

    const submitUser = async (event) => {
        event.preventDefault();
        try {
            await createStaffUser(userForm);
            setUserForm(emptyUser);
            await loadAll();
            showSuccess('Staff account created');
        } catch (requestError) {
            showError(requestError, 'Cannot create user');
        }
    };

    const submitRole = async (event) => {
        event.preventDefault();
        try {
            await createRole(roleForm);
            setRoleForm({ code: '', name: '', permissions: [] });
            await loadAll();
            showSuccess('Role created');
        } catch (requestError) {
            showError(requestError, 'Cannot create role');
        }
    };

    const submitCourse = async (event) => {
        event.preventDefault();
        try {
            const payload = { ...courseForm, price: Number(courseForm.price), durationWeeks: Number(courseForm.durationWeeks), sessionCount: Number(courseForm.sessionCount), imageUrl: courseImageUrl };
            let savedCourseId = editingCourseId;
            if (editingCourseId) {
                await updateCourse(editingCourseId, payload);
            } else {
                const response = await createCourse(payload);
                savedCourseId = response.data.course?._id;
            }
            if (courseImageFile && savedCourseId) {
                await uploadCourseImage(savedCourseId, courseImageFile);
            }
            setCourseForm(emptyCourse);
            setCourseImageUrl('');
            setCourseImageFile(null);
            setEditingCourseId('');
            await loadAll();
            showSuccess(editingCourseId ? 'Course updated' : 'Course created');
        } catch (requestError) {
            showError(requestError, 'Cannot save course');
        }
    };

    const submitCategory = async (event) => {
        event.preventDefault();
        try {
            await createCategory(categoryForm);
            setCategoryForm({ name: '', description: '' });
            await loadAll();
            showSuccess('Category created');
        } catch (requestError) {
            showError(requestError, 'Cannot create category');
        }
    };

    const submitClass = async (event) => {
        event.preventDefault();
        try {
            const payload = { ...classForm, maxStudents: Number(classForm.maxStudents) };
            if (editingClassId) {
                await updateClass(editingClassId, payload);
            } else {
                await createClass(payload);
            }
            setClassForm(emptyClass);
            setEditingClassId('');
            await loadAll();
            showSuccess(editingClassId ? 'Class updated' : 'Class created');
        } catch (requestError) {
            showError(requestError, 'Cannot save class');
        }
    };

    const submitNotification = async (event) => {
        event.preventDefault();
        try {
            await broadcastNotification(notificationForm);
            setNotificationForm(emptyNotification);
            await loadAll();
            showSuccess('Notification broadcasted');
        } catch (requestError) {
            showError(requestError, 'Cannot broadcast notification');
        }
    };

    const submitCoupon = async (event) => {
        event.preventDefault();
        try {
            await createCoupon({
                ...couponForm,
                discountValue: Number(couponForm.discountValue || 0),
                maxDiscountAmount: Number(couponForm.maxDiscountAmount || 0),
                minOrderAmount: Number(couponForm.minOrderAmount || 0),
                usageLimit: Number(couponForm.usageLimit || 0),
                perUserLimit: Number(couponForm.perUserLimit || 0),
                startsAt: couponForm.startsAt || undefined,
                expiresAt: couponForm.expiresAt || undefined
            });
            setCouponForm(emptyCoupon);
            await loadAll();
            showSuccess('Coupon created');
        } catch (requestError) {
            showError(requestError, 'Cannot create coupon');
        }
    };

    const startEditCourse = (course) => {
        setEditingCourseId(course._id);
        setCourseImageUrl(course.imageUrl || '');
        setCourseImageFile(null);
        setCourseForm({
            title: course.title || '',
            description: course.description || '',
            price: course.price || '',
            category: course.category?._id || course.category || '',
            durationWeeks: course.durationWeeks || 0,
            sessionCount: course.sessionCount || 0,
            status: course.status || 'PUBLISHED'
        });
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
    };

    const runConfirmedAction = async (confirmMessage, action, successMessage, fallbackError) => {
        if (!window.confirm(confirmMessage)) return;
        try {
            await action();
            await loadAll();
            showSuccess(successMessage);
        } catch (requestError) {
            showError(requestError, fallbackError);
        }
    };

    const handleUpdateUserRole = async (user, nextRole) => {
        const currentRole = getUserRoleCode(user);
        if (nextRole === currentRole) return;
        await runConfirmedAction(
            `Change role for ${user.email} from ${currentRole} to ${nextRole}?`,
            () => updateAdminUser(user._id, { role: nextRole }),
            'User role updated',
            'Cannot update user role'
        );
    };

    const submitBanner = async (event) => {
        event.preventDefault();
        try {
            await addBanner({ ...bannerForm, position: Number(bannerForm.position) });
            setBannerForm(emptyBanner);
            await loadAll();
            showSuccess('Banner created');
        } catch (requestError) {
            showError(requestError, 'Cannot create banner');
        }
    };

    const submitSetting = async (event) => {
        event.preventDefault();
        try {
            await saveSetting(settingForm);
            setSettingForm({ key: '', value: '', description: '' });
            await loadAll();
            showSuccess('Setting saved');
        } catch (requestError) {
            showError(requestError, 'Cannot save setting');
        }
    };

    const pagedRoles = paginateList('roles', roles);
    const pagedCourses = paginateList('courses', courses);
    const pagedClasses = paginateList('classes', classes);
    const pagedClassStudents = paginateList('classStudents', selectedClassStudents);
    const pagedBanners = paginateList('banners', banners);
    const pagedSettings = paginateList('settings', settings);
    const pagedNotifications = paginateList('notifications', notifications);
    const pagedOrders = paginateList('orders', orders);
    const pagedCoupons = paginateList('coupons', coupons);

    const tabs = [
        ['users', 'Users'],
        ['roles', 'Roles'],
        ['courses', 'Courses'],
        ['classes', 'Classes'],
        ['banners', 'Banners'],
        ['settings', 'Settings'],
        ['coupons', 'Coupons'],
        ['notifications', 'Notifications'],
        ['payments', 'Payments']
    ];

    return (
        <div className="container-fluid px-0 py-3">
            {/* Header Block */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4 p-4 bg-white rounded-4 border">
                <div>
                    <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-1.5 mb-2 text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>Admin</span>
                    <h2 className="fw-bold mb-1 text-dark">Management console</h2>
                    <p className="text-muted mb-0 small">Manage users, roles, courses, classes, banners, settings, and payments.</p>
                </div>
            </div>

            <div className="row g-4">
                {/* Horizontal Pill Navigation */}
                <div className="col-12 mb-4">
                    <div className="d-flex flex-wrap gap-2 p-2 bg-white rounded-4 border">
                        {tabs.map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                className={`btn px-4 py-2 fw-semibold rounded-pill border-0 ${
                                    activeTab === key
                                        ? 'btn-primary shadow-sm'
                                        : 'btn-light text-muted'
                                }`}
                                onClick={() => setActiveTab(key)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab content panel */}
                <main className="col-12">
                    {message && <div className="alert alert-success py-2.5 mb-4">{message}</div>}
                    {error && <div className="alert alert-danger py-2.5 mb-4">{error}</div>}

                    {/* TAB: Users */}
                    {activeTab === 'users' && (
                        <section className="card border-0 shadow-sm rounded-4 p-4">
                            <h4 className="fw-bold text-dark mb-3 fs-5">Create staff account</h4>
                            <form className="row g-3 mb-4 p-3 bg-light rounded-4 border" onSubmit={submitUser}>
                                <div className="col-md-3">
                                    <label className="form-label small fw-semibold text-dark">Email</label>
                                    <input className="form-control bg-white py-2 rounded-3" placeholder="staff@example.com" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} required />
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label small fw-semibold text-dark">Password</label>
                                    <input className="form-control bg-white py-2 rounded-3" placeholder="Password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label small fw-semibold text-dark">Full Name</label>
                                    <input className="form-control bg-white py-2 rounded-3" placeholder="Full name" value={userForm.fullName} onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })} required />
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label small fw-semibold text-dark">Role</label>
                                    <select className="form-select bg-white py-2 rounded-3" value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>{roleOptions.map((role) => <option key={role.code} value={role.code}>{role.name}</option>)}</select>
                                </div>
                                <div className="col-md-2 d-flex align-items-end">
                                    <button className="btn btn-primary py-2.5 rounded-3 w-100 fw-bold auth-primary-btn">Create</button>
                                </div>
                            </form>
                            <hr className="my-4 opacity-10" />

                            <h4 className="fw-bold text-dark mb-3 fs-5">Search and filter users</h4>
                            <div className="row g-3 mb-4">
                                <div className="col-md-5">
                                    <input className="form-control py-2 rounded-3" placeholder="Search email or name" value={userFilters.q} onChange={(e) => updateUserFilter({ q: e.target.value })} />
                                </div>
                                <div className="col-md-3">
                                    <select className="form-select py-2 rounded-3" value={userFilters.role} onChange={(e) => updateUserFilter({ role: e.target.value })}>
                                        <option value="">All roles</option>
                                        {roleOptions.map((role) => <option key={role.code} value={role.code}>{role.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <select className="form-select py-2 rounded-3" value={userFilters.status} onChange={(e) => updateUserFilter({ status: e.target.value })}>
                                        <option value="">All statuses</option>
                                        <option value="ACTIVE">ACTIVE</option>
                                        <option value="INACTIVE">INACTIVE</option>
                                    </select>
                                </div>
                                <div className="col-md-1">
                                    <button className="btn btn-outline-secondary w-100 py-2 rounded-3" type="button" onClick={() => updateUserFilter({ q: '', role: '', status: '' })}>Clear</button>
                                </div>
                            </div>

                            <h4 className="fw-bold text-dark mb-3 fs-5">Users</h4>
                            <div className="table-responsive rounded-3 border mb-3">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th className="ps-4">Email</th>
                                            <th>Name</th>
                                            <th>Role</th>
                                            <th>Status</th>
                                            <th className="pe-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>{users.map((user) => (
                                        <tr key={user._id}>
                                            <td className="ps-4 fw-semibold text-dark">{user.email}</td>
                                            <td>{user.fullName}</td>
                                            <td>
                                                <select className="form-select form-select-sm rounded-2 py-1" style={{ width: '130px' }} value={getUserRoleCode(user)} onChange={(e) => handleUpdateUserRole(user, e.target.value)}>
                                                    {roleOptions.map((role) => <option key={role.code} value={role.code}>{role.code}</option>)}
                                                </select>
                                            </td>
                                            <td><span className="badge text-bg-light px-2.5 py-1.5">{user.status}</span></td>
                                            <td className="pe-4">
                                                <div className="d-flex gap-2">
                                                    <button className="btn btn-sm btn-outline-secondary px-2.5" type="button" onClick={() => runConfirmedAction(
                                                        `Change status for ${user.email}?`,
                                                        () => updateAdminUserStatus(user._id, user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'),
                                                        'User status updated',
                                                        'Cannot update user status'
                                                    )}>Toggle</button>
                                                    <button className="btn btn-sm btn-outline-secondary px-2.5" type="button" onClick={() => runConfirmedAction(
                                                        `Reset password for ${user.email} to 123456?`,
                                                        () => resetAdminUserPassword(user._id, '123456'),
                                                        'Password reset to 123456',
                                                        'Cannot reset password'
                                                    )}>Reset</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}</tbody>
                                </table>
                            </div>
                            <PaginationControls pagination={userPagination} onPageChange={changeUserPage} onLimitChange={changeUserLimit} itemLabel="users" pageSizeOptions={[10, 20, 50]} />
                        </section>
                    )}

                    {/* TAB: Roles */}
                    {activeTab === 'roles' && (
                        <section className="card border-0 shadow-sm rounded-4 p-4">
                            <h4 className="fw-bold text-dark mb-3 fs-5">Create role</h4>
                            <form className="row g-3 mb-4 p-3 bg-light rounded-4 border" onSubmit={submitRole}>
                                <div className="col-md-3">
                                    <label className="form-label small fw-semibold text-dark">Code</label>
                                    <input className="form-control bg-white py-2 rounded-3" placeholder="e.g. VISITOR" value={roleForm.code} onChange={(e) => setRoleForm({ ...roleForm, code: e.target.value })} required />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label small fw-semibold text-dark">Name</label>
                                    <input className="form-control bg-white py-2 rounded-3" placeholder="e.g. Visitor User" value={roleForm.name} onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })} required />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label small fw-semibold text-dark">Permissions</label>
                                    <select multiple className="form-select bg-white rounded-3" style={{ height: '38px' }} value={roleForm.permissions} onChange={(e) => setRoleForm({ ...roleForm, permissions: Array.from(e.target.selectedOptions).map((item) => item.value) })}>{permissions.map((permission) => <option key={permission.code} value={permission.code}>{permission.code}</option>)}</select>
                                </div>
                                <div className="col-md-2 d-flex align-items-end">
                                    <button className="btn btn-primary py-2.5 rounded-3 w-100 fw-bold auth-primary-btn">Create</button>
                                </div>
                            </form>
                            <hr className="my-4 opacity-10" />

                            <h4 className="fw-bold text-dark mb-3 fs-5">Roles</h4>
                            <div className="d-flex flex-column gap-3 mb-3">
                                {pagedRoles.items.map((role) => (
                                    <div className="p-3 border rounded-3 bg-light" key={role._id}>
                                        <div className="d-flex align-items-center gap-2">
                                            <strong className="text-dark fs-5">{role.code}</strong>
                                            <span className="text-muted">({role.name})</span>
                                        </div>
                                        <div className="mt-2 text-muted small">{role.permissions?.map((p) => p.code).join(', ') || 'No permissions assigned.'}</div>
                                    </div>
                                ))}
                            </div>
                            {roles.length > 0 && <PaginationControls pagination={pagedRoles.pagination} onPageChange={(page) => setListPage('roles', page)} itemLabel="roles" />}
                        </section>
                    )}

                    {/* TAB: Courses */}
                    {activeTab === 'courses' && (
                        <section className="card border-0 shadow-sm rounded-4 p-4">
                            <h4 className="fw-bold text-dark mb-3 fs-5">Create category</h4>
                            <form className="row g-3 mb-4 p-3 bg-light rounded-4 border" onSubmit={submitCategory}>
                                <div className="col-md-4">
                                    <label className="form-label small fw-semibold text-dark">Category Name</label>
                                    <input className="form-control bg-white py-2 rounded-3" placeholder="Category name" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} required />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label small fw-semibold text-dark">Description</label>
                                    <input className="form-control bg-white py-2 rounded-3" placeholder="Description details" value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} required />
                                </div>
                                <div className="col-md-2 d-flex align-items-end">
                                    <button className="btn btn-primary py-2.5 rounded-3 w-100 fw-bold auth-primary-btn">Create</button>
                                </div>
                            </form>
                            <hr className="my-4 opacity-10" />

                            <h4 className="fw-bold text-dark mb-3 fs-5">{editingCourseId ? 'Update course' : 'Create course'}</h4>
                            <form className="row g-3 mb-4 p-3 bg-light rounded-4 border" onSubmit={submitCourse}>
                                <div className="col-md-3">
                                    <label className="form-label small fw-semibold text-dark">Title</label>
                                    <input className="form-control bg-white py-2 rounded-3" placeholder="Course Title" value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} required />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label small fw-semibold text-dark">Description</label>
                                    <input className="form-control bg-white py-2 rounded-3" placeholder="Short description" value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} required />
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label small fw-semibold text-dark">Price (VND)</label>
                                    <input className="form-control bg-white py-2 rounded-3" placeholder="Price" value={courseForm.price} onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })} required />
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label small fw-semibold text-dark">Category</label>
                                    <select className="form-select bg-white py-2 rounded-3" value={courseForm.category} onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })} required>
                                        <option value="">Category</option>
                                        {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label small fw-semibold text-dark">Image URL</label>
                                    <input className="form-control bg-white py-2 rounded-3" placeholder="Image URL" value={courseImageUrl} onChange={(e) => setCourseImageUrl(e.target.value)} />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label small fw-semibold text-dark">Upload Image</label>
                                    <input className="form-control bg-white py-1.5 rounded-3" type="file" accept="image/*" onChange={(e) => setCourseImageFile(e.target.files?.[0] || null)} />
                                </div>
                                <div className="col-md-3 d-flex align-items-end gap-2">
                                    <button className="btn btn-primary py-2.5 rounded-3 w-100 fw-bold auth-primary-btn">{editingCourseId ? 'Update' : 'Create'}</button>
                                    {editingCourseId && <button className="btn btn-outline-secondary py-2.5 rounded-3 w-100" type="button" onClick={() => { setEditingCourseId(''); setCourseForm(emptyCourse); setCourseImageUrl(''); setCourseImageFile(null); }}>Cancel</button>}
                                </div>
                            </form>
                            <hr className="my-4 opacity-10" />

                            <h4 className="fw-bold text-dark mb-3 fs-5">Search and filter courses</h4>
                            <div className="row g-3 mb-4">
                                <div className="col-md-2">
                                    <input className="form-control py-2 rounded-3" placeholder="Search title or description" value={courseFilters.q} onChange={(e) => updateCourseFilter({ q: e.target.value })} />
                                </div>
                                <div className="col-md-2">
                                    <select className="form-select py-2 rounded-3" value={courseFilters.category} onChange={(e) => updateCourseFilter({ category: e.target.value })}>
                                        <option value="">All categories</option>
                                        {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-2">
                                    <input type="text" className="form-control py-2 rounded-3" placeholder="Min price" value={courseFilters.minPrice ? Number(courseFilters.minPrice).toLocaleString('vi-VN') : ''} onChange={(e) => updateCourseFilter({ minPrice: e.target.value.replace(/\D/g, '') })} />
                                </div>
                                <div className="col-md-2">
                                    <input type="text" className="form-control py-2 rounded-3" placeholder="Max price" value={courseFilters.maxPrice ? Number(courseFilters.maxPrice).toLocaleString('vi-VN') : ''} onChange={(e) => updateCourseFilter({ maxPrice: e.target.value.replace(/\D/g, '') })} />
                                </div>
                                <div className="col-md-2">
                                    <select className="form-select py-2 rounded-3" value={courseFilters.sort} onChange={(e) => updateCourseFilter({ sort: e.target.value })}>
                                        <option value="">Sort by...</option>
                                        <option value="priceAsc">Price: Low to High</option>
                                        <option value="priceDesc">Price: High to Low</option>
                                        <option value="newest">Newest</option>
                                        <option value="titleAsc">Title A-Z</option>
                                    </select>
                                </div>
                                <div className="col-md-2 d-flex gap-2">
                                    <button className="btn btn-primary w-100 py-2 rounded-3" type="button" onClick={applyCourseFilters}>Apply</button>
                                    <button className="btn btn-outline-secondary w-100 py-2 rounded-3" type="button" onClick={clearCourseFilters}>Clear</button>
                                </div>
                            </div>

                            <h4 className="fw-bold text-dark mb-3 fs-5">Courses</h4>
                            <div className="d-flex flex-column gap-3 mb-3">
                                {pagedCourses.items.map((course) => (
                                    <div className="p-3 border rounded-3 bg-white d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3" key={course._id}>
                                        <span className="d-flex align-items-center gap-3">
                                            <CourseImage course={course} className="admin-course-image rounded-3" style={{ width: '80px', height: '56px', objectFit: 'cover' }} />
                                            <div>
                                                <strong className="text-dark fs-6 d-block">{course.title}</strong>
                                                <span className="text-muted small">{course.price?.toLocaleString('vi-VN')} VND {course.imageUrl ? '• Image set' : ''}</span>
                                            </div>
                                        </span>
                                        <span className="d-flex gap-2">
                                            <button className="btn btn-sm btn-outline-primary px-3" type="button" onClick={() => startEditCourse(course)}>Edit</button>
                                            <button className="btn btn-sm btn-outline-danger px-3" type="button" onClick={() => runConfirmedAction(
                                                `Delete course "${course.title}"?`,
                                                () => deleteCourse(course._id),
                                                'Course deleted',
                                                'Cannot delete course'
                                            )}>Delete</button>
                                        </span>
                                    </div>
                                ))}
                            </div>
                            {courses.length > 0 && <PaginationControls pagination={pagedCourses.pagination} onPageChange={(page) => setListPage('courses', page)} itemLabel="courses" />}
                        </section>
                    )}

                    {/* TAB: Classes */}
                    {activeTab === 'classes' && (
                        <section className="card border-0 shadow-sm rounded-4 p-4">
                            <h4 className="fw-bold text-dark mb-3 fs-5">{editingClassId ? 'Update class' : 'Create class'}</h4>
                            <form className="row g-3 mb-4 p-3 bg-light rounded-4 border" onSubmit={submitClass}>
                                <div className="col-md-2">
                                    <label className="form-label small fw-semibold text-dark">Class Code</label>
                                    <input className="form-control bg-white py-2 rounded-3" placeholder="Code" value={classForm.code} onChange={(e) => setClassForm({ ...classForm, code: e.target.value })} required />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label small fw-semibold text-dark">Course</label>
                                    <select className="form-select bg-white py-2 rounded-3" value={classForm.course} onChange={(e) => setClassForm({ ...classForm, course: e.target.value })} required>
                                        <option value="">Select Course</option>
                                        {courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label small fw-semibold text-dark">Teacher</label>
                                    <select className="form-select bg-white py-2 rounded-3" value={classForm.teacher} onChange={(e) => setClassForm({ ...classForm, teacher: e.target.value })} required>
                                        <option value="">Select Teacher</option>
                                        {teachers.map((teacher) => <option key={teacher._id} value={teacher._id}>{teacher.fullName || teacher.email}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label small fw-semibold text-dark">Start Date</label>
                                    <input type="date" className="form-control bg-white py-2 rounded-3" value={classForm.startDate} onChange={(e) => setClassForm({ ...classForm, startDate: e.target.value })} required />
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label small fw-semibold text-dark">End Date</label>
                                    <input type="date" className="form-control bg-white py-2 rounded-3" value={classForm.endDate} onChange={(e) => setClassForm({ ...classForm, endDate: e.target.value })} required />
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label small fw-semibold text-dark">Max Students</label>
                                    <input className="form-control bg-white py-2 rounded-3" placeholder="Max" value={classForm.maxStudents} onChange={(e) => setClassForm({ ...classForm, maxStudents: e.target.value })} required />
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label small fw-semibold text-dark">Status</label>
                                    <select className="form-select bg-white py-2 rounded-3" value={classForm.status} onChange={(e) => setClassForm({ ...classForm, status: e.target.value })}>
                                        {['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'].map((status) => <option key={status} value={status}>{status}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-3 d-flex align-items-end gap-2">
                                    <button className="btn btn-primary py-2.5 rounded-3 w-100 fw-bold auth-primary-btn">{editingClassId ? 'Update' : 'Create'}</button>
                                    {editingClassId && <button className="btn btn-outline-secondary py-2.5 rounded-3 w-100" type="button" onClick={() => { setEditingClassId(''); setClassForm(emptyClass); }}>Cancel</button>}
                                </div>
                            </form>
                            <hr className="my-4 opacity-10" />

                            <h4 className="fw-bold text-dark mb-3 fs-5">Search and filter classes</h4>
                            <div className="row g-3 mb-4">
                                <div className="col-md-2">
                                    <input className="form-control py-2 rounded-3" placeholder="Search class code" value={classFilters.code} onChange={(e) => updateClassFilter({ code: e.target.value })} />
                                </div>
                                <div className="col-md-3">
                                    <select className="form-select py-2 rounded-3" value={classFilters.course} onChange={(e) => updateClassFilter({ course: e.target.value })}>
                                        <option value="">All courses</option>
                                        {courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <select className="form-select py-2 rounded-3" value={classFilters.teacher} onChange={(e) => updateClassFilter({ teacher: e.target.value })}>
                                        <option value="">All teachers</option>
                                        {teachers.map((teacher) => <option key={teacher._id} value={teacher._id}>{teacher.fullName || teacher.email}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-2">
                                    <select className="form-select py-2 rounded-3" value={classFilters.status} onChange={(e) => updateClassFilter({ status: e.target.value })}>
                                        <option value="">All statuses</option>
                                        <option value="OPEN">OPEN</option>
                                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                                        <option value="COMPLETED">COMPLETED</option>
                                        <option value="CLOSED">CLOSED</option>
                                    </select>
                                </div>
                                <div className="col-md-2 d-flex gap-2">
                                    <button className="btn btn-primary w-100 py-2 rounded-3" type="button" onClick={applyClassFilters}>Apply</button>
                                    <button className="btn btn-outline-secondary w-100 py-2 rounded-3" type="button" onClick={clearClassFilters}>Clear</button>
                                </div>
                            </div>

                            <h4 className="fw-bold text-dark mb-3 fs-5">Classes</h4>
                            <div className="d-flex flex-column gap-3 mb-3">
                                {pagedClasses.items.map((item) => (
                                    <div className="p-3 border rounded-3 bg-white d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3" key={item._id}>
                                        <div>
                                            <strong className="badge bg-secondary-subtle text-secondary px-2 py-1 font-monospace mb-1">{item.code}</strong>
                                            <div className="text-dark fw-semibold mt-1">{item.course?.title}</div>
                                            <small className="text-muted">Students: {item.currentStudents || 0}/{item.maxStudents}</small>
                                        </div>
                                        <span className="d-flex gap-2">
                                            <button className="btn btn-sm btn-outline-primary px-3" type="button" onClick={() => startEditClass(item)}>Edit</button>
                                            <button className="btn btn-sm btn-outline-secondary px-3" type="button" onClick={() => setSelectedClassId(item._id)}>Students</button>
                                            <button className="btn btn-sm btn-outline-danger px-3" type="button" onClick={() => runConfirmedAction(
                                                `Delete class "${item.code}"?`,
                                                () => deleteClass(item._id),
                                                'Class deleted',
                                                'Cannot delete class'
                                            )}>Delete</button>
                                        </span>
                                    </div>
                                ))}
                            </div>
                            {classes.length > 0 && <PaginationControls pagination={pagedClasses.pagination} onPageChange={(page) => setListPage('classes', page)} itemLabel="classes" />}

                            {selectedClassId && (
                                <div className="mt-4 p-3 bg-light rounded-4 border">
                                    <h5 className="fw-bold text-dark mb-3">Class students</h5>
                                    {selectedClassStudents.length === 0 ? (
                                        <p className="text-muted mb-0 small">No student is assigned to this class.</p>
                                    ) : (
                                        <>
                                            <div className="table-responsive rounded-3 border bg-white mb-2">
                                                <table className="table table-hover align-middle mb-0">
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th className="ps-3">Student</th>
                                                            <th>Email</th>
                                                            <th>Course</th>
                                                            <th>Status</th>
                                                            <th className="pe-3">Progress</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>{pagedClassStudents.items.map((enrollment) => (
                                                        <tr key={enrollment._id}>
                                                            <td className="ps-3 fw-semibold text-dark">{enrollment.user?.fullName || '-'}</td>
                                                            <td>{enrollment.user?.email || '-'}</td>
                                                            <td>{enrollment.course?.title || '-'}</td>
                                                            <td><span className="badge text-bg-light px-2 py-1">{enrollment.status}</span></td>
                                                            <td className="pe-3 fw-bold text-primary">{enrollment.progress || 0}%</td>
                                                        </tr>
                                                    ))}</tbody>
                                                </table>
                                            </div>
                                            <PaginationControls pagination={pagedClassStudents.pagination} onPageChange={(page) => setListPage('classStudents', page)} itemLabel="students" />
                                        </>
                                    )}
                                </div>
                            )}
                        </section>
                    )}

                    {/* TAB: Banners */}
                    {activeTab === 'banners' && (
                        <section className="card border-0 shadow-sm rounded-4 p-4">
                            <h4 className="fw-bold text-dark mb-3 fs-5">Create banner</h4>
                            <form className="row g-3 mb-4 p-3 bg-light rounded-4 border" onSubmit={submitBanner}>
                                <div className="col-md-3">
                                    <label className="form-label small fw-semibold text-dark">Title</label>
                                    <input className="form-control bg-white py-2 rounded-3" placeholder="Banner title" value={bannerForm.title} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })} required />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label small fw-semibold text-dark">Image URL</label>
                                    <input className="form-control bg-white py-2 rounded-3" placeholder="URL" value={bannerForm.imageUrl} onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })} required />
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label small fw-semibold text-dark">Link</label>
                                    <input className="form-control bg-white py-2 rounded-3" placeholder="Link URL" value={bannerForm.linkUrl} onChange={(e) => setBannerForm({ ...bannerForm, linkUrl: e.target.value })} />
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label small fw-semibold text-dark">Position</label>
                                    <input className="form-control bg-white py-2 rounded-3" placeholder="Position" value={bannerForm.position} onChange={(e) => setBannerForm({ ...bannerForm, position: e.target.value })} required />
                                </div>
                                <div className="col-md-2 d-flex align-items-end">
                                    <button className="btn btn-primary py-2.5 rounded-3 w-100 fw-bold auth-primary-btn">Create</button>
                                </div>
                            </form>
                            <hr className="my-4 opacity-10" />

                            <h4 className="fw-bold text-dark mb-3 fs-5">Banners</h4>
                            <div className="d-flex flex-column gap-3 mb-3">
                                {pagedBanners.items.map((banner) => (
                                    <div className="p-3 border rounded-3 bg-white d-flex justify-content-between align-items-center" key={banner._id}>
                                        <div>
                                            <strong className="text-dark">{banner.title}</strong>
                                            <span className="badge bg-success-subtle text-success ms-2">{banner.active ? 'Active' : 'Inactive'}</span>
                                        </div>
                                        <button className="btn btn-sm btn-outline-danger px-3" type="button" onClick={() => runConfirmedAction(
                                            `Delete banner "${banner.title}"?`,
                                            () => removeBanner(banner._id),
                                            'Banner deleted',
                                            'Cannot delete banner'
                                        )}>Delete</button>
                                    </div>
                                ))}
                            </div>
                            {banners.length > 0 && <PaginationControls pagination={pagedBanners.pagination} onPageChange={(page) => setListPage('banners', page)} itemLabel="banners" />}
                        </section>
                    )}

                    {/* TAB: Settings */}
                    {activeTab === 'settings' && (
                        <section className="card border-0 shadow-sm rounded-4 p-4">
                            <h4 className="fw-bold text-dark mb-3 fs-5">Save setting</h4>
                            <form className="row g-3 mb-4 p-3 bg-light rounded-4 border" onSubmit={submitSetting}>
                                <div className="col-md-3">
                                    <label className="form-label small fw-semibold text-dark">Key</label>
                                    <input className="form-control bg-white py-2 rounded-3" placeholder="Setting key" value={settingForm.key} onChange={(e) => setSettingForm({ ...settingForm, key: e.target.value })} required />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label small fw-semibold text-dark">Value</label>
                                    <input className="form-control bg-white py-2 rounded-3" placeholder="Setting value" value={settingForm.value} onChange={(e) => setSettingForm({ ...settingForm, value: e.target.value })} required />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label small fw-semibold text-dark">Description</label>
                                    <input className="form-control bg-white py-2 rounded-3" placeholder="Description details" value={settingForm.description} onChange={(e) => setSettingForm({ ...settingForm, description: e.target.value })} />
                                </div>
                                <div className="col-md-2 d-flex align-items-end">
                                    <button className="btn btn-primary py-2.5 rounded-3 w-100 fw-bold auth-primary-btn">Save</button>
                                </div>
                            </form>
                            <hr className="my-4 opacity-10" />

                            <h4 className="fw-bold text-dark mb-3 fs-5">Settings</h4>
                            <div className="d-flex flex-column gap-3 mb-3">
                                {pagedSettings.items.map((setting) => (
                                    <div className="p-3 border rounded-3 bg-white d-flex justify-content-between align-items-center" key={setting._id}>
                                        <div>
                                            <strong className="text-primary font-monospace">{setting.key}</strong>
                                            <span className="text-muted ms-2">: {String(setting.value)}</span>
                                        </div>
                                        <button className="btn btn-sm btn-outline-danger px-3" type="button" onClick={() => runConfirmedAction(
                                            `Delete setting "${setting.key}"?`,
                                            () => removeSetting(setting.key),
                                            'Setting deleted',
                                            'Cannot delete setting'
                                        )}>Delete</button>
                                    </div>
                                ))}
                            </div>
                            {settings.length > 0 && <PaginationControls pagination={pagedSettings.pagination} onPageChange={(page) => setListPage('settings', page)} itemLabel="settings" />}
                        </section>
                    )}

                    {/* TAB: Coupons */}
                    {activeTab === 'coupons' && (
                        <section className="card border-0 shadow-sm rounded-4 p-4">
                            <h4 className="fw-bold text-dark mb-3 fs-5">Create coupon</h4>
                            <form className="row g-3 mb-4 p-3 bg-light rounded-4 border" onSubmit={submitCoupon}>
                                <div className="col-md-2">
                                    <label className="form-label small fw-semibold text-dark">Code</label>
                                    <input className="form-control bg-white py-2 rounded-3" placeholder="Code" value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })} required />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label small fw-semibold text-dark">Name</label>
                                    <input className="form-control bg-white py-2 rounded-3" placeholder="Name" value={couponForm.name} onChange={(e) => setCouponForm({ ...couponForm, name: e.target.value })} required />
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label small fw-semibold text-dark">Discount Type</label>
                                    <select className="form-select bg-white py-2 rounded-3" value={couponForm.discountType} onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}>
                                        <option value="PERCENT">Percent</option>
                                        <option value="FIXED">Fixed amount</option>
                                    </select>
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label small fw-semibold text-dark">Value</label>
                                    <input className="form-control bg-white py-2 rounded-3" type="number" min="0" placeholder="Discount" value={couponForm.discountValue} onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })} required />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label small fw-semibold text-dark">Max Discount (VND)</label>
                                    <input className="form-control bg-white py-2 rounded-3" type="number" min="0" placeholder="Max cap" value={couponForm.maxDiscountAmount} onChange={(e) => setCouponForm({ ...couponForm, maxDiscountAmount: e.target.value })} />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label small fw-semibold text-dark">Min Order (VND)</label>
                                    <input className="form-control bg-white py-2 rounded-3" type="number" min="0" placeholder="Min order" value={couponForm.minOrderAmount} onChange={(e) => setCouponForm({ ...couponForm, minOrderAmount: e.target.value })} />
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label small fw-semibold text-dark">Total Uses</label>
                                    <input className="form-control bg-white py-2 rounded-3" type="number" min="0" placeholder="Usage limit" value={couponForm.usageLimit} onChange={(e) => setCouponForm({ ...couponForm, usageLimit: e.target.value })} />
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label small fw-semibold text-dark">Uses/User</label>
                                    <input className="form-control bg-white py-2 rounded-3" type="number" min="0" placeholder="Per user limit" value={couponForm.perUserLimit} onChange={(e) => setCouponForm({ ...couponForm, perUserLimit: e.target.value })} />
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label small fw-semibold text-dark">Starts At</label>
                                    <input className="form-control bg-white py-2 rounded-3" type="date" value={couponForm.startsAt} onChange={(e) => setCouponForm({ ...couponForm, startsAt: e.target.value })} />
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label small fw-semibold text-dark">Expires At</label>
                                    <input className="form-control bg-white py-2 rounded-3" type="date" value={couponForm.expiresAt} onChange={(e) => setCouponForm({ ...couponForm, expiresAt: e.target.value })} />
                                </div>
                                <div className="col-md-2 form-check d-flex align-items-center gap-2 mt-4">
                                    <input className="form-check-input" id="couponActive" type="checkbox" checked={couponForm.active} onChange={(e) => setCouponForm({ ...couponForm, active: e.target.checked })} />
                                    <label className="form-check-label text-dark fw-semibold small" htmlFor="couponActive">Active</label>
                                </div>
                                <div className="col-md-2 d-flex align-items-end">
                                    <button className="btn btn-primary py-2.5 rounded-3 w-100 fw-bold auth-primary-btn">Create</button>
                                </div>
                            </form>
                            <hr className="my-4 opacity-10" />

                            <h4 className="fw-bold text-dark mb-3 fs-5">Coupons</h4>
                            <div className="table-responsive rounded-3 border mb-3">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th className="ps-4">Code</th>
                                            <th>Name</th>
                                            <th>Discount</th>
                                            <th>Min order</th>
                                            <th>Usage</th>
                                            <th>Status</th>
                                            <th>Expires</th>
                                            <th className="pe-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>{pagedCoupons.items.map((coupon) => (
                                        <tr key={coupon._id}>
                                            <td className="ps-4"><strong className="badge bg-secondary-subtle text-secondary font-monospace px-2.5 py-1.5">{coupon.code}</strong></td>
                                            <td>{coupon.name}</td>
                                            <td>{coupon.discountType === 'PERCENT' ? `${coupon.discountValue}%` : `${Number(coupon.discountValue || 0).toLocaleString('vi-VN')} VND`}{coupon.maxDiscountAmount > 0 ? `, cap ${Number(coupon.maxDiscountAmount).toLocaleString('vi-VN')} VND` : ''}</td>
                                            <td>{Number(coupon.minOrderAmount || 0).toLocaleString('vi-VN')} VND</td>
                                            <td>{coupon.usedCount || 0}/{coupon.usageLimit || 'Unlimited'}</td>
                                            <td><span className="badge text-bg-light px-2.5 py-1.5">{coupon.active ? 'Active' : 'Inactive'}</span></td>
                                            <td className="text-muted">{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : '-'}</td>
                                            <td className="pe-4">
                                                <button className="btn btn-sm btn-outline-primary px-2.5" type="button" onClick={() => runConfirmedAction(
                                                    `${coupon.active ? 'Disable' : 'Enable'} coupon "${coupon.code}"?`,
                                                    () => updateCoupon(coupon._id, { active: !coupon.active }),
                                                    'Coupon updated',
                                                    'Cannot update coupon'
                                                )}>{coupon.active ? 'Disable' : 'Enable'}</button>
                                            </td>
                                        </tr>
                                    ))}</tbody>
                                </table>
                            </div>
                            {coupons.length === 0 && <p className="text-muted mb-0 small ps-4">No coupons have been created.</p>}
                            {coupons.length > 0 && <PaginationControls pagination={pagedCoupons.pagination} onPageChange={(page) => setListPage('coupons', page)} itemLabel="coupons" />}
                        </section>
                    )}

                    {/* TAB: Notifications */}
                    {activeTab === 'notifications' && (
                        <section className="card border-0 shadow-sm rounded-4 p-4">
                            <h4 className="fw-bold text-dark mb-3 fs-5">Broadcast notification</h4>
                            <form className="row g-3 mb-4 p-3 bg-light rounded-4 border" onSubmit={submitNotification}>
                                <div className="col-md-3">
                                    <label className="form-label small fw-semibold text-dark">Title</label>
                                    <input className="form-control bg-white py-2 rounded-3" placeholder="Title" value={notificationForm.title} onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })} required />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label small fw-semibold text-dark">Message</label>
                                    <input className="form-control bg-white py-2 rounded-3" placeholder="Message details" value={notificationForm.message} onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })} />
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label small fw-semibold text-dark">Role Filter</label>
                                    <select className="form-select bg-white py-2 rounded-3" value={notificationForm.role} onChange={(e) => setNotificationForm({ ...notificationForm, role: e.target.value })}>
                                        <option value="">All roles</option>
                                        {roleOptions.map((role) => <option key={role.code} value={role.code}>{role.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label small fw-semibold text-dark">Status</label>
                                    <select className="form-select bg-white py-2 rounded-3" value={notificationForm.status} onChange={(e) => setNotificationForm({ ...notificationForm, status: e.target.value })}>
                                        <option value="">All statuses</option>
                                        <option value="ACTIVE">ACTIVE</option>
                                        <option value="INACTIVE">INACTIVE</option>
                                    </select>
                                </div>
                                <div className="col-md-1 d-flex align-items-end">
                                    <button className="btn btn-primary py-2.5 rounded-3 w-100 fw-bold auth-primary-btn">Send</button>
                                </div>
                            </form>
                            <hr className="my-4 opacity-10" />

                            <h4 className="fw-bold text-dark mb-3 fs-5">Search and filter notifications</h4>
                            <div className="row g-3 mb-4">
                                <div className="col-md-5 d-flex align-items-center gap-2">
                                    <span className="text-muted small fw-semibold text-nowrap">From date</span>
                                    <input type="date" className="form-control py-2 rounded-3" value={notificationFilters.startDate} onChange={(e) => updateNotificationFilter({ startDate: e.target.value })} />
                                    <span className="text-muted small fw-semibold text-nowrap">to date</span>
                                    <input type="date" className="form-control py-2 rounded-3" value={notificationFilters.endDate} onChange={(e) => updateNotificationFilter({ endDate: e.target.value })} />
                                </div>
                                <div className="col-md-3">
                                    <select className="form-select py-2 rounded-3" value={notificationFilters.role} onChange={(e) => updateNotificationFilter({ role: e.target.value })}>
                                        <option value="">All roles</option>
                                        {roleOptions.map((role) => <option key={role.code} value={role.code}>{role.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-3 d-flex gap-2">
                                    <button className="btn btn-primary w-100 py-2 rounded-3" type="button" onClick={applyNotificationFilters}>Apply</button>
                                    <button className="btn btn-outline-secondary w-100 py-2 rounded-3" type="button" onClick={clearNotificationFilters}>Clear</button>
                                </div>
                            </div>

                            <h4 className="fw-bold text-dark mb-3 fs-5">Recent notifications</h4>
                            <div className="table-responsive rounded-3 border mb-3">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th className="ps-4">User</th>
                                            <th>Title</th>
                                            <th>Message</th>
                                            <th>Read</th>
                                            <th className="pe-4">Created</th>
                                        </tr>
                                    </thead>
                                    <tbody>{pagedNotifications.items.map((notification) => (
                                        <tr key={notification._id}>
                                            <td className="ps-4 fw-semibold text-dark">{notification.user?.fullName || notification.user?.email || '-'}</td>
                                            <td>{notification.title}</td>
                                            <td>{notification.message}</td>
                                            <td><span className="badge text-bg-light px-2.5 py-1.5">{notification.read ? 'Yes' : 'No'}</span></td>
                                            <td className="pe-4 text-muted">{notification.createdAt ? new Date(notification.createdAt).toLocaleString() : '-'}</td>
                                        </tr>
                                    ))}</tbody>
                                </table>
                            </div>
                            {notifications.length > 0 && <PaginationControls pagination={pagedNotifications.pagination} onPageChange={(page) => setListPage('notifications', page)} itemLabel="notifications" />}
                        </section>
                    )}

                    {/* TAB: Payments */}
                    {activeTab === 'payments' && (
                        <section className="card border-0 shadow-sm rounded-4 p-4">
                            <h4 className="fw-bold text-dark mb-3 fs-5">Payments and orders</h4>
                            <div className="table-responsive rounded-3 border mb-3">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th className="ps-4">Course</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th>Method</th>
                                            <th className="pe-4">Created</th>
                                        </tr>
                                    </thead>
                                    <tbody>{pagedOrders.items.map((order) => (
                                        <tr key={order._id}>
                                            <td className="ps-4 fw-semibold text-dark">{order.course?.title}</td>
                                            <td className="fw-bold">{order.amount?.toLocaleString('vi-VN')} VND</td>
                                            <td><span className="badge text-bg-light px-2.5 py-1.5">{order.status}</span></td>
                                            <td>{order.paymentMethod}</td>
                                            <td className="pe-4 text-muted">{order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}</td>
                                        </tr>
                                    ))}</tbody>
                                </table>
                            </div>
                            {orders.length > 0 && <PaginationControls pagination={pagedOrders.pagination} onPageChange={(page) => setListPage('orders', page)} itemLabel="orders" />}
                        </section>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminManagement;
