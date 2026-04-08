"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Card, Spin, Space, Avatar, Typography, Tooltip } from 'antd';
import { RobotOutlined, CloseOutlined, SendOutlined, PlusOutlined, UserOutlined, QuestionCircleOutlined, SearchOutlined, MessageOutlined, FileTextOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector } from '@/stores/hooks';

const { Text, Title, Paragraph } = Typography;

interface AIResponseCard {
  id: string;
  title: string;
  image: string;
  price: string;
  district: string;
  link: string;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  cards?: AIResponseCard[];
  quickReplies?: string[];
  options?: { value: string; label: string }[];
}

export default function AIChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Xin chào! Tôi là trợ lý ảo từ Digital Curator. Tôi có thể giúp gì cho bạn trong việc tìm kiếm bất động sản mơ ước hôm nay?',
      quickReplies: [
        'Tìm phòng trọ',
        'Đăng tin cho thuê',
        'Cần hỗ trợ kỹ thuật',
        'Hỏi về hợp đồng'
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), sender: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Call Real API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT || 'http://localhost:8000'}/api/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id || 'guest-' + Date.now(),
          message: text
        })
      });

      if (!response.ok) {
        throw new Error('API ERROR');
      }

      const data = await response.json();
      
      let aiResponse: Message = { id: (Date.now() + 1).toString(), sender: 'ai', text: data.answer };

      // Since the actual backend returns just "answer" string for now, we can try to inject some quick replies
      const lowerText = text.toLowerCase();
      if (lowerText === 'tìm phòng trọ' || lowerText.includes('tìm')) {
        // Example logic if we want to show cards or if backend someday returns structured cards 
        // For now we will rely on backend text. We can append quick replies dynamically
        aiResponse.quickReplies = ['Xem thêm Cầu Giấy', 'Tìm quận khác'];
      }
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error(error);
      
      // Fallback to mock logic if backend fails or doesn't exist
      setTimeout(() => {
        let aiResponse: Message = { id: (Date.now() + 1).toString(), sender: 'ai', text: '' };
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes('tìm') && lowerText.includes('cầu giấy')) {
          aiResponse.text = 'Tuyệt vời! Tôi đã tìm thấy kết quả phù hợp với yêu cầu của bạn tại khu vực Cầu Giấy. Bạn có muốn xem danh sách này không?';
          aiResponse.cards = [
            {
              id: '1',
              title: 'Phòng trọ ban công rộng Cầu Giấy',
              image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300&h=200&fit=crop',
              price: '5,000,000 đ',
              district: 'Cầu Giấy',
              link: '#'
            },
            {
              id: '2',
              title: 'Căn hộ mini full đồ Cầu Giấy',
              image: 'https://images.unsplash.com/photo-1502672260266-1c1c24240f38?w=300&h=200&fit=crop',
              price: '6,500,000 đ',
              district: 'Cầu Giấy',
              link: '#'
            }
          ];
        } else if (lowerText.includes('đăng tin') || lowerText.includes('phí')) {
          aiResponse.text = 'Để đăng tin, bạn vui lòng truy cập trang Quản lý tin đăng và nhấn nút "Tạo tin mới". Phí dịch vụ cơ bản là miễn phí, và bạn có thể trả phí để đẩy tin lên top.';
        } else if (lowerText.includes('không có') || lowerText.includes('tìm chưa thấy')) {
          aiResponse.text = 'Thật tiếc vì hiện tại chưa có phòng ở đó với mức giá này. Bạn có muốn để lại số điện thoại để khi có phòng mới mình báo ngay không?';
        } else if (lowerText === 'tìm phòng trọ') {
          aiResponse.text = 'Bạn muốn tìm phòng trọ khu vực nào và ngân sách khoảng bao nhiêu?';
        } else if (lowerText === 'hỏi về hợp đồng') {
          aiResponse.text = 'Hợp đồng điện tử có thể được ký kết ngay trên nền tảng. Bạn đang thắc mắc vấn đề gì về điều khoản hay cách ký kết?';
        } else {
          aiResponse.text = 'Xin lỗi, hiện tại tính năng gọi API thật chưa nhận được kết nối đến AI Service (có thể do lỗi CORS hoặc server chưa chạy ổn định), nên đây là phản hồi mặc định. Vui lòng kiểm tra lại backend AI service trên port 8000/50055!';
        }

        setMessages(prev => [...prev, aiResponse]);
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  const currentTheme = {
    primary: '#1677ff',
    bg: '#ffffff',
    text: '#333',
    aiBubble: '#f0f2f5',
    userBubble: '#e6f4ff',
    border: '#e8e8e8',
  };

  return (
    <div style={{ position: 'fixed', bottom: 30, right: 30, zIndex: 9999 }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              bottom: 80,
              right: 0,
              width: 380,
              height: 600,
              backgroundColor: currentTheme.bg,
              borderRadius: 16,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: `1px solid ${currentTheme.border}`,
            }}
          >
            {/* Header */}
            <div style={{ 
              padding: '16px 20px', 
              backgroundColor: currentTheme.primary, 
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <RobotOutlined style={{ fontSize: 20 }} />
                </div>
                <div>
                  <Title level={5} style={{ color: 'white', margin: 0, fontSize: 16 }}>AI Concierge</Title>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#52c41a' }} />
                    ĐANG TRỰC TUYẾN
                  </Text>
                </div>
              </div>
              <Button 
                type="text" 
                icon={<CloseOutlined style={{ color: 'white' }}/>} 
                onClick={() => setIsOpen(false)} 
              />
            </div>

            {/* Chat Area */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '20px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 16,
              backgroundColor: '#f8f9fa'
            }}>
              {messages.map((msg, index) => (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index === messages.length - 1 ? 0.1 : 0 }}
                  style={{
                    display: 'flex',
                    flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
                    gap: 12,
                    alignItems: 'flex-start'
                  }}
                >
                  <Avatar 
                    icon={msg.sender === 'user' ? <UserOutlined /> : <RobotOutlined />} 
                    style={{ backgroundColor: msg.sender === 'user' ? '#5750F1' : currentTheme.primary }}
                  />
                  
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '75%'
                  }}>
                    <div style={{
                      backgroundColor: msg.sender === 'user' ? currentTheme.userBubble : currentTheme.aiBubble,
                      padding: '12px 16px',
                      borderRadius: 16,
                      borderTopRightRadius: msg.sender === 'user' ? 4 : 16,
                      borderTopLeftRadius: msg.sender === 'ai' ? 4 : 16,
                      color: currentTheme.text,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      fontSize: 14,
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap'
                    }}>
                      {msg.text}
                    </div>

                    {/* Rich Content: Cards Data extraction feature */}
                    {msg.cards && msg.cards.length > 0 && (
                      <div style={{ 
                        marginTop: 10, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 10,
                        width: '100%',
                        minWidth: 240
                      }}>
                        {msg.cards.map(card => (
                          <Card 
                            key={card.id} 
                            hoverable
                            size="small"
                            cover={<img alt={card.title} src={card.image} style={{ height: 120, objectFit: 'cover' }} />}
                            onClick={() => window.location.href = card.link}
                            styles={{ body: { padding: '12px' } }}
                            style={{ borderRadius: 12, overflow: 'hidden' }}
                          >
                            <Card.Meta 
                              title={<span style={{ fontSize: 13, whiteSpace: 'normal', lineHeight: 1.4 }}>{card.title}</span>} 
                              description={<span style={{ color: '#1677ff', fontWeight: 600 }}>{card.price} <br/><span style={{ color: '#888', fontWeight: 'normal', fontSize: 12 }}>{card.district}</span></span>} 
                            />
                            <Button type="primary" size="small" style={{ marginTop: 10, width: '100%', borderRadius: 6 }}>
                              Xem chi tiết
                            </Button>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Quick Replies feature */}
                    {msg.quickReplies && (
                      <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {msg.quickReplies.map(reply => (
                          <Button 
                            key={reply} 
                            size="small" 
                            style={{ borderRadius: 16, fontSize: 13, borderColor: currentTheme.primary, color: currentTheme.primary }}
                            onClick={() => handleSend(reply)}
                          >
                            {reply}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Avatar icon={<RobotOutlined />} style={{ backgroundColor: currentTheme.primary }} />
                  <Spin size="small" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <div style={{ 
              padding: '16px', 
              backgroundColor: 'white', 
              borderTop: `1px solid ${currentTheme.border}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <Input 
                  placeholder="Nhập tin nhắn..." 
                  size="large"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onPressEnter={() => handleSend(input)}
                  style={{ borderRadius: 20 }}
                  suffix={
                    <Button 
                      type="text" 
                      shape="circle"
                      icon={<SendOutlined style={{ color: input.trim() ? currentTheme.primary : '#ccc', fontSize: 18 }} />} 
                      onClick={() => handleSend(input)}
                    />
                  }
                />
              </div>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Powered by Real Estate AI
                </Text>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <Tooltip title="Chat với AI Trợ lý" placement="left">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            type="primary"
            shape="circle"
            size="large"
            style={{
              width: 60,
              height: 60,
              boxShadow: '0 4px 16px rgba(22, 119, 255, 0.4)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <CloseOutlined style={{ fontSize: 24 }} /> : <RobotOutlined style={{ fontSize: 28 }} />}
          </Button>
        </motion.div>
      </Tooltip>
    </div>
  );
}
