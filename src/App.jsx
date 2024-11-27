import './App.scss';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import ManageUser from './components/Container/ManageUser';
import Nav from './components/Container/Nav';
import AttendanceToday from './components/Container/AttendanceToday';
import Login from './components/Container/Login';
import Signup from './components/Container/Signup';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import History from './components/Container/History';
import Statistics from './components/Container/Statistics';
import DetailUserAttendanceMonth from './components/Container/DetailUserAttendanceMonth';
import ProtectedRoute from './components/protectedRoute/ProtectedRoute'; // Import the ProtectedRoute component
import DeviceManagement from './components/Container/DeviceManagement';
class App extends Component {
  render() {
    const { isAuthenticated } = this.props;

    return (
      <Router>
        <div className='app-container'>
          {isAuthenticated && <Nav />}
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route 
              path="/manage-user" 
              element={
                <ProtectedRoute>
                  <ManageUser />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/history" 
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/statistics" 
              element={
                <ProtectedRoute>
                  <Statistics />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <AttendanceToday />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/device-management" 
              element={
                <ProtectedRoute>
                  <DeviceManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/detail-user" 
              element={
                <ProtectedRoute>
                  <DetailUserAttendanceMonth />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    );
  }
}

// Map authentication state from Redux store to props
const mapStateToProps = (state) => {
  return {
    isAuthenticated: state.auth.isAuthenticated,
  };
};

// Connect component to Redux store
export default connect(mapStateToProps)(App);
