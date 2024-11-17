import React, { Component } from 'react';
import { connect } from "react-redux";
import { getAllUser, getAllHistory } from '../../services/userService';
import '../style/History.scss';
import moment from 'moment-timezone';
import { Calendar as CalendarIcon, Search } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Select from 'react-select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { vi } from 'date-fns/locale';

class History extends Component {
    constructor(props) {
        super(props);
        const today = new Date();

        this.state = {
            listUser: [],
            listSelecteUser: [],
            selectedUser: null,  // Changed to null for proper initialization
            selectedDate: today,
            listHistory: [],
            isLoading: true,     // Added loading state
            error: null          // Added error state
        };
    }

    async componentDidMount() {
        try {
            await this.loadUserData();
        } catch (error) {
            console.error("Error loading user data:", error);
            this.setState({ 
                error: "Failed to load user data",
                isLoading: false 
            });
        }
    }

    loadUserData = async () => {
        this.setState({ isLoading: true, error: null });
        
        try {
            const resUser = await getAllUser();
            
            if (resUser && resUser.errCode === 0 && Array.isArray(resUser.data)) {
                // Transform data immediately instead of calling separate method
                const transformedUsers = resUser.data.map(user => ({
                    label: user.fullName,
                    value: user.id
                }));

                this.setState({
                    listUser: resUser.data,
                    listSelecteUser: transformedUsers,
                    isLoading: false
                });
            } else {
                throw new Error("Invalid user data format received");
            }
        } catch (error) {
            console.error("Error in loadUserData:", error);
            this.setState({
                error: "Failed to load user data",
                isLoading: false
            });
        }
    };

    handleUserChange = (selectedOption) => {
        this.setState({
            selectedUser: selectedOption,
            listHistory: [] // Clear history when user changes
        }); 
    };

    handleDateSelect = (date) => {
        this.setState({ 
            selectedDate: date,
            listHistory: [] // Clear history when date changes
        });
    };

    handleSearch = async () => {
        const { selectedDate, selectedUser } = this.state;
        
        if (!selectedUser?.value) {
            // You might want to show a notification to the user here
            console.log("Please select a user first");
            return;
        }

        try {
            const timestamp = moment(selectedDate).tz('Asia/Ho_Chi_Minh').startOf('day').valueOf();
            const res = await getAllHistory({
                userId: selectedUser.value,
                timestamp: timestamp
            });

            if (res && res.errCode === 0) {
                this.setState({
                    listHistory: res.data
                });
            } else {
                throw new Error("Invalid history data format received");
            }
        } catch (error) {
            console.error("Error fetching history:", error);
            this.setState({
                error: "Failed to load history data"
            });
        }
    };

    convertTimestampToTimezone = (timestamp) => {
        try {
            const timeInMillis = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
            let dateInTimezone = moment.tz(timeInMillis, 'Asia/Ho_Chi_Minh');
            return dateInTimezone.format('YYYY-MM-DD HH:mm:ss');
        } catch (error) {
            console.error("Error converting timestamp:", error);
            return "Invalid date";
        }
    }

    render() {
        const { 
            listHistory, 
            selectedDate, 
            listSelecteUser, 
            selectedUser,
            isLoading,
            error 
        } = this.state;
        
        const today = new Date();

        const customSelectStyles = {
            control: (provided, state) => ({
                ...provided,
                border: '1px solid #e2e8f0',
                borderRadius: '0.375rem',
                padding: '2px',
                boxShadow: state.isFocused ? '0 0 0 2px #22c55e' : null,
                '&:hover': {
                    borderColor: '#22c55e'
                }
            }),
            menu: (provided) => ({
                ...provided,
                borderRadius: '0.375rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            })
        };

        return (
            <div className="min-h-screen bg-gray-50 p-4 md:p-8">
                <Card className="max-w-4xl mx-auto shadow-lg">
                    <CardHeader className="border-b border-gray-100 bg-white">
                        <CardTitle className="text-xl font-semibold text-gray-800">
                            Lịch sử quẹt thẻ
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6">
                        <div className="grid gap-6 md:grid-cols-2 mb-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-600">
                                    Chọn Nhân viên
                                </label>
                                <Select
                                    value={selectedUser}
                                    options={listSelecteUser}
                                    onChange={this.handleUserChange}
                                    styles={customSelectStyles}
                                    placeholder={isLoading ? "Đang tải..." : "Chọn nhân viên"}
                                    isLoading={isLoading}
                                    isDisabled={isLoading}
                                    className="w-full"
                                    noOptionsMessage={() => "Không có nhân viên"}
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-600">
                                    Chọn ngày
                                </label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal border-gray-200 hover:border-green-500 focus:border-green-500"
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : 'Chọn ngày...'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={selectedDate}
                                            onSelect={this.handleDateSelect}
                                            disabled={(date) => date > today}
                                            initialFocus
                                            locale={vi}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <Button
                            className="w-full md:w-auto px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white"
                            onClick={this.handleSearch}
                            disabled={isLoading || !selectedUser}
                        >
                            <Search className="mr-2 h-4 w-4" />
                            Tìm kiếm
                        </Button>

                        <div className="mt-8 border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead className="font-semibold text-gray-700">STT</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Thời gian</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {error ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center text-red-500">
                                                {error}
                                            </TableCell>
                                        </TableRow>
                                    ) : listHistory && listHistory.length > 0 ? (
                                        listHistory.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell>{this.convertTimestampToTimezone(item.timecheck)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={2} className="h-48 text-center">
                                                <div className="flex flex-col items-center justify-center text-gray-500">
                                                    <Search size={32} className="mb-2 text-gray-400" />
                                                    <p>Không có dữ liệu</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {};
};

const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(History);