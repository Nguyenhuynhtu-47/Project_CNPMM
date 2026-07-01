import { useEffect, useState } from 'react';
import { getProfile } from '../services/auth';
import { updateProfile } from '../services/profile';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        address: '',
        avatar: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await getProfile();
                if (res.data && res.data.user) {
                    const profile = res.data.user;
                    setFormData({
                        fullName: profile.fullName || '',
                        phone: profile.phone || '',
                        address: profile.address || '',
                        avatar: profile.avatar || '',
                    });
                    updateUser(profile);
                }
            } catch {
                setError('Không thể tải profile của bạn.');
            }
        };
        fetchProfile();
    }, [updateUser]);

    const handleChange = (event) => {
        setFormData({ ...formData, [event.target.name]: event.target.value });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await updateProfile(formData);
            if (response.data?.data) {
                updateUser(response.data.data);
            }
            setSuccess('Cập nhật profile thành công.');
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Update failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid px-0 py-3">
            {/* Header Block */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4 p-4 bg-white rounded-4 border">
                <div>
                    <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-1.5 mb-2 text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>Account Settings</span>
                    <h2 className="fw-bold mb-1 text-dark">Profile của bạn</h2>
                    <p className="text-muted mb-0">Chỉnh sửa thông tin cá nhân và lưu lại để cập nhật hồ sơ.</p>
                </div>
                <div className="d-flex align-items-center gap-3 bg-light p-3 rounded-4 border">
                    <div className="account-avatar d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: '48px', height: '48px', fontSize: '1.15rem', fontWeight: 'bold' }}>
                        {(user?.fullName || user?.email || 'TK').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>{user?.fullName || 'My account'}</div>
                        <small className="text-muted">{user?.email}</small>
                    </div>
                </div>
            </div>

            {/* Grid Section */}
            <div className="row g-4">
                {/* Details Column */}
                <div className="col-lg-4">
                    <div className="card h-100 border-0 shadow-sm rounded-4">
                        <div className="card-header bg-transparent border-bottom-0 pt-4 px-4 pb-2">
                            <h4 className="fw-bold text-dark mb-0 fs-5">Thông tin hiện tại</h4>
                        </div>
                        <div className="card-body p-4 d-flex flex-column gap-3">
                            <div className="p-3 bg-light rounded-3 border">
                                <small className="text-muted d-block text-uppercase fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Email</small>
                                <strong className="text-dark d-block text-break mt-1">{user?.email || '-'}</strong>
                            </div>
                            <div className="p-3 bg-light rounded-3 border">
                                <small className="text-muted d-block text-uppercase fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Role</small>
                                <strong className="text-dark d-block mt-1">{user?.role || '-'}</strong>
                            </div>
                            <div className="p-3 bg-light rounded-3 border">
                                <small className="text-muted d-block text-uppercase fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Status</small>
                                <strong className="text-dark d-block mt-1">{user?.status || '-'}</strong>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit Form Column */}
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm rounded-4">
                        <div className="card-header bg-transparent border-bottom-0 pt-4 px-4 pb-2">
                            <h4 className="fw-bold text-dark mb-0 fs-5">Cập nhật profile</h4>
                            <p className="text-muted mb-0 small">Điền đầy đủ thông tin rồi lưu thay đổi.</p>
                        </div>
                        <div className="card-body p-4">
                            {error && <div className="alert alert-danger py-2 mb-4">{error}</div>}
                            {success && <div className="alert alert-success py-2 mb-4">{success}</div>}

                            <form onSubmit={handleSubmit} className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold text-dark small">Full Name</label>
                                    <input type="text" name="fullName" className="form-control form-control-lg py-2.5 rounded-3 fs-6" value={formData.fullName} onChange={handleChange} required />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold text-dark small">Phone</label>
                                    <input type="text" name="phone" className="form-control form-control-lg py-2.5 rounded-3 fs-6" value={formData.phone} onChange={handleChange} required />
                                </div>
                                <div className="col-12">
                                    <label className="form-label fw-semibold text-dark small">Address</label>
                                    <input type="text" name="address" className="form-control form-control-lg py-2.5 rounded-3 fs-6" value={formData.address} onChange={handleChange} required />
                                </div>
                                <div className="col-12">
                                    <label className="form-label fw-semibold text-dark small">Avatar URL</label>
                                    <input type="text" name="avatar" className="form-control form-control-lg py-2.5 rounded-3 fs-6" value={formData.avatar} onChange={handleChange} />
                                </div>
                                <div className="col-12 mt-4">
                                    <button type="submit" className="btn btn-primary btn-lg px-4 py-2.5 w-100 auth-primary-btn rounded-3 fw-bold" disabled={loading}>
                                        {loading ? 'Saving...' : 'Cập nhật Profile'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;