import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { login } from '../services/auth';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { login: setAuth } = useAuth();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await login({ email, password });
            setAuth(response.data.token, response.data.user);
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
                <h1>Đăng nhập để vào trang học và quản lý khóa học.</h1>
                <p>
                    Hệ thống sẽ đưa bạn vào home page chỉ sau khi login thành công.
                </p>
                <div className="feature-stack">
                    <div>
                        <strong>Login first</strong>
                        <span>Không có tài khoản thì đăng ký ngay.</span>
                    </div>
                    <div>
                        <strong>Protected home</strong>
                        <span>Đăng nhập xong mới vào dashboard.</span>
                    </div>
                </div>
            </div>

            <div className="auth-form-panel">
                <div className="auth-form-card">
                    <span className="eyebrow">Login</span>
                    <h2>Đăng nhập</h2>
                    <p className="auth-helper">Nhập email và mật khẩu để tiếp tục.</p>

                    {error ? <div className="alert alert-danger py-2">{error}</div> : null}

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <label className="field-label">
                            Email
                            <input
                                type="email"
                                className="form-control form-control-lg"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="you@example.com"
                                required
                            />
                        </label>

                        <label className="field-label">
                            Password
                            <div className="password-field">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-control form-control-lg"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword((value) => !value)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                                            <path fill="currentColor" d="M12 5c-5 0-9.27 3.11-11 7 1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-2.5A1.5 1.5 0 1 0 12 11a1.5 1.5 0 0 0 0 3Z" />
                                        </svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                                            <path fill="currentColor" d="M2 5.27 3.28 4 20 20.72 18.73 22l-2.2-2.2A11.1 11.1 0 0 1 12 21C7 21 2.73 17.89 1 14c.83-1.88 2.19-3.56 3.86-4.86L2 5.27ZM12 7a5 5 0 0 1 5 5c0 .66-.13 1.29-.35 1.87l-1.49-1.49A3.5 3.5 0 0 0 12 8.5c-.67 0-1.3.19-1.85.51L8.65 7.51A4.98 4.98 0 0 1 12 7Zm0 10a5 5 0 0 1-5-5c0-.44.06-.86.17-1.26L3.67 8.24c-1.03.86-1.92 1.88-2.59 3.04 1.73 3.29 5.42 5.72 10.92 5.72 1.11 0 2.15-.12 3.12-.36L12 17Z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
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