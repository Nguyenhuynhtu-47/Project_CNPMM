export const menuItems = [
    { label: 'Home', to: '/home' },
    { label: 'Courses', to: '/courses' },
    { label: 'Orders', to: '/orders', roles: ['STUDENT', 'USER', 'ADMIN'] },
    { label: 'Enrollments', to: '/enrollments', roles: ['STUDENT', 'USER', 'ADMIN'] },
    { label: 'My learning', to: '/my-learning', roles: ['STUDENT', 'USER', 'ADMIN'] },
    { label: 'Wishlist', to: '/wishlist', roles: ['STUDENT', 'USER', 'ADMIN'] },
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Admin dashboard', to: '/admin', roles: ['ADMIN'] },
    { label: 'Admin management', to: '/admin/manage', roles: ['ADMIN'] },
    { label: 'Manager dashboard', to: '/manager', roles: ['MANAGER', 'ADMIN'] },
    { label: 'Teacher dashboard', to: '/teacher', roles: ['TEACHER', 'ADMIN'] },
    { label: 'Profile', to: '/profile' },
    { label: 'Notifications', to: '/notifications' }
];
