import { useCallback, useEffect, useMemo, useState } from 'react';
import { createStaffUser, getAdminUsers, resetAdminUserPassword, updateAdminUser, updateAdminUserStatus } from '../services/adminUser';
import { createCategory, createCourse, deleteCourse, getCategories, getCourses, updateCourse, uploadCourseImage } from '../services/course';
import { createClass, deleteClass, getClasses, updateClass } from '../services/class';
import { getAllEnrollments } from '../services/enrollment';
import { broadcastNotification, listAllNotifications } from '../services/notification';
import { getAllOrders } from '../services/order';
import { createRole, getPermissions, getRoles } from '../services/rbac';
import { getAllBanners as loadBanners, createBanner as addBanner, deleteBanner as removeBanner, getSettings as loadSettings, upsertSetting as saveSetting, deleteSetting as removeSetting } from '../services/site';
import CourseImage from '../components/CourseImage';
import PaginationControls from '../components/PaginationControls';
import { createPagination } from '../utils/pagination';

const emptyCourse = { title: '', description: '', price: '', category: '', durationWeeks: 0, sessionCount: 0, status: 'PUBLISHED' };
const emptyClass = { code: '', course: '', teacher: '', startDate: '', endDate: '', maxStudents: 20, status: 'OPEN' };
const emptyUser = { email: '', password: '123456', role: 'TEACHER', fullName: '', status: 'ACTIVE' };
const emptyBanner = { title: '', subtitle: '', imageUrl: '', linkUrl: '', position: 0, active: true };
const emptyNotification = { title: '', message: '', role: '', status: 'ACTIVE' };
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
    const [userForm, setUserForm] = useState(emptyUser);
    const [userFilters, setUserFilters] = useState({ q: '', role: '', status: '' });
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
            const [userRes, roleRes, permissionRes, courseRes, categoryRes, classRes, enrollmentRes, orderRes, bannerRes, settingRes, notificationRes] = await Promise.all([
                getAdminUsers({ ...userFilters, page: userPagination.page, limit: userPagination.limit }),
                getRoles(),
                getPermissions(),
                getCourses({ limit: 100 }),
                getCategories(),
                getClasses(),
                getAllEnrollments(),
                getAllOrders(),
                loadBanners(),
                loadSettings(),
                listAllNotifications()
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
        } catch (requestError) {
            showError(requestError, 'Cannot load admin data');
        }
    }, [showError, userFilters, userPagination.limit, userPagination.page]);

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

    const tabs = [
        ['users', 'Users'],
        ['roles', 'Roles'],
        ['courses', 'Courses'],
        ['classes', 'Classes'],
        ['banners', 'Banners'],
        ['settings', 'Settings'],
        ['notifications', 'Notifications'],
        ['payments', 'Payments']
    ];

    return (
        <div className="container py-5">
            <div className="mb-4">
                <span className="eyebrow">Admin</span>
                <h2>Management console</h2>
                <p>Manage users, roles, courses, classes, banners, settings, and payments.</p>
            </div>

            <div className="row gy-4">
                <aside className="col-lg-2">
                    <div className="list-group">
                        {tabs.map(([key, label]) => (
                            <button key={key} type="button" className={`list-group-item list-group-item-action ${activeTab === key ? 'active' : ''}`} onClick={() => setActiveTab(key)}>
                                {label}
                            </button>
                        ))}
                    </div>
                </aside>

                <main className="col-lg-10">
                    {message && <div className="alert alert-success">{message}</div>}
                    {error && <div className="alert alert-danger">{error}</div>}

            {activeTab === 'users' && (
                <section className="card p-4">
                    <h4>Create staff account</h4>
                    <form className="row gy-3" onSubmit={submitUser}>
                        <div className="col-md-3"><input className="form-control" placeholder="Email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} /></div>
                        <div className="col-md-2"><input className="form-control" placeholder="Password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} /></div>
                        <div className="col-md-3"><input className="form-control" placeholder="Full name" value={userForm.fullName} onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })} /></div>
                        <div className="col-md-2"><select className="form-select" value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>{roleOptions.map((role) => <option key={role.code} value={role.code}>{role.name}</option>)}</select></div>
                        <div className="col-md-2"><button className="btn btn-primary w-100">Create</button></div>
                    </form>
                    <hr />
                    <h4>Search and filter users</h4>
                    <div className="row gy-3 mb-4">
                        <div className="col-md-5">
                            <input className="form-control" placeholder="Search email or name" value={userFilters.q} onChange={(e) => updateUserFilter({ q: e.target.value })} />
                        </div>
                        <div className="col-md-3">
                            <select className="form-select" value={userFilters.role} onChange={(e) => updateUserFilter({ role: e.target.value })}>
                                <option value="">All roles</option>
                                {roleOptions.map((role) => <option key={role.code} value={role.code}>{role.name}</option>)}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <select className="form-select" value={userFilters.status} onChange={(e) => updateUserFilter({ status: e.target.value })}>
                                <option value="">All statuses</option>
                                <option value="ACTIVE">ACTIVE</option>
                                <option value="INACTIVE">INACTIVE</option>
                            </select>
                        </div>
                        <div className="col-md-1">
                            <button className="btn btn-outline-secondary w-100" type="button" onClick={() => updateUserFilter({ q: '', role: '', status: '' })}>Clear</button>
                        </div>
                    </div>
                    <h4>Users</h4>
                    <div className="table-responsive">
                        <table className="table">
                            <thead><tr><th>Email</th><th>Name</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
                            <tbody>{users.map((user) => (
                                <tr key={user._id}>
                                    <td>{user.email}</td><td>{user.fullName}</td>
                                    <td>
                                        <select className="form-select form-select-sm" value={getUserRoleCode(user)} onChange={(e) => handleUpdateUserRole(user, e.target.value)}>
                                            {roleOptions.map((role) => <option key={role.code} value={role.code}>{role.code}</option>)}
                                        </select>
                                    </td>
                                    <td>{user.status}</td>
                                    <td className="d-flex gap-2">
                                        <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => runConfirmedAction(
                                            `Change status for ${user.email}?`,
                                            () => updateAdminUserStatus(user._id, user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'),
                                            'User status updated',
                                            'Cannot update user status'
                                        )}>Toggle</button>
                                        <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => runConfirmedAction(
                                            `Reset password for ${user.email} to 123456?`,
                                            () => resetAdminUserPassword(user._id, '123456'),
                                            'Password reset to 123456',
                                            'Cannot reset password'
                                        )}>Reset</button>
                                    </td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                    <PaginationControls pagination={userPagination} onPageChange={changeUserPage} onLimitChange={changeUserLimit} itemLabel="users" pageSizeOptions={[10, 20, 50]} />
                </section>
            )}

            {activeTab === 'roles' && (
                <section className="card p-4">
                    <h4>Create role</h4>
                    <form className="row gy-3" onSubmit={submitRole}>
                        <div className="col-md-3"><input className="form-control" placeholder="Code" value={roleForm.code} onChange={(e) => setRoleForm({ ...roleForm, code: e.target.value })} /></div>
                        <div className="col-md-3"><input className="form-control" placeholder="Name" value={roleForm.name} onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })} /></div>
                        <div className="col-md-4"><select multiple className="form-select" value={roleForm.permissions} onChange={(e) => setRoleForm({ ...roleForm, permissions: Array.from(e.target.selectedOptions).map((item) => item.value) })}>{permissions.map((permission) => <option key={permission.code} value={permission.code}>{permission.code}</option>)}</select></div>
                        <div className="col-md-2"><button className="btn btn-primary w-100">Create</button></div>
                    </form>
                    <hr />
                    {pagedRoles.items.map((role) => <div className="border-bottom py-2" key={role._id}><strong>{role.code}</strong> - {role.name}<div>{role.permissions?.map((p) => p.code).join(', ')}</div></div>)}
                    {roles.length > 0 && <PaginationControls pagination={pagedRoles.pagination} onPageChange={(page) => setListPage('roles', page)} itemLabel="roles" />}
                </section>
            )}

            {activeTab === 'courses' && (
                <section className="card p-4">
                    <h4>Create category</h4>
                    <form className="row gy-3 mb-4" onSubmit={submitCategory}>
                        <div className="col-md-4"><input className="form-control" placeholder="Category name" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} /></div>
                        <div className="col-md-6"><input className="form-control" placeholder="Description" value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} /></div>
                        <div className="col-md-2"><button className="btn btn-primary w-100">Create</button></div>
                    </form>
                    <h4>Create course</h4>
                    <form className="row gy-3" onSubmit={submitCourse}>
                        <div className="col-md-3"><input className="form-control" placeholder="Title" value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} /></div>
                        <div className="col-md-3"><input className="form-control" placeholder="Description" value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} /></div>
                        <div className="col-md-2"><input className="form-control" placeholder="Price" value={courseForm.price} onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })} /></div>
                        <div className="col-md-2"><select className="form-select" value={courseForm.category} onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}><option value="">Category</option>{categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}</select></div>
                        <div className="col-md-2"><input className="form-control" placeholder="Image URL" value={courseImageUrl} onChange={(e) => setCourseImageUrl(e.target.value)} /></div>
                        <div className="col-md-2"><input className="form-control" type="file" accept="image/*" onChange={(e) => setCourseImageFile(e.target.files?.[0] || null)} /></div>
                        <div className="col-md-2"><button className="btn btn-primary w-100">{editingCourseId ? 'Update' : 'Create'}</button></div>
                        {editingCourseId && <div className="col-md-2"><button className="btn btn-outline-secondary w-100" type="button" onClick={() => { setEditingCourseId(''); setCourseForm(emptyCourse); setCourseImageUrl(''); setCourseImageFile(null); }}>Cancel</button></div>}
                    </form>
                    <hr />
                    {pagedCourses.items.map((course) => <div className="border-bottom py-2 d-flex justify-content-between align-items-center gap-3" key={course._id}><span className="d-flex align-items-center gap-3"><CourseImage course={course} className="admin-course-image" /><span><strong>{course.title}</strong> - {course.price?.toLocaleString('vi-VN')}d {course.imageUrl ? '- image set' : ''}</span></span><span className="d-flex gap-2"><button className="btn btn-sm btn-outline-primary" type="button" onClick={() => startEditCourse(course)}>Edit</button><button className="btn btn-sm btn-outline-danger" type="button" onClick={() => runConfirmedAction(
                        `Delete course "${course.title}"?`,
                        () => deleteCourse(course._id),
                        'Course deleted',
                        'Cannot delete course'
                    )}>Delete</button></span></div>)}
                    {courses.length > 0 && <PaginationControls pagination={pagedCourses.pagination} onPageChange={(page) => setListPage('courses', page)} itemLabel="courses" />}
                </section>
            )}

            {activeTab === 'classes' && (
                <section className="card p-4">
                    <h4>Create class</h4>
                    <form className="row gy-3" onSubmit={submitClass}>
                        <div className="col-md-2"><input className="form-control" placeholder="Code" value={classForm.code} onChange={(e) => setClassForm({ ...classForm, code: e.target.value })} /></div>
                        <div className="col-md-3"><select className="form-select" value={classForm.course} onChange={(e) => setClassForm({ ...classForm, course: e.target.value })}><option value="">Course</option>{courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}</select></div>
                        <div className="col-md-3"><select className="form-select" value={classForm.teacher} onChange={(e) => setClassForm({ ...classForm, teacher: e.target.value })}><option value="">Teacher</option>{teachers.map((teacher) => <option key={teacher._id} value={teacher._id}>{teacher.fullName || teacher.email}</option>)}</select></div>
                        <div className="col-md-2"><input type="date" className="form-control" value={classForm.startDate} onChange={(e) => setClassForm({ ...classForm, startDate: e.target.value })} /></div>
                        <div className="col-md-2"><input type="date" className="form-control" value={classForm.endDate} onChange={(e) => setClassForm({ ...classForm, endDate: e.target.value })} /></div>
                        <div className="col-md-2"><input className="form-control" placeholder="Max" value={classForm.maxStudents} onChange={(e) => setClassForm({ ...classForm, maxStudents: e.target.value })} /></div>
                        <div className="col-md-2">
                            <select className="form-select" value={classForm.status} onChange={(e) => setClassForm({ ...classForm, status: e.target.value })}>
                                {['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'].map((status) => <option key={status} value={status}>{status}</option>)}
                            </select>
                        </div>
                        <div className="col-md-2"><button className="btn btn-primary w-100">{editingClassId ? 'Update' : 'Create'}</button></div>
                        {editingClassId && <div className="col-md-2"><button className="btn btn-outline-secondary w-100" type="button" onClick={() => { setEditingClassId(''); setClassForm(emptyClass); }}>Cancel</button></div>}
                    </form>
                    <hr />
                    {pagedClasses.items.map((item) => <div className="border-bottom py-2 d-flex justify-content-between gap-3" key={item._id}><span><strong>{item.code}</strong> - {item.course?.title} - {item.currentStudents || 0}/{item.maxStudents}</span><span className="d-flex gap-2"><button className="btn btn-sm btn-outline-primary" type="button" onClick={() => startEditClass(item)}>Edit</button><button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => setSelectedClassId(item._id)}>Students</button><button className="btn btn-sm btn-outline-danger" type="button" onClick={() => runConfirmedAction(
                        `Delete class "${item.code}"?`,
                        () => deleteClass(item._id),
                        'Class deleted',
                        'Cannot delete class'
                    )}>Delete</button></span></div>)}
                    {classes.length > 0 && <PaginationControls pagination={pagedClasses.pagination} onPageChange={(page) => setListPage('classes', page)} itemLabel="classes" />}
                    {selectedClassId && (
                        <div className="mt-4">
                            <h5>Class students</h5>
                            {selectedClassStudents.length === 0 ? <p className="text-muted">No student is assigned to this class.</p> : (
                                <div className="table-responsive">
                                    <table className="table">
                                        <thead><tr><th>Student</th><th>Email</th><th>Course</th><th>Status</th><th>Progress</th></tr></thead>
                                        <tbody>{pagedClassStudents.items.map((enrollment) => (
                                            <tr key={enrollment._id}>
                                                <td>{enrollment.user?.fullName || '-'}</td>
                                                <td>{enrollment.user?.email || '-'}</td>
                                                <td>{enrollment.course?.title || '-'}</td>
                                                <td>{enrollment.status}</td>
                                                <td>{enrollment.progress || 0}%</td>
                                            </tr>
                                        ))}</tbody>
                                    </table>
                                </div>
                            )}
                            {selectedClassStudents.length > 0 && <PaginationControls pagination={pagedClassStudents.pagination} onPageChange={(page) => setListPage('classStudents', page)} itemLabel="students" />}
                        </div>
                    )}
                </section>
            )}

            {activeTab === 'banners' && (
                <section className="card p-4">
                    <h4>Create banner</h4>
                    <form className="row gy-3" onSubmit={submitBanner}>
                        <div className="col-md-3"><input className="form-control" placeholder="Title" value={bannerForm.title} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })} /></div>
                        <div className="col-md-3"><input className="form-control" placeholder="Image URL" value={bannerForm.imageUrl} onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })} /></div>
                        <div className="col-md-2"><input className="form-control" placeholder="Link" value={bannerForm.linkUrl} onChange={(e) => setBannerForm({ ...bannerForm, linkUrl: e.target.value })} /></div>
                        <div className="col-md-2"><input className="form-control" placeholder="Position" value={bannerForm.position} onChange={(e) => setBannerForm({ ...bannerForm, position: e.target.value })} /></div>
                        <div className="col-md-2"><button className="btn btn-primary w-100">Create</button></div>
                    </form>
                    <hr />
                    {pagedBanners.items.map((banner) => <div className="border-bottom py-2 d-flex justify-content-between" key={banner._id}><span><strong>{banner.title}</strong> - {banner.active ? 'Active' : 'Inactive'}</span><button className="btn btn-sm btn-outline-danger" type="button" onClick={() => runConfirmedAction(
                        `Delete banner "${banner.title}"?`,
                        () => removeBanner(banner._id),
                        'Banner deleted',
                        'Cannot delete banner'
                    )}>Delete</button></div>)}
                    {banners.length > 0 && <PaginationControls pagination={pagedBanners.pagination} onPageChange={(page) => setListPage('banners', page)} itemLabel="banners" />}
                </section>
            )}

            {activeTab === 'settings' && (
                <section className="card p-4">
                    <h4>Save setting</h4>
                    <form className="row gy-3" onSubmit={submitSetting}>
                        <div className="col-md-3"><input className="form-control" placeholder="Key" value={settingForm.key} onChange={(e) => setSettingForm({ ...settingForm, key: e.target.value })} /></div>
                        <div className="col-md-4"><input className="form-control" placeholder="Value" value={settingForm.value} onChange={(e) => setSettingForm({ ...settingForm, value: e.target.value })} /></div>
                        <div className="col-md-3"><input className="form-control" placeholder="Description" value={settingForm.description} onChange={(e) => setSettingForm({ ...settingForm, description: e.target.value })} /></div>
                        <div className="col-md-2"><button className="btn btn-primary w-100">Save</button></div>
                    </form>
                    <hr />
                    {pagedSettings.items.map((setting) => <div className="border-bottom py-2 d-flex justify-content-between" key={setting._id}><span><strong>{setting.key}</strong>: {String(setting.value)}</span><button className="btn btn-sm btn-outline-danger" type="button" onClick={() => runConfirmedAction(
                        `Delete setting "${setting.key}"?`,
                        () => removeSetting(setting.key),
                        'Setting deleted',
                        'Cannot delete setting'
                    )}>Delete</button></div>)}
                    {settings.length > 0 && <PaginationControls pagination={pagedSettings.pagination} onPageChange={(page) => setListPage('settings', page)} itemLabel="settings" />}
                </section>
            )}

            {activeTab === 'notifications' && (
                <section className="card p-4">
                    <h4>Broadcast notification</h4>
                    <form className="row gy-3" onSubmit={submitNotification}>
                        <div className="col-md-3"><input className="form-control" placeholder="Title" value={notificationForm.title} onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })} required /></div>
                        <div className="col-md-4"><input className="form-control" placeholder="Message" value={notificationForm.message} onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })} /></div>
                        <div className="col-md-2">
                            <select className="form-select" value={notificationForm.role} onChange={(e) => setNotificationForm({ ...notificationForm, role: e.target.value })}>
                                <option value="">All roles</option>
                                {roleOptions.map((role) => <option key={role.code} value={role.code}>{role.name}</option>)}
                            </select>
                        </div>
                        <div className="col-md-2">
                            <select className="form-select" value={notificationForm.status} onChange={(e) => setNotificationForm({ ...notificationForm, status: e.target.value })}>
                                <option value="">All statuses</option>
                                <option value="ACTIVE">ACTIVE</option>
                                <option value="INACTIVE">INACTIVE</option>
                            </select>
                        </div>
                        <div className="col-md-1"><button className="btn btn-primary w-100">Send</button></div>
                    </form>
                    <hr />
                    <h4>Recent notifications</h4>
                    <div className="table-responsive">
                        <table className="table">
                            <thead><tr><th>User</th><th>Title</th><th>Message</th><th>Read</th><th>Created</th></tr></thead>
                            <tbody>{pagedNotifications.items.map((notification) => (
                                <tr key={notification._id}>
                                    <td>{notification.user?.fullName || notification.user?.email || '-'}</td>
                                    <td>{notification.title}</td>
                                    <td>{notification.message}</td>
                                    <td>{notification.read ? 'Yes' : 'No'}</td>
                                    <td>{notification.createdAt ? new Date(notification.createdAt).toLocaleString() : '-'}</td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                    {notifications.length > 0 && <PaginationControls pagination={pagedNotifications.pagination} onPageChange={(page) => setListPage('notifications', page)} itemLabel="notifications" />}
                </section>
            )}

            {activeTab === 'payments' && (
                <section className="card p-4">
                    <h4>Payments and orders</h4>
                    <div className="table-responsive">
                        <table className="table">
                            <thead><tr><th>Course</th><th>Amount</th><th>Status</th><th>Method</th><th>Created</th></tr></thead>
                            <tbody>{pagedOrders.items.map((order) => (
                                <tr key={order._id}>
                                    <td>{order.course?.title}</td>
                                    <td>{order.amount?.toLocaleString('vi-VN')}d</td>
                                    <td>{order.status}</td>
                                    <td>{order.paymentMethod}</td>
                                    <td>{order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}</td>
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
