import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Users, Clock, BarChart, LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip"
import { useDispatch, useSelector } from 'react-redux';

const Nav = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/login');
  };

  return (
    <div className="bg-emerald-600 text-white px-6 py-3 flex items-center shadow-lg">
      {/* Logo or Brand - You can add one here */}
      <div className="flex-1 flex items-center space-x-6">
        <NavLink 
          to="/"
          className={({ isActive }) => 
            `transition-all duration-200 ease-in-out transform hover:scale-105 ${
              isActive ? 'bg-emerald-700 rounded-lg' : ''
            }`}
        >
          <Button variant="ghost" className="text-white hover:bg-emerald-700">
            <Users className="h-5 w-5 mr-2" />
            Home
          </Button>
        </NavLink>
        
        <NavLink 
          to="/manage-user"
          className={({ isActive }) => 
            `transition-all duration-200 ease-in-out transform hover:scale-105 ${
              isActive ? 'bg-emerald-700 rounded-lg' : ''
            }`}
        >
          <Button variant="ghost" className="text-white hover:bg-emerald-700">
            <Users className="h-5 w-5 mr-2" />
            Quản lý Nhân Viên
          </Button>
        </NavLink>
        
        <NavLink 
          to="/history"
          className={({ isActive }) => 
            `transition-all duration-200 ease-in-out transform hover:scale-105 ${
              isActive ? 'bg-emerald-700 rounded-lg' : ''
            }`}
        >
          <Button variant="ghost" className="text-white hover:bg-emerald-700">
            <Clock className="h-5 w-5 mr-2" />
            Lịch sử chấm công
          </Button>
        </NavLink>
        
        <NavLink 
          to="/statistics"
          className={({ isActive }) => 
            `transition-all duration-200 ease-in-out transform hover:scale-105 ${
              isActive ? 'bg-emerald-700 rounded-lg' : ''
            }`}
        >
          <Button variant="ghost" className="text-white hover:bg-emerald-700">
            <BarChart className="h-5 w-5 mr-2" />
            Thống kê
          </Button>
        </NavLink>

        <NavLink 
          to="/device-management"
          className={({ isActive }) => 
            `transition-all duration-200 ease-in-out transform hover:scale-105 ${
              isActive ? 'bg-emerald-700 rounded-lg' : ''
            }`}
        >
          <Button variant="ghost" className="text-white hover:bg-emerald-700">
            <BarChart className="h-5 w-5 mr-2" />
            Quản lý thiết bị
          </Button>
        </NavLink>
      </div>

      <div className="flex items-center space-x-4">
        {/* Clock display */}
        <div className="bg-emerald-700 px-4 py-2 rounded-lg shadow-md transition-all duration-200 hover:bg-emerald-800">
          {currentTime.toLocaleTimeString('en-US', { 
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          })}
        </div>

        {/* Elegant Logout Button with Tooltip */}
        {isAuthenticated && (
          <TooltipProvider>
            <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={handleLogout} 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-emerald-700/80 transition-all duration-200"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Logout</p>
            </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};

export default Nav;