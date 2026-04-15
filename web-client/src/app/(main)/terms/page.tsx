"use client";
import React from "react";
import { Typography, Divider } from "antd";

const { Title, Paragraph, Text } = Typography;

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Typography>
        <Title level={1} className="!text-3xl !font-bold !text-gray-900 !mb-2">
          Điều khoản sử dụng
        </Title>
        <Text type="secondary" className="text-sm">
          Cập nhật lần cuối: 01/01/2026
        </Text>

        <Divider />

        <Paragraph className="!text-gray-600 !leading-relaxed">
          Chào mừng bạn đến với nền tảng cho thuê bất động sản trực tuyến Group33 Real Estate (&quot;Nền tảng&quot;). 
          Vui lòng đọc kỹ các điều khoản sử dụng dưới đây trước khi sử dụng dịch vụ của chúng tôi. 
          Bằng việc truy cập và sử dụng Nền tảng, bạn đồng ý tuân thủ và bị ràng buộc bởi các điều khoản này.
        </Paragraph>

        <Title level={3}>1. Định nghĩa</Title>
        <Paragraph className="!text-gray-600 !leading-relaxed">
          <ul className="list-disc pl-6 space-y-2">
            <li><Text strong>&quot;Nền tảng&quot;</Text>: Hệ thống website và ứng dụng di động Group33 Real Estate, bao gồm tất cả các dịch vụ liên quan đến cho thuê bất động sản trực tuyến.</li>
            <li><Text strong>&quot;Người dùng&quot;</Text>: Bất kỳ cá nhân hoặc tổ chức nào truy cập, đăng ký và sử dụng Nền tảng, bao gồm Chủ nhà (Landlord) và Người thuê (Tenant).</li>
            <li><Text strong>&quot;Chủ nhà&quot;</Text>: Người dùng đăng tin cho thuê bất động sản trên Nền tảng.</li>
            <li><Text strong>&quot;Người thuê&quot;</Text>: Người dùng tìm kiếm và gửi yêu cầu thuê bất động sản trên Nền tảng.</li>
            <li><Text strong>&quot;Hợp đồng điện tử&quot;</Text>: Hợp đồng thuê nhà được tạo, ký kết và quản lý trực tuyến thông qua Nền tảng.</li>
          </ul>
        </Paragraph>

        <Title level={3}>2. Đăng ký tài khoản</Title>
        <Paragraph className="!text-gray-600 !leading-relaxed">
          <ul className="list-disc pl-6 space-y-2">
            <li>Bạn phải từ đủ 18 tuổi trở lên để đăng ký tài khoản trên Nền tảng.</li>
            <li>Thông tin đăng ký phải chính xác, đầy đủ và được cập nhật khi có thay đổi. Bạn có trách nhiệm bảo mật tài khoản, mật khẩu và chịu trách nhiệm về mọi hoạt động phát sinh từ tài khoản của mình.</li>
            <li>Mỗi người dùng chỉ được sở hữu một tài khoản. Việc tạo nhiều tài khoản có thể dẫn đến việc bị khóa tài khoản.</li>
            <li>Nền tảng hỗ trợ xác minh danh tính (KYC) để tăng tính tin cậy cho tài khoản của bạn.</li>
          </ul>
        </Paragraph>

        <Title level={3}>3. Quyền và nghĩa vụ của Chủ nhà</Title>
        <Paragraph className="!text-gray-600 !leading-relaxed">
          <ul className="list-disc pl-6 space-y-2">
            <li>Chủ nhà cam kết thông tin bất động sản đăng tải là chính xác, đầy đủ, không vi phạm pháp luật. Hình ảnh và mô tả phải phản ánh đúng thực tế của bất động sản.</li>
            <li>Chủ nhà có quyền phê duyệt hoặc từ chối yêu cầu thuê từ Người thuê dựa trên các tiêu chí hợp lý.</li>
            <li>Chủ nhà phải tuân thủ đúng nội dung hợp đồng đã ký kết, bao gồm giá thuê, thời hạn, các điều khoản bảo trì và sửa chữa.</li>
            <li>Chủ nhà không được phân biệt đối xử với Người thuê dựa trên giới tính, tôn giáo, dân tộc, hay bất kỳ yếu tố cá nhân nào khác.</li>
            <li>Nền tảng có quyền gỡ bỏ bài đăng vi phạm mà không cần thông báo trước.</li>
          </ul>
        </Paragraph>

        <Title level={3}>4. Quyền và nghĩa vụ của Người thuê</Title>
        <Paragraph className="!text-gray-600 !leading-relaxed">
          <ul className="list-disc pl-6 space-y-2">
            <li>Người thuê sử dụng Nền tảng để tìm kiếm, xem thông tin bất động sản và gửi yêu cầu thuê nhà.</li>
            <li>Người thuê cam kết thanh toán tiền thuê đúng hạn theo hợp đồng đã ký, bao gồm tiền thuê, tiền cọc, và các khoản phí khác (điện, nước, internet, phí quản lý...).</li>
            <li>Người thuê có trách nhiệm bảo quản bất động sản thuê, sử dụng đúng mục đích và thông báo kịp thời cho Chủ nhà về các hư hỏng cần sửa chữa.</li>
            <li>Người thuê không được cho thuê lại (sublease) khi chưa có sự đồng ý bằng văn bản của Chủ nhà.</li>
          </ul>
        </Paragraph>

        <Title level={3}>5. Hợp đồng điện tử và chữ ký số</Title>
        <Paragraph className="!text-gray-600 !leading-relaxed">
          <ul className="list-disc pl-6 space-y-2">
            <li>Nền tảng hỗ trợ tạo và quản lý hợp đồng thuê nhà điện tử. Hợp đồng điện tử có giá trị pháp lý tương đương hợp đồng giấy theo quy định của pháp luật Việt Nam.</li>
            <li>Chữ ký số được thực hiện thông qua dịch vụ SmartCA hoặc các phương thức xác thực khác do Nền tảng cung cấp.</li>
            <li>Sau khi cả hai bên ký hợp đồng, nội dung hợp đồng không thể bị thay đổi trừ khi có phụ lục bổ sung được hai bên đồng ý.</li>
            <li>Hợp đồng có thể được xác thực trên blockchain để đảm bảo tính minh bạch và không thể giả mạo.</li>
          </ul>
        </Paragraph>

        <Title level={3}>6. Thanh toán và ví điện tử</Title>
        <Paragraph className="!text-gray-600 !leading-relaxed">
          <ul className="list-disc pl-6 space-y-2">
            <li>Nền tảng cung cấp hệ thống ví điện tử nội bộ để thực hiện các giao dịch thanh toán. Tiền cọc sẽ được giữ trong tài khoản Escrow của Nền tảng cho đến khi hợp đồng được kích hoạt.</li>
            <li>Các phương thức thanh toán được hỗ trợ: chuyển khoản ngân hàng, MoMo, VNPay, ZaloPay, và các phương thức khác.</li>
            <li>Nền tảng có thể thu phí dịch vụ theo tỷ lệ phần trăm trên mỗi giao dịch. Mức phí cụ thể sẽ được thông báo rõ ràng trước khi giao dịch.</li>
            <li>Người dùng có thể rút tiền từ ví về tài khoản ngân hàng. Yêu cầu rút tiền sẽ được xử lý trong vòng 1-3 ngày làm việc.</li>
          </ul>
        </Paragraph>

        <Title level={3}>7. Giải quyết tranh chấp</Title>
        <Paragraph className="!text-gray-600 !leading-relaxed">
          <ul className="list-disc pl-6 space-y-2">
            <li>Khi phát sinh tranh chấp, hai bên được khuyến khích tự thương lượng giải quyết thông qua tính năng khiếu nại trên Nền tảng.</li>
            <li>Nếu hai bên không tự giải quyết được, tranh chấp sẽ được chuyển lên bộ phận quản trị của Nền tảng để hòa giải.</li>
            <li>Nền tảng đóng vai trò trung gian hòa giải, không phải cơ quan phán xử. Quyết định cuối cùng thuộc về các bên hoặc cơ quan có thẩm quyền.</li>
            <li>Nền tảng hỗ trợ các loại khiếu nại: thanh toán, tiền cọc, hư hỏng tài sản, vi phạm hợp đồng và các vấn đề khác.</li>
          </ul>
        </Paragraph>

        <Title level={3}>8. Chấm dứt hợp đồng</Title>
        <Paragraph className="!text-gray-600 !leading-relaxed">
          <ul className="list-disc pl-6 space-y-2">
            <li>Các bên có quyền yêu cầu chấm dứt hợp đồng trước hạn thông qua tính năng trên Nền tảng. Bên yêu cầu chấm dứt phải nêu rõ lý do và tuân thủ thời hạn báo trước theo hợp đồng.</li>
            <li>Phí chấm dứt hợp đồng sớm (nếu có) sẽ được tính theo điều khoản đã thỏa thuận trong hợp đồng.</li>
            <li>Tiền cọc sẽ được xử lý theo quy định của hợp đồng: hoàn trả, khấu trừ hoặc tịch thu tùy trường hợp.</li>
          </ul>
        </Paragraph>

        <Title level={3}>9. Nội dung bị cấm</Title>
        <Paragraph className="!text-gray-600 !leading-relaxed">
          Người dùng không được đăng tải hoặc chia sẻ:
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Thông tin sai sự thật, gây nhầm lẫn về bất động sản.</li>
            <li>Nội dung vi phạm pháp luật, đạo đức xã hội, thuần phong mỹ tục.</li>
            <li>Thông tin lừa đảo, giả mạo giấy tờ sở hữu hoặc quyền sử dụng bất động sản.</li>
            <li>Sử dụng Nền tảng cho mục đích rửa tiền hoặc các hoạt động bất hợp pháp khác.</li>
          </ul>
        </Paragraph>

        <Title level={3}>10. Giới hạn trách nhiệm</Title>
        <Paragraph className="!text-gray-600 !leading-relaxed">
          <ul className="list-disc pl-6 space-y-2">
            <li>Nền tảng là trung gian kết nối giữa Chủ nhà và Người thuê. Chúng tôi không chịu trách nhiệm về chất lượng bất động sản, hành vi của Chủ nhà hoặc Người thuê.</li>
            <li>Nền tảng nỗ lực đảm bảo hoạt động ổn định nhưng không cam kết dịch vụ không bị gián đoạn hay lỗi kỹ thuật.</li>
            <li>Nền tảng không chịu trách nhiệm về bất kỳ thiệt hại gián tiếp, đặc biệt hay hậu quả nào phát sinh từ việc sử dụng dịch vụ.</li>
          </ul>
        </Paragraph>

        <Title level={3}>11. Quyền sở hữu trí tuệ</Title>
        <Paragraph className="!text-gray-600 !leading-relaxed">
          Tất cả nội dung, thiết kế, logo, phần mềm và công nghệ trên Nền tảng thuộc quyền sở hữu của Group33 hoặc các bên cấp phép. 
          Người dùng không được sao chép, phân phối hoặc sử dụng bất kỳ tài sản trí tuệ nào mà không có sự đồng ý bằng văn bản.
        </Paragraph>

        <Title level={3}>12. Thay đổi điều khoản</Title>
        <Paragraph className="!text-gray-600 !leading-relaxed">
          Nền tảng có quyền cập nhật, sửa đổi các điều khoản sử dụng này bất kỳ lúc nào. 
          Những thay đổi quan trọng sẽ được thông báo qua email hoặc thông báo trên Nền tảng. 
          Việc tiếp tục sử dụng Nền tảng sau khi thay đổi được đăng tải đồng nghĩa với việc bạn chấp nhận các điều khoản mới.
        </Paragraph>

        <Title level={3}>13. Liên hệ</Title>
        <Paragraph className="!text-gray-600 !leading-relaxed">
          Nếu bạn có bất kỳ câu hỏi nào về Điều khoản sử dụng, vui lòng liên hệ chúng tôi:
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Email: support@group33realestate.com</li>
            <li>Hotline: 1900-xxxx</li>
            <li>Địa chỉ: TP. Hồ Chí Minh, Việt Nam</li>
          </ul>
        </Paragraph>
      </Typography>
    </div>
  );
}
