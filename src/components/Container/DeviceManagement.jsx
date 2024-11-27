import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Plus, Signal, Settings, Activity } from 'lucide-react';

const DeviceManagement = () => {
  const [devices, setDevices] = useState([
    {
      id: 1,
      name: "Thiết bị chấm công 1",
      location: "Tòa A2 - PTIT",
      type: "Chấm công",
      status: "online",
      lastUpdate: "2024-11-25 08:52:20",
      ip: "10.170.100.122",
      mac: "3C:71:BF:9A:47:82",
      branch: "Chi nhánh A",
      heartbeat: "2024-11-25 08:52:00",
      successfulScans: 156,
      failedScans: 3
    },
    {
      id: 2,
      name: "Thiết bị chấm công 2",
      location: "PTIT IEC",
      type: "Quẹt thẻ",
      status: "offline",
      lastUpdate: "2024-11-25 08:45:00",
      ip: "113.22.56.109",
      mac: "24:6F:28:12:34:56",
      branch: "Chi nhánh B",
      heartbeat: "2024-11-25 08:44:00",
      successfulScans: 89,
      failedScans: 1
    }
  ]);

  return (
    <div className="p-4 bg-green-50">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-green-800">Quản lý Thiết bị</h1>
          <p className="text-green-600">Quản lý và giám sát thiết bị chấm công</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Thêm thiết bị mới
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-green-100 bg-white">
          <CardHeader>
            <CardTitle className="text-lg flex items-center text-green-700">
              <Signal className="w-4 h-4 mr-2" />
              Tổng số thiết bị
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">{devices.length}</div>
            <div className="text-sm text-green-600">Đang hoạt động: {devices.filter(d => d.status === 'online').length}</div>
          </CardContent>
        </Card>

        <Card className="border-green-100 bg-white">
          <CardHeader>
            <CardTitle className="text-lg flex items-center text-green-700">
              <Activity className="w-4 h-4 mr-2" />
              Quẹt thẻ hôm nay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">245</div>
            <div className="text-sm text-green-600">Thành công: 242 | Lỗi: 3</div>
          </CardContent>
        </Card>

        <Card className="border-green-100 bg-white">
          <CardHeader>
            <CardTitle className="text-lg flex items-center text-green-700">
              <AlertCircle className="w-4 h-4 mr-2" />
              Cảnh báo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">1</div>
            <div className="text-sm text-green-600">Thiết bị không phản hồi</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-green-100 bg-white">
        <CardHeader className="border-b border-green-100">
          <div className="flex justify-between items-center">
            <CardTitle className="text-green-800">Danh sách thiết bị</CardTitle>
            <Input 
              className="max-w-xs border-green-200 focus:ring-green-500 focus:border-green-500" 
              placeholder="Tìm kiếm thiết bị..." 
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-green-100">
                  <th className="text-left p-4 text-green-700">Tên thiết bị</th>
                  <th className="text-left p-4 text-green-700">Vị trí</th>
                  <th className="text-left p-4 text-green-700">Trạng thái</th>
                  <th className="text-left p-4 text-green-700">Chi nhánh</th>
                  <th className="text-left p-4 text-green-700">Cập nhật cuối</th>
                  <th className="text-left p-4 text-green-700">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {devices.map(device => (
                  <tr key={device.id} className="border-b border-green-50 hover:bg-green-50">
                    <td className="p-4">
                      <div className="font-medium text-green-800">{device.name}</div>
                      <div className="text-sm text-green-600">MAC: {device.mac}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-green-800">{device.location}</div>
                      <div className="text-sm text-green-600">IP: {device.ip}</div>
                    </td>
                    <td className="p-4">
                      <Badge className={device.status === 'online' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}>
                        {device.status === 'online' ? 'Hoạt động' : 'Không hoạt động'}
                      </Badge>
                    </td>
                    <td className="p-4 text-green-800">{device.branch}</td>
                    <td className="p-4">
                      <div className="text-green-800">{device.lastUpdate}</div>
                      <div className="text-sm text-green-600">
                        Heartbeat: {device.heartbeat}
                      </div>
                    </td>
                    <td className="p-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mr-2 border-green-600 text-green-600 hover:bg-green-50"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Cài đặt
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        Vô hiệu hóa
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeviceManagement;