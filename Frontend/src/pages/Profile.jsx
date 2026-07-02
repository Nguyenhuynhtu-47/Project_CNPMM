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
        <div className="container mx-auto px-4 py-6 max-w-5xl">
            {/* Header Block */}
            <div className="mb-6 pb-5 border-b border-slate-200">
                <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Account Settings</h1>
                <p className="text-sm text-slate-500 mt-1">Review your account details or edit your personal information.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                {/* Left Card: Account Overview */}
                <div className="col-span-1 md:col-span-4 bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full border border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 font-bold text-slate-800 text-3xl mb-4 shrink-0 shadow-sm">
                        {avatarPreview ? (
                            <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                        ) : initials}
                    </div>

                    <h3 className="text-base font-semibold text-slate-900 text-center truncate w-full mb-1">
                        {user?.fullName || 'My Account'}
                    </h3>
                    <p className="text-xs text-slate-500 text-center truncate w-full mb-4">
                        {user?.email}
                    </p>

                    <div className="w-full space-y-2 pt-3 border-t border-slate-100">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500">Role</span>
                            <span className="inline-flex px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-700 font-medium">
                                {user?.role || '-'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500">Status</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${
                                user?.status === 'ACTIVE'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-slate-50 text-slate-500 border-slate-200'
                            }`}>
                                <span className={`w-1 h-1 rounded-full ${user?.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                {user?.status || '-'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Card: Profile Details */}
                <div className="col-span-1 md:col-span-8 bg-white rounded-lg border border-slate-200 shadow-sm p-5">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 mb-4 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-semibold text-slate-900">Personal Information</h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {isEditing ? 'Update your information and save the changes.' : 'View your saved personal details.'}
                            </p>
                        </div>
                        {!isEditing && (
                            <button
                                type="button"
                                onClick={handleStartEdit}
                                className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition shadow-sm cursor-pointer whitespace-nowrap"
                            >
                                Edit Profile
                            </button>
                        )}
                    </div>

                    {error && <div className="p-3 mb-4 text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded">{error}</div>}
                    {success && <div className="p-3 mb-4 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded">{success}</div>}

                    {!isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-3.5 bg-slate-50/50 border border-slate-100 rounded-md">
                                <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Full Name</span>
                                <span className="block text-sm font-semibold text-slate-800">{user?.fullName || '-'}</span>
                            </div>
                            <div className="p-3.5 bg-slate-50/50 border border-slate-100 rounded-md">
                                <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Phone Number</span>
                                <span className="block text-sm font-semibold text-slate-800">{user?.phone || '-'}</span>
                            </div>
                            <div className="col-span-1 md:col-span-2 p-3.5 bg-slate-50/50 border border-slate-100 rounded-md">
                                <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Address</span>
                                <span className="block text-sm font-semibold text-slate-800">{user?.address || '-'}</span>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="col-span-1">
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number</label>
                                <input
                                    type="text"
                                    name="phone"
                                    className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                    value={formData.address}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Avatar Image</label>
                                <input
                                    type="file"
                                    name="avatarFile"
                                    className="w-full bg-white border border-slate-200 rounded-md px-3 py-1 text-sm text-slate-900 file:border-0 file:bg-slate-50 file:text-slate-700 file:px-3 file:py-1 file:mr-3 file:rounded-md file:text-xs file:font-semibold hover:file:bg-slate-100 transition"
                                    accept="image/png,image/jpeg"
                                    onChange={handleAvatarChange}
                                />
                            </div>
                            <div className="col-span-1 md:col-span-2 flex flex-col sm:flex-row gap-2 mt-2">
                                <button
                                    type="submit"
                                    className="px-4 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition shadow-sm cursor-pointer flex-fill"
                                    disabled={loading}
                                >
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="px-4 py-2.5 text-sm font-semibold border border-slate-200 text-slate-600 rounded-md hover:bg-slate-50 transition cursor-pointer flex-fill"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
