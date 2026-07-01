import { useEffect, useState } from 'react';
import CourseImage from '../components/CourseImage';
import PaginationControls from '../components/PaginationControls';
import { getOrders } from '../services/order';
import { createPagination } from '../utils/pagination';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(5);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { items: visibleOrders, pagination } = createPagination(orders, page, limit);

    useEffect(() => {
        const loadOrders = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await getOrders();
                setOrders(response.data.orders);
            } catch {
                setError('Unable to load order history.');
            } finally {
                setLoading(false);
            }
        };

        loadOrders();
    }, []);

    return (
        <div className="orders-page">
            <section className="section-block">
                <div className="section-heading">
                    <div>
                        <span className="eyebrow">Orders</span>
                        <h2>Payment and enrollment history</h2>
                    </div>
                    <p>Review your course payments and enrollment statuses.</p>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                {loading ? (
                    <div>Loading orders...</div>
                ) : (
                    <div className="row gy-4">
                        {orders.length === 0 ? (
                            <div className="alert alert-secondary">You do not have any orders yet.</div>
                        ) : (
                            visibleOrders.map((order) => (
                                <div className="col-12" key={order._id}>
                                    <div className="card list-card">
                                        <CourseImage course={order.course} className="list-card__image" />
                                        <div className="card-body">
                                            <h5 className="card-title">{order.course?.title || 'Unknown course'}</h5>
                                            <p className="card-text">Amount: {order.amount?.toLocaleString('vi-VN')}đ</p>
                                            <p className="card-text">Status: {order.status}</p>
                                            <p className="card-text">Method: {order.paymentMethod}</p>
                                            {order.class ? (
                                                <p className="card-text">Class: {order.class.code || order.class.name || 'Assigned class'}</p>
                                            ) : (
                                                <p className="card-text text-muted">Class: Not assigned yet</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
                {!loading && orders.length > 0 && (
                    <PaginationControls
                        pagination={pagination}
                        onPageChange={setPage}
                        onLimitChange={(nextLimit) => {
                            setLimit(nextLimit);
                            setPage(1);
                        }}
                        itemLabel="orders"
                    />
                )}
            </section>
        </div>
    );
};

export default Orders;

