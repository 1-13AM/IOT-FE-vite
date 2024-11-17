import React, { Component } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import mqtt from 'mqtt';
import { getAllCode, addNewUser, getAllUser, putSaveUser, deleteUser, getUserByRfid } from '../../services/userService';

class EmployeeManagement extends Component {
  constructor(props) {
    super(props);
    this.state = {
      listUser: [],
      rfid: '',
      fullName: '',
      email: '',
      phoneNumber: '',
      address: '',
      listGender: [],
      gender: '',
      listPosition: [],
      position: '',
      isCreate: true,
      isConnected: false,
      showDeleteModal: false,
      selectedUser: null,
      isOpen: false,
      isEditOpen: false,
    };
  }

  async componentDidMount() {
    let genders = await getAllCode('GENDER');
    let positions = await getAllCode('POSITION');
    await this.getUser();
    
    if (genders.errCode === 0) {
      this.setState({
        listGender: this.buildDataInputSelect(genders.data)
      });
    }
    
    if (positions.errCode === 0) {
      this.setState({
        listPosition: this.buildDataInputSelect(positions.data)
      });
    }

    const options = {
      clientId: `mqtt_${Math.random().toString(16).slice(3)}`,
      username: 'nhom1',
      password: '123456',
      protocol: 'wss',
    };

    this.client = mqtt.connect('wss://99ae98df26c84e4fad0e757738d87df2.s1.eu.hivemq.cloud:8884/mqtt', options);

    this.client.on('connect', () => {
      this.setState({ isConnected: true });
      this.client.subscribe('topic/rfid');
    });

    this.client.on('message', async (topic, message) => {
      if (topic === 'topic/rfid') {
        const receivedMessage = message.toString();
        try {
          let res = await getUserByRfid(receivedMessage);
          if (res && res.data && res.data.length === 0) {
            this.setState({ rfid: receivedMessage });
          }
        } catch (error) {
          console.error('Lỗi khi gọi getUserByRfid:', error);
        }
      }
    });
  }

  componentWillUnmount() {
    if (this.client) {
      this.client.end();
    }
  }

  getUser = async () => {
    let users = await getAllUser();
    if (users.errCode === 0) {
      this.setState({ listUser: users.data });
    }
  }

  buildDataInputSelect = (inputData) => {
    return inputData.map((item) => ({
      label: item.valueV,
      value: item.keyMap
    }));
  }

  handleUpdateUser = (item) => {
    this.setState({
      isCreate: false,
      rfid: item.rfid,
      fullName: item.fullName,
      email: item.email,
      phoneNumber: item.phonenumber,
      address: item.address,
      gender: item.gender,
      position: item.roleId
    });
  }
  
  handleSaveUser = async () => {
    if (!this.validateForm()) return;

    let res = await putSaveUser({
      rfid: this.state.rfid,
      fullName: this.state.fullName,
      email: this.state.email,
      phoneNumber: this.state.phoneNumber,
      address: this.state.address,
      gender: this.state.gender,
      position: this.state.position
    });

    if (res.errCode === 0) {
      this.resetForm();
      await this.getUser();
    } else {
      alert(res.errMessage || 'Có lỗi xảy ra');
    }
  }
      
  handleDeleteUser = async (item) => {
    this.setState({
      showDeleteModal: true,
      selectedUser: item
    });
  }

  confirmDelete = async () => {
    const { selectedUser } = this.state;
    if (selectedUser) {
      let res = await deleteUser(selectedUser.id);
      if (res.errCode === 0) {
        await this.getUser();
      }
    }
    this.setState({
      showDeleteModal: false,
      selectedUser: null
    });
  }

  cancelDelete = () => {
    this.setState({
      showDeleteModal: false,
      selectedUser: null
    });
  }

  handleChangeInput = (event, id) => {
    this.setState({ [id]: event.target.value });
  }

  handleChangeSelected = (value, name) => {
    this.setState({ [name]: value });
  }

  handleAddNewUser = async () => {
    if (!this.validateForm()) return;

    let res = await addNewUser({
      rfid: this.state.rfid,
      fullName: this.state.fullName,
      email: this.state.email,
      phoneNumber: this.state.phoneNumber,
      address: this.state.address,
      gender: this.state.gender,
      position: this.state.position
    });

    if (res.errCode === 0) {
      this.resetForm();
      await this.getUser();
    } else {
      alert(res.errMessage || 'Có lỗi xảy ra');
    }
  }

  validateForm = () => {
    const { rfid, fullName, email, gender, position } = this.state;
    if (!rfid || !fullName || !email || !gender || !position) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return false;
    }
    return true;
  }
  
  resetForm = () => {
    this.setState({
      isOpen: false,
      isEditOpen: false,
      rfid: '',
      fullName: '',
      email: '',
      phoneNumber: '',
      address: '',
      gender: '',
      position: '',
      isCreate: true
    });
  }

  render() {
    const { isCreate, listUser, showDeleteModal, isOpen, isEditOpen } = this.state;

    return (
      <Card className="max-w-7xl mx-auto p-6 bg-white shadow-lg rounded-lg">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Quản lý Nhân viên</h1>
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={() => this.setState({ isOpen: true })}
          >
            <Plus className="w-4 h-4 mr-2" /> Thêm nhân viên
          </Button>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">STT</th>
                <th className="text-left p-4">RFID</th>
                <th className="text-left p-4">Họ và tên</th>
                <th className="text-left p-4">Email</th>
                <th className="text-left p-4">Giới tính</th>
                <th className="text-left p-4">Phòng ban</th>
                <th className="text-left p-4">Địa chỉ</th>
                <th className="text-left p-4">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {listUser.map((item, index) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">{index + 1}</td>
                  <td className="p-4">{item.rfid}</td>
                  <td className="p-4">{item.fullName}</td>
                  <td className="p-4">{item.email}</td>
                  <td className="p-4">{item['genderData.valueV']}</td>
                  <td className="p-4">{item['positionData.valueV']}</td>
                  <td className="p-4">{item.address}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-green-600 hover:text-green-700"
                        onClick={() => {
                          this.handleUpdateUser(item);
                          this.setState({ isOpen: true, isCreate: false });
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => this.setState({ showDeleteModal: true, selectedUser: item })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add/Edit User Dialog - Now using the same dialog for both operations */}
        <Dialog 
          open={isOpen} 
          onOpenChange={(open) => {
            // If dialog is being closed (open === false)
            if (!open) {
              // Reset all form fields and state
              this.setState({
                isOpen: false,
                isCreate: true,
                rfid: '',
                fullName: '',
                email: '',
                phoneNumber: '',
                address: '',
                gender: '',
                position: '',
              });
            } else {
              // If dialog is being opened
              this.setState({ isOpen: true });
            }
          }}
          >
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>
                {isCreate ? 'Thêm nhân viên mới' : 'Sửa thông tin nhân viên'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">RFID:</label>
                <Input
                  value={this.state.rfid}
                  onChange={(e) => this.handleChangeInput(e, 'rfid')}
                  disabled={!isCreate}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Họ và tên:</label>
                <Input
                  value={this.state.fullName}
                  onChange={(e) => this.handleChangeInput(e, 'fullName')}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email:</label>
                <Input
                  type="email"
                  value={this.state.email}
                  onChange={(e) => this.handleChangeInput(e, 'email')}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Số điện thoại:</label>
                <Input
                  type="tel"
                  value={this.state.phoneNumber}
                  onChange={(e) => this.handleChangeInput(e, 'phoneNumber')}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Giới tính:</label>
                <Select
                  value={this.state.gender}
                  onValueChange={(value) => this.handleChangeSelected(value, 'gender')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn giới tính" />
                  </SelectTrigger>
                  <SelectContent>
                    {this.state.listGender.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Chức vụ:</label>
                <Select
                  value={this.state.position}
                  onValueChange={(value) => this.handleChangeSelected(value, 'position')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn chức vụ" />
                  </SelectTrigger>
                  <SelectContent>
                    {this.state.listPosition.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Địa chỉ:</label>
                <Input
                  value={this.state.address}
                  onChange={(e) => this.handleChangeInput(e, 'address')}
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  this.setState({ 
                    isOpen: false,
                    rfid: '',
                    fullName: '',
                    email: '',
                    phoneNumber: '',
                    address: '',
                    gender: '',
                    position: '',
                    isCreate: true
                  });
                }}
              >
                Hủy
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={isCreate ? this.handleAddNewUser : this.handleSaveUser}
              >
                {isCreate ? 'Thêm nhân viên' : 'Cập nhật'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog 
          open={showDeleteModal} 
          onOpenChange={(open) => {
            // If dialog is being closed
            if (!open) {
              this.setState({ 
                showDeleteModal: false,
                selectedUser: null  // Clear selected user when closing
              });
            } else {
              // If dialog is being opened
              this.setState({ showDeleteModal: true });
            }
          }}
          >
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Xác nhận xóa</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-center text-gray-600">
                Bạn có chắc là muốn xóa người dùng này?
              </p>
            </div>
            <div className="flex justify-end gap-4">
              <Button 
                variant="outline" 
                onClick={() => this.setState({ showDeleteModal: false, selectedUser: null })}
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  this.confirmDelete();
                  this.setState({ showDeleteModal: false });
                }}
              >
                Xóa
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </Card>
    );
  }
}
export default EmployeeManagement;
