import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Store, ShoppingBag } from 'lucide-react';
import { api } from '../services/api';

interface ProdutoCatalogo {
  id: number;
  code: string;
  name: string;
  color: string;
  size: string;
  units: number;
  price: string;
  photoUrl?: string | null;
  category: { id: number; name: string };
}

interface Categoria { id: number; name: string; }
interface EmpresaPublico { id: number; tradeName: string; }

export function Catalogo() {
  const { companyId } = useParams<{ companyId: string }>();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>();

  const empresaQuery = useQuery({
    queryKey: ['empresa-publico', companyId],
    queryFn: () =>
      api.get<EmpresaPublico>(`/empresa/${companyId}/publico`).then(r => r.data),
    enabled: !!companyId,
  });

  const nomeFantasia = empresaQuery.data?.tradeName ?? 'Catálogo';

  const produtosQuery = useQuery({
    queryKey: ['catalogo', companyId, search, categoryFilter],
    queryFn: () =>
      api.get<ProdutoCatalogo[]>(`/produtos/catalogo/${companyId}`, {
        params: { ...(search && { q: search }), ...(categoryFilter && { categoryId: categoryFilter }) },
      }).then(r => r.data),
    enabled: !!companyId,
  });

  const categoriasQuery = useQuery({
    queryKey: ['categorias-publico', companyId],
    queryFn: () => api.get<Categoria[]>(`/categorias/publico/${companyId}`).then(r => r.data),
    enabled: !!companyId,
  });

  const categorias = categoriasQuery.data ?? [];
  const produtos = produtosQuery.data ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-600">
              <Store size={20} />
            </div>
            <div>
              <h1 className="font-bold leading-tight text-slate-900">{nomeFantasia}</h1>
              <p className="text-xs text-slate-400">Catálogo de Produtos</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShoppingBag size={14} />
            <span>{produtos.length} produtos</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-3 px-4 py-4">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Search size={18} className="shrink-0 text-slate-400" />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Buscar produto..."
            className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
        </div>

        {categorias.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setCategoryFilter(undefined)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                !categoryFilter
                  ? 'bg-amber-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-amber-400'
              }`}
            >
              Todos
            </button>
            {categorias.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id === categoryFilter ? undefined : cat.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  categoryFilter === cat.id
                    ? 'bg-amber-600 text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-amber-400'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <main className="mx-auto max-w-5xl px-4 pb-10">
        {produtosQuery.isLoading && (
          <div className="py-20 text-center text-slate-400">Carregando catálogo...</div>
        )}

        {!produtosQuery.isLoading && produtos.length === 0 && (
          <div className="py-20 text-center text-slate-400">Nenhum produto encontrado.</div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {produtos.map(produto => (
            <div
              key={produto.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="aspect-square overflow-hidden bg-slate-100">
                {produto.photoUrl ? (
                  <img
                    src={produto.photoUrl}
                    alt={produto.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ShoppingBag size={32} className="text-slate-300" />
                  </div>
                )}
              </div>

              <div className="space-y-1 p-3">
                <p className="truncate text-xs text-slate-400">{produto.category.name}</p>
                <p className="line-clamp-2 text-sm font-semibold leading-tight text-slate-800">{produto.name}</p>
                <p className="text-xs text-slate-500">{produto.color} · Tam. {produto.size}</p>
                {produto.units <= 3 && produto.units > 0 && (
                  <p className="text-xs font-medium text-orange-500">Últimas {produto.units} unidades</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        {nomeFantasia} · Catálogo Digital · CodaraStoke
      </footer>
    </div>
  );
}
