import { useEffect, useState, type ReactNode } from 'react';
import { getJson } from '../api/client.js';

type Props = { title: string; description: string };
type ResourceProps<T> = Props & {
  path: string;
  dataKey: string;
  emptyMessage: string;
  renderItems: (items: T[]) => ReactNode;
};

export function CapabilityCard<T>({ title, description, path, dataKey, emptyMessage, renderItems }: ResourceProps<T>) {
  const [items, setItems] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<Record<string, unknown>>(path)
      .then((response) => {
        const collection = response[dataKey];
        if (!Array.isArray(collection)) throw new Error('Invalid response from the server');
        if (active) setItems(collection as T[]);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unknown error');
      });
    return () => { active = false; };
  }, [dataKey, path]);

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">{title}</h2>
    <p>{description}</p>
    {items === null && error === null && <p role="status">Loading {title.toLowerCase()}...</p>}
    {error !== null && <p role="alert">Unable to load {title.toLowerCase()}: {error}</p>}
    {items !== null && items.length === 0 && <p role="status">{emptyMessage}</p>}
    {items !== null && items.length > 0 && renderItems(items)}
  </div></section>;
}
