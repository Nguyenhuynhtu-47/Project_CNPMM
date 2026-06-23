import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { verifyOtp } from '../services/auth';

const VerifyOtp = () => {
    const location = useLocation();
    const [email, setEmail] = useState(location.state?.email || '');
    const [otp, setOtp] = useState('');
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
            await verifyOtp({ email, otp });
            setSuccess('Xác minh email thành công. Tài khoản đã được kích hoạt.');
            setTimeout(() => {
                navigate('/login', { state: { successMessage: 'Xác minh email thành công. Bạn có thể đăng nhập ngay bây giờ.' } });
            }, 1200);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="auth-card-grid">
            <div className="auth-copy-panel auth-copy-panel--verify">
                <span className="eyebrow">Verify email</span>
                <h1>Xác minh email để kích hoạt tài khoản.</h1>
                <p>
                    Nhập mã OTP đã gửi tới hộp thư của bạn, sau đó quay lại đăng nhập.
                </p>
                <div className="feature-stack">
                    <div>
                        <strong>Activation step</strong>
                        <span>Kích hoạt tài khoản bằng OTP.</span>
                    </div>
                    <div>
                        <strong>Login ready</strong>
                        <span>Xác minh xong là đăng nhập được ngay.</span>
                    </div>
                </div>
            </div>

            <div className="auth-form-panel">
                <div className="auth-form-card">
                    <span className="eyebrow">OTP</span>
                    <h2>Xác minh email</h2>
                    <p className="auth-helper">Nhập email và mã OTP nhận từ hệ thống.</p>

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

                        <button type="submit" className="btn btn-primary btn-lg w-100 auth-primary-btn" disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify email'}
                        </button>
                    </form>

                    <div className="auth-links">
                        <Link to="/register">Need an account? Register</Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default VerifyOtp;