import actionTypes from "../action/actionTypes";

const initialState = {
    allAttendanceToday: []
};

const adminReducer = (state = initialState, action) => {
    switch (action.type) {
        case actionTypes.FETCH_ALL_ATTENDANCE_TODAY_SUCCED:
            return {
                ...state,
                allAttendanceToday: action.data // Sử dụng spread operator để giữ nguyên state
            };
        case actionTypes.FETCH_ALL_ATTENDANCE_TODAY_FAILED:
            return {
                ...state,
                allAttendanceToday: [] // Reset lại attendance
            };
        default:
            return state;
    }
};

export default adminReducer;
