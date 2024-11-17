import axios from '../utils/axios';
const getAllCode = (type) => {
    return axios.get(`/api/get-allcode?type=${type}`);
}
const addNewUser = (dataInput) => {
    return axios.post(`/api/add-new-user`,dataInput);
}
const getAllUser = () => {
    return axios.get(`/api/get-all-user`);
}
const putSaveUser = (data) => {
    return axios.put(`/api/put-save-user`,data);
}
const deleteUser = (id) => {
    return axios.delete(`/api/delete-user`,{data:{id:id}});
}
const getUserByRfid = (rfid) => {
    return axios.get(`/api/get-user-by-rfid?rfid=${rfid}`);
}
const getAllAttendanceToday=()=>{
    return axios.get(`api/get-all-attendance-today`)
}
const createAttendanceAndHistory=(data)=>{
    return axios.post(`/api/create-attendance-and-history`,data)
}
const getAllHistory=(data)=>{
    return axios.get(`/api/get-all-history?userId=${data.userId}&timestamp=${data.timestamp}`,)
}
const getUserAttendanceByDay=(day)=>{
    return axios.get(`/api/get-user-attendance-by-day?date=${day}`)
}
const getUserAttendanceByWeek=(week)=>{
    return axios.get(`/api/get-user-attendance-by-week?date=${week}`)
}
const getUserAttendanceByMonth=(month)=>{
    return axios.get(`/api/get-user-attendance-by-month?month=${month}`)
}
const getUserAttendanceByYear=(year)=>{
    return axios.get(`/api/get-user-attendance-by-year?year=${year}`)
}
const getAttendanceByIdAndMonth=(data)=>{
    return axios.get(`/api/get-attendance-by-id-and-month?id=${data.id}&month=${data.month}`)
}
export {
    getAllCode,
    addNewUser,
    getAllUser,
    putSaveUser,
    deleteUser,
    getUserByRfid,
    getAllAttendanceToday,
    createAttendanceAndHistory,
    getAllHistory,
    getUserAttendanceByDay,
    getUserAttendanceByWeek,
    getUserAttendanceByMonth,
    getUserAttendanceByYear,
    getAttendanceByIdAndMonth
}