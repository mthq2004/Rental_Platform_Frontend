import React from "react";
import { Button, Space } from "antd";

const FooterTop = () => {
  return (
    <section className="w-full bg-gradient-to-r from-[#003ECB] to-[#0052FF] py-16 px-6 text-center text-white">
      <div className="mx-auto max-w-5xl">
        <span className="inline-block mb-3 text-[11px] font-semibold tracking-widest uppercase opacity-80">
          Dành cho chủ bất động sản
        </span>

        <h2 className="text-[22px] md:text-[26px] font-bold mb-4 leading-tight">
          Đăng tin bất động sản dễ dàng.
          <br className="hidden md:block" />
          Tiếp cận hàng ngàn khách hàng tiềm năng.
        </h2>

        <p className="text-[14px] opacity-90 mb-8 max-w-2xl mx-auto">
          Tham gia nền tảng bất động sản uy tín, giúp bạn cho thuê nhanh
          hơn với sự hỗ trợ chuyên nghiệp.
        </p>

        <Space size="middle" className="flex justify-center">
          <Button
            size="large"
            className="
              h-10 px-8 text-[14px] font-semibold rounded-lg
              border-none text-[#0052FF] bg-white
              hover:bg-gray-100
            "
          >
            Đăng tin ngay
          </Button>

          <Button
            size="large"
            ghost
            className="
              h-10 px-8 text-[14px] font-semibold rounded-lg
              border-2 border-white text-white
              hover:bg-white hover:text-[#0052FF]
            "
          >
            Liên hệ tư vấn
          </Button>
        </Space>
      </div>
    </section>
  );
};

export default FooterTop;
