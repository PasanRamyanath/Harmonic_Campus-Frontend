import { Link } from 'react-router-dom';

export type BreadcrumbItem = { label: string; to?: string };

export default function Breadcrumbs({ items = [] }: { items?: BreadcrumbItem[] }) {
  if (!items || items.length === 0) return null;
  return (
    <nav className="mb-5" aria-label="Breadcrumb">
      <ol className="flex items-center flex-wrap gap-1">
        {items.map((it, idx) => (
          <li key={idx} className="flex items-center gap-1">
            {it.to ? (
              <Link
                to={it.to}
                className="text-slate-500 hover:text-purple-400 text-sm transition-colors duration-200"
              >
                {it.label}
              </Link>
            ) : (
              <span className="text-slate-300 text-sm font-medium">{it.label}</span>
            )}
            {idx < items.length - 1 && (
              <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
