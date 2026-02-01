import React from 'react';
import { Search, Home, Filter } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  variant?: 'search' | 'filter' | 'default';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Không tìm thấy bất động sản',
  message = 'Thử điều chỉnh bộ lọc hoặc tìm kiếm để xem kết quả khác',
  variant = 'default'
}) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200/60 rounded-2xl shadow-sm">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-100/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative text-center !py-16 !px-6">
        <div className="relative inline-block !mb-6">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/10 to-purple-500/10 animate-ping"
            style={{ animationDuration: '2s' }} />
          <div className="relative bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl !p-6 shadow-lg">
            <div className="absolute inset-0 bg-white/40 rounded-2xl" />
            <div className="relative">
              {variant === 'search' && (
                <Search size={56} className="text-blue-500 animate-pulse"
                  style={{ animationDuration: '2s' }} />
              )}
              {variant === 'filter' && (
                <Filter size={56} className="text-purple-500 animate-pulse"
                  style={{ animationDuration: '2s' }} />
              )}
              {variant === 'default' && (
                <Home size={56} className="text-indigo-500 animate-pulse"
                  style={{ animationDuration: '2s' }} />
              )}
            </div>
          </div>

          <div className="absolute -top-2 -right-2 w-3 h-3 bg-blue-400 rounded-full animate-bounce"
            style={{ animationDelay: '0s', animationDuration: '2s' }} />
          <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-purple-400 rounded-full animate-bounce"
            style={{ animationDelay: '0.5s', animationDuration: '2s' }} />
          <div className="absolute top-1/2 -right-4 w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
            style={{ animationDelay: '1s', animationDuration: '2s' }} />
        </div>

        <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent !mb-3">
          {title}
        </h3>

        <p className="text-slate-600 max-w-md !mx-auto leading-relaxed">
          {message}
        </p>

        <div className="flex items-center justify-center gap-2 !mt-8 opacity-30">
          <div className="w-12 h-px bg-gradient-to-r from-transparent via-slate-400 to-transparent" />
          <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          <div className="w-12 h-px bg-gradient-to-r from-transparent via-slate-400 to-transparent" />
        </div>
      </div>
    </div>
  );
};