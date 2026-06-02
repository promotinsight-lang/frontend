import React from 'react';

export function ResponsiveTableShell({ children, mobile, empty, emptyMessage = 'No records found.' }) {
  return (
    <>
      <div className="hidden md:block overflow-x-auto">{children}</div>
      <div className="md:hidden p-3 space-y-3">
        {empty ? (
          <p className="text-center text-gray-500 py-8 text-sm font-medium">{emptyMessage}</p>
        ) : (
          mobile
        )}
      </div>
    </>
  );
}

export function AdminMobileCard({ title, subtitle, children, actions, className = '' }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-4 shadow-sm ${className}`}>
      {(title || subtitle) && (
        <div className="mb-3 pb-3 border-b border-gray-100">
          {title && <p className="font-bold text-gray-800 text-sm">{title}</p>}
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div className="space-y-0.5">{children}</div>
      {actions && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2">{actions}</div>
      )}
    </div>
  );
}

export function AdminField({ label, children, align = 'between' }) {
  return (
    <div
      className={`flex ${
        align === 'start' ? 'flex-col items-start gap-1' : 'justify-between items-start gap-3'
      } py-2 border-b border-gray-50 last:border-0`}
    >
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide shrink-0">
        {label}
      </span>
      <div className="text-sm text-gray-800 font-medium text-right break-words max-w-[65%]">
        {children}
      </div>
    </div>
  );
}
