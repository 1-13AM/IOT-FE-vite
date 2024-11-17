import React, { Component } from 'react';
import { connect } from "react-redux";
import { getUserAttendanceByMonth, getUserAttendanceByDay, getAllHistory } from '../../services/userService';
import '../style/History.scss';
import moment from 'moment';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useNavigate } from 'react-router-dom';
import { Calendar, Download, Users, Clock, Filter, LineChart as ChartIcon, ChevronUp, ChevronDown } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/components/ui/tabs";

class Statistics extends Component {
    constructor(props) {
        super(props);
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
    
        this.state = {
            listUser: [],
            selectedMonth: currentMonth,
            selectedYear: currentYear,
            time: '',
            isLoading: false,
            timeframe: 'weekly',
            previousMonthData: [],
            analyticsData: [], // Store the current analytics data
            trendsData: [],
            departmentData: [],
            peakTimeData: [],
            todayAttendance: [],
            currentTime: moment()
        };
    }

    formatDateForExcel = (timestamp) => {
        return moment(parseInt(timestamp)).format('DD/MM/YYYY HH:mm:ss');
    }

    exportIndividualRecords = () => {
        const { listUser, selectedMonth, selectedYear } = this.state;
        
        if (!listUser || listUser.length === 0) {
            // You might want to show a notification here
            console.log('Không có dữ liệu để xuất');
            return;
        }

        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();

        // Prepare data for export
        const exportData = listUser.map((user, index) => ({
            'STT': index + 1,
            'Họ và tên': user.fullName,
            'RFID': user.rfid,
            'Giới tính': user['genderData.valueV'],
            'Phòng ban': user['positionData.valueV'],
            'Số công': user.totalAttendance || 0,
            'Số lần đi muộn': user.lateAttendance || 0
        }));

        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(exportData);

        // Add title rows with report information
        const titleData = [
            ['BÁO CÁO CHẤM CÔNG NHÂN VIÊN'],
            [`Tháng ${selectedMonth + 1}/${selectedYear}`],
            [''],  // Empty row for spacing
        ];

        // Inject title rows at the beginning
        XLSX.utils.sheet_add_aoa(worksheet, titleData, { origin: 'A1' });

        // Set column widths
        const columnWidths = [
            { wch: 5 },   // STT
            { wch: 30 },  // Họ và tên
            { wch: 15 },  // RFID
            { wch: 10 },  // Giới tính
            { wch: 20 },  // Phòng ban
            { wch: 10 },  // Số công
            { wch: 15 }   // Số lần đi muộn
        ];
        worksheet['!cols'] = columnWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Dữ liệu chấm công');

        // Generate filename
        const filename = `bao-cao-cham-cong-thang-${selectedMonth + 1}-${selectedYear}.xlsx`;

        // Export the workbook
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, filename);
    }

    fetchTodayData = async () => {
        try {
            const response = await getAllAttendanceToday();
            if (response?.errCode === 0) {
                this.setState({ 
                    todayAttendance: response.data || [],
                    currentTime: moment()
                });
            }
        } catch (error) {
            console.error('Error fetching today data:', error);
        }
    }
    
    fetchDateRangeAttendance = async (startDate, endDate) => {
        const dates = [];
        let currentDate = moment(startDate);
        
        // Generate array of dates to fetch
        while (currentDate.isSameOrBefore(endDate)) {
            dates.push(currentDate.valueOf());
            currentDate.add(1, 'days');
        }
        
        // Fetch attendance data for each date
        const promises = dates.map(date => 
            getUserAttendanceByDay(moment(date).valueOf())
        );
        
        const responses = await Promise.all(promises);
        
        // Map responses to date-attendance pairs
        return dates.map((date, index) => ({
            date: moment(date).format('YYYY-MM-DD'),
            attendance: responses[index].data || []
        }));
    }

    // Helper to process single day attendance
    processDailyAttendance = (attendance) => {
        if (!attendance || !Array.isArray(attendance)) return { present: 0, late: 0, absent: 100 };
        
        const totalUsers = attendance.length || 1; // Prevent division by zero
        const onTimeCount = attendance.filter(user => user['Attendances.status'] === 'D').length;
        const lateCount = attendance.filter(user => user['Attendances.status'] === 'M').length;
        const absentCount = totalUsers - (onTimeCount + lateCount);
        
        return {
            present: (onTimeCount / totalUsers) * 100,
            late: (lateCount / totalUsers) * 100,
            absent: (absentCount / totalUsers) * 100
        };
    }

    fetchAnalyticsData = async () => {
        const { timeframe } = this.state;
        this.setState({ isLoading: true });
        
        try {
            let trendsData = [];
            let attendanceData = [];
            
            switch (timeframe) {
                case 'daily': {
                    const response = await getUserAttendanceByDay(moment().valueOf());
                    attendanceData = response.data || [];
                    const stats = this.processDailyAttendance(attendanceData);
                    trendsData = [{
                        date: moment().format('YYYY-MM-DD'),
                        ...stats
                    }];
                    break;
                }
                
                case 'weekly': {
                    const startOfWeek = moment().startOf('week');
                    const weekData = await this.fetchDateRangeAttendanceUntilToday(startOfWeek);
                    
                    trendsData = weekData.map(day => ({
                        date: day.date,
                        ...this.processDailyAttendance(day.attendance)
                    }));
                    
                    // Combine all attendance data from start of week until today
                    attendanceData = weekData.reduce((acc, day) => [...acc, ...day.attendance], []);
                    break;
                }
                
                case 'monthly': {
                    const startOfMonth = moment().startOf('month');
                    const monthData = await this.fetchDateRangeAttendanceUntilToday(startOfMonth);
                    
                    trendsData = monthData.map(day => ({
                        date: day.date,
                        ...this.processDailyAttendance(day.attendance)
                    }));
                    
                    // Combine all attendance data from start of month until today
                    attendanceData = monthData.reduce((acc, day) => [...acc, ...day.attendance], []);
                    break;
                }
                
                case 'yearly': {
                    // For trends data, use monthly API
                    const startOfYear = moment().startOf('year');
                    const months = Array.from({ length: 12 }, (_, i) => 
                        moment(startOfYear).add(i, 'months')
                    );
                    
                    const monthlyPromises = months.map(month => 
                        getUserAttendanceByMonth(month.valueOf())
                    );
                    
                    const monthlyResponses = await Promise.all(monthlyPromises);
                    
                    trendsData = months.map((month, index) => {
                        const monthData = monthlyResponses[index].data || [];
                        const totalUsers = monthData.length || 1;
                        const workingDays = 22;
                        
                        const totalAttendance = monthData.reduce((sum, user) => 
                            sum + (user.totalAttendance || 0), 0
                        );
                        const totalLate = monthData.reduce((sum, user) => 
                            sum + (user.lateAttendance || 0), 0
                        );
                        
                        const totalPossibleDays = totalUsers * workingDays;
                        const onTime = totalAttendance - totalLate;
                        
                        return {
                            date: month.format('YYYY-MM'),
                            present: (onTime / totalPossibleDays) * 100,
                            late: (totalLate / totalPossibleDays) * 100,
                            absent: ((totalPossibleDays - totalAttendance) / totalPossibleDays) * 100
                        };
                    });
                    
                    // For department rates and peak hours, get daily data from start of year until today
                    const yearData = await this.fetchDateRangeAttendanceUntilToday(startOfYear);
                    attendanceData = yearData.reduce((acc, day) => [...acc, ...day.attendance], []);
                    break;
                }
            }
            
            const departmentData = this.getDepartmentData(attendanceData);
            const peakTimeData = this.getPeakHoursData(attendanceData);
            
            this.setState({
                trendsData,
                departmentData,
                peakTimeData,
                analyticsData: attendanceData
            });
            
        } catch (error) {
            console.error('Error fetching analytics data:', error);
        } finally {
            this.setState({ isLoading: false });
        }
    }

    getTodayAttendance = () => {
        const { analyticsData } = this.state;
        if (!Array.isArray(analyticsData)) return [];

        const startOfToday = moment().startOf('day');
        const endOfToday = moment().endOf('day');

        return analyticsData.filter(record => {
            if (!record['Attendances.timecheck']) return false;
            const checkInTime = moment(parseInt(record['Attendances.timecheck']));
            return checkInTime.isBetween(startOfToday, endOfToday, 'day', '[]');
        });
    }

    CustomDepartmentTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-sm">
                    <p className="font-medium text-slate-900">{label}</p>
                    <p className="text-sm text-green-600">
                        On Time: {payload[0].value.toFixed(1)}%
                    </p>
                    <p className="text-sm text-orange-600">
                        Late: {payload[1].value.toFixed(1)}%
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                        Total Employees: {payload[0].payload.total}
                    </p>
                </div>
            );
        }
        return null;
    };

    fetchIndividualRecords = async () => {
        const { selectedMonth, selectedYear } = this.state;
        
        try {
            const selectedDate = moment()
                .year(selectedYear)
                .month(selectedMonth)
                .startOf('month')
                .valueOf();
            
            const response = await getUserAttendanceByMonth(selectedDate);
            
            if (response?.errCode === 0) {
                this.setState({
                    listUser: response.data || [],
                    time: selectedDate
                });
            }
        } catch (error) {
            console.error('Error fetching individual records:', error);
        }
    }

    fetchDateRangeAttendanceUntilToday = async (startDate) => {
        const dates = [];
        let currentDate = moment(startDate);
        const today = moment();
        
        while (currentDate.isSameOrBefore(today)) {
            dates.push(currentDate.valueOf());
            currentDate = moment(currentDate).add(1, 'days');
        }
        
        const promises = dates.map(date => 
            getUserAttendanceByDay(date)
        );
        
        const responses = await Promise.all(promises);
        
        return dates.map((date, index) => ({
            date: moment(date).format('YYYY-MM-DD'),
            attendance: responses[index].data || []
        }));
    }

    async fetchAttendanceData() {
        const { selectedMonth, selectedYear } = this.state;
        const startDate = moment().year(selectedYear).month(selectedMonth).startOf('month');
        const endDate = moment().year(selectedYear).month(selectedMonth).endOf('month');
        const daysInMonth = endDate.diff(startDate, 'days') + 1;
        
        const historyPromises = [];
        this.state.listUser.forEach(user => {
            for(let day = 0; day < daysInMonth; day++) {
                const timestamp = moment(startDate).add(day, 'days').valueOf();
                historyPromises.push(
                    getAllHistory({
                        userId: user.id,
                        timestamp: moment(timestamp).startOf('day').valueOf()
                    })
                );
            }
        });
        
        const historyResponses = await Promise.all(historyPromises);
        
        const attendanceHistory = {};
        const departmentStats = {};
        const timeSlots = {};
        
        // console.log(historyResponses);

        historyResponses.forEach(response => {
            if (response.errCode === 0 && response.data.length > 0) {
                response.data.forEach(record => {
                    if (!attendanceHistory[record.idUser]) {
                        attendanceHistory[record.idUser] = [];
                    }
                    attendanceHistory[record.idUser].push(record);
                    
                    const timeSlot = moment(parseInt(record.timecheck)).format('HH:mm');
                    timeSlots[timeSlot] = (timeSlots[timeSlot] || 0) + 1;
                });
            }
        });
        
        this.state.listUser.forEach(user => {
            const dept = user['positionData.valueV'];
            if (!departmentStats[dept]) {
                departmentStats[dept] = {
                    total: 0,
                    attendance: 0,
                    late: 0
                };
            }
            departmentStats[dept].total++;
            if (attendanceHistory[user.id]) {
                departmentStats[dept].attendance += attendanceHistory[user.id].length;
                const lateArrivals = attendanceHistory[user.id].filter(record => {
                    const arrivalTime = moment(parseInt(record.timecheck));
                    const cutoffTime = moment(parseInt(record.timecheck)).startOf('day').add(8, 'hours');
                    return arrivalTime.isAfter(cutoffTime);
                });
                departmentStats[dept].late += lateArrivals.length;
            }
        });

        const peakTimeData = Object.entries(timeSlots)
            .map(([time, count]) => ({ time, count }))
            .sort((a, b) => moment(a.time, 'HH:mm').valueOf() - moment(b.time, 'HH:mm').valueOf());
        
        this.setState({
            attendanceHistory,
            departmentStats,
            peakTimeData
        });
    }

    getTrendsData = (data) => {
        if (!Array.isArray(data) || data.length === 0) return [];
    
        const { timeframe } = this.state;
        
        switch (timeframe) {
            case 'daily': {
                // Single day view
                const currentDate = moment().format('YYYY-MM-DD');
                const totalUsers = data.length || 1;
                const onTimeCount = data.filter(user => user['Attendances.status'] === 'D').length;
                const lateCount = data.filter(user => user['Attendances.status'] === 'M').length;
                const absentCount = totalUsers - (onTimeCount + lateCount);
                
                return [{
                    date: currentDate,
                    present: (onTimeCount / totalUsers) * 100,
                    late: (lateCount / totalUsers) * 100,
                    absent: (absentCount / totalUsers) * 100
                }];
            }
            
            case 'weekly':
            case 'monthly': {
                // Data is already arranged by days with attendance arrays
                return data.map(dayData => {
                    // Safely access attendance array with fallback to empty array
                    const attendance = dayData?.attendance || [];
                    const totalUsers = attendance.length || 1; // Prevent division by zero
                    
                    const onTimeCount = attendance.filter(user => user['Attendances.status'] === 'D').length;
                    const lateCount = attendance.filter(user => user['Attendances.status'] === 'M').length;
                    const absentCount = totalUsers - (onTimeCount + lateCount);
                    
                    return {
                        date: dayData.date,
                        present: (onTimeCount / totalUsers) * 100,
                        late: (lateCount / totalUsers) * 100,
                        absent: (absentCount / totalUsers) * 100
                    };
                });
            }
            
            case 'yearly': {
                // Data is arranged by months with aggregated attendance
                return data.map(monthData => {
                    // Safely access attendance array with fallback to empty array
                    const attendance = monthData?.attendance || [];
                    const totalUsers = attendance.length || 1;
                    
                    // For monthly data, we use totalAttendance and lateAttendance
                    const totalDays = 22; // Standard working days per month
                    const totalPresent = attendance.reduce((sum, user) => sum + (user.totalAttendance || 0), 0);
                    const totalLate = attendance.reduce((sum, user) => sum + (user.lateAttendance || 0), 0);
                    const onTimeCount = totalPresent - totalLate;
                    const totalPossibleAttendance = totalUsers * totalDays;
                    
                    return {
                        date: monthData.date,
                        present: (onTimeCount / totalPossibleAttendance) * 100,
                        late: (totalLate / totalPossibleAttendance) * 100,
                        absent: ((totalPossibleAttendance - totalPresent) / totalPossibleAttendance) * 100
                    };
                });
            }
            
            default:
                return [];
        }
    };

    getDepartmentData = (data) => {
        const { timeframe } = this.state;
        if (!Array.isArray(data)) return [];
        
        // Helper to get date range based on timeframe
        const getStartDate = (timeframe) => {
            const today = moment();
            switch (timeframe) {
                case 'daily':
                    return today.startOf('day');
                case 'weekly':
                    return today.startOf('week');
                case 'monthly':
                    return today.startOf('month');
                case 'yearly':
                    return today.startOf('year');
                default:
                    return today;
            }
        };
        
        const startDate = getStartDate(timeframe);
        const daysPassed = timeframe === 'daily' 
            ? 1 
            : moment().diff(startDate, 'days') + 1;
    
        // Group by department
        const deptMap = data.reduce((acc, user) => {
            const dept = user['positionData.valueV'];
            if (!acc[dept]) {
                acc[dept] = {
                    department: dept,
                    totalEmployees: new Set(),
                    onTimeCount: 0,
                    lateCount: 0
                };
            }
            
            // Add user to total employees Set
            acc[dept].totalEmployees.add(user.id);
            
            // Count attendance status
            if (user['Attendances.status'] === 'D') {
                acc[dept].onTimeCount++;
            } else if (user['Attendances.status'] === 'M') {
                acc[dept].lateCount++;
            }
            
            return acc;
        }, {});
        
        return Object.values(deptMap).map(dept => {
            const totalPossibleCheckins = dept.totalEmployees.size * daysPassed;
            return {
                department: dept.department,
                onTime: (dept.onTimeCount / totalPossibleCheckins) * 100,
                late: (dept.lateCount / totalPossibleCheckins) * 100,
                total: dept.totalEmployees.size
            };
        });
    }

    getPeakHoursData = (data) => {
        if (!Array.isArray(data)) return [];
        
        // Initialize time slots
        const timeSlots = {};
        for (let hour = 7; hour <= 18; hour++) {
            timeSlots[`${hour}:00`] = 0;
            timeSlots[`${hour}:30`] = 0;
        }
        
        // Count total users who checked in
        const totalCheckins = data.length;
        
        // Count check-ins per time slot
        data.forEach(user => {
            if (user['Attendances.timecheck']) {
                const checkInTime = moment(parseInt(user['Attendances.timecheck']));
                const hour = checkInTime.hour();
                const minute = Math.floor(checkInTime.minute() / 30) * 30;
                
                if (hour >= 7 && hour <= 18) {
                    const timeKey = `${hour}:${minute.toString().padStart(2, '0')}`;
                    if (timeSlots.hasOwnProperty(timeKey)) {
                        timeSlots[timeKey]++;
                    }
                }
            }
        });
        
        // Convert counts to percentages
        return Object.entries(timeSlots)
            .map(([time, count]) => ({
                time,
                count: totalCheckins > 0 ? (count / totalCheckins) * 100 : 0
            }))
            .sort((a, b) => {
                const [aHour, aMin] = a.time.split(':').map(Number);
                const [bHour, bMin] = b.time.split(':').map(Number);
                return (aHour * 60 + aMin) - (bHour * 60 + bMin);
            });
    }
    

    async componentDidMount() {
        try {
            await Promise.all([
                this.fetchAnalyticsData(),
                this.fetchIndividualRecords()
            ]);
            
            this.timeInterval = setInterval(() => {
                this.updateTime();
                // Also refresh analytics data every minute
                this.fetchAnalyticsData();
            }, 15000);
 
        } catch (error) {
            console.error('Error in componentDidMount:', error);
        }
    }

    componentWillUnmount() {
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
        }
    }
    async componentDidUpdate(prevProps, prevState) {
        if (prevState.time !== this.state.time) {
            // Fetch previous month data for comparisons
            const prevMonthTimestamp = moment(this.state.time).subtract(1, 'month').valueOf();
            let prevMonthData = await getUserAttendanceByMonth(prevMonthTimestamp);
            if (prevMonthData && prevMonthData.errCode === 0) {
                this.setState({ previousMonthData: prevMonthData.data });
            }
        }
    }
    
    // Statistics calculation methods
    calculateOverallAttendance() {
        const { listUser } = this.state;
        if (!listUser.length) return 0;
        
        const workingDays = 22; // Standard working days per month
        const totalAttendance = listUser.reduce((sum, user) => sum + parseInt(user.totalAttendance || 0), 0);
        const totalPossibleDays = listUser.length * workingDays;
        
        return ((totalAttendance / totalPossibleDays) * 100).toFixed(1);
    }
    
    calculateAttendanceChange() {
        const { listUser, previousMonthData } = this.state;
        if (!listUser.length || !previousMonthData?.length) return 0;
        
        // Current month attendance rate
        const currentRate = this.calculateOverallAttendance();
        
        // Previous month attendance rate
        const workingDays = 22;
        const prevTotalAttendance = previousMonthData.reduce((sum, user) => 
            sum + (parseInt(user.totalAttendance) || 0), 0);
        const prevTotalPossible = previousMonthData.length * workingDays;
        const prevRate = ((prevTotalAttendance / prevTotalPossible) * 100);
        
        return parseFloat((currentRate - prevRate).toFixed(1));
    }
    
    calculateLatePercentage() {
        const { listUser } = this.state;
        if (!listUser.length) return 0;
        
        const totalLate = listUser.reduce((sum, user) => sum + parseInt(user.lateAttendance || 0), 0);
        const totalAttendance = listUser.reduce((sum, user) => sum + parseInt(user.totalAttendance || 0), 0);
        
        return totalAttendance ? ((totalLate / totalAttendance) * 100).toFixed(1) : 0;
    }
    
    calculateLateChange() {
        const { listUser, previousMonthData } = this.state;
        if (!listUser.length || !previousMonthData?.length) return 0;
        
        // Current month late percentage
        const currentLate = this.calculateLatePercentage();
        
        // Previous month late percentage
        const prevTotalLate = previousMonthData.reduce((sum, user) => 
            sum + (parseInt(user.lateAttendance) || 0), 0);
        const prevTotalAttendance = previousMonthData.reduce((sum, user) => 
            sum + (parseInt(user.totalAttendance) || 0), 0);
        const prevLate = prevTotalAttendance ? 
            ((prevTotalLate / prevTotalAttendance) * 100) : 0;
        
        return parseFloat((currentLate - prevLate).toFixed(1));
    }
    
    getArrivalTimes() {
        const { listUser } = this.state;
        if (!listUser.length) return [];
        
        // Assuming you have timestamp data for each attendance
        const timeSlots = {};
        const hours = ['7:00', '7:30', '8:00', '8:30', '9:00', '9:30', '10:00'];
        hours.forEach(hour => timeSlots[hour] = 0);
        
        // Process attendance data to count arrivals per time slot
        listUser.forEach(user => {
            if (user.arrivalTime) {
                const hour = moment(user.arrivalTime).format('H:mm');
                if (timeSlots.hasOwnProperty(hour)) {
                    timeSlots[hour]++;
                }
            }
        });
        
        return Object.entries(timeSlots).map(([time, count]) => ({ time, count }));
    }
    
    findPeakTime() {
        const arrivalTimes = this.getArrivalTimes();
        if (!arrivalTimes.length) return { time: "N/A", count: 0 };
        
        return arrivalTimes.reduce((peak, current) => 
            current.count > peak.count ? current : peak, 
            { time: arrivalTimes[0].time, count: arrivalTimes[0].count }
        );
    }
    
    calculatePeakTime = () => {
        const todayAttendance = this.getTodayAttendance();
        if (!todayAttendance.length) {
            return { time: "Chưa có chấm công", count: 0 };
        }

        // Create time slots for every 30 minutes from 7:00 to 18:00
        const timeSlots = {};
        for (let hour = 7; hour <= 18; hour++) {
            timeSlots[`${hour}:00`] = { count: 0, users: [] };
            timeSlots[`${hour}:30`] = { count: 0, users: [] };
        }

        // Count check-ins per time slot
        todayAttendance.forEach(record => {
            if (record['Attendances.timecheck']) {
                const checkInTime = moment(parseInt(record['Attendances.timecheck']));
                const hour = checkInTime.hour();
                const minute = checkInTime.minute();
                const roundedMinute = minute < 30 ? '00' : '30';
                
                if (hour >= 7 && hour <= 18) {
                    const timeKey = `${hour}:${roundedMinute}`;
                    if (timeSlots.hasOwnProperty(timeKey)) {
                        timeSlots[timeKey].count++;
                        timeSlots[timeKey].users.push(record.fullName);
                    }
                }
            }
        });

        // Find peak time slot
        let peakTime = "Chưa có chấm công";
        let maxCount = 0;
        let peakUsers = [];

        Object.entries(timeSlots).forEach(([time, data]) => {
            if (data.count > maxCount) {
                peakTime = time;
                maxCount = data.count;
                peakUsers = data.users;
            }
        });

        return { 
            time: peakTime, 
            count: maxCount,
            users: peakUsers
        };
    }
    
    updateTime = () => {
        this.setState({ currentTime: moment() });
    }

    handleTimeframeChange = (value) => {
        this.setState({ timeframe: value }, () => {
            this.fetchAnalyticsData();
        });
    }

    handleMonthChange = (value) => {
        this.setState({ 
            selectedMonth: parseInt(value) - 1 
        });
    }

    handleYearChange = (value) => {
        this.setState({ 
            selectedYear: parseInt(value) 
        });
    }

    handleSearch = async () => {
        await this.fetchIndividualRecords();
    }
    
    handleDetailUser = (id) => {
        const { navigate } = this.props;
        let { time } = this.state;
        navigate(`/detail-user?id=${id}&month=${time}`);
    }

    render() {
        const months = [
            { value: '1', label: 'Tháng 1' },
            { value: '2', label: 'Tháng 2' },
            { value: '3', label: 'Tháng 3' },
            { value: '4', label: 'Tháng 4' },
            { value: '5', label: 'Tháng 5' },
            { value: '6', label: 'Tháng 6' },
            { value: '7', label: 'Tháng 7' },
            { value: '8', label: 'Tháng 8' },
            { value: '9', label: 'Tháng 9' },
            { value: '10', label: 'Tháng 10' },
            { value: '11', label: 'Tháng 11' },
            { value: '12', label: 'Tháng 12' }
        ];

        const currentYear = new Date().getFullYear();
        const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
        let { listUser } = this.state;

        return (
            <div className="p-6 space-y-6 bg-slate-50 min-h-screen">

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4">
                    {/* Overall Attendance Card */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 bg-green-100 rounded-lg">
                                <Users size={20} className="text-green-600" />
                            </div>
                            <span className="text-sm text-slate-600">Tỷ Lệ Chấm Công</span>
                            {this.calculateAttendanceChange() !== 0 && (
                                <span className={`ml-auto text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1
                                    ${this.calculateAttendanceChange() > 0 
                                        ? 'bg-green-100 text-green-600' 
                                        : 'bg-red-100 text-red-600'}`}
                                >
                                    {this.calculateAttendanceChange() > 0 ? (
                                        <ChevronUp size={14} />
                                    ) : (
                                        <ChevronDown size={14} />
                                    )}
                                    {Math.abs(this.calculateAttendanceChange())}%
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-semibold text-slate-900">
                                {this.calculateOverallAttendance()}%
                            </span>
                            <span className="text-xs text-slate-500">trong tổng số dự kiến</span>
                        </div>
                    </div>
                    
                    {/* Late Arrivals Card */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 bg-orange-100 rounded-lg">
                                <Clock size={20} className="text-orange-600" />
                            </div>
                            <span className="text-sm text-slate-600">Đi muộn</span>
                            {this.calculateLateChange() !== 0 && (
                                <span className={`ml-auto text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1
                                    ${this.calculateLateChange() < 0  // Note: for late arrivals, decrease is good
                                        ? 'bg-green-100 text-green-600' 
                                        : 'bg-red-100 text-red-600'}`}
                                >
                                    {this.calculateLateChange() < 0 ? (
                                        <ChevronDown size={14} />
                                    ) : (
                                        <ChevronUp size={14} />
                                    )}
                                    {Math.abs(this.calculateLateChange())}%
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-semibold text-slate-900">
                                {this.calculateLatePercentage()}%
                            </span>
                            <span className="text-xs text-slate-500">tổng số chấm công muộn</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 bg-blue-100 rounded-lg">
                                <Clock size={20} className="text-blue-600" />
                            </div>
                            <span className="text-sm text-slate-600">Giờ Cao Điểm Hôm Nay</span>
                            <span className="ml-auto text-xs font-medium px-2 py-1 bg-blue-100 text-blue-600 rounded-full flex items-center gap-1">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                                Trực Tiếp
                            </span>
                        </div>
                        <div className="flex flex-col">
                            {(() => {
                                const peakData = this.calculatePeakTime();
                                return (
                                    <>
                                        <span className="text-2xl font-semibold text-slate-900">
                                            {peakData.time}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            {peakData.count} lượt chấm công
                                        </span>
                                        {peakData.count > 0 && (
                                            <div className="mt-2 text-xs text-slate-500">
                                                <span className="font-medium">Chấm công gần nhất: </span>
                                                {peakData.users[peakData.users.length - 1]}
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                {/* Analytics Overview */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <ChartIcon size={20} className="text-slate-600" />
                            <div>
                                <h2 className="font-medium text-slate-900">Tổng Quan Phân Tích</h2>
                                <p className="text-sm text-slate-500">Thống kê xu hướng chấm công</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-600">Chọn khoảng thời gian:</span>
                            <Select 
                                value={this.state.timeframe} 
                                onValueChange={this.handleTimeframeChange}
                            >
                                <SelectTrigger className="w-32 bg-white border-slate-200">
                                    <SelectValue placeholder="Select range" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Hàng ngày</SelectItem>
                                    <SelectItem value="weekly">Hàng tuần</SelectItem>
                                    <SelectItem value="monthly">Hàng tháng</SelectItem>
                                    <SelectItem value="yearly">Hàng năm</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Tabs defaultValue="trends" className="space-y-4">
                        <TabsList className="space-x-2">
                            <TabsTrigger value="trends" className="px-4 py-2">Xu Hướng Chấm Công</TabsTrigger>
                            <TabsTrigger value="departments" className="px-4 py-2">Tỷ Lệ Theo Phòng Ban</TabsTrigger>
                            <TabsTrigger value="peak" className="px-4 py-2">Giờ cao điểm</TabsTrigger>
                        </TabsList>

                        <TabsContent value="trends" className="pt-4">
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart 
                                    data={this.state.trendsData} 
                                    margin={{ top: 5, right: 30, bottom: 5, left: 20 }}
                                    >
                                        <CartesianGrid stroke="#e5e7eb" />
                                        <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                                        <YAxis stroke="#64748b" fontSize={12} />
                                        <Tooltip 
                                            contentStyle={{
                                                backgroundColor: 'white',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '6px',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                            }}
                                        />
                                        <Legend />
                                        <Line type="monotone" name="Có mặt" dataKey="present" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', strokeWidth: 2 }} />
                                        <Line type="monotone" name="Muộn" dataKey="late" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', strokeWidth: 2 }} />
                                        <Line type="monotone" name="Vắng mặt" dataKey="absent" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', strokeWidth: 2 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </TabsContent>

                        <TabsContent value="departments" className="pt-4">
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart 
                                        data={this.state.departmentData} 
                                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis 
                                            dataKey="department" 
                                            stroke="#64748b" 
                                            fontSize={12}
                                        />
                                        <YAxis
                                            stroke="#64748b"
                                            fontSize={12}
                                            label={{ 
                                                value: 'Phần Trăm (%)', 
                                                angle: -90, 
                                                position: 'insideLeft',
                                                fontSize: 12,
                                                fill: '#64748b'
                                            }}
                                        />
                                        <Tooltip content={this.CustomDepartmentTooltip} />
                                        <Legend />
                                        <Bar 
                                            name="Đúng giờ" 
                                            dataKey="onTime" 
                                            stackId="a" 
                                            fill="#10b981"
                                            radius={[4, 4, 0, 0]}
                                        />
                                        <Bar 
                                            name="Muộn" 
                                            dataKey="late" 
                                            stackId="a" 
                                            fill="#f59e0b"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </TabsContent>

                        <TabsContent value="peak" className="pt-4">
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart 
                                        data={this.state.peakTimeData} 
                                        margin={{ top: 5, right: 30, bottom: 5, left: 20 }}
                                    >
                                        <CartesianGrid stroke="#e5e7eb" />
                                        <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                                        <YAxis stroke="#64748b" fontSize={12} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'white',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '6px',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                            }}
                                        />
                                        <Legend />
                                        <Line name="Employees" type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', strokeWidth: 2 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </TabsContent>


                    </Tabs>
                    {/* Individual Records */}
                    <div className="col-span-12">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Users size={18} className="text-slate-600" />
                            <div>
                                <h2 className="font-medium text-slate-900">Dữ Liệu Cá Nhân</h2>
                                <p className="text-xs text-slate-500">Chi tiết dữ liệu chấm công nhân viên</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                                        <label className="text-xs text-slate-500 mb-1">Tháng</label>
                                        <Select 
                                        value={(this.state.selectedMonth + 1).toString()} 
                                        onValueChange={this.handleMonthChange}
                                        >
                                            <SelectTrigger className="w-[140px] h-9 text-sm bg-white">
                                                <SelectValue placeholder="Select month" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {months.map((month) => (
                                                    <SelectItem key={month.value} value={month.value}>
                                                        {month.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                
                            </div>

                            <div className="flex flex-col">
                            <label className="text-xs text-slate-500 mb-1">Year</label>
                                    <Select 
                                        value={this.state.selectedYear.toString()} 
                                        onValueChange={this.handleYearChange}
                                    >
                                        <SelectTrigger className="w-[100px] h-9 text-sm bg-white">
                                            <SelectValue placeholder="Select year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {years.map((year) => (
                                                <SelectItem key={year} value={year}>
                                                    {year}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                            </div>

                            <button 
                                className="mt-6 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
                                onClick={this.handleSearch}
                            >
                                <Filter size={14} />
                                Lọc
                            </button>

                            <button 
                                className="mt-6 px-4 py-2 bg-green-600 text-white text-sm rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors shadow-sm"
                                onClick={this.exportIndividualRecords}
                                disabled={!this.state.listUser || this.state.listUser.length === 0}
                            >
                                <Download size={14} />
                                Xuất Báo Cáo
                            </button>
                        </div>
                    </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">STT</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Họ và tên</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">RFID</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Giới tính</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phòng ban</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Số công</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Muộn</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Xem chi tiết</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                    {listUser.length > 0 ? (
                                        listUser.map((item, index) => (
                                            <tr key={`user-${index}`} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3 text-sm text-slate-900">{index + 1}</td>
                                                <td className="px-4 py-3 text-sm font-medium text-blue-600">{item.fullName}</td>
                                                <td className="px-4 py-3 text-sm text-slate-600">{item.rfid}</td>
                                                <td className="px-4 py-3 text-sm text-slate-600">{item['genderData.valueV']}</td>
                                                <td className="px-4 py-3 text-sm text-slate-600">{item['positionData.valueV']}</td>
                                                <td className="px-4 py-3 text-sm text-slate-600">{item.totalAttendance}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                        item.lateAttendance === 0 
                                                            ? 'bg-green-100 text-green-600' 
                                                            : 'bg-orange-100 text-orange-600'
                                                    }`}>
                                                        {item.lateAttendance}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <button 
                                                        className="text-blue-600 hover:text-blue-700 font-medium"
                                                        onClick={() => this.handleDetailUser(item.id)}
                                                    >
                                                        Xem
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-3 text-sm text-center text-slate-500">
                                                Không có dữ liệu
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {};
};

const StatisticsWrapper = (props) => {
    const navigate = useNavigate();
    return <Statistics {...props} navigate={navigate} />;
};

export default connect(mapStateToProps)(StatisticsWrapper);

