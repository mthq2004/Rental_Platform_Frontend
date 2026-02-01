import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="!mb-8">
      <div className="flex items-center gap-3 !mb-2">
        <div className="w-1 h-10 bg-blue-600 rounded" />
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
          {title}
        </h1>
      </div>
      <p className="text-base text-slate-500 !pl-7">
        {subtitle}
      </p>
    </div>
  );
};