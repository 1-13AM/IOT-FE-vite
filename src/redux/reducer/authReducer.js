const initialState = {
    isAuthenticated: false,
    // username: '', // Add username to the state
};

const authReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'LOGIN_SUCCESS':
            // return { ...state, isAuthenticated: true, username: action.payload.username }; // Store username
            return { ...state, isAuthenticated: true}
        case 'LOGOUT':
            // return { ...state, isAuthenticated: false, username: '' }; // Clear username on logout
            return { ...state, isAuthenticated: false}
        default:
            return state;
    }
};

export default authReducer;