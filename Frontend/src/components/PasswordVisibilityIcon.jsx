const PasswordVisibilityIcon = ({ visible }) => {
    if (visible) {
        return (
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                <path d="M3 3l18 18" />
                <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                <path d="M9.4 5.5A9.9 9.9 0 0 1 12 5c5 0 8.5 4.2 9.6 6.2a1.6 1.6 0 0 1 0 1.6 14.8 14.8 0 0 1-2.2 2.8" />
                <path d="M6.7 6.8a15 15 0 0 0-4.3 4.4 1.6 1.6 0 0 0 0 1.6C3.5 14.8 7 19 12 19a10 10 0 0 0 4.1-.9" />
            </svg>
        );
    }

    return (
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path d="M2.4 11.2C3.5 9.2 7 5 12 5s8.5 4.2 9.6 6.2a1.6 1.6 0 0 1 0 1.6C20.5 14.8 17 19 12 19s-8.5-4.2-9.6-6.2a1.6 1.6 0 0 1 0-1.6z" />
            <path d="M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
        </svg>
    );
};

export default PasswordVisibilityIcon;
