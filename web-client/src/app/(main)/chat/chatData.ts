// chatData.ts

export type MessageType = 'text' | 'image' | 'file';

export interface Message {
  id: string;
  senderId: string; // 'me' là admin, còn lại là khách
  type: MessageType;
  content: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'seen';
  fileName?: string;
  fileSize?: string;
}

export interface Conversation {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  isOnline: boolean;
  unreadCount: number;
}

export const MOCK_CONVERSATIONS: Conversation[] = [
  { id: 1, name: "Mai Thành Hải Quân", avatar: "1", lastMessage: "Dự án này còn hướng Đông không em?", time: "10:30", isOnline: true, unreadCount: 2 },
  { id: 2, name: "Nguyễn Thị An", avatar: "2", lastMessage: "Gửi chị bảng giá chi tiết nhé.", time: "09:15", isOnline: false, unreadCount: 0 },
  { id: 3, name: "Trần Văn Bình", avatar: "3", lastMessage: "Cảm ơn em đã tư vấn nhiệt tình.", time: "Hôm qua", isOnline: true, unreadCount: 0 },
  { id: 4, name: "Lê Thị Thu", avatar: "4", lastMessage: "Chị đã nhận được file rồi.", time: "Thứ 2", isOnline: false, unreadCount: 0 },
  { id: 5, name: "Phạm Minh Hoàng", avatar: "5", lastMessage: "Căn hộ này bàn giao thô hay hoàn thiện?", time: "11/02", isOnline: false, unreadCount: 0 },
  { id: 6, name: "Hoàng Thanh Trúc", avatar: "6", lastMessage: "Em check lại lịch hẹn xem nhà nhé.", time: "10/02", isOnline: true, unreadCount: 0 },
  { id: 7, name: "Bùi Anh Tuấn", avatar: "7", lastMessage: "Oki em, cảm ơn em.", time: "09/02", isOnline: false, unreadCount: 0 },
  { id: 8, name: "Đặng Minh Anh", avatar: "8", lastMessage: "Gửi thêm ảnh thực tế đi em.", time: "08/02", isOnline: true, unreadCount: 1 },
  { id: 9, name: "Vũ Đức Trọng", avatar: "9", lastMessage: "Thủ tục vay vốn cần những gì?", time: "07/02", isOnline: false, unreadCount: 0 },
  { id: 10, name: "Quách Gia", avatar: "10", lastMessage: "Hẹn gặp em tại dự án.", time: "05/02", isOnline: false, unreadCount: 0 },
];

export const MOCK_MESSAGES: Message[] = [
  { id: '1', senderId: 'customer', type: 'text', content: 'Chào bạn, mình cần tư vấn về căn hộ 2 phòng ngủ dự án Empire City.', timestamp: '09:00 AM', status: 'seen' },
  { id: '2', senderId: 'me', type: 'text', content: 'Chào anh Quân! Rất vui được hỗ trợ anh. Hiện tại block mới đang có vị trí rất đẹp nhìn trực diện sông, anh quan tâm tầng cao hay thấp ạ?', timestamp: '09:01 AM' },
  { id: '3', senderId: 'customer', type: 'text', content: 'Anh thích tầng trung, tầm tầng 15 đến 25.', timestamp: '09:03 AM', status: 'seen' },
  { id: '4', senderId: 'me', type: 'text', content: 'Dạ vâng, tầng đó tầm nhìn cực thoáng. Em gửi anh phối cảnh ban công từ tầng 18 anh xem thử nhé.', timestamp: '09:04 AM' },
  { id: '5', senderId: 'me', type: 'image', content: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000', timestamp: '09:05 AM' },
  { id: '6', senderId: 'customer', type: 'text', content: 'Đẹp quá em. Cho anh hỏi thêm về chính sách thanh toán và chiết khấu hiện tại.', timestamp: '09:07 AM', status: 'seen' },
  { id: '7', senderId: 'me', type: 'text', content: 'Dạ, hiện tại nếu thanh toán nhanh 95% anh sẽ được chiết khấu ngay 8%. Ngoài ra còn được tặng gói nội thất trị giá 200 triệu đồng.', timestamp: '09:09 AM' },
  { id: '8', senderId: 'me', type: 'file', content: '', fileName: 'Phuong_Thuc_Thanh_Toan_Empire.pdf', fileSize: '2.1 MB', timestamp: '09:10 AM' },
  { id: '9', senderId: 'customer', type: 'text', content: 'Để anh bàn lại với nhà mình. À, nội dung này dài để test tính năng cuộn trang (scroll) của giao diện chat chúng ta đang xây dựng. Hy vọng mọi thứ hoạt động trơn tru trên cả mobile và desktop. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', timestamp: '09:15 AM', status: 'seen' },
  { id: '10', senderId: 'me', type: 'text', content: 'Dạ anh cứ thong thả thảo luận với gia đình ạ. Em gửi thêm cho anh mặt bằng chi tiết các căn còn trống để anh dễ hình dung.', timestamp: '09:16 AM' },
  { id: '11', senderId: 'me', type: 'file', content: '', fileName: 'Mat_Bang_Tang_Dien_Hinh.zip', fileSize: '15.4 MB', timestamp: '09:17 AM' },
  { id: '12', senderId: 'customer', type: 'text', content: 'Oki em, anh đã nhận được file.', timestamp: '09:20 AM', status: 'seen' },
  { id: '13', senderId: 'customer', type: 'text', content: 'Dự án này pháp lý hiện tại như thế nào rồi em nhỉ?', timestamp: '09:21 AM', status: 'seen' },
  { id: '14', senderId: 'me', type: 'text', content: 'Dạ dự án đã có đầy đủ giấy phép xây dựng và giấy chứng nhận quyền sử dụng đất rồi anh nhé. Em gửi anh bản scan giấy tờ pháp lý để anh yên tâm.', timestamp: '09:23 AM' },
  { id: '15', senderId: 'me', type: 'file', content: '', fileName: 'Giay_Phep_Xay_Dung_Empire.pdf', fileSize: '3.5 MB', timestamp: '09:24 AM' },
  { id: '16', senderId: 'customer', type: 'text', content: 'Cảm ơn em, tư vấn rất chuyên nghiệp.', timestamp: '09:26 AM', status: 'seen' },
  { id: '17', senderId: 'me', type: 'text', content: 'Dạ cảm ơn anh đã tin tưởng! Anh cần thêm thông tin gì cứ nhắn em bất cứ lúc nào ạ.', timestamp: '09:28 AM' },
  { id: '18', senderId: 'customer', type: 'text', content: 'Chiều thứ 7 này tầm 3h em có rảnh không? Anh muốn ghé xem thực tế căn nhà mẫu.', timestamp: '10:00 AM', status: 'seen' },
  { id: '19', senderId: 'me', type: 'text', content: 'Dạ thứ 7 này em rảnh ạ. Để em đăng ký với ban quản lý nhà mẫu đón anh nhé. Anh cho em xin thêm số điện thoại để em tiện liên lạc khi anh tới ạ.', timestamp: '10:02 AM' },
  { id: '20', senderId: 'customer', type: 'text', content: 'Số của anh là 0909 123 456. Hẹn gặp em nhé.', timestamp: '10:05 AM', status: 'seen' },
  { id: '21', senderId: 'me', type: 'text', content: 'Dạ em đã lưu thông tin. Hẹn gặp anh vào 3h chiều thứ 7 ạ. Chúc anh một ngày tốt lành!', timestamp: '10:07 AM' },
];