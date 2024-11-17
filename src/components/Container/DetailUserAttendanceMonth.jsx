import React, { Component } from 'react';
import { connect } from "react-redux";
import { useLocation } from 'react-router-dom';
import { getAttendanceByIdAndMonth } from '../../services/userService';
import moment from 'moment-timezone';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

class DetailUserAttendanceMonth extends Component {
    constructor(props) {
        super(props);
        const { id, month } = this.parseQueryParams();
        this.state = {
            id: id || '',
            month: month || '',
            userAttendance: {}
        };
    }

    parseQueryParams = () => {
        const { search } = this.props.location;
        const params = new URLSearchParams(search);
        return {
            id: params.get('id'),
            month: params.get('month')
        };
    }

    async componentDidMount() {
        const { id, month } = this.state;
        if (id && month) {
            let res = await getAttendanceByIdAndMonth({
                id: id,
                month: month
            });
            if (res && res.errCode === 0) {
                this.setState({
                    userAttendance: res.data
                });
            }
        }
    }

    convertTimestampToDate(timestamp) {
        const timeInMillis = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
        let dateInTimezone = moment.tz(timeInMillis, 'Asia/Ho_Chi_Minh');
        return dateInTimezone.format('DD MMM YYYY HH:mm:ss');
    }

    render() {
        const { userAttendance } = this.state;
        
        return (
            <div className="container mx-auto px-4 py-8">
                <Card className="shadow-lg">
                    <CardHeader className="space-y-1">
                        <div className="flex items-center justify-center space-x-2">
                            <Calendar className="h-6 w-6 text-blue-500" />
                            <CardTitle className="text-2xl font-bold text-center">
                                Bảng Chấm Công
                            </CardTitle>
                        </div>
                        {userAttendance.fullName && (
                            <p className="text-center text-gray-600">
                                Nhân viên: <span className="font-semibold">{userAttendance.fullName}</span>
                            </p>
                        )}
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16 text-center">STT</TableHead>
                                    <TableHead>Thời gian</TableHead>
                                    <TableHead className="w-32 text-center">Trạng thái</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {userAttendance.listAttendance && userAttendance.listAttendance.length > 0 ? (
                                    userAttendance.listAttendance.map((item, index) => (
                                        <TableRow key={`atten-${index}`}>
                                            <TableCell className="text-center font-medium">
                                                {index + 1}
                                            </TableCell>
                                            <TableCell>
                                                {this.convertTimestampToDate(item.timecheck)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge 
                                                    variant={item.status === 'M' ? "destructive" : "success"}
                                                    className="font-semibold"
                                                >
                                                    {item.status === 'M' ? 'Muộn' : 'Đúng giờ'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                                            Không có dữ liệu chấm công
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        );
    }
}

const DetailUserAttendanceMonthWithLocation = (props) => {
    const location = useLocation();
    return <DetailUserAttendanceMonth {...props} location={location} />;
};

const mapStateToProps = state => {
    return {};
};

const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(DetailUserAttendanceMonthWithLocation);
