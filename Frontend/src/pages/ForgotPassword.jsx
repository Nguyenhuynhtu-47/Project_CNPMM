import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword } from '../services/auth';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await forgotPassword({ email });
            setSuccess('Đã gửi OTP đặt lại mật khẩu thành công. Vui lòng kiểm tra email của bạn.');
            setTimeout(() => {
                navigate('/reset-password', { state: { email, successMessage: 'OTP đặt lại mật khẩu đã được gửi thành công.' } });
            }, 1200);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="auth-card-grid">
            <div className="auth-copy-panel auth-copy-panel--forgot">
                <span className="eyebrow">Forgot password</span>
                <h1>Gửi mã xác minh mới khi bạn quên mật khẩu.</h1>
                <p>
                    Nhập email của bạn, nhận OTP và tiếp tục sang bước đặt lại mật khẩu.
                </p>
                <div className="feature-stack">
                    <div>
                        <strong>Reset code</strong>
                        <span>Mã xác minh đi qua email.</span>
                    </div>
                    <div>
                        <strong>Step by step</strong>
                        <span>Xác minh rồi mới reset password.</span>
                    </div>
                </div>
            </div>

            <div className="auth-form-panel">
                <div className="auth-form-card">
                    <span className="eyebrow">Reset access</span>
                    <h2>Quên mật khẩu</h2>
                    <p className="auth-helper">Nhập email để nhận mã OTP đặt lại mật khẩu.</p>

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
                                placeholder="you@example.com"
                                required
                            />
                        </label>

                        <button type="submit" className="btn btn-primary btn-lg w-100 auth-primary-btn" disabled={loading}>
                            {loading ? 'Sending...' : 'Send OTP'}
                        </button>
                    </form>

                    <div className="auth-links">
                        <Link to="/login">Back to login</Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ForgotPassword;