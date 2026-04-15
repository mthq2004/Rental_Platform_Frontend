"use client";
import React from "react";
import { Typography, Divider } from "antd";

const { Title, Paragraph, Text } = Typography;

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Typography>
        <Title level={1} className="!text-3xl !font-bold !text-gray-900 !mb-2">
          Chính sách bảo mật
        </Title>
        <Text type="secondary" className="text-sm">
          Cập nhật lần cuối: 01/01/2026
        </Text>

        <Divider />

        <Paragraph className="!text-gray-600 !leading-relaxed">
          Group33 Real Estate (&quot;chúng tôi&quot;) cam kết bảo vệ quyền riêng tư và thông tin cá nhân của bạn. 
          Chính sách bảo mật này giải thích cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ thông tin 
          khi bạn sử dụng nền tảng cho thuê bất động sản trực tuyến của chúng tôi.
        </Paragraph>

        <Title level={3}>1. Thông tin chúng tôi thu thập</Title>
        <Paragraph className="!text-gray-600 !leading-relaxed">
          <Text strong>a) Thông tin bạn cung cấp trực tiếp:</Text>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Thông tin đăng ký: họ tên, số điện thoại, email, mật khẩu.</li>
            <li>Thông tin hồ sơ: ảnh đại diện, ngày sinh, giới tính, địa chỉ.</li>
            <li>Thông tin xác minh (KYC): CCCD/CMND, ảnh chân dung để xác thực danh tính.</li>
            <li>Thông tin tài chính: thông tin ngân hàng, lịch sử giao dịch, ví điện tử.</li>
            <li>Thông tin bất động sản: hình ảnh, mô tả, vị trí, giá thuê (đối với Chủ nhà).</li>
            <li>Nội dung giao tiếp: tin nhắn, phản hồi, khiếu nại, đánh giá.</li>
          </ul>
        </Paragraph>
        <Paragraph className="!text-gray-600 !leading-relaxed">
          <Text strong>b) Thông tin tự động thu thập:</Text>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Thông tin thiết bị: loại thiết bị, hệ điều hành, trình duyệt, IP address.</li>
            <li>Hoạt động sử dụng: trang truy cập, thời gian sử dụng, lịch sử tìm kiếm.</li>
            <li>Dữ liệu vị trí: vị trí từ trình duyệt (nếu bạn cho phép) để hiển thị bất động sản phù hợp.</li>
            <li>Cookie và công nghệ theo dõi: để cải thiện trải nghiệm người dùng.</li>
          </ul>
        </Paragraph>

        <Title level={3}>2. Mục đích sử dụng thông tin</Title>
        <Paragraph className="!text-gray-600 !leading-relaxed">
          Chúng tôi sử dụng thông tin của bạn cho các mục đích sau:
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><Text strong>Cung cấp dịch vụ:</Text> Tạo tài khoản, quản lý hồ sơ, kết nối Chủ nhà với Người thuê, xử lý giao dịch, tạo và quản lý hợp đồng điện tử.</li>
            <li><Text strong>Xác minh danh tính:</Text> Xác thực thông tin người dùng thông qua OTP, KYC, chữ ký số để đảm bảo an toàn giao dịch.</li>
            <li><Text strong>Thanh toán:</Text> Xử lý tiền thuê, tiền cọc, phí dịch vụ, rút tiền và các giao dịch tài chính khác qua hệ thống ví điện tử.</li>
            <li><Text strong>Liên lạc:</Text> Gửi thông báo, lời nhắc thanh toán, cập nhật trạng thái hợp đồng, tin nhắn từ đối tác thuê.</li>
            <li><Text strong>Cải thiện dịch vụ:</Text> Phân tích hành vi sử dụng để nâng cao chất lượng, đề xuất bất động sản phù hợp qua AI.</li>
            <li><Text strong>Giải quyết tranh chấp:</Text> Hỗ trợ xử lý khiếu nại, hòa giải giữa các bên thông qua hệ thống báo cáo.</li>
            <li><Text strong>Tuân thủ pháp luật:</Text> Đáp ứng yêu cầu của cơ quan nhà nước có thẩm quyền.</li>
          </ul>
        </Paragraph>

        <Title level={3}>3. Chia sẻ thông tin</Title>
        <Paragraph className="!text-gray-600 !leading-relaxed">
          Chúng tôi <Text strong>không</Text> bán thông tin cá nhân của bạn cho bên thứ ba. Thông tin chỉ được chia sẻ trong các trường hợp sau:
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><Text strong>Giữa các bên trong giao dịch:</Text> Chủ nhà và Người thuê sẽ thấy thông tin cơ bản của nhau (tên, số điện thoại) khi có giao dịch phát sinh để liên lạc.</li>
            <li><Text strong>Đối tác dịch vụ:</Text> Các nhà cung cấp thanh toán (VNPay, MoMo, ZaloPay), dịch vụ chữ ký số (SmartCA), dịch vụ blockchain để xử lý giao dịch.</li>
            <li><Text strong>Yêu cầu pháp lý:</Text> Khi có yêu cầu từ cơ quan nhà nước có thẩm quyền theo quy định pháp luật.</li>
            <li><Text strong>Bảo vệ quyền lợi:</Text> Khi cần thiết để bảo vệ quyền, tài sản hoặc sự an toàn của Nền tảng, người dùng hoặc công chúng.</li>
          </ul>
        </Paragraph>

        <Title level={3}>4. Bảo mật thông tin</Title>
        <Paragraph className="!text-gray-600 !leading-relaxed">
          Chúng tôi áp dụng các biện pháp bảo mật sau:
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><Text strong>Mã hóa:</Text> Mật khẩu được mã hóa bằng thuật toán băm (hash) an toàn. Dữ liệu truyền tải được mã hóa SSL/TLS.</li>
            <li><Text strong>Xác thực đa yếu tố:</Text> Hỗ trợ OTP qua SMS/Email, chữ ký số SmartCA cho các giao dịch quan trọng.</li>
            <li><Text strong>Kiểm soát truy cập:</Text> Phân quyền nghiêm ngặt, chỉ nhân viên được ủy quyền mới có thể truy cập dữ liệu nhạy cảm.</li>
            <li><Text strong>Token bảo mật:</Text> Sử dụng JWT (JSON Web Token) với thời hạn hết hạn để quản lý phiên đăng nhập.</li>
            <li><Text strong>Blockchain:</Text> Hợp đồng điện tử có thể được ghi lại trên blockchain để đảm bảo tính toàn vẹn và minh bạch.</li>
            <li><Text strong>Giám sát:</Text> Theo dõi liên tục các hoạt động bất thường và có cơ chế cảnh báo sớm.</li>
          </ul>
        </Paragraph>

        <Title level={3}>5. Lưu trữ thông tin</Title>
        <Paragraph className="!text-gray-600 !leading-relaxed">
          <ul className="list-disc pl-6 space-y-2">
            <li>Thông tin cá nhân được lưu trữ trong suốt thời gian tài khoản còn hoạt động và trong khoảng thời gian hợp lý sau khi tài khoản bị xóa (tối đa 90 ngày) để xử lý các vấn đề phát sinh.</li>
            <li>Dữ liệu giao dịch và hợp đồng được lưu trữ theo quy định pháp luật về kế toán và lưu trữ hồ sơ (tối thiểu 5 năm).</li>
            <li>Dữ liệu blockchain là vĩnh viễn và không thể xóa.</li>
          </ul>
        </Paragraph>

        <Title level={3}>6. Quyền của người dùng</Title>
        <Paragraph className="!text-gray-600 !leading-relaxed">
          Bạn có các quyền sau đối với thông tin cá nhân:
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><Text strong>Quyền truy cập:</Text> Xem và tải xuống thông tin cá nhân đã cung cấp thông qua trang Hồ sơ.</li>
            <li><Text strong>Quyền chỉnh sửa:</Text> Cập nhật thông tin cá nhân bất kỳ lúc nào qua phần cài đặt tài khoản.</li>
            <li><Text strong>Quyền xóa:</Text> Yêu cầu xóa tài khoản và dữ liệu cá nhân (trừ dữ liệu cần lưu giữ theo pháp luật).</li>
            <li><Text strong>Quyền phản đối:</Text> Từ chối nhận thông báo quảng cáo, email tiếp thị.</li>
            <li><Text strong>Quyền hạn chế:</Text> Yêu cầu hạn chế việc xử lý dữ liệu trong một số trường hợp nhất định.</li>
          </ul>
        </Paragraph>

        <Title level={3}>7. Cookie</Title>
        <Paragraph className="!text-gray-600 !leading-relaxed">
          Nền tảng sử dụng cookie và công nghệ tương tự để:
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Duy trì phiên đăng nhập và ghi nhớ tùy chọn người dùng.</li>
            <li>Phân tích hành vi sử dụng để cải thiện trải nghiệm.</li>
            <li>Hiển thị nội dung và đề xuất phù hợp.</li>
          </ul>
          Bạn có thể quản lý cài đặt cookie trong trình duyệt. Tuy nhiên, việc tắt cookie có thể ảnh hưởng đến một số tính năng của Nền tảng.
        </Paragraph>

        <Title level={3}>8. Bảo mật trẻ em</Title>
        <Paragraph className="!text-gray-600 !leading-relaxed">
          Nền tảng không dành cho người dưới 18 tuổi. Chúng tôi không cố ý thu thập thông tin từ trẻ em. 
          Nếu phát hiện tài khoản của người dưới 18 tuổi, chúng tôi sẽ xóa ngay thông tin liên quan.
        </Paragraph>

        <Title level={3}>9. Thay đổi chính sách</Title>
        <Paragraph className="!text-gray-600 !leading-relaxed">
          Chính sách bảo mật này có thể được cập nhật theo thời gian. Chúng tôi sẽ thông báo về các thay đổi quan trọng 
          qua email hoặc thông báo trên Nền tảng. Bạn nên kiểm tra trang này định kỳ để cập nhật các thay đổi mới nhất.
        </Paragraph>

        <Title level={3}>10. Liên hệ</Title>
        <Paragraph className="!text-gray-600 !leading-relaxed">
          Nếu bạn có câu hỏi hoặc yêu cầu liên quan đến quyền riêng tư và bảo mật dữ liệu, vui lòng liên hệ:
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Email: privacy@group33realestate.com</li>
            <li>Hotline: 1900-xxxx</li>
            <li>Địa chỉ: TP. Hồ Chí Minh, Việt Nam</li>
          </ul>
        </Paragraph>
      </Typography>
    </div>
  );
}
