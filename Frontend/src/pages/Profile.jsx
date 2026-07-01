import { useEffect, useState } from 'react';
import { getProfile } from '../services/auth';
import { updateProfile } from '../services/profile';
import { useAuth } from '../context/AuthContext';

const getInitials = (name, email) => (
    (name || email || 'TK')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase())
        .join('') || 'TK'
);

const Profile = () => {
    const { user, updateUser } = useAuth();
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        address: '',
        avatar: ''
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');
    const [isEditing, setIsEditing] = useState(false);
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
                    setAvatarPreview(profile.avatar || '');
                    updateUser(profile);
                }
            } catch {
                setError('Không thể tải profile của bạn.');
            }
        };
        fetchProfile();
    }, [updateUser]);

    useEffect(() => {
        return () => {
            if (avatarPreview.startsWith('blob:')) {
                URL.revokeObjectURL(avatarPreview);
            }
        };
    }, [avatarPreview]);

    const handleChange = (event) => {
        setFormData({ ...formData, [event.target.name]: event.target.value });
    };

    const handleAvatarChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            setAvatarFile(null);
            setAvatarPreview(formData.avatar || '');
            return;
        }

        if (avatarPreview.startsWith('blob:')) {
            URL.revokeObjectURL(avatarPreview);
        }

        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const handleCancelEdit = () => {
        setFormData({
            fullName: user?.fullName || '',
            phone: user?.phone || '',
            address: user?.address || '',
            avatar: user?.avatar || '',
        });
        setAvatarFile(null);
        setAvatarPreview(user?.avatar || '');
        setError('');
        setSuccess('');
        setIsEditing(false);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const payload = new FormData();
            payload.append('fullName', formData.fullName);
            payload.append('phone', formData.phone);
            payload.append('address', formData.address);

            if (avatarFile) {
                payload.append('avatar', avatarFile);
            }

            const response = await updateProfile(payload);
            if (response.data?.data) {
                updateUser(response.data.data);
                setFormData({
                    fullName: response.data.data.fullName || '',
                    phone: response.data.data.phone || '',
                    address: response.data.data.address || '',
                    avatar: response.data.data.avatar || '',
                });
                setAvatarPreview(response.data.data.avatar || '');
            }
            setAvatarFile(null);
            setIsEditing(false);
            setSuccess('Cập nhật profile thành công.');
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Update failed');
        } finally {
            setLoading(false);
        }
    };

    const displayAvatar = avatarPreview || user?.avatar || '';
    const displayName = formData.fullName || user?.fullName || user?.email || 'My account';

    return (
        <div className="profile-page">
            <section className="profile-header">
                <div>
                    <span className="eyebrow">Account settings</span>
                    <h1>Profile của bạn</h1>
                    <p>Xem thông tin cá nhân, bấm chỉnh sửa khi cần cập nhật hồ sơ.</p>
                </div>

                <div className="profile-summary">
                    <div className="profile-summary__avatar">
                        {displayAvatar ? <img src={displayAvatar} alt={displayName} /> : getInitials(displayName, user?.email)}
                    </div>
                    <div>
                        <strong>{displayName}</strong>
                        <span>{user?.email}</span>
                    </div>
                </div>
            </section>

            <section className="profile-grid">
                <div className="profile-card profile-card--info">
                    <h2>Thông tin hiện tại</h2>
                    <div className="profile-info-list">
                        <div><span>Họ tên</span><strong>{user?.fullName || '-'}</strong></div>
                        <div><span>Email</span><strong>{user?.email || '-'}</strong></div>
                        <div><span>Số điện thoại</span><strong>{user?.phone || '-'}</strong></div>
                        <div><span>Địa chỉ</span><strong>{user?.address || '-'}</strong></div>
                        <div><span>Role</span><strong>{user?.role || '-'}</strong></div>
                        <div><span>Status</span><strong>{user?.status || '-'}</strong></div>
                    </div>
                </div>

                <div className="profile-card">
                    <div className="profile-card__heading">
                        <div>
                            <h2>{isEditing ? 'Cập nhật profile' : 'Thông tin cá nhân'}</h2>
                            <p>{isEditing ? 'Chọn ảnh từ máy và lưu lại để cập nhật hồ sơ.' : 'Bạn cần bấm chỉnh sửa profile trước khi thay đổi thông tin.'}</p>
                        </div>
                        {!isEditing ? (
                            <button type="button" className="btn btn-outline-primary" onClick={() => setIsEditing(true)}>
                                Chỉnh sửa profile
                            </button>
                        ) : null}
                    </div>

                    {error ? <div className="alert alert-danger py-2">{error}</div> : null}
                    {success ? <div className="alert alert-success py-2">{success}</div> : null}

                    <form className="profile-form" onSubmit={handleSubmit}>
                        <div className="profile-avatar-picker">
                            <div className="profile-avatar-preview">
                                {displayAvatar ? <img src={displayAvatar} alt={displayName} /> : getInitials(displayName, user?.email)}
                            </div>
                            <label className={`btn btn-outline-primary ${!isEditing ? 'disabled' : ''}`}>
                                Chọn ảnh từ máy
                                <input type="file" accept="image/*" onChange={handleAvatarChange} disabled={!isEditing || loading} hidden />
                            </label>
                        </div>

                        <label className="field-label">
                            Full name
                            <input type="text" name="fullName" className="form-control form-control-lg" value={formData.fullName} onChange={handleChange} required disabled={!isEditing || loading} />
                        </label>
                        <label className="field-label">
                            Phone
                            <input type="text" name="phone" className="form-control form-control-lg" value={formData.phone} onChange={handleChange} required disabled={!isEditing || loading} />
                        </label>
                        <label className="field-label">
                            Address
                            <input type="text" name="address" className="form-control form-control-lg" value={formData.address} onChange={handleChange} required disabled={!isEditing || loading} />
                        </label>

                        {isEditing ? (
                            <div className="profile-form__actions">
                                <button type="button" className="btn btn-outline-secondary btn-lg" onClick={handleCancelEdit} disabled={loading}>
                                    Hủy
                                </button>
                                <button type="submit" className="btn btn-primary btn-lg auth-primary-btn" disabled={loading}>
                                    {loading ? 'Saving...' : 'Cập nhật Profile'}
                                </button>
                            </div>
                        ) : null}
                    </form>
                </div>
            </section>
        </div>
    );
};

export default Profile;
