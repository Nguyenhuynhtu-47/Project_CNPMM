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
    email: yup.string().email('Email khong hop le').required('Email la bat buoc'),
    password: yup.string().min(6, 'Mat khau toi thieu 6 ky tu').required('Mat khau la bat buoc')
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
        <section className="auth-card-grid">
            <div className="auth-copy-panel auth-copy-panel--login">
                <span className="eyebrow">Welcome back</span>
                <h1>Dang nhap de vao trang hoc va quan ly khoa hoc.</h1>
                <p>He thong se dua ban vao home page sau khi login thanh cong.</p>
                <div className="feature-stack">
                    <div>
                        <strong>Login first</strong>
                        <span>Khong co tai khoan thi dang ky ngay.</span>
                    </div>
                    <div>
                        <strong>Protected home</strong>
                        <span>Dang nhap xong moi vao dashboard.</span>
                    </div>
                </div>
            </div>

            <div className="auth-form-panel">
                <div className="auth-form-card">
                    <span className="eyebrow">Login</span>
                    <h2>Dang nhap</h2>
                    <p className="auth-helper">Nhap email va mat khau de tiep tuc.</p>

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
                                    placeholder="********"
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
