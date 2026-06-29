import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import CourseImage from '../components/CourseImage';
import { getCourses } from '../services/course';
import { getBanners } from '../services/site';

const CourseSlider = ({ title, eyebrow, courses, onDetails }) => (
    <section className="section-block">
        <div className="section-heading">
            <div>
                <span className="eyebrow">{eyebrow}</span>
                <h2>{title}</h2>
            </div>
        </div>
        <Swiper className="course-slider" modules={[Pagination]} pagination={{ clickable: true }} spaceBetween={20} slidesPerView={1} breakpoints={{ 768: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }}>
            {courses.map((course) => (
                <SwiperSlide key={course._id}>
                    <article className="course-card h-100">
                        <CourseImage course={course} />
                        <span className="course-tag">{course.category?.name || 'General'}</span>
                        <h3>{course.title}</h3>
                        <p>{course.description}</p>
                        <p>{course.durationWeeks} weeks - {course.sessionCount} lessons</p>
                        <div className="course-card__footer">
                            <strong>{course.price?.toLocaleString('vi-VN')}d</strong>
                            <button type="button" className="btn btn-sm btn-light" onClick={() => onDetails(course._id)}>Details</button>
                        </div>
                    </article>
                </SwiperSlide>
            ))}
        </Swiper>
    </section>
);

const Home = () => {
    const [banners, setBanners] = useState([]);
    const [newCourses, setNewCourses] = useState([]);
    const [bestValueCourses, setBestValueCourses] = useState([]);
    const [premiumCourses, setPremiumCourses] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHome = async () => {
            try {
                const [bannerRes, newestRes, valueRes, premiumRes] = await Promise.all([
                    getBanners(),
                    getCourses({ page: 1, limit: 8, sort: 'newest' }),
                    getCourses({ page: 1, limit: 8, sort: 'priceAsc' }),
                    getCourses({ page: 1, limit: 8, sort: 'priceDesc' })
                ]);

                setBanners(bannerRes.data.banners || []);
                setNewCourses(newestRes.data.courses || []);
                setBestValueCourses(valueRes.data.courses || []);
                setPremiumCourses(premiumRes.data.courses || []);
            } catch (error) {
                console.error(error);
            }
        };

        fetchHome();
    }, []);

    const fallbackBanner = useMemo(() => ({
        title: 'Learn English with structured courses and a clear study path.',
        subtitle: 'Explore curated English courses, follow a guided learning journey, and manage your account from one dashboard.',
        imageUrl: ''
    }), []);

    const heroBanners = banners.length ? banners : [fallbackBanner];

    return (
        <div className="dashboard-page">
            <section className="hero-banner">
                <Swiper modules={[Pagination, Autoplay]} autoplay={{ delay: 4500 }} pagination={{ clickable: true }} className="w-100">
                    {heroBanners.map((banner, index) => (
                        <SwiperSlide key={banner._id || index}>
                            <div className="hero-banner__content">
                                <span className="eyebrow">English Learning Platform</span>
                                <h1>{banner.title}</h1>
                                <p>{banner.subtitle}</p>
                                <div className="hero-actions">
                                    <a href="#courses" className="btn btn-primary btn-lg">Explore courses</a>
                                    <a href={banner.linkUrl || '/profile'} className="btn btn-outline-primary btn-lg">Open profile</a>
                                </div>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>

                <div className="hero-banner__stats">
                    <div className="stat-card"><strong>12K+</strong><span>Active learners</span></div>
                    <div className="stat-card"><strong>98%</strong><span>Course completion</span></div>
                    <div className="stat-card"><strong>4.9/5</strong><span>Student rating</span></div>
                </div>
            </section>

            <div id="courses">
                <CourseSlider eyebrow="New courses" title="Newest learning tracks" courses={newCourses} onDetails={(id) => navigate(`/courses/${id}`)} />
                <CourseSlider eyebrow="Best value" title="Affordable courses to start today" courses={bestValueCourses} onDetails={(id) => navigate(`/courses/${id}`)} />
                <CourseSlider eyebrow="Premium goals" title="Advanced courses for ambitious learners" courses={premiumCourses} onDetails={(id) => navigate(`/courses/${id}`)} />
            </div>
        </div>
    );
};

export default Home;
