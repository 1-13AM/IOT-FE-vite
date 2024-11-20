import { combineReducers } from 'redux';
import authReducer from './authReducer'; // Import the authReducer
import adminReducer from './adminReducer'; // Import other reducers

const rootReducer = combineReducers({
    auth: authReducer, // Add authReducer to the root reducer
    admin: adminReducer, // Other reducers
});

export default rootReducer;
