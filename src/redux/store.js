import { configureStore } from '@reduxjs/toolkit'; // Nhập configureStore từ Redux Toolkit
import rootReducer from './reducer/rootReducer'; // Nhập rootReducer

// Tạo store với configureStore
const store = configureStore({
    reducer: rootReducer, // Gán rootReducer
    middleware: (getDefaultMiddleware) => getDefaultMiddleware(), // Sử dụng middleware mặc định, bao gồm thunk
});

export default store;

// import { createStore, combineReducers } from 'redux';
// import countReducer from './Reducers';

// const rootReducer = combineReducers({
//   count: countReducer
// });

// export const store = createStore(rootReducer);