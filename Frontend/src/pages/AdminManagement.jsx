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
import { getEnrollmentStatusLabel } from '../utils/enrollmentStatus';
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

const renderTabIcon = (key) => {
    const classNames = "w-4 h-4 text-current shrink-0";
    switch (key) {
        case 'users':
            return (
                <svg className={classNames} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            );
        case 'roles':
            return (
                <svg className={classNames} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            );
        case 'courses':
            return (
                <svg className={classNames} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            );
        case 'classes':
            return (
                <svg className={classNames} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            );
        case 'banners':
            return (
                <svg className={classNames} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            );
        case 'settings':
            return (
                <svg className={classNames} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            );
        case 'coupons':
            return (
                <svg className={classNames} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2zM9 16l6-6" />
                </svg>
            );
        case 'notifications':
            return (
                <svg className={classNames} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            );
        case 'payments':
            return (
                <svg className={classNames} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3-3v8a3 3 0 003 3z" />
                </svg>
            );
        default:
            return null;
    }
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
        setClassAppliedFilters(emptyFilters); // wait, let's keep the exact state variables
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
        <div className="container mx-auto px-4 py-6 max-w-7xl">
            {/* Header Block */}
            <div className="mb-6 pb-6 border-b border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Admin Console</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Manage user accounts, security roles, courses, classes, banners, settings, and payments.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Horizontal Navigation List */}
                <div className="col-span-12">
                    <div className="flex flex-wrap gap-1 border-b border-slate-200">
                        {tabs.map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-150 -mb-[1px] cursor-pointer ${
                                    activeTab === key
                                        ? 'border-blue-600 text-blue-600 font-semibold'
                                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                                }`}
                                onClick={() => setActiveTab(key)}
                            >
                                {renderTabIcon(key)}
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab content panel */}
                <main className="col-span-12">
                    {message && (
                        <div className="flex items-center gap-2.5 p-3.5 mb-6 text-sm bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg animate-fadeIn">
                            <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{message}</span>
                        </div>
                    )}
                    {error && (
                        <div className="flex items-center gap-2.5 p-3.5 mb-6 text-sm bg-rose-50 border border-rose-200 text-rose-800 rounded-lg animate-fadeIn">
                            <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* TAB: Users */}
                    {activeTab === 'users' && (
                        <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 animate-fadeIn">
                            <div className="bg-slate-50/50 border border-slate-200 rounded-lg p-5 mb-6">
                                <h3 className="text-sm font-semibold text-slate-900 mb-4">
                                    Create Staff Account
                                </h3>
                                <form className="grid grid-cols-1 md:grid-cols-12 gap-4" onSubmit={submitUser}>
                                    <div className="col-span-1 md:col-span-4">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                                        <input className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="staff@example.com" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} required />
                                    </div>
                                    <div className="col-span-1 md:col-span-3">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
                                        <input className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="Password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required />
                                    </div>
                                    <div className="col-span-1 md:col-span-3">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                                        <input className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="Full Name" value={userForm.fullName} onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })} required />
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Role</label>
                                        <select className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition cursor-pointer" value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                                            {roleOptions.map((role) => <option key={role.code} value={role.code}>{role.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-1 md:col-span-12 flex justify-end mt-2">
                                        <button className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition shadow-sm cursor-pointer">
                                            Create Account
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
                                <div className="flex-grow flex flex-col md:flex-row items-stretch md:items-center gap-3">
                                    <div className="relative flex-grow max-w-md">
                                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </span>
                                        <input className="w-full bg-white border border-slate-200 rounded-md pl-9 pr-3.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="Search by email or name..." value={userFilters.q} onChange={(e) => updateUserFilter({ q: e.target.value })} />
                                    </div>
                                    <div className="w-full md:w-44">
                                        <select className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition cursor-pointer" value={userFilters.role} onChange={(e) => updateUserFilter({ role: e.target.value })}>
                                            <option value="">All Roles</option>
                                            {roleOptions.map((role) => <option key={role.code} value={role.code}>{role.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="w-full md:w-44">
                                        <select className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition cursor-pointer" value={userFilters.status} onChange={(e) => updateUserFilter({ status: e.target.value })}>
                                            <option value="">All Statuses</option>
                                            <option value="ACTIVE">ACTIVE</option>
                                            <option value="INACTIVE">INACTIVE</option>
                                        </select>
                                    </div>
                                    {(userFilters.q || userFilters.role || userFilters.status) && (
                                        <button className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-slate-200 text-slate-600 rounded-md hover:bg-slate-50 transition cursor-pointer" type="button" onClick={() => updateUserFilter({ q: '', role: '', status: '' })}>
                                            Clear Filters
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="overflow-hidden border border-slate-200 rounded-lg mb-4 bg-white">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-left text-sm text-slate-600">
                                        <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            <tr>
                                                <th className="px-5 py-3">Account</th>
                                                <th className="px-5 py-3">Full Name</th>
                                                <th className="px-5 py-3">Role</th>
                                                <th className="px-5 py-3">Status</th>
                                                <th className="px-5 py-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 text-slate-700">
                                            {users.map((user) => {
                                                const role = getUserRoleCode(user);
                                                const isStaff = ['ADMIN', 'MANAGER', 'TEACHER'].includes(role);
                                                return (
                                                    <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-5 py-3.5">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${isStaff ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                                                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div className="font-medium text-slate-900">{user.email}</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-3.5 text-slate-600">{user.fullName || '-'}</td>
                                                        <td className="px-5 py-3.5">
                                                            <select className="bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition cursor-pointer" style={{ width: '130px' }} value={role} onChange={(e) => handleUpdateUserRole(user, e.target.value)}>
                                                                {roleOptions.map((r) => <option key={r.code} value={r.code}>{r.code}</option>)}
                                                            </select>
                                                        </td>
                                                        <td className="px-5 py-3.5">
                                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                                                {user.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3.5 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button className="inline-flex items-center justify-center px-2.5 py-1 text-xs text-slate-700 border border-slate-200 rounded hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer" type="button" onClick={() => runConfirmedAction(
                                                                    `Change status for ${user.email}?`,
                                                                    () => updateAdminUserStatus(user._id, user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'),
                                                                    'Status updated successfully',
                                                                    'Failed to update status'
                                                                )}>
                                                                    Toggle
                                                                </button>
                                                                <button className="inline-flex items-center justify-center px-2.5 py-1 text-xs text-slate-700 border border-slate-200 rounded hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer" type="button" onClick={() => runConfirmedAction(
                                                                    `Reset password for ${user.email} to 123456?`,
                                                                    () => resetAdminUserPassword(user._id, '123456'),
                                                                    'Password reset successfully (123456)',
                                                                    'Failed to reset password'
                                                                )}>
                                                                    Reset
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <PaginationControls pagination={userPagination} onPageChange={changeUserPage} onLimitChange={changeUserLimit} itemLabel="users" pageSizeOptions={[10, 20, 50]} />
                        </section>
                    )}

                    {/* TAB: Roles */}
                    {activeTab === 'roles' && (
                        <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 animate-fadeIn">
                            <div className="bg-slate-50/50 border border-slate-200 rounded-lg p-5 mb-6">
                                <h3 className="text-sm font-semibold text-slate-900 mb-4">
                                    Create Security Role
                                </h3>
                                <form className="grid grid-cols-1 md:grid-cols-12 gap-4" onSubmit={submitRole}>
                                    <div className="col-span-1 md:col-span-3">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Role Code</label>
                                        <input className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="e.g. VISITOR" value={roleForm.code} onChange={(e) => setRoleForm({ ...roleForm, code: e.target.value })} required />
                                    </div>
                                    <div className="col-span-1 md:col-span-3">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Display Name</label>
                                        <input className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="e.g. Guest User" value={roleForm.name} onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })} required />
                                    </div>
                                    <div className="col-span-1 md:col-span-4">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Select Permissions</label>
                                        <select multiple className="w-full bg-white border border-slate-200 rounded-md px-3 py-1 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition cursor-pointer" style={{ height: '38px' }} value={roleForm.permissions} onChange={(e) => setRoleForm({ ...roleForm, permissions: Array.from(e.target.selectedOptions).map((item) => item.value) })}>
                                            {permissions.map((permission) => <option key={permission.code} value={permission.code}>{permission.code}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-1 md:col-span-2 flex items-end">
                                        <button className="w-full py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition shadow-sm cursor-pointer">
                                            Create Role
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <h4 className="text-sm font-semibold text-slate-900 mb-4">Roles List</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                {pagedRoles.items.map((role) => (
                                    <div className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm" key={role._id}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-xs font-semibold border border-slate-200">
                                                {role.code}
                                            </div>
                                            <span className="text-slate-500 text-xs">({role.name})</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {role.permissions?.length > 0 ? (
                                                role.permissions.map((p) => {
                                                    const permCode = typeof p === 'string' ? p : p.code;
                                                    return (
                                                        <span key={permCode} className="inline-flex px-1.5 py-0.5 rounded bg-slate-50 text-slate-600 text-xs font-normal border border-slate-200">
                                                            {permCode}
                                                        </span>
                                                    );
                                                })
                                            ) : (
                                                <span className="text-slate-400 text-xs italic">No permissions assigned.</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {roles.length > 0 && <PaginationControls pagination={pagedRoles.pagination} onPageChange={(page) => setListPage('roles', page)} itemLabel="roles" />}
                        </section>
                    )}

                    {/* TAB: Courses */}
                    {activeTab === 'courses' && (
                        <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 animate-fadeIn">
                            <div className="bg-slate-50/50 border border-slate-200 rounded-lg p-5 mb-6">
                                <h3 className="text-sm font-semibold text-slate-900 mb-4">
                                    Create Course Category
                                </h3>
                                <form className="grid grid-cols-1 md:grid-cols-12 gap-4" onSubmit={submitCategory}>
                                    <div className="col-span-1 md:col-span-4">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Category Name</label>
                                        <input className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="e.g. Mobile Development" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} required />
                                    </div>
                                    <div className="col-span-1 md:col-span-6">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Category Description</label>
                                        <input className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="Brief category description..." value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} required />
                                    </div>
                                    <div className="col-span-1 md:col-span-2 flex items-end">
                                        <button className="w-full py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition shadow-sm cursor-pointer">
                                            Create Category
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <div className="bg-slate-50/50 border border-slate-200 rounded-lg p-5 mb-6">
                                <h3 className="text-sm font-semibold text-slate-900 mb-4">
                                    {editingCourseId ? 'Update Course' : 'Create Course'}
                                </h3>
                                <form className="grid grid-cols-1 md:grid-cols-12 gap-4" onSubmit={submitCourse}>
                                    <div className="col-span-1 md:col-span-3">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Course Title</label>
                                        <input className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="Course title..." value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} required />
                                    </div>
                                    <div className="col-span-1 md:col-span-5">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Short Description</label>
                                        <input className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="Brief summary of course content..." value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} required />
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Price (VND)</label>
                                        <input className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="Price" value={courseForm.price} onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })} required />
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                                        <select className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition cursor-pointer" value={courseForm.category} onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })} required>
                                            <option value="">Select Category</option>
                                            {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-1 md:col-span-4">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Image URL</label>
                                        <input className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="Image URL address..." value={courseImageUrl} onChange={(e) => setCourseImageUrl(e.target.value)} />
                                    </div>
                                    <div className="col-span-1 md:col-span-4">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Upload Local Image</label>
                                        <input className="w-full bg-white border border-slate-200 rounded-md px-3 py-1 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" type="file" accept="image/*" onChange={(e) => setCourseImageFile(e.target.files?.[0] || null)} />
                                    </div>
                                    <div className="col-span-1 md:col-span-4 flex items-end gap-2">
                                        <button className="flex-grow py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition shadow-sm cursor-pointer">{editingCourseId ? 'Update' : 'Create'}</button>
                                        {editingCourseId && (
                                            <button className="px-4 py-2 text-sm font-medium border border-slate-200 text-slate-600 rounded-md hover:bg-slate-50 transition cursor-pointer" type="button" onClick={() => { setEditingCourseId(''); setCourseForm(emptyCourse); setCourseImageUrl(''); setCourseImageFile(null); }}>
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
                                <div className="flex-grow flex flex-col md:flex-row items-stretch md:items-center gap-3">
                                    <div className="relative flex-grow max-w-sm">
                                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </span>
                                        <input className="w-full bg-white border border-slate-200 rounded-md pl-9 pr-3.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="Search by title/description..." value={courseFilters.q} onChange={(e) => updateCourseFilter({ q: e.target.value })} />
                                    </div>
                                    <div className="w-full md:w-36">
                                        <select className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition cursor-pointer" value={courseFilters.category} onChange={(e) => updateCourseFilter({ category: e.target.value })}>
                                            <option value="">All Categories</option>
                                            {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="w-full md:w-32">
                                        <input type="text" className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="Min price" value={courseFilters.minPrice ? Number(courseFilters.minPrice).toLocaleString('vi-VN') : ''} onChange={(e) => updateCourseFilter({ minPrice: e.target.value.replace(/\D/g, '') })} />
                                    </div>
                                    <div className="w-full md:w-32">
                                        <input type="text" className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="Max price" value={courseFilters.maxPrice ? Number(courseFilters.maxPrice).toLocaleString('vi-VN') : ''} onChange={(e) => updateCourseFilter({ maxPrice: e.target.value.replace(/\D/g, '') })} />
                                    </div>
                                    <div className="w-full md:w-44">
                                        <select className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition cursor-pointer" value={courseFilters.sort} onChange={(e) => updateCourseFilter({ sort: e.target.value })}>
                                            <option value="">Sort by...</option>
                                            <option value="priceAsc">Price: Low to High</option>
                                            <option value="priceDesc">Price: High to Low</option>
                                            <option value="newest">Newest</option>
                                            <option value="titleAsc">Title A-Z</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="px-4 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition shadow-sm cursor-pointer" type="button" onClick={applyCourseFilters}>Apply</button>
                                        <button className="px-4 py-1.5 text-sm font-medium border border-slate-200 text-slate-600 rounded-md hover:bg-slate-50 transition cursor-pointer" type="button" onClick={clearCourseFilters}>Clear</button>
                                    </div>
                                </div>
                            </div>

                            <h4 className="text-sm font-semibold text-slate-900 mb-4">Courses List</h4>
                            <div className="grid grid-cols-1 gap-3 mb-4">
                                {pagedCourses.items.map((course) => (
                                    <div className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4" key={course._id}>
                                        <div className="flex items-center gap-3">
                                            <CourseImage course={course} className="admin-course-image rounded-md border border-slate-100" style={{ width: '80px', height: '56px', objectFit: 'cover' }} />
                                            <div>
                                                <strong className="text-slate-900 text-sm font-semibold block">{course.title}</strong>
                                                <span className="text-slate-500 text-xs mt-0.5 block">{course.price?.toLocaleString('vi-VN')} VND {course.imageUrl ? '• Image set' : ''}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="inline-flex items-center justify-center px-2.5 py-1 text-xs text-slate-700 border border-slate-200 rounded hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer" type="button" onClick={() => startEditCourse(course)}>Edit</button>
                                            <button className="inline-flex items-center justify-center px-2.5 py-1 text-xs text-rose-600 border border-rose-200 bg-rose-50/20 hover:bg-rose-50 rounded hover:text-rose-800 transition cursor-pointer" type="button" onClick={() => runConfirmedAction(
                                                `Delete course "${course.title}"?`,
                                                () => deleteCourse(course._id),
                                                'Course deleted successfully',
                                                'Failed to delete course'
                                            )}>Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {courses.length > 0 && <PaginationControls pagination={pagedCourses.pagination} onPageChange={(page) => setListPage('courses', page)} itemLabel="courses" />}
                        </section>
                    )}

                    {/* TAB: Classes */}
                    {activeTab === 'classes' && (
                        <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 animate-fadeIn">
                            <div className="bg-slate-50/50 border border-slate-200 rounded-lg p-5 mb-6">
                                <h3 className="text-sm font-semibold text-slate-900 mb-4">
                                    {editingClassId ? 'Update Class' : 'Create Class'}
                                </h3>
                                <form className="grid grid-cols-1 md:grid-cols-12 gap-4" onSubmit={submitClass}>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Class Code</label>
                                        <input className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="Code" value={classForm.code} onChange={(e) => setClassForm({ ...classForm, code: e.target.value })} required />
                                    </div>
                                    <div className="col-span-1 md:col-span-3">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Course</label>
                                        <select className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition cursor-pointer" value={classForm.course} onChange={(e) => setClassForm({ ...classForm, course: e.target.value })} required>
                                            <option value="">Select Course</option>
                                            {courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-1 md:col-span-3">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Teacher</label>
                                        <select className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition cursor-pointer" value={classForm.teacher} onChange={(e) => setClassForm({ ...classForm, teacher: e.target.value })} required>
                                            <option value="">Select Teacher</option>
                                            {teachers.map((teacher) => <option key={teacher._id} value={teacher._id}>{teacher.fullName || teacher.email}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Start Date</label>
                                        <input type="date" className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" value={classForm.startDate} onChange={(e) => setClassForm({ ...classForm, startDate: e.target.value })} required />
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">End Date</label>
                                        <input type="date" className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" value={classForm.endDate} onChange={(e) => setClassForm({ ...classForm, endDate: e.target.value })} required />
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Max Students</label>
                                        <input className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="Max" value={classForm.maxStudents} onChange={(e) => setClassForm({ ...classForm, maxStudents: e.target.value })} required />
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                                        <select className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition cursor-pointer" value={classForm.status} onChange={(e) => setClassForm({ ...classForm, status: e.target.value })}>
                                            {['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'].map((status) => <option key={status} value={status}>{status}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-1 md:col-span-3 flex items-end gap-2">
                                        <button className="flex-grow py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition shadow-sm cursor-pointer">{editingClassId ? 'Update' : 'Create'}</button>
                                        {editingClassId && (
                                            <button className="px-4 py-2 text-sm font-medium border border-slate-200 text-slate-600 rounded-md hover:bg-slate-50 transition cursor-pointer" type="button" onClick={() => { setEditingClassId(''); setClassForm(emptyClass); }}>
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
                                <div className="flex-grow flex flex-col md:flex-row items-stretch md:items-center gap-3">
                                    <div className="relative flex-grow max-w-sm">
                                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </span>
                                        <input className="w-full bg-white border border-slate-200 rounded-md pl-9 pr-3.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="Search class code..." value={classFilters.code} onChange={(e) => updateClassFilter({ code: e.target.value })} />
                                    </div>
                                    <div className="w-full md:w-52">
                                        <select className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition cursor-pointer" value={classFilters.course} onChange={(e) => updateClassFilter({ course: e.target.value })}>
                                            <option value="">All Courses</option>
                                            {courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}
                                        </select>
                                    </div>
                                    <div className="w-full md:w-52">
                                        <select className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition cursor-pointer" value={classFilters.teacher} onChange={(e) => updateClassFilter({ teacher: e.target.value })}>
                                            <option value="">All Teachers</option>
                                            {teachers.map((teacher) => <option key={teacher._id} value={teacher._id}>{teacher.fullName || teacher.email}</option>)}
                                        </select>
                                    </div>
                                    <div className="w-full md:w-40">
                                        <select className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition cursor-pointer" value={classFilters.status} onChange={(e) => updateClassFilter({ status: e.target.value })}>
                                            <option value="">All Statuses</option>
                                            <option value="OPEN">OPEN</option>
                                            <option value="IN_PROGRESS">IN_PROGRESS</option>
                                            <option value="COMPLETED">COMPLETED</option>
                                            <option value="CLOSED">CLOSED</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="px-4 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition shadow-sm cursor-pointer" type="button" onClick={applyClassFilters}>Apply</button>
                                        <button className="px-4 py-1.5 text-sm font-medium border border-slate-200 text-slate-600 rounded-md hover:bg-slate-50 transition cursor-pointer" type="button" onClick={clearClassFilters}>Clear</button>
                                    </div>
                                </div>
                            </div>

                            <h4 className="text-sm font-semibold text-slate-900 mb-4">Classes List</h4>
                            <div className="grid grid-cols-1 gap-3 mb-4">
                                {pagedClasses.items.map((item) => (
                                    <div className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4" key={item._id}>
                                        <div>
                                            <strong className="inline-flex px-2 py-0.5 rounded border border-slate-200 bg-slate-50 font-mono text-xs text-slate-700">{item.code}</strong>
                                            <div className="text-slate-900 font-semibold text-sm mt-1.5">{item.course?.title}</div>
                                            <span className="text-slate-500 text-xs mt-1 block">Students: {item.currentStudents || 0}/{item.maxStudents}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="inline-flex items-center justify-center px-2.5 py-1 text-xs text-slate-700 border border-slate-200 rounded hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer" type="button" onClick={() => startEditClass(item)}>Edit</button>
                                            <button className="inline-flex items-center justify-center px-2.5 py-1 text-xs text-slate-700 border border-slate-200 rounded hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer" type="button" onClick={() => setSelectedClassId(item._id)}>Students</button>
                                            <button className="inline-flex items-center justify-center px-2.5 py-1 text-xs text-rose-600 border border-rose-200 bg-rose-50/20 hover:bg-rose-50 rounded hover:text-rose-800 transition cursor-pointer" type="button" onClick={() => runConfirmedAction(
                                                `Delete class "${item.code}"?`,
                                                () => deleteClass(item._id),
                                                'Class deleted successfully',
                                                'Failed to delete class'
                                            )}>Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {classes.length > 0 && <PaginationControls pagination={pagedClasses.pagination} onPageChange={(page) => setListPage('classes', page)} itemLabel="classes" />}

                            {selectedClassId && (
                                <div className="mt-6 p-5 bg-slate-50/50 border border-slate-200 rounded-lg">
                                    <h5 className="text-sm font-semibold text-slate-900 mb-3">Class Students</h5>
                                    {selectedClassStudents.length === 0 ? (
                                        <p className="text-slate-400 text-xs italic mb-0">No students are currently assigned to this class.</p>
                                    ) : (
                                        <>
                                            <div className="overflow-hidden border border-slate-200 rounded-lg mb-3 bg-white">
                                                <table className="w-full border-collapse text-left text-xs text-slate-600">
                                                    <thead className="bg-slate-50 border-b border-slate-200 font-semibold uppercase text-slate-500">
                                                        <tr>
                                                            <th className="px-4 py-2.5">Student</th>
                                                            <th className="px-4 py-2.5">Email</th>
                                                            <th className="px-4 py-2.5">Course</th>
                                                            <th className="px-4 py-2.5">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                                        {pagedClassStudents.items.map((enrollment) => (
                                                            <tr key={enrollment._id} className="hover:bg-slate-50/20">
                                                                <td className="px-4 py-2.5 font-medium text-slate-900">{enrollment.user?.fullName || '-'}</td>
                                                                <td className="px-4 py-2.5">{enrollment.user?.email || '-'}</td>
                                                                <td className="px-4 py-2.5">{enrollment.course?.title || '-'}</td>
                                                                <td className="px-4 py-2.5">
                                                                    <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold border bg-slate-50 text-slate-600 border-slate-200">
                                                                        {getEnrollmentStatusLabel(enrollment.status)}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
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
                        <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 animate-fadeIn">
                            <div className="bg-slate-50/50 border border-slate-200 rounded-lg p-5 mb-6">
                                <h3 className="text-sm font-semibold text-slate-900 mb-4">Create Banner</h3>
                                <form className="grid grid-cols-1 md:grid-cols-12 gap-4" onSubmit={submitBanner}>
                                    <div className="col-span-1 md:col-span-3">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Title</label>
                                        <input className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="Banner Title" value={bannerForm.title} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })} required />
                                    </div>
                                    <div className="col-span-1 md:col-span-3">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Image URL</label>
                                        <input className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="URL" value={bannerForm.imageUrl} onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })} required />
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Link</label>
                                        <input className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="Link URL" value={bannerForm.linkUrl} onChange={(e) => setBannerForm({ ...bannerForm, linkUrl: e.target.value })} />
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Position</label>
                                        <input className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="Position" value={bannerForm.position} onChange={(e) => setBannerForm({ ...bannerForm, position: e.target.value })} required />
                                    </div>
                                    <div className="col-span-1 md:col-span-2 flex items-end">
                                        <button className="w-full py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition shadow-sm cursor-pointer">Create</button>
                                    </div>
                                </form>
                            </div>

                            <h4 className="text-sm font-semibold text-slate-900 mb-4">Banners List</h4>
                            <div className="grid grid-cols-1 gap-3 mb-4">
                                {pagedBanners.items.map((banner) => (
                                    <div className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm flex justify-between items-center" key={banner._id}>
                                        <div className="flex items-center gap-2">
                                            <strong className="text-slate-900 text-sm font-semibold">{banner.title}</strong>
                                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold border ${banner.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                {banner.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <button className="inline-flex items-center justify-center px-2.5 py-1 text-xs text-rose-600 border border-rose-200 bg-rose-50/20 hover:bg-rose-50 rounded hover:text-rose-800 transition cursor-pointer" type="button" onClick={() => runConfirmedAction(
                                            `Delete banner "${banner.title}"?`,
                                            () => removeBanner(banner._id),
                                            'Banner deleted successfully',
                                            'Failed to delete banner'
                                        )}>Delete</button>
                                    </div>
                                ))}
                            </div>
                            {banners.length > 0 && <PaginationControls pagination={pagedBanners.pagination} onPageChange={(page) => setListPage('banners', page)} itemLabel="banners" />}
                        </section>
                    )}

                    {/* TAB: Settings */}
                    {activeTab === 'settings' && (
                        <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 animate-fadeIn">
                            <div className="bg-slate-50/50 border border-slate-200 rounded-lg p-5 mb-6">
                                <h3 className="text-sm font-semibold text-slate-900 mb-4">Save Setting</h3>
                                <form className="grid grid-cols-1 md:grid-cols-12 gap-4" onSubmit={submitSetting}>
                                    <div className="col-span-1 md:col-span-3">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Key</label>
                                        <input className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="Setting Key" value={settingForm.key} onChange={(e) => setSettingForm({ ...settingForm, key: e.target.value })} required />
                                    </div>
                                    <div className="col-span-1 md:col-span-4">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Value</label>
                                        <input className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="Setting Value" value={settingForm.value} onChange={(e) => setSettingForm({ ...settingForm, value: e.target.value })} required />
                                    </div>
                                    <div className="col-span-1 md:col-span-3">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                                        <input className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="Description details" value={settingForm.description} onChange={(e) => setSettingForm({ ...settingForm, description: e.target.value })} />
                                    </div>
                                    <div className="col-span-1 md:col-span-2 flex items-end">
                                        <button className="w-full py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition shadow-sm cursor-pointer">Save</button>
                                    </div>
                                </form>
                            </div>

                            <h4 className="text-sm font-semibold text-slate-900 mb-4">Settings List</h4>
                            <div className="grid grid-cols-1 gap-3 mb-4">
                                {pagedSettings.items.map((setting) => (
                                    <div className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm flex justify-between items-center" key={setting._id}>
                                        <div>
                                            <strong className="text-blue-600 font-mono text-xs">{setting.key}</strong>
                                            <span className="text-slate-500 text-sm ms-2">: {String(setting.value)}</span>
                                        </div>
                                        <button className="inline-flex items-center justify-center px-2.5 py-1 text-xs text-rose-600 border border-rose-200 bg-rose-50/20 hover:bg-rose-50 rounded hover:text-rose-800 transition cursor-pointer" type="button" onClick={() => runConfirmedAction(
                                            `Delete setting "${setting.key}"?`,
                                            () => removeSetting(setting.key),
                                            'Setting deleted successfully',
                                            'Failed to delete setting'
                                        )}>Delete</button>
                                    </div>
                                ))}
                            </div>
                            {settings.length > 0 && <PaginationControls pagination={pagedSettings.pagination} onPageChange={(page) => setListPage('settings', page)} itemLabel="settings" />}
                        </section>
                    )}

                    {/* TAB: Coupons */}
                    {activeTab === 'coupons' && (
                        <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 animate-fadeIn">
                            <div className="bg-slate-50/50 border border-slate-200 rounded-lg p-5 mb-6">
                                <h3 className="text-sm font-semibold text-slate-900 mb-4">Create Coupon</h3>
                                <form className="grid grid-cols-1 md:grid-cols-12 gap-4" onSubmit={submitCoupon}>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Code</label>
                                        <input className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="Code" value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })} required />
                                    </div>
                                    <div className="col-span-1 md:col-span-3">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Name</label>
                                        <input className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="Name" value={couponForm.name} onChange={(e) => setCouponForm({ ...couponForm, name: e.target.value })} required />
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Discount Type</label>
                                        <select className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition cursor-pointer" value={couponForm.discountType} onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value, maxDiscountAmount: e.target.value === 'FIXED' ? '' : couponForm.maxDiscountAmount })}>
                                            <option value="PERCENT">Percent</option>
                                            <option value="FIXED">Fixed Amount</option>
                                        </select>
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Value</label>
                                        <input className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" type="number" min="0" placeholder="Discount" value={couponForm.discountValue} onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })} required />
                                    </div>
                                    {couponForm.discountType === 'PERCENT' && (
                                        <div className="col-span-1 md:col-span-3">
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Max Discount (VND)</label>
                                            <input className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" type="number" min="0" placeholder="Max cap" value={couponForm.maxDiscountAmount} onChange={(e) => setCouponForm({ ...couponForm, maxDiscountAmount: e.target.value })} />
                                        </div>
                                    )}
                                    <div className="col-span-1 md:col-span-3">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Min Order (VND)</label>
                                        <input className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" type="number" min="0" placeholder="Min order" value={couponForm.minOrderAmount} onChange={(e) => setCouponForm({ ...couponForm, minOrderAmount: e.target.value })} />
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Total Uses</label>
                                        <input className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" type="number" min="0" placeholder="Usage limit" value={couponForm.usageLimit} onChange={(e) => setCouponForm({ ...couponForm, usageLimit: e.target.value })} />
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Uses/User</label>
                                        <input className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" type="number" min="0" placeholder="Per user limit" value={couponForm.perUserLimit} onChange={(e) => setCouponForm({ ...couponForm, perUserLimit: e.target.value })} />
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Starts At</label>
                                        <input className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" type="date" value={couponForm.startsAt} onChange={(e) => setCouponForm({ ...couponForm, startsAt: e.target.value })} />
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Expires At</label>
                                        <input className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" type="date" value={couponForm.expiresAt} onChange={(e) => setCouponForm({ ...couponForm, expiresAt: e.target.value })} />
                                    </div>
                                    <div className="col-span-1 md:col-span-2 flex items-center gap-2 mt-4">
                                        <input className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" id="couponActive" type="checkbox" checked={couponForm.active} onChange={(e) => setCouponForm({ ...couponForm, active: e.target.checked })} />
                                        <label className="text-xs font-medium text-slate-700 cursor-pointer" htmlFor="couponActive">Active</label>
                                    </div>
                                    <div className="col-span-1 md:col-span-2 flex items-end">
                                        <button className="w-full py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition shadow-sm cursor-pointer">Create</button>
                                    </div>
                                </form>
                            </div>

                            <h4 className="text-sm font-semibold text-slate-900 mb-4">Coupons List</h4>
                            <div className="overflow-hidden border border-slate-200 rounded-lg mb-4 bg-white">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-left text-sm text-slate-600">
                                        <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            <tr>
                                                <th className="px-5 py-3">Code</th>
                                                <th className="px-5 py-3">Name</th>
                                                <th className="px-5 py-3">Discount</th>
                                                <th className="px-5 py-3">Min Order</th>
                                                <th className="px-5 py-3">Usage</th>
                                                <th className="px-5 py-3">Status</th>
                                                <th className="px-5 py-3">Expires</th>
                                                <th className="px-5 py-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 text-slate-700">
                                            {pagedCoupons.items.map((coupon) => (
                                                <tr key={coupon._id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-5 py-3.5">
                                                        <span className="inline-flex px-2 py-0.5 rounded border border-slate-200 bg-slate-50 font-mono text-xs text-slate-700 font-semibold">
                                                            {coupon.code}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-slate-900 font-medium">{coupon.name}</td>
                                                    <td className="px-5 py-3.5">
                                                        {coupon.discountType === 'PERCENT' ? `${coupon.discountValue}%` : `${Number(coupon.discountValue || 0).toLocaleString('vi-VN')} VND`}
                                                        {coupon.maxDiscountAmount > 0 ? `, cap ${Number(coupon.maxDiscountAmount).toLocaleString('vi-VN')} VND` : ''}
                                                    </td>
                                                    <td className="px-5 py-3.5">{Number(coupon.minOrderAmount || 0).toLocaleString('vi-VN')} VND</td>
                                                    <td className="px-5 py-3.5">{coupon.usedCount || 0}/{coupon.usageLimit || 'Unlimited'}</td>
                                                    <td className="px-5 py-3.5">
                                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${coupon.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${coupon.active ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                                            {coupon.active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-slate-500">{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : '-'}</td>
                                                    <td className="px-5 py-3.5 text-right">
                                                        <button className="inline-flex items-center justify-center px-2.5 py-1 text-xs text-slate-700 border border-slate-200 rounded hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer" type="button" onClick={() => runConfirmedAction(
                                                            `${coupon.active ? 'Disable' : 'Enable'} coupon "${coupon.code}"?`,
                                                            () => updateCoupon(coupon._id, { active: !coupon.active }),
                                                            'Coupon updated successfully',
                                                            'Failed to update coupon'
                                                        )}>
                                                            {coupon.active ? 'Disable' : 'Enable'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            {coupons.length === 0 && <p className="text-slate-400 text-xs italic ps-4">No coupons have been created.</p>}
                            {coupons.length > 0 && <PaginationControls pagination={pagedCoupons.pagination} onPageChange={(page) => setListPage('coupons', page)} itemLabel="coupons" />}
                        </section>
                    )}

                    {/* TAB: Notifications */}
                    {activeTab === 'notifications' && (
                        <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 animate-fadeIn">
                            <div className="bg-slate-50/50 border border-slate-200 rounded-lg p-5 mb-6">
                                <h3 className="text-sm font-semibold text-slate-900 mb-4">Broadcast Notification by Role</h3>
                                <form className="grid grid-cols-1 md:grid-cols-12 gap-4" onSubmit={submitNotification}>
                                    <div className="col-span-1 md:col-span-3">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Title</label>
                                        <input className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="Title" value={notificationForm.title} onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })} required />
                                    </div>
                                    <div className="col-span-1 md:col-span-4">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Message</label>
                                        <input className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder="Message details..." value={notificationForm.message} onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })} />
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Recipient Role</label>
                                        <select className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition cursor-pointer" value={notificationForm.role} onChange={(e) => setNotificationForm({ ...notificationForm, role: e.target.value })}>
                                            <option value="">All Roles</option>
                                            {roleOptions.map((role) => <option key={role.code} value={role.code}>{role.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                                        <select className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition cursor-pointer" value={notificationForm.status} onChange={(e) => setNotificationForm({ ...notificationForm, status: e.target.value })}>
                                            <option value="">All Statuses</option>
                                            <option value="ACTIVE">ACTIVE</option>
                                            <option value="INACTIVE">INACTIVE</option>
                                        </select>
                                    </div>
                                    <div className="col-span-1 md:col-span-1 flex items-end">
                                        <button className="w-full py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition shadow-sm cursor-pointer">Send</button>
                                    </div>
                                </form>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
                                <div className="flex-grow flex flex-col md:flex-row items-stretch md:items-center gap-3">
                                    <div className="flex items-center gap-2 flex-grow max-w-md">
                                        <span className="text-slate-500 text-xs font-medium text-nowrap">From</span>
                                        <input type="date" className="w-full bg-white border border-slate-200 rounded-md px-3 py-1 text-sm text-slate-900 focus:outline-none focus:border-blue-500 transition" value={notificationFilters.startDate} onChange={(e) => updateNotificationFilter({ startDate: e.target.value })} />
                                        <span className="text-slate-500 text-xs font-medium text-nowrap">To</span>
                                        <input type="date" className="w-full bg-white border border-slate-200 rounded-md px-3 py-1 text-sm text-slate-900 focus:outline-none focus:border-blue-500 transition" value={notificationFilters.endDate} onChange={(e) => updateNotificationFilter({ endDate: e.target.value })} />
                                    </div>
                                    <div className="w-full md:w-44">
                                        <select className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition cursor-pointer" value={notificationFilters.role} onChange={(e) => updateNotificationFilter({ role: e.target.value })}>
                                            <option value="">All Roles</option>
                                            {roleOptions.map((role) => <option key={role.code} value={role.code}>{role.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="px-4 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition shadow-sm cursor-pointer" type="button" onClick={applyNotificationFilters}>Apply</button>
                                        <button className="px-4 py-1.5 text-sm font-medium border border-slate-200 text-slate-600 rounded-md hover:bg-slate-50 transition cursor-pointer" type="button" onClick={clearNotificationFilters}>Clear</button>
                                    </div>
                                </div>
                            </div>

                            <h4 className="text-sm font-semibold text-slate-900 mb-4">Recent Notifications</h4>
                            <div className="overflow-hidden border border-slate-200 rounded-lg mb-4 bg-white">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-left text-sm text-slate-600">
                                        <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            <tr>
                                                <th className="px-5 py-3">Recipient</th>
                                                <th className="px-5 py-3">Title</th>
                                                <th className="px-5 py-3">Message</th>
                                                <th className="px-5 py-3">Read</th>
                                                <th className="px-5 py-3 text-right">Created</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 text-slate-700">
                                            {pagedNotifications.items.map((notification) => (
                                                <tr key={notification._id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-5 py-3.5 font-medium text-slate-900">{notification.user?.fullName || notification.user?.email || '-'}</td>
                                                    <td className="px-5 py-3.5 text-slate-700 font-semibold">{notification.title}</td>
                                                    <td className="px-5 py-3.5 text-slate-600">{notification.message}</td>
                                                    <td className="px-5 py-3.5">
                                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${notification.read ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                            {notification.read ? 'Yes' : 'No'}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-right text-slate-500">{notification.createdAt ? new Date(notification.createdAt).toLocaleString() : '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            {notifications.length > 0 && <PaginationControls pagination={pagedNotifications.pagination} onPageChange={(page) => setListPage('notifications', page)} itemLabel="notifications" />}
                        </section>
                    )}

                    {/* TAB: Payments */}
                    {activeTab === 'payments' && (
                        <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 animate-fadeIn">
                            <h4 className="text-sm font-semibold text-slate-900 mb-4">Payments and Orders</h4>
                            <div className="overflow-hidden border border-slate-200 rounded-lg mb-4 bg-white">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-left text-sm text-slate-600">
                                        <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            <tr>
                                                <th className="px-5 py-3">Course</th>
                                                <th className="px-5 py-3">Amount</th>
                                                <th className="px-5 py-3">Status</th>
                                                <th className="px-5 py-3">Method</th>
                                                <th className="px-5 py-3 text-right">Created At</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 text-slate-700">
                                            {pagedOrders.items.map((order) => (
                                                <tr key={order._id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-5 py-3.5 font-medium text-slate-900">{order.course?.title}</td>
                                                    <td className="px-5 py-3.5 text-slate-900 font-bold">{order.amount?.toLocaleString('vi-VN')} VND</td>
                                                    <td className="px-5 py-3.5">
                                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${order.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : order.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-slate-600">{order.paymentMethod}</td>
                                                    <td className="px-5 py-3.5 text-right text-slate-500">{order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
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
