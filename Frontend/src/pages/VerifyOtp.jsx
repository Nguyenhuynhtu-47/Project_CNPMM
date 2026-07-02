import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { verifyOtp } from '../services/auth';

const VerifyOtp = () => {
    const location = useLocation();
    const [email] = useState(location.state?.email || '');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(location.state?.successMessage || '');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleOtpChange = (event) => {
        setOtp(event.target.value.replace(/\D/g, '').slice(0, 6));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await verifyOtp({ email, otp });
            setSuccess('Email verified successfully. Your account has been activated.');
            setTimeout(() => {
                navigate('/login', { state: { successMessage: 'Email verified successfully. You can log in now.' } });
            }, 1200);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="auth-card-grid auth-card-grid--verify">
            <div className="auth-copy-panel auth-copy-panel--verify">
                <h1>Verify your email to activate your account.</h1>
                <p>Enter the OTP code sent to your inbox to complete registration.</p>
                <div className="feature-stack feature-stack--register">
                    <div>
                        <span className="feature-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" focusable="false">
                                <path d="M4 6h16v12H4z" />
                                <path d="m4 8 8 6 8-6" />
                            </svg>
                        </span>
                        <span>
                            <strong>Check your inbox</strong>
                            <small>The OTP code is sent to your email after registration.</small>
                        </span>
                    </div>
                    <div>
                        <span className="feature-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" focusable="false">
                                <path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6z" />
                                <path d="m9 12 2 2 4-5" />
                            </svg>
                        </span>
                        <span>
                            <strong>Login ready</strong>
                            <small>After verification, you can log in right away.</small>
                        </span>
                    </div>
                </div>
            </div>

            <div className="auth-form-panel">
                <div className="auth-form-card">
                    <span className="eyebrow">OTP</span>
                    <h2>Verify email</h2>
                    <p className="auth-helper">Use your registered email and the 6-digit OTP code.</p>

                    {error ? <div className="alert alert-danger py-2">{error}</div> : null}
                    {success ? <div className="alert alert-success py-2">{success}</div> : null}

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <label className="field-label">
                            Email
                            <input
                                type="email"
                                className="form-control form-control-lg"
                                value={email}
                                readOnly
                                required
                            />
                        </label>

                        <label className="field-label">
                            OTP code
                            <input
                                type="text"
                                className="form-control form-control-lg letter-spacing otp-code-input"
                                value={otp}
                                onChange={handleOtpChange}
                                placeholder="123456"
                                inputMode="numeric"
                                maxLength="6"
                                required
                            />
                        </label>

                        <button type="submit" className="btn btn-primary btn-lg w-100 auth-primary-btn" disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify email'}
                        </button>
                    </form>

                    <div className="auth-links">
                        <Link to="/register">Need an account? Register</Link>
                        <Link to="/login">Back to Login</Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default VerifyOtp;
