import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CourseImage from '../components/CourseImage';
import { createVnpayPayment, previewPayment } from '../services/payment';

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')} VND`;

const Checkout = () => {
    const navigate = useNavigate();
    const { courseId } = useParams();
    const [form, setForm] = useState({ couponCode: '', pointsToUse: '' });
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const loadPreview = useCallback(async (options = { couponCode: '', pointsToUse: '' }) => {
        setLoading(true);
        setError('');
        try {
            const response = await previewPayment(courseId, {
                couponCode: options.couponCode.trim(),
                pointsToUse: Number(options.pointsToUse || 0)
            });
            setPreview(response.data.preview);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Cannot calculate checkout total.');
        } finally {
            setLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            loadPreview();
        }, 0);
        return () => window.clearTimeout(timer);
    }, [loadPreview]);

    const handleApply = async (event) => {
        event.preventDefault();
        await loadPreview(form);
    };

    const handlePayment = async () => {
        setPaying(true);
        setError('');
        setSuccess('');
        try {
            const response = await createVnpayPayment(courseId, {
                couponCode: form.couponCode.trim(),
                pointsToUse: Number(form.pointsToUse || 0)
            });
            if (response.data.paid) {
                const params = new URLSearchParams({
                    status: 'success',
                    orderId: response.data.orderId,
                    message: 'Payment completed with coupon or loyalty points'
                });
                navigate('/payment-result?' + params.toString());
                return;
            }
            window.location.href = response.data.paymentUrl;
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Cannot create payment.');
        } finally {
            setPaying(false);
        }
    };

    return (
        <div className="container py-5">
            <div className="mb-4">
                <span className="eyebrow">Checkout</span>
                <h2>Review payment</h2>
                <p className="text-muted mb-0">Check the final amount before continuing to VNPAY.</p>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div className="row gy-4">
                <div className="col-lg-7">
                    <div className="card p-4">
                        {loading && <div>Calculating checkout total...</div>}
                        {!loading && preview && (
                            <>
                                <div className="d-flex flex-wrap gap-3 align-items-center mb-4">
                                    <CourseImage course={preview.course} className="checkout-course-image" />
                                    <div>
                                        <h4 className="mb-1">{preview.course?.title}</h4>
                                        <p className="text-muted mb-0">Order expires after 30 minutes if payment is not completed.</p>
                                    </div>
                                </div>

                                <div className="list-group list-group-flush mb-4">
                                    <div className="list-group-item d-flex justify-content-between px-0">
                                        <span>Original price</span>
                                        <strong>{formatCurrency(preview.subtotal)}</strong>
                                    </div>
                                    <div className="list-group-item d-flex justify-content-between px-0">
                                        <span>Coupon discount{preview.couponCode ? ` (${preview.couponCode})` : ''}</span>
                                        <strong>-{formatCurrency(preview.couponDiscount)}</strong>
                                    </div>
                                    <div className="list-group-item d-flex justify-content-between px-0">
                                        <span>Loyalty points discount ({preview.pointsRedeemed || 0} points)</span>
                                        <strong>-{formatCurrency(preview.pointsDiscount)}</strong>
                                    </div>
                                    <div className="list-group-item d-flex justify-content-between px-0 fs-5">
                                        <span>Final amount</span>
                                        <strong className="text-primary">{formatCurrency(preview.amount)}</strong>
                                    </div>
                                </div>

                                <button className="btn btn-primary btn-lg w-100" type="button" onClick={handlePayment} disabled={paying}>
                                    {paying ? 'Processing...' : preview.freeCheckout ? 'Complete payment' : 'Pay with VNPAY'}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="col-lg-5">
                    <div className="card p-4">
                        <h4>Discounts</h4>
                        <form className="row gy-3" onSubmit={handleApply}>
                            <div className="col-12">
                                <label className="form-label">Coupon code</label>
                                <input
                                    className="form-control"
                                    placeholder="Example: IELTS10"
                                    value={form.couponCode}
                                    onChange={(event) => setForm((current) => ({ ...current, couponCode: event.target.value }))}
                                />
                            </div>
                            <div className="col-12">
                                <label className="form-label">Use loyalty points</label>
                                <input
                                    className="form-control"
                                    type="number"
                                    min="0"
                                    max={preview?.pointsBalance || 0}
                                    placeholder={`Available: ${preview?.pointsBalance || 0}`}
                                    value={form.pointsToUse}
                                    onChange={(event) => setForm((current) => ({ ...current, pointsToUse: event.target.value }))}
                                />
                                <small className="text-muted">Available balance: {preview?.pointsBalance || 0} points</small>
                            </div>
                            <div className="col-12">
                                <button className="btn btn-outline-primary w-100" type="submit" disabled={loading}>Apply and recalculate</button>
                            </div>
                        </form>
                        <hr />
                        <Link className="btn btn-link px-0" to={`/courses/${courseId}`}>Back to course detail</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;



