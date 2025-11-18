import { Link } from 'react-router-dom';

export type BreadcrumbItem = { label: string; to?: string };

export default function Breadcrumbs({ items = [] }: { items?: BreadcrumbItem[] }) {
  if (!items || items.length === 0) return null;
  return (
    <nav className="text-sm text-gray-600 mb-4" aria-label="Breadcrumb">
      <ol className="list-none p-0 inline-flex items-center">
        {items.map((it, idx) => (
          <li key={idx} className="inline-flex items-center">
            {it.to ? (
              <Link to={it.to} className="text-blue-600 hover:underline">{it.label}</Link>
            ) : (
              <span className="text-gray-700">{it.label}</span>
            )}
            {idx < items.length - 1 && <span className="px-2 text-gray-400">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
