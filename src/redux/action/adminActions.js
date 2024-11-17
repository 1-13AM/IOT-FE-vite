import actionTypes from "./actionTypes";
import { getAllAttendanceToday } from "../../services/userService";

export const fetchAllAttendanceToday = () => {
    return async (dispatch, getState) => {
        try {
            let res = await getAllAttendanceToday();
            if (res && res.errCode === 0) {
                dispatch({
                    type: actionTypes.FETCH_ALL_ATTENDANCE_TODAY_SUCCED,
                    data: res.data
                });
            } else {
                dispatch({
                    type: actionTypes.FETCH_ALL_ATTENDANCE_TODAY_FAILED
                });
            }
        } catch (e) {
            dispatch({
                type: actionTypes.FETCH_ALL_ATTENDANCE_TODAY_FAILED
            });
        }
    };
};
