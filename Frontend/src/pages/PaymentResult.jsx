import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import CourseImage from '../components/CourseImage';
import { getOrderById } from '../services/order';

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')} VND`;

const PaymentResult = () => {
    const [searchParams] = useSearchParams();
    const status = searchParams.get('status') || 'failed';
    const orderId = searchParams.get('orderId') || '';
    const responseCode = searchParams.get('responseCode') || '';
    const message = searchParams.get('message') || '';
    const isSuccess = status === 'success';
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(Boolean(orderId));

    useEffect(() => {
        if (!orderId) return undefined;

        let isMounted = true;
        const loadOrder = async () => {
            try {
                const response = await getOrderById(orderId);
                if (isMounted) setOrder(response.data.order);
            } catch {
                if (isMounted) setOrder(null);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadOrder();

        return () => {
            isMounted = false;
        };
    }, [orderId]);

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                        <div className={`p-4 p-md-5 ${isSuccess ? 'bg-success-subtle' : 'bg-danger-subtle'}`}>
                            <span className={`badge rounded-pill px-3 py-2 mb-3 ${isSuccess ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                                {isSuccess ? 'Payment Successful' : 'Payment Failed'}
                            </span>
                            <h2 className="fw-bold text-dark mb-2">
                                {isSuccess ? 'Your enrollment is confirmed.' : 'We could not complete your payment.'}
                            </h2>
                            <p className="text-muted mb-0">
                                {message || (isSuccess ? 'VNPAY confirmed your payment successfully.' : 'Please try again or review your order history.')}
                            </p>
                        </div>

                        <div className="p-4 p-md-5">
                            {loading ? (
                                <div className="text-muted">Loading order details...</div>
                            ) : order ? (
                                <div className="d-flex flex-column flex-md-row gap-3 align-items-md-center mb-4 p-3 bg-light rounded-3 border">
                                    <CourseImage course={order.course} className="list-card__image" />
                                    <div className="flex-grow-1">
                                        <h5 className="fw-bold mb-1">{order.course?.title || 'Course'}</h5>
                                        <div className="text-muted small">Order ID: {order._id}</div>
                                        <div className="text-muted small">Status: {order.status}</div>
                                        <div className="text-muted small">Amount: {formatCurrency(order.amount)}</div>
                                        {order.class && (
                                            <div className="text-muted small">Class: {order.class.code || order.class.name || 'Assigned class'}</div>
                                        )}
                                    </div>
                                </div>
                            ) : orderId ? (
                                <div className="alert alert-light border mb-4">Order ID: {orderId}</div>
                            ) : null}

                            {responseCode && (
                                <div className="text-muted small mb-4">VNPAY response code: {responseCode}</div>
                            )}

                            <div className="d-flex flex-column flex-sm-row gap-2">
                                {isSuccess ? (
                                    <Link className="btn btn-primary btn-lg flex-fill auth-primary-btn" to="/my-learning">
                                        Go to My Learning
                                    </Link>
                                ) : (
                                    <Link className="btn btn-primary btn-lg flex-fill auth-primary-btn" to="/orders">
                                        View Orders
                                    </Link>
                                )}
                                <Link className="btn btn-outline-secondary btn-lg flex-fill" to="/courses">
                                    Browse Courses
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentResult;
