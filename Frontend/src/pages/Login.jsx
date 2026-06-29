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
    email: yup.string().email('Email is invalid').required('Email is required'),
    password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required')
});

const loginErrorMessages = {
    'Đăng nhập thành công.': 'Login successful.',
    'Email hoặc mật khẩu không đúng.': 'Email or password is incorrect.',
    'Tài khoản chưa được kích hoạt.': 'Your account has not been activated.'
};

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
            const message = requestError.response?.data?.message;
            setError(loginErrorMessages[message] || message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="auth-card-grid">
            <div className="auth-copy-panel auth-copy-panel--login">
                <span className="eyebrow">Welcome back</span>
                <h1>Sign in to access your courses and learning dashboard.</h1>
                <p>The system will take you to the home page after a successful login.</p>
                <div className="feature-stack">
                    <div>
                        <strong>Login first</strong>
                        <span>Do not have an account yet? Register to get started.</span>
                    </div>
                    <div>
                        <strong>Protected home</strong>
                        <span>Sign in before opening your dashboard.</span>
                    </div>
                </div>
            </div>

            <div className="auth-form-panel">
                <div className="auth-form-card">
                    <span className="eyebrow">Login</span>
                    <h2>Login</h2>
                    <p className="auth-helper">Enter your email and password to continue.</p>

                    {error ? <div className="alert alert-danger py-2">{error}</div> : null}

                    <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
                        <label className="field-label">
                            Email
                            <input
                                type="email"
                                className="form-control form-control-lg"
                                {...register('email')}
                                placeholder="you@example.com"
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
                                    placeholder="Enter password"
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

                        <button type="submit" className="btn btn-primary btn-lg w-100 auth-primary-btn" disabled={loading}>
                            {loading ? 'Signing in...' : 'Login'}
                        </button>
                    </form>

                    <div className="auth-links">
                        <Link to="/forgot-password">Forgot password?</Link>
                        <Link to="/register">New here? Register</Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Login;
