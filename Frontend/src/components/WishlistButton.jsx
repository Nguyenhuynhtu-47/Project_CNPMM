import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addToWishlist, removeFromWishlist } from '../services/wishlist';

const WishlistButton = ({ courseId, initialIsWishlisted, isLoggedIn, className = '' }) => {
    const [isWishlisted, setIsWishlisted] = useState(initialIsWishlisted);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        setIsWishlisted(initialIsWishlisted);
    }, [initialIsWishlisted]);

    const handleToggle = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }
        setLoading(true);
        try {
            if (isWishlisted) {
                await removeFromWishlist(courseId);
                setIsWishlisted(false);
            } else {
                await addToWishlist(courseId);
                setIsWishlisted(true);
            }
        } catch (error) {
            console.error('Cannot toggle wishlist', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button 
            type="button" 
            className={`btn btn-light rounded-circle shadow-sm d-flex align-items-center justify-content-center p-0 ${className}`}
            style={{ width: '36px', height: '36px', transition: 'all 0.2s', zIndex: 10 }}
            onClick={handleToggle}
            disabled={loading}
            title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
        >
            <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill={isWishlisted ? "var(--bs-danger, #dc3545)" : "none"} 
                stroke={isWishlisted ? "var(--bs-danger, #dc3545)" : "currentColor"} 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ transform: isWishlisted ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.2s' }}
            >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
        </button>
    );
};

export default WishlistButton;
