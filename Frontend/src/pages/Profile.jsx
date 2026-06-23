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
        <div className="profile-page">
            <section className="profile-header">
                <div>
                    <span className="eyebrow">Account settings</span>
                    <h1>Profile của bạn</h1>
                    <p>Chỉnh sửa thông tin cá nhân và lưu lại để cập nhật hồ sơ.</p>
                </div>

                <div className="profile-summary">
                    <div className="profile-summary__avatar">{(user?.fullName || user?.email || 'TK').slice(0, 2).toUpperCase()}</div>
                    <div>
                        <strong>{user?.fullName || 'My account'}</strong>
                        <span>{user?.email}</span>
                    </div>
                </div>
            </section>

            <section className="profile-grid">
                <div className="profile-card profile-card--info">
                    <h2>Thông tin hiện tại</h2>
                    <div className="profile-info-list">
                        <div><span>Email</span><strong>{user?.email || '-'}</strong></div>
                        <div><span>Role</span><strong>{user?.role || '-'}</strong></div>
                        <div><span>Status</span><strong>{user?.status || '-'}</strong></div>
                    </div>
                </div>

                <div className="profile-card">
                    <h2>Cập nhật profile</h2>
                    <p>Điền đầy đủ thông tin rồi lưu thay đổi.</p>

                    {error ? <div className="alert alert-danger py-2">{error}</div> : null}
                    {success ? <div className="alert alert-success py-2">{success}</div> : null}

                    <form className="profile-form" onSubmit={handleSubmit}>
                        <label className="field-label">
                            Full name
                            <input type="text" name="fullName" className="form-control form-control-lg" value={formData.fullName} onChange={handleChange} required />
                        </label>
                        <label className="field-label">
                            Phone
                            <input type="text" name="phone" className="form-control form-control-lg" value={formData.phone} onChange={handleChange} required />
                        </label>
                        <label className="field-label">
                            Address
                            <input type="text" name="address" className="form-control form-control-lg" value={formData.address} onChange={handleChange} required />
                        </label>
                        <label className="field-label">
                            Avatar URL
                            <input type="text" name="avatar" className="form-control form-control-lg" value={formData.avatar} onChange={handleChange} />
                        </label>

                        <button type="submit" className="btn btn-primary btn-lg w-100 auth-primary-btn" disabled={loading}>
                            {loading ? 'Saving...' : 'Cập nhật Profile'}
                        </button>
                    </form>
                </div>
            </section>
        </div>
    );
};

export default Profile;