import api from '../services/api';

const apiOrigin = (() => {
    try {
        return new URL(api.defaults.baseURL).origin;
    } catch {
        return '';
    }
})();

const resolveImageUrl = (imageUrl) => {
    if (!imageUrl) return '';
    if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
    return `${apiOrigin}${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}`;
};

const CourseImage = ({ course, className = 'course-image' }) => {
    const src = resolveImageUrl(course?.imageUrl);

    if (!src) {
        return (
            <div className={`${className} course-image--placeholder`} aria-label="Course image placeholder">
                <span>{course?.title?.charAt(0)?.toUpperCase() || 'C'}</span>
            </div>
        );
    }

    return <img src={src} alt={course?.title || 'Course'} className={className} loading="lazy" />;
};

export default CourseImage;
