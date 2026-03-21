interface Props {
  title: string;
  subtitle?: string;
  emoji?: string;
  breadcrumb?: { label: string; href: string }[];
  right?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, emoji, breadcrumb, right }: Props) {
  return (
    <div className="bg-white border-b border-gray-100 mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
            {breadcrumb.map((b, i) => (
              <span key={b.href} className="flex items-center gap-1.5">
                {i > 0 && <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="9 18 15 12 9 6"/></svg>}
                <a href={b.href} className="hover:text-gray-600 transition-colors">{b.label}</a>
              </span>
            ))}
            <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="9 18 15 12 9 6"/></svg>
            <span className="text-gray-600 font-medium">{title}</span>
          </nav>
        )}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {emoji && (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#FFE8EC,#fff0f3)' }}>
                {emoji}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-extrabold" style={{ color: '#1A3C5E' }}>{title}</h1>
              {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {right && <div className="flex-shrink-0">{right}</div>}
        </div>
      </div>
    </div>
  );
}
