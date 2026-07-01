import { useEffect, useState } from 'react';
import { getProfile } from '../services/auth';
import { updateProfile } from '../services/profile';
import { useAuth } from '../context/AuthContext';

const createProfileForm = (profile = {}) => ({
    fullName: profile.fullName || '',
    phone: profile.phone || '',
    address: profile.address || '',
    avatar: profile.avatar || '',
    avatarFile: null
});

const Profile = () => {
    const { user, updateUser } = useAuth();
    const [formData, setFormData] = useState(createProfileForm());
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
                    setFormData(createProfileForm(profile));
                    setAvatarPreview(profile.avatar || '');
                    updateUser(profile);
                }
            } catch {
                setError('Unable to load your profile.');
            }
        };
        fetchProfile();
    }, [updateUser]);

    useEffect(() => {
        if (!formData.avatarFile) {
            setAvatarPreview(formData.avatar || '');
            return undefined;
        }

        const previewUrl = URL.createObjectURL(formData.avatarFile);
        setAvatarPreview(previewUrl);

        return () => URL.revokeObjectURL(previewUrl);
    }, [formData.avatar, formData.avatarFile]);

    const initials = (user?.fullName || user?.email || 'TK').slice(0, 2).toUpperCase();

    const handleStartEdit = () => {
        setError('');
        setSuccess('');
        setFormData(createProfileForm(user || formData));
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setError('');
        setSuccess('');
        setFormData(createProfileForm(user || formData));
        setAvatarPreview(user?.avatar || formData.avatar || '');
        setIsEditing(false);
    };

    const handleChange = (event) => {
        setFormData({ ...formData, [event.target.name]: event.target.value });
    };

    const handleAvatarChange = (event) => {
        const file = event.target.files?.[0];

        setError('');
        setSuccess('');

        if (!file) {
            setFormData({ ...formData, avatarFile: null });
            return;
        }

        if (!file.type.startsWith('image/')) {
            setError('Please select a valid image file.');
            event.target.value = '';
            return;
        }

        setFormData({ ...formData, avatarFile: file });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await updateProfile(formData);
            if (response.data?.data) {
                const updatedProfile = response.data.data;
                updateUser(updatedProfile);
                setFormData(createProfileForm(updatedProfile));
                setAvatarPreview(updatedProfile.avatar || '');
            }
            setSuccess('Profile updated successfully.');
            setIsEditing(false);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Update failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid px-0 py-3">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4 p-4 bg-white rounded-4 border">
                <div>
                    <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-1.5 mb-2 text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>Account Settings</span>
                    <h2 className="fw-bold mb-1 text-dark">Your Profile</h2>
                    <p className="text-muted mb-0">Review your account details or edit your personal information.</p>
                </div>
                <div className="d-flex align-items-center gap-3 bg-light p-3 rounded-4 border">
                    <div className="account-avatar d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 overflow-hidden" style={{ width: '48px', height: '48px', fontSize: '1.15rem', fontWeight: 'bold' }}>
                        {avatarPreview ? (
                            <img src={avatarPreview} alt="Avatar" className="w-100 h-100" style={{ objectFit: 'cover' }} />
                        ) : initials}
                    </div>
                    <div>
                        <div className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>{user?.fullName || 'My account'}</div>
                        <small className="text-muted">{user?.email}</small>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                <div className="col-lg-4">
                    <div className="card h-100 border-0 shadow-sm rounded-4">
                        <div className="card-header bg-transparent border-bottom-0 pt-4 px-4 pb-2">
                            <h4 className="fw-bold text-dark mb-0 fs-5">Account Overview</h4>
                        </div>
                        <div className="card-body p-4 d-flex flex-column gap-3">
                            <div className="d-flex flex-column align-items-center gap-3 p-3 bg-light rounded-3 border">
                                <div className="account-avatar d-flex align-items-center justify-content-center rounded-circle overflow-hidden" style={{ width: '112px', height: '112px', fontSize: '2rem', fontWeight: 'bold' }}>
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Avatar preview" className="w-100 h-100" style={{ objectFit: 'cover' }} />
                                    ) : initials}
                                </div>
                                <small className="text-muted text-center">Your selected avatar will appear across the account navigation.</small>
                            </div>
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

                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm rounded-4">
                        <div className="card-header bg-transparent border-bottom-0 pt-4 px-4 pb-2 d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">
                            <div>
                                <h4 className="fw-bold text-dark mb-0 fs-5">Profile Details</h4>
                                <p className="text-muted mb-0 small">{isEditing ? 'Update your information and save the changes.' : 'View your saved personal information.'}</p>
                            </div>
                            {!isEditing && (
                                <button type="button" className="btn btn-primary px-4 py-2 auth-primary-btn rounded-3 fw-bold" onClick={handleStartEdit}>
                                    Edit Profile
                                </button>
                            )}
                        </div>
                        <div className="card-body p-4">
                            {error && <div className="alert alert-danger py-2 mb-4">{error}</div>}
                            {success && <div className="alert alert-success py-2 mb-4">{success}</div>}

                            {!isEditing ? (
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <div className="p-3 bg-light rounded-3 border h-100">
                                            <small className="text-muted d-block text-uppercase fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Full Name</small>
                                            <strong className="text-dark d-block text-break mt-1">{user?.fullName || '-'}</strong>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="p-3 bg-light rounded-3 border h-100">
                                            <small className="text-muted d-block text-uppercase fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Phone</small>
                                            <strong className="text-dark d-block text-break mt-1">{user?.phone || '-'}</strong>
                                        </div>
                                    </div>
                                    <div className="col-12">
                                        <div className="p-3 bg-light rounded-3 border">
                                            <small className="text-muted d-block text-uppercase fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>Address</small>
                                            <strong className="text-dark d-block text-break mt-1">{user?.address || '-'}</strong>
                                        </div>
                                    </div>
                                </div>
                            ) : (
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
                                        <label className="form-label fw-semibold text-dark small">Avatar</label>
                                        <input type="file" name="avatarFile" className="form-control form-control-lg py-2.5 rounded-3 fs-6" accept="image/png,image/jpeg" onChange={handleAvatarChange} />
                                    </div>
                                    <div className="col-12 mt-4 d-flex flex-column flex-sm-row gap-2">
                                        <button type="submit" className="btn btn-primary btn-lg px-4 py-2.5 flex-fill auth-primary-btn rounded-3 fw-bold" disabled={loading}>
                                            {loading ? 'Saving...' : 'Update Profile'}
                                        </button>
                                        <button type="button" className="btn btn-outline-secondary btn-lg px-4 py-2.5 flex-fill rounded-3 fw-bold" onClick={handleCancelEdit} disabled={loading}>
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
