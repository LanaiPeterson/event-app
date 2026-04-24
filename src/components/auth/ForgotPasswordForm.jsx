import React, { useState } from 'react';

const ForgotPasswordForm = () => {
    const [email, setEmail] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        // Add password reset functionality here
        console.log('Password reset link sent to: ', email);
    };

    return (
        <form onSubmit={handleSubmit}>
            <label htmlFor="email">Email:</label>
            <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <button type="submit">Reset Password</button>
        </form>
    );
};

export default ForgotPasswordForm;