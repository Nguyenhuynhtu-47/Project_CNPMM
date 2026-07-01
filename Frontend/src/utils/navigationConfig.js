export const menuItems = [
    { label: 'Home', to: '/home' },
    { label: 'Courses', to: '/courses' },
    { label: 'Dashboard', to: '/dashboard', roles: ['STUDENT', 'USER'] },
    { label: 'Orders', to: '/orders', roles: ['STUDENT', 'USER'] },
    { label: 'Enrollments', to: '/enrollments', roles: ['STUDENT', 'USER'] },
    { label: 'My learning', to: '/my-learning', roles: ['STUDENT', 'USER'] },
    { label: 'Wishlist', to: '/wishlist', roles: ['STUDENT', 'USER'] },
    { label: 'Admin dashboard', to: '/admin', roles: ['ADMIN'] },
    { label: 'Admin management', to: '/admin/manage', roles: ['ADMIN'] },
    { label: 'Manager dashboard', to: '/manager', roles: ['MANAGER'] },
    { label: 'Teacher dashboard', to: '/teacher', roles: ['TEACHER'] },
    { label: 'Profile', to: '/profile' },
    { label: 'Notifications', to: '/notifications' }
];
