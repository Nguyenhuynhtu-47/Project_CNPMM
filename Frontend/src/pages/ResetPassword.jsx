import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { resetPassword } from '../services/auth';
import PasswordVisibilityIcon from '../components/PasswordVisibilityIcon';

const ResetPassword = () => {
    const location = useLocation();
    const [email, setEmail] = useState(location.state?.email || '');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(location.state?.successMessage || '');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await resetPassword({ email, otp, password });
            setSuccess('Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay bây giờ.');
            setTimeout(() => {
                navigate('/login', { state: { successMessage: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' } });
            }, 1200);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Password reset failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="auth-card-grid">
            <div className="auth-copy-panel auth-copy-panel--reset">
                <span className="eyebrow">Reset password</span>
                <h1>Đặt lại mật khẩu bằng OTP đã gửi qua email.</h1>
                <p>
                    Sau bước xác minh, bạn tạo mật khẩu mới rồi quay lại đăng nhập.
                </p>
                <div className="feature-stack">
                    <div>
                        <strong>Verified reset</strong>
                        <span>OTP là bước bắt buộc.</span>
                    </div>
                    <div>
                        <strong>New password</strong>
                        <span>Đổi xong đăng nhập lại ngay.</span>
                    </div>
                </div>
            </div>

            <div className="auth-form-panel">
                <div className="auth-form-card">
                    <span className="eyebrow">New password</span>
                    <h2>Đặt lại mật khẩu</h2>
                    <p className="auth-helper">Nhập email, OTP và mật khẩu mới.</p>

                    {error ? <div className="alert alert-danger py-2">{error}</div> : null}
                    {success ? <div className="alert alert-success py-2">{success}</div> : null}

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <label className="field-label">
                            Email
                            <input
                                type="email"
                                className="form-control form-control-lg"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                required
                            />
                        </label>

                        <label className="field-label">
                            OTP code
                            <input
                                type="text"
                                className="form-control form-control-lg letter-spacing"
                                value={otp}
                                onChange={(event) => setOtp(event.target.value)}
                                placeholder="123456"
                                required
                            />
                        </label>

                        <label className="field-label">
                            New password
                            <div className="password-field">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-control form-control-lg"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    placeholder="Create a new password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword((value) => !value)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    <PasswordVisibilityIcon visible={showPassword} />
                                </button>
                            </div>
                        </label>

                        <button type="submit" className="btn btn-primary btn-lg w-100 auth-primary-btn" disabled={loading}>
                            {loading ? 'Updating...' : 'Reset password'}
                        </button>
                    </form>

                    <div className="auth-links">
                        <Link to="/forgot-password">Need another OTP?</Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ResetPassword;
