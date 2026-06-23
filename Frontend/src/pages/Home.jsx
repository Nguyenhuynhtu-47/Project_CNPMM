const courses = [
    {
        title: 'Speak English Fast Track',
        level: 'Beginner to Intermediate',
        meta: '8 weeks • 24 lessons',
        price: '1.200.000đ',
    },
    {
        title: 'IELTS Foundation',
        level: 'Band 4.5 - 6.0',
        meta: '10 weeks • 30 lessons',
        price: '2.400.000đ',
    },
    {
        title: 'Business English Pro',
        level: 'Workplace Communication',
        meta: '6 weeks • 18 lessons',
        price: '1.900.000đ',
    },
];

const Home = () => {
    return (
        <div className="dashboard-page">
            <section className="hero-banner">
                <div className="hero-banner__content">
                    <span className="eyebrow">English Learning Platform</span>
                    <h1>Learn English with structured courses and a clear study path.</h1>
                    <p>
                        Explore curated English courses, follow a guided learning journey, and manage your account from one dashboard.
                    </p>
                    <div className="hero-actions">
                        <a href="#courses" className="btn btn-primary btn-lg">Explore courses</a>
                        <a href="/profile" className="btn btn-outline-light btn-lg">Open profile</a>
                    </div>
                </div>

                <div className="hero-banner__stats">
                    <div className="stat-card">
                        <strong>12K+</strong>
                        <span>Active learners</span>
                    </div>
                    <div className="stat-card">
                        <strong>98%</strong>
                        <span>Course completion</span>
                    </div>
                    <div className="stat-card">
                        <strong>4.9/5</strong>
                        <span>Student rating</span>
                    </div>
                </div>
            </section>

            <section className="section-block" id="courses">
                <div className="section-heading">
                    <div>
                        <span className="eyebrow">Popular courses</span>
                        <h2>Pick the learning track that fits your goal</h2>
                    </div>
                    <p>Clear pricing, focused lessons, and a progression path that keeps students moving forward.</p>
                </div>

                <div className="course-grid">
                    {courses.map((course) => (
                        <article className="course-card" key={course.title}>
                            <span className="course-tag">{course.level}</span>
                            <h3>{course.title}</h3>
                            <p>{course.meta}</p>
                            <div className="course-card__footer">
                                <strong>{course.price}</strong>
                                <button type="button" className="btn btn-sm btn-light">Details</button>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Home;