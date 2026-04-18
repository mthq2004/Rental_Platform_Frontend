"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Input, Card, Avatar, Typography } from 'antd';
import {
  ThunderboltOutlined,
  CloseOutlined,
  SendOutlined,
  UserOutlined,
  RobotOutlined,
  HomeOutlined,
  FileTextOutlined,
  CustomerServiceOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  EnvironmentOutlined,
  AliwangwangOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector } from '@/stores/hooks';
import { useRouter } from 'next/navigation';

const { Text, Title } = Typography;

// ─── Types ────────────────────────────────────────────────────────────────────

interface AIPropertyCard {
  id: string;
  title: string;
  image: string;
  price: string;
  district: string;
  city: string;
  slug: string;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  properties?: AIPropertyCard[];
  quickReplies?: string[];
  timestamp?: string;
}

// ─── Particle component ───────────────────────────────────────────────────────

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  dx: number;
  dy: number;
}

function ParticleCanvas({ trigger }: { trigger: number }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (trigger === 0) return;
    const colors = ['#1d4ed8', '#0ea5e9', '#38bdf8', '#22d3ee', '#60a5fa'];
    const newParticles: Particle[] = Array.from({ length: 10 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      y: 90,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 4 + Math.random() * 4,
      dx: (Math.random() - 0.5) * 60,
      dy: -(40 + Math.random() * 50),
    }));

    const showTimer = setTimeout(() => setParticles(newParticles), 0);
    const hideTimer = setTimeout(() => setParticles([]), 1200);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [trigger]);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: `${p.x}%`, y: `${p.y}%`, opacity: 1, scale: 1 }}
            animate={{ x: `calc(${p.x}% + ${p.dx}px)`, y: `calc(${p.y}% + ${p.dy}px)`, opacity: 0, scale: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: p.color,
              boxShadow: `0 0 6px ${p.color}`,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}
    >
      <Avatar
        icon={<RobotOutlined />}
        size={30}
        style={{
          background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)',
          boxShadow: '0 0 10px rgba(14,165,233,0.35)',
          flexShrink: 0,
        }}
      />
      <div
        style={{
          padding: '12px 16px',
          background: 'rgba(14,165,233,0.1)',
          border: '1px solid rgba(14,165,233,0.22)',
          borderRadius: '18px 18px 18px 4px',
          display: 'flex',
          gap: 5,
          alignItems: 'center',
        }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
            style={{ width: 7, height: 7, borderRadius: '50%', background: '#0ea5e9' }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ─── Ambient Orb ──────────────────────────────────────────────────────────────

function AmbientOrb({ style, delay = 0 }: { style: React.CSSProperties; delay?: number }) {
  return (
    <motion.div
      animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }}
      transition={{ duration: 6, repeat: Infinity, delay, ease: 'easeInOut' }}
      style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none', ...style }}
    />
  );
}

// ─── Spinning Ring Avatar ─────────────────────────────────────────────────────

function SpinRingAvatar() {
  return (
    <div style={{ position: 'relative', width: 42, height: 42 }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          inset: -3,
          borderRadius: '50%',
          background: 'conic-gradient(from 0deg, #1d4ed8, #38bdf8, #0ea5e9, #1d4ed8)',
        }}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: 42,
          height: 42,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid #ffffff',
        }}
      >
        <ThunderboltOutlined style={{ color: 'white', fontSize: 20 }} />
      </div>
    </div>
  );
}

// ─── Property Card Component ──────────────────────────────────────────────────

function PropertyCardItem({ property, onNavigate }: { property: AIPropertyCard; onNavigate: (slug: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        hoverable
        size="small"
        cover={
          property.image ? (
            <img
              alt={property.title}
              src={property.image}
              style={{ height: 120, objectFit: 'cover' }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://placehold.co/300x120/e2e8f0/64748b?text=BDS';
              }}
            />
          ) : (
            <div
              style={{
                height: 120,
                background: 'linear-gradient(135deg, #e0f2fe, #dbeafe)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HomeOutlined style={{ fontSize: 36, color: '#1d4ed8', opacity: 0.5 }} />
            </div>
          )
        }
        onClick={() => onNavigate(`/property/${property.slug}`)}
        styles={{ body: { padding: 10 } }}
        style={{
          borderRadius: 14,
          overflow: 'hidden',
          background: '#ffffff',
          border: '1px solid #dbeafe',
          cursor: 'pointer',
        }}
      >
        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a', lineHeight: 1.4, marginBottom: 4 }}>
          <HomeOutlined style={{ marginRight: 4, color: '#1d4ed8', fontSize: 11 }} />
          {property.title.length > 50 ? property.title.slice(0, 50) + '...' : property.title}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#0ea5e9', fontWeight: 700, fontSize: 13 }}>
            <DollarOutlined style={{ marginRight: 3 }} />
            {property.price}
          </span>
          {(property.district || property.city) && (
            <span style={{ color: '#64748b', fontSize: 10.5 }}>
              <EnvironmentOutlined style={{ marginRight: 2 }} />
              {property.district || property.city}
            </span>
          )}
        </div>
        <Button
          type="primary"
          size="small"
          block
          style={{
            marginTop: 8,
            borderRadius: 8,
            background: 'linear-gradient(90deg, #1d4ed8, #0ea5e9)',
            border: 'none',
            fontWeight: 600,
            fontSize: 11.5,
            height: 28,
          }}
        >
          Xem chi tiết
        </Button>
      </Card>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AIChatBox() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [particleTrigger, setParticleTrigger] = useState(0);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Xin chào! Tôi là trợ lý AI từ Digital Curator. Tôi có thể giúp bạn tìm kiếm bất động sản, tư vấn thuê nhà, hoặc giải đáp thắc mắc. Hãy hỏi tôi bất cứ điều gì!',
      quickReplies: ['Tìm phòng trọ', 'Tìm căn hộ Hà Nội', 'Hỏi về hợp đồng', 'Cần hỗ trợ kỹ thuật'],
      timestamp: 'Vừa xong',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const getTimestamp = () => {
    const now = new Date();
    return `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  const handleNavigate = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        sender: 'user',
        text,
        timestamp: getTimestamp(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setLoading(true);
      setParticleTrigger((n) => n + 1);

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_ENDPOINT || 'http://localhost:8000'}/api/ai/api/v1/chat`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user?.id || 'guest-' + Date.now(), message: text }),
          }
        );
        if (!response.ok) throw new Error('API ERROR');
        const data = await response.json();

        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: data.answer,
          timestamp: getTimestamp(),
        };

        // Attach property cards from backend
        if (data.properties && data.properties.length > 0) {
          aiResponse.properties = data.properties;
          aiResponse.quickReplies = ['Tìm thêm khu vực khác', 'Xem tất cả kết quả'];
        } else {
          // Add contextual quick replies
          const lower = text.toLowerCase();
          if (lower.includes('tìm') || lower.includes('phòng') || lower.includes('căn hộ')) {
            aiResponse.quickReplies = ['Dưới 5 triệu', 'Quận Cầu Giấy', 'Căn hộ full nội thất'];
          }
        }

        setMessages((prev) => [...prev, aiResponse]);
      } catch {
        // Fallback when backend is unreachable
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: 'Xin lỗi, AI service chưa kết nối được. Vui lòng kiểm tra backend đang chạy trên port đúng!',
          timestamp: getTimestamp(),
          quickReplies: ['Thử lại'],
        };
        setMessages((prev) => [...prev, aiResponse]);
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const quickReplyIcons: Record<string, React.ReactNode> = {
    'Tìm phòng trọ': <SearchOutlined />,
    'Tìm căn hộ Hà Nội': <HomeOutlined />,
    'Cần hỗ trợ kỹ thuật': <CustomerServiceOutlined />,
    'Hỏi về hợp đồng': <QuestionCircleOutlined />,
    'Dưới 5 triệu': <DollarOutlined />,
    'Quận Cầu Giấy': <EnvironmentOutlined />,
    'Căn hộ full nội thất': <HomeOutlined />,
    'Tìm thêm khu vực khác': <SearchOutlined />,
    'Xem tất cả kết quả': <SearchOutlined />,
    'Đăng tin cho thuê': <FileTextOutlined />,
    'Thử lại': <SendOutlined />,
  };

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chatbox"
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            style={{
              position: 'absolute',
              bottom: 80,
              right: 0,
              width: 'min(400px, calc(100vw - 24px))',
              height: 'min(650px, calc(100vh - 110px))',
              borderRadius: 24,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(255,255,255,0.96)',
              backdropFilter: 'blur(16px) saturate(130%)',
              border: '1px solid rgba(14,165,233,0.2)',
              boxShadow: '0 24px 50px rgba(15,23,42,0.18), 0 0 0 1px rgba(255,255,255,0.7) inset',
              transformOrigin: 'bottom right',
            }}
          >
            {/* Ambient orbs */}
            <AmbientOrb
              style={{
                width: 200,
                height: 200,
                top: -60,
                left: -40,
                background: 'radial-gradient(circle, rgba(14,165,233,0.22), transparent 70%)',
              }}
              delay={0}
            />
            <AmbientOrb
              style={{
                width: 160,
                height: 160,
                bottom: 40,
                left: 60,
                background: 'radial-gradient(circle, rgba(29,78,216,0.2), transparent 70%)',
              }}
              delay={3}
            />

            {/* Grid overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage:
                  'linear-gradient(rgba(14,165,233,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.07) 1px, transparent 1px)',
                backgroundSize: '36px 36px',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />

            {/* Particle canvas */}
            <ParticleCanvas trigger={particleTrigger} />

            {/* ── Header ── */}
            <div
              style={{
                position: 'relative',
                zIndex: 2,
                padding: '16px 18px 14px',
                background: 'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)',
                borderBottom: '1px solid rgba(14,165,233,0.18)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <SpinRingAvatar />
                  <div>
                    <Title level={5} style={{ color: '#0f172a', margin: 0, fontSize: 15, letterSpacing: -0.3 }}>
                      AI Concierge
                    </Title>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <motion.div
                        animate={{ opacity: [1, 0.5, 1], scale: [1, 0.85, 1] }}
                        transition={{ duration: 1.8, repeat: Infinity }}
                        style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }}
                      />
                      <Text style={{ color: '#334155', fontSize: 11, fontWeight: 500 }}>
                        ĐANG TRỰC TUYẾN
                      </Text>
                    </div>
                  </div>
                </div>

                <motion.div whileHover={{ rotate: 90 }} transition={{ duration: 0.2 }}>
                  <Button
                    type="text"
                    shape="circle"
                    size="small"
                    icon={<CloseOutlined style={{ color: '#334155', fontSize: 13 }} />}
                    onClick={() => setIsOpen(false)}
                    style={{
                      background: 'rgba(14,165,233,0.1)',
                      border: '1px solid rgba(14,165,233,0.25)',
                    }}
                  />
                </motion.div>
              </div>

              {/* Status pills */}
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                {[
                  { label: '● Live', color: '#4ade80', bg: 'rgba(74,222,128,0.15)', border: 'rgba(74,222,128,0.25)' },
                  { label: 'Bất động sản', color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)', border: 'rgba(14,165,233,0.24)' },
                  { label: 'AI Powered', color: '#1d4ed8', bg: 'rgba(29,78,216,0.1)', border: 'rgba(29,78,216,0.24)' },
                ].map((pill) => (
                  <span
                    key={pill.label}
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '3px 9px',
                      borderRadius: 20,
                      letterSpacing: 0.4,
                      textTransform: 'uppercase',
                      color: pill.color,
                      background: pill.bg,
                      border: `1px solid ${pill.border}`,
                    }}
                  >
                    {pill.label}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Messages ── */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                position: 'relative',
                zIndex: 2,
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(14,165,233,0.35) transparent',
              }}
            >
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 12, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                    style={{
                      display: 'flex',
                      flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
                      gap: 10,
                      alignItems: 'flex-end',
                    }}
                  >
                    {/* Avatar */}
                    <Avatar
                      icon={msg.sender === 'user' ? <UserOutlined /> : <RobotOutlined />}
                      size={30}
                      style={{
                        flexShrink: 0,
                        background:
                          msg.sender === 'user'
                            ? 'linear-gradient(135deg, #0ea5e9, #0284c7)'
                            : 'linear-gradient(135deg, #1d4ed8, #0ea5e9)',
                        boxShadow:
                          msg.sender === 'user'
                            ? '0 0 10px rgba(56,189,248,0.45)'
                            : '0 0 10px rgba(29,78,216,0.35)',
                      }}
                    />

                    {/* Content */}
                    <div
                      style={{
                        maxWidth: '80%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                        gap: 6,
                      }}
                    >
                      {/* Bubble */}
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        style={{
                          padding: '10px 14px',
                          fontSize: 13.5,
                          lineHeight: 1.55,
                          color: '#0f172a',
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap',
                          ...(msg.sender === 'ai'
                            ? {
                                background: 'rgba(14,165,233,0.08)',
                                border: '1px solid rgba(14,165,233,0.25)',
                                borderRadius: '18px 18px 18px 4px',
                                backdropFilter: 'blur(8px)',
                              }
                            : {
                                background: 'linear-gradient(135deg, rgba(14,165,233,0.18), rgba(2,132,199,0.18))',
                                border: '1px solid rgba(14,165,233,0.35)',
                                borderRadius: '18px 18px 4px 18px',
                              }),
                        }}
                      >
                        {msg.text}
                      </motion.div>

                      {/* Timestamp */}
                      {msg.timestamp && (
                        <Text style={{ fontSize: 10, color: '#64748b', padding: '0 4px' }}>
                          {msg.timestamp}
                        </Text>
                      )}

                      {/* Property Cards */}
                      {msg.properties && msg.properties.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', minWidth: 240 }}>
                          {msg.properties.map((property) => (
                            <PropertyCardItem
                              key={property.id}
                              property={property}
                              onNavigate={handleNavigate}
                            />
                          ))}
                        </div>
                      )}

                      {/* Quick Replies */}
                      {msg.quickReplies && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                          {msg.quickReplies.map((reply) => (
                            <motion.div key={reply} whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                size="small"
                                icon={quickReplyIcons[reply]}
                                onClick={() => handleSend(reply)}
                                style={{
                                  borderRadius: 20,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  border: '1px solid rgba(14,165,233,0.4)',
                                  color: '#0369a1',
                                  background: 'rgba(14,165,233,0.1)',
                                  backdropFilter: 'blur(4px)',
                                  height: 'auto',
                                  padding: '4px 12px',
                                }}
                              >
                                {reply}
                              </Button>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing indicator */}
              <AnimatePresence>{loading && <TypingIndicator />}</AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* ── Input Footer ── */}
            <div
              style={{
                position: 'relative',
                zIndex: 2,
                padding: '12px 14px 14px',
                background: 'rgba(255,255,255,0.9)',
                borderTop: '1px solid rgba(14,165,233,0.18)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Input
                  placeholder="Nhập tin nhắn..."
                  size="large"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onPressEnter={() => handleSend(input)}
                  style={{
                    borderRadius: 22,
                    background: '#ffffff',
                    border: '1px solid #bfdbfe',
                    color: '#0f172a',
                    fontSize: 13.5,
                    boxShadow: 'none',
                  }}
                  styles={{ input: { background: 'transparent', color: '#0f172a' } }}
                />
                <motion.div whileHover={{ scale: 1.12, rotate: -5 }} whileTap={{ scale: 0.92 }}>
                  <Button
                    type="primary"
                    shape="circle"
                    size="large"
                    icon={<SendOutlined style={{ fontSize: 16 }} />}
                    onClick={() => handleSend(input)}
                    disabled={!input.trim() || loading}
                    style={{
                      width: 44,
                      height: 44,
                      background: input.trim()
                        ? 'linear-gradient(135deg, #1d4ed8, #0ea5e9)'
                        : '#e2e8f0',
                      border: 'none',
                      boxShadow: input.trim() ? '0 4px 18px rgba(14,165,233,0.35)' : 'none',
                      transition: 'all 0.25s',
                      flexShrink: 0,
                    }}
                  />
                </motion.div>
              </div>

              {/* Gradient footer note */}
              <div style={{ textAlign: 'center' }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    background: 'linear-gradient(90deg, #1d4ed8, #0ea5e9)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    opacity: 0.8,
                  }}
                >
                  ✦ Powered by Real Estate AI ✦
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FAB Button ── */}
      <motion.div
        animate={
          isOpen
            ? {}
            : {
                boxShadow: [
                  '0 0 0 0 rgba(14,165,233,0.45)',
                  '0 0 0 14px rgba(14,165,233,0)',
                  '0 0 0 0 rgba(14,165,233,0)',
                ],
              }
        }
        transition={{ duration: 2.4, repeat: Infinity }}
        style={{ borderRadius: '50%' }}
      >
        <motion.div whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.93 }}>
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={
              <AnimatePresence mode="wait">
                <motion.span
                  key={isOpen ? 'close' : 'open'}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {isOpen ? (
                    <CloseOutlined style={{ fontSize: 22 }} />
                  ) : (
                    <AliwangwangOutlined style={{ fontSize: 26 }} />
                  )}
                </motion.span>
              </AnimatePresence>
            }
            onClick={() => setIsOpen(!isOpen)}
            style={{
              width: 62,
              height: 62,
              background: 'linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)',
              border: 'none',
              boxShadow: '0 8px 28px rgba(14,165,233,0.42)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
        </motion.div>
      </motion.div>

      {/* Online badge on FAB */}
      {!isOpen && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: '#4ade80',
            border: '2px solid white',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}