import { combineReducers } from 'redux';
import adminReducer from './adminReducer'; // Nhập adminReducer

// Kết hợp các reducer
const rootReducer = combineReducers({
    admin: adminReducer, // Reducer cho phần admin
    // Các reducer khác có thể thêm ở đây
});

export default rootReducer;
