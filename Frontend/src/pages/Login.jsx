import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { login } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { setCredentials } from '../store/authSlice';

const loginSchema = yup.object({
    email: yup
        .string()
        .email('Please enter a valid email address')
        .required('Email is required'),

    password: yup
        .string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required')
});

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { login: setAuth } = useAuth();
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm({
        resolver: yupResolver(loginSchema),
        defaultValues: {
            email: '',
            password: ''
        }
    });

    const onSubmit = async (values) => {
        setError('');
        setLoading(true);

        try {
            const response = await login(values);
            const credentials = {
                token: response.data.token,
                refreshToken: response.data.refreshToken,
                user: response.data.user
            };
            setAuth(credentials.token, credentials.user, credentials.refreshToken);
            dispatch(setCredentials(credentials));
            navigate(location.state?.from?.pathname || '/home', { replace: true });
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="auth-card-grid login-page">
            <div className="auth-copy-panel auth-copy-panel--login">
                <div className="login-copy-content">
                    <span className="eyebrow">English Course Hub</span>
                    <h1>Master English with a smarter learning journey.</h1>
                    <p>
                        Join interactive classes, track your progress, and manage every lesson in one elegant English
                        learning workspace.
                    </p>

                    <div className="learning-visual" aria-hidden="true">
                        <div className="learning-visual__card learning-visual__card--primary">
                            <span>Speaking class</span>
                            <strong>95%</strong>
                            <small>Weekly progress</small>
                        </div>
                        <div className="learning-visual__book">
                            <span>EN</span>
                            <div>
                                <strong>Vocabulary</strong>
                                <small>32 new words</small>
                            </div>
                        </div>
                        <div className="learning-visual__bubble">A+</div>
                    </div>

                    <div className="feature-stack login-feature-stack">
                        <div>
                            <strong>Personalized learning</strong>
                            <span>Follow courses, quizzes, and lessons matched to your English goals.</span>
                        </div>
                        <div>
                            <strong>Course management</strong>
                            <span>Access your dashboard, enrollments, and progress after signing in.</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="auth-form-panel">
                <div className="auth-form-card login-form-card">
                    <span className="eyebrow">Login</span>
                    <h2>Welcome Back</h2>
                    <p className="auth-helper">Sign in to continue your English learning experience.</p>

                    {error ? <div className="alert alert-danger py-2">{error}</div> : null}

                    <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
                        <label className="field-label">
                            Email
                            <input
                                type="email"
                                className="form-control form-control-lg"
                                {...register('email')}
                                placeholder="student@example.com"
                            />
                            {errors.email ? <span className="text-danger small">{errors.email.message}</span> : null}
                        </label>

                        <label className="field-label">
                            Password
                            <div className="password-field">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-control form-control-lg"
                                    {...register('password')}
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword((value) => !value)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                            {errors.password ? <span className="text-danger small">{errors.password.message}</span> : null}
                        </label>

                        <div className="login-options">
                            <label className="remember-option">
                                <input type="checkbox" />
                                <span>Remember me</span>
                            </label>
                            <Link to="/forgot-password">Forgot password?</Link>
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg w-100 auth-primary-btn" disabled={loading}>
                            {loading ? 'Signing in...' : 'Login'}
                        </button>
                    </form>

                    <div className="auth-links login-signup-link">
                        <span>Don&apos;t have an account?</span>
                        <Link to="/register">Sign up</Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Login;
