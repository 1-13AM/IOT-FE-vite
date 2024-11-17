import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAllCode } from '../../services/userService';  // Add this import
import { Home, Users, Clock, Phone, Search, FilterIcon, MoreVertical, Calendar, BarChart } from 'lucide-react';
import moment from 'moment-timezone';
import { connect } from "react-redux";
import { fetchAllAttendanceToday } from '../../redux/action/adminActions';
import { getAllUser, createAttendanceAndHistory } from '../../services/userService';

const AttendanceToday = ({ allAttendanceToday, fetchAllAttendanceToday }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [allUsers, setAllUsers] = useState([]);
  const [listUserTable, setListUserTable] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [positionList, setPositionList] = useState([]);
  
  // Initialize data and set up polling
  useEffect(() => {
    const fetchData = async () => {
      // Fetch users
      const res = await getAllUser();
      if (res && res.errCode === 0) {
        setAllUsers(res.data);
      }

      // Fetch positions
      const positions = await getAllCode('POSITION');
      if (positions && positions.errCode === 0) {
        const formattedPositions = positions.data.map(pos => ({
          label: pos.valueV,
          value: pos.keyMap
        }));
        setPositionList(formattedPositions);
      }

      fetchAllAttendanceToday();
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchAllAttendanceToday]);

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, []);

  // Build data when attendance or users change
  useEffect(() => {
    if (allUsers.length > 0 && allAttendanceToday) {
      const updatedUsers = allUsers.map(item => {
        const attendance = allAttendanceToday.find(check => check.idUser === item.id);
        if (attendance) {
          return {
            ...item,
            isAttendance: true,
            timecheck: convertTimestampToDate(attendance.timecheck),
            status: attendance.status,
            note: attendance.note
          };
        }
        return {
          ...item,
          isAttendance: false,
          timecheck: '00:00:00',
          status: 'Chưa chấm công',
          note: ''
        };
      });
      setListUserTable(updatedUsers);
    }
  }, [allUsers, allAttendanceToday]);

  const convertTimestampToDate = (timestamp) => {
    const timeInMillis = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
    return moment.tz(timeInMillis, 'Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');
  };

  const handleAttendance = async (item) => {
    const res = await createAttendanceAndHistory({
      id: item.id,
      timestamp: new Date().getTime(),
      note: 'Admin chấm công hộ'
    });
    if (res && res.errCode === 0) {
      fetchAllAttendanceToday();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('vi-VN', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'numeric', 
      year: 'numeric' 
    });
  };

  const filteredUsers = listUserTable.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.rfid.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = 
    selectedPosition === 'all' || 
    user.roleId === selectedPosition || // Check against roleId
    (user.positionData && user.positionData.keyMap === selectedPosition); // Check against positionData

  return matchesSearch && matchesPosition;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}

      {/* Main Content */}
      <div className="p-6">
        {/* Stats Cards */}
        <div className="flex gap-6 mb-6 flex-wrap">
          <Card className="w-72 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Today's Date</p>
                  <p className="font-medium mt-1">{formatDate(currentTime)}</p>
                </div>
                <div className="bg-emerald-100 p-2 rounded-lg">
                  <Calendar className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="w-72 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Employees</p>
                  <p className="font-medium mt-1">{allUsers.length}</p>
                </div>
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table Section */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-medium">Danh sách điểm danh ngày hôm nay</h2>
              <p className="text-sm text-gray-500">Quản lý và theo dõi nhân viên điểm danh</p>
            </div>

            <div className="flex justify-between items-center mb-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <FilterIcon className="h-4 w-4" />
                  {selectedPosition === 'all' 
                    ? 'Tất cả chức vụ' 
                    : positionList.find(p => p.value === selectedPosition)?.label || 'Chọn chức vụ'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => {
                  console.log('Setting position to all'); // Debug log
                  setSelectedPosition('all');
                }}>
                  Tất cả chức vụ
                </DropdownMenuItem>
                {positionList.map((position) => (
                  <DropdownMenuItem 
                    key={position.value}
                    onClick={() => {
                      console.log('Setting position to:', position.value); // Debug log
                      setSelectedPosition(position.value);
                    }}
                  >
                    {position.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>


            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-sm text-gray-500">
                    <th className="text-left py-4 px-4 font-medium">STT</th>
                    <th className="text-left py-4 px-4 font-medium">RFID</th>
                    <th className="text-left py-4 px-4 font-medium">HỌ VÀ TÊN</th>
                    <th className="text-left py-4 px-4 font-medium">THỜI GIAN CHẤM CÔNG</th>
                    <th className="text-left py-4 px-4 font-medium">TRẠNG THÁI</th>
                    <th className="text-left py-4 px-4 font-medium">NOTE</th>
                    <th className="text-left py-4 px-4 font-medium">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-4 px-4">{index + 1}</td>
                      <td className="py-4 px-4">{item.rfid}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-emerald-100 w-8 h-8 rounded-full flex items-center justify-center text-emerald-600">
                            {item.fullName.split(' ').map(word => word[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium">{item.fullName}</p>
                            <p className="text-sm text-gray-500">{item.positionData?.valueV}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">{item.timecheck}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          item.status === 'M' ? 'bg-yellow-100 text-yellow-800' : 
                          item.status === 'Chưa chấm công' ? 'bg-gray-100 text-gray-800' : 
                          'bg-green-100 text-green-800'
                        }`}>
                          {item.status === 'M' ? 'Muộn' : 
                           item.status === 'Chưa chấm công' ? 'Chưa chấm công' : 
                           'Đúng giờ'}
                        </span>
                      </td>
                      <td className="py-4 px-4">{item.note}</td>
                      <td className="py-4 px-4">
                        {!item.isAttendance && (
                          <Button 
                            variant="secondary"
                            size="sm"
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700"
                            onClick={() => handleAttendance(item)}
                          >
                            Chấm công
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const mapStateToProps = state => ({
  allAttendanceToday: state.admin.allAttendanceToday
});

const mapDispatchToProps = {
  fetchAllAttendanceToday
};

export default connect(mapStateToProps, mapDispatchToProps)(AttendanceToday);