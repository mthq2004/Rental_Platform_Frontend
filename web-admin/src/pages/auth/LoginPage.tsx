import { Form, Input, Button, ConfigProvider } from "antd";
import { useNavigate } from "react-router-dom";
import {
  PhoneOutlined,
  ApartmentOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";
import { isValidPhone } from "../../utils/validators";

const LoginPage = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const onFinish = (values: Record<string, any>) => {
    console.log("Dữ liệu đăng nhập:", values);
    navigate("/dashboard");
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#0b50da",
          borderRadius: 8,
          controlHeightLG: 52,
          fontSize: 16,
        },
        components: {
          Form: {
            verticalLabelPadding: "0 0 6px",
            itemMarginBottom: 20,
          },
        },
      }}
    >
      {/* Layout tổng */}
      <div className="min-h-screen w-full flex flex-col lg:flex-row overflow-hidden font-['Inter'] bg-[#f5f6f8] dark:bg-[#101622]">
        {/* LEFT - FORM (60%) */}
        <div className="flex-[0.6] flex flex-col justify-center items-center p-6 lg:p-12 xl:p-24 bg-white dark:bg-[#1e2532] border-r border-[#dbdfe6] dark:border-gray-800">
          <div className="w-full max-w-[440px] flex flex-col gap-6">
            {/* Logo + Heading */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[#0b50da] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <ApartmentOutlined style={{ fontSize: "28px" }} />
                </div>
                <span className="text-2xl font-bold tracking-tight text-[#111318] dark:text-white">
                  EstateAdmin
                </span>
              </div>

              <h1 className="text-[#111318] dark:text-white text-3xl font-extrabold tracking-tight">
                Chào mừng trở lại
              </h1>
              <p className="text-[#606e8a] dark:text-gray-400 text-lg">
                Vui lòng nhập thông tin để truy cập hệ thống.
              </p>
            </div>

            {/* Form đăng nhập */}
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              requiredMark={false}
              className="w-full"
            >
              <Form.Item
                label={
                  <span className="dark:text-gray-200 text-base">
                    Số điện thoại
                  </span>
                }
                name="phone"
                rules={[
                  { required: true, message: "Vui lòng nhập số điện thoại!" },
                  {
                    validator: (_, value) =>
                      isValidPhone(value)
                        ? Promise.resolve()
                        : Promise.reject(
                            new Error("Số điện thoại không hợp lệ!")
                          ),
                  },
                ]}
              >
                <Input
                  size="large"
                  placeholder="09xxxxxxxx"
                  suffix={<PhoneOutlined className="text-gray-400 text-xl" />}
                  className="text-lg dark:bg-[#101622] dark:border-gray-700 dark:text-white"
                />
              </Form.Item>

              <Form.Item
                label={
                  <span className="dark:text-gray-200 text-base">Mật khẩu</span>
                }
                name="password"
                rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
              >
                <Input.Password
                  size="large"
                  placeholder="Nhập mật khẩu"
                  className="text-lg dark:bg-[#101622] dark:border-gray-700 dark:text-white"
                />
              </Form.Item>

              <Form.Item className="mt-8 mb-0">
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  className="text-lg font-bold shadow-md hover:translate-y-[-1px] transition-all"
                >
                  Đăng Nhập
                </Button>
              </Form.Item>
            </Form>

            {/* Support */}
            <div className="flex flex-col items-center gap-4 mt-4">
              <p className="text-[#606e8a] dark:text-gray-500 text-base">
                Bạn cần trợ giúp?{" "}
                <a
                  className="text-[#0b50da] font-semibold hover:underline"
                  href="#support"
                >
                  Liên hệ hỗ trợ
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT - BANNER (40%) */}
        <div className="hidden lg:flex flex-[0.4] relative bg-[#0b101b] items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              className="w-full h-full object-cover opacity-80"
              alt="Architecture"
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0b50da]/90 to-transparent mix-blend-multiply"></div>
          </div>

          <div className="relative z-10 p-12 text-white max-w-lg flex flex-col gap-8">
            <h2 className="text-5xl font-bold leading-tight">
              Quản lý bất động sản chuyên nghiệp.
            </h2>

            <div className="flex flex-col gap-5">
              {[
                "Theo dõi dự án",
                "Quản lý khách thuê",
                "Báo cáo tài chính",
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-5 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:translate-x-2 rounded-2xl"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20">
                    <CheckCircleFilled className="text-white text-xl" />
                  </div>
                  <span className="text-xl font-semibold text-white tracking-wide">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default LoginPage;
