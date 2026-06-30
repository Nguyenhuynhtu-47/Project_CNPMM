import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { register as registerAccount } from '../services/auth';
import PasswordVisibilityIcon from '../components/PasswordVisibilityIcon';

const registerSchema = yup.object({
    email: yup.string().email('Email is invalid').required('Email is required'),
    password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref('password')], 'Confirm password does not match')
        .required('Confirm password is required')
});

const Register = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm({
        resolver: yupResolver(registerSchema),
        defaultValues: {
            email: '',
            password: '',
            confirmPassword: ''
        }
    });

    const onSubmit = async (values) => {
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await registerAccount(values);
            setSuccess('Registration successful. Please check your email for the OTP code.');
            setTimeout(() => {
                navigate('/verify-email', {
                    state: {
                        email: values.email,
                        successMessage: 'Registration successful. Enter the OTP code to verify your email.'
                    }
                });
            }, 800);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="auth-card-grid auth-card-grid--register">
            <div className="auth-copy-panel auth-copy-panel--register">
                <h1>Create a student account and unlock the course catalog.</h1>
                <div className="feature-stack feature-stack--register">
                    <div>
                        <span className="feature-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" focusable="false">
                                <path d="M4 6h16v12H4z" />
                                <path d="m4 8 8 6 8-6" />
                                <path d="m18 17 3 3 4-5" />
                            </svg>
                        </span>
                        <span>
                            <strong>Email verification</strong>
                            <small>You must verify your email before logging in.</small>
                        </span>
                    </div>
                    <div>
                        <span className="feature-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" focusable="false">
                                <path d="m3 8 9-4 9 4-9 4z" />
                                <path d="M7 10v5c0 1.5 2.2 3 5 3s5-1.5 5-3v-5" />
                            </svg>
                        </span>
                        <span>
                            <strong>Course ready</strong>
                            <small>After this step, you are ready to enter the learning system.</small>
                        </span>
                    </div>
                </div>
            </div>

            <div className="auth-form-panel">
                <div className="auth-form-card">
                    <span className="eyebrow">Register</span>
                    <h2>Register</h2>

                    {error ? <div className="alert alert-danger py-2">{error}</div> : null}
                    {success ? <div className="alert alert-success py-2">{success}</div> : null}

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
                                    placeholder="Create password"
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
                            {errors.password ? <span className="text-danger small">{errors.password.message}</span> : null}
                        </label>

                        <label className="field-label">
                            Confirm password
                            <div className="password-field">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    className="form-control form-control-lg"
                                    {...register('confirmPassword')}
                                    placeholder="Re-enter password"
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowConfirmPassword((value) => !value)}
                                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                >
                                    <PasswordVisibilityIcon visible={showConfirmPassword} />
                                </button>
                            </div>
                            {errors.confirmPassword ? <span className="text-danger small">{errors.confirmPassword.message}</span> : null}
                        </label>

                        <button type="submit" className="btn btn-primary btn-lg w-100 auth-primary-btn" disabled={loading}>
                            {loading ? 'Creating account...' : 'Register'}
                        </button>
                    </form>

                    <div className="auth-links">
                        <Link to="/login">Already have an account? Login</Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Register;
