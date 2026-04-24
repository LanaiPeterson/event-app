import React, { createContext, useContext, useState } from 'react';

// Create the Notification Context
const NotificationContext = createContext();

// Notification Provider
export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [alerts, setAlerts] = useState([]);

    const addNotification = (notification) => {
        setNotifications((prev) => [...prev, notification]);
    };

    const addAlert = (alert) => {
        setAlerts((prev) => [...prev, alert]);
    };

    return (
        <NotificationContext.Provider value={{ notifications, alerts, addNotification, addAlert }}>
            {children}
        </NotificationContext.Provider>
    );
};

// Custom hook to use the Notification Context
export const useNotification = () => {
    return useContext(NotificationContext);
};
