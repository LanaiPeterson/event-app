import React, { createContext, useContext, useReducer } from 'react';

// Initialize the context
const SavedEventsContext = createContext();

// Define initial state
const initialState = {
    savedEvents: [],
};

// Define reducer function
const reducer = (state, action) => {
    switch (action.type) {
        case 'ADD_EVENT':
            return { ...state, savedEvents: [...state.savedEvents, action.payload] };
        case 'REMOVE_EVENT':
            return { ...state, savedEvents: state.savedEvents.filter(event => event.id !== action.payload.id) };
        case 'CHECK_EVENT':
            return state.savedEvents.some(event => event.id === action.payload.id);
        default:
            return state;
    }
};

// Provide context to children components
const SavedEventsProvider = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, initialState);

    const addEvent = (event) => { dispatch({ type: 'ADD_EVENT', payload: event }); };
    const removeEvent = (event) => { dispatch({ type: 'REMOVE_EVENT', payload: event }); };
    const checkEvent = (event) => { return dispatch({ type: 'CHECK_EVENT', payload: event }); };

    return (
        <SavedEventsContext.Provider value={{ state, addEvent, removeEvent, checkEvent }}>
            {children}
        </SavedEventsContext.Provider>
    );
};

// Custom hook for using saved events context
const useSavedEvents = () => {
    return useContext(SavedEventsContext);
};

export { SavedEventsProvider, useSavedEvents };