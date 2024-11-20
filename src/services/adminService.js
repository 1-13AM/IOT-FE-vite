import axios from '../utils/axios';
const loginAdmin=(dataInput)=>{
    console.log(dataInput);
    return axios.post(`/api/login`, dataInput)
}
const signupAdmin=(dataInput)=>{
    return axios.post(`/api/signup`, dataInput)
}
const logoutAdmin=(dataInput)=>{
    return axios.post(`/api/logout`)
}

export {
    loginAdmin,
    signupAdmin,
    logoutAdmin,
}