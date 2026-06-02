import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, RotateCcw } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { parcelasService } from '../services/parcelas.service';

type InstallmentStatus = 'PENDING' | 'PAID' | 'OVERDUE';

interface Parcela {
  id: number;
  number: number;
  value: string;
  dueDate: string;
  paidAt?: string;
  status: InstallmentStatus;
  sale: {
    id: number;
    documentNumber: string;
    installments?: Parcela[];
    client: {
      id: number;
      fullName: string;
    };
  };
}

const statusLabels: Record<InstallmentStatus, string> = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  OVERDUE: 'Atrasado',
};

const statusClasses: Record<InstallmentStatus, string> = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  PAID: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  OVERDUE: 'border-red-200 bg-red-50 text-red-700',
};

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value));
}

function formatDate(value?: string) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value));
}

function isOverdue(parcela: Parcela) {
  if (parcela.status !== 'PENDING') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(parcela.dueDate);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < today;
}

export function Parcelas() {
  const [pagarTarget, setPagarTarget] = useState<Parcela | null>(null);
  const [estornarTarget, setEstornarTarget] = useState<Parcela | null>(null);
  const [status, setStatus] = useState('');
  const [vencimentoAte, setVencimentoAte] = useState('');
  const queryClient = useQueryClient();

  const queryParams = useMemo(
    () => ({
      ...(status && { status }),
      ...(vencimentoAte && { vencimentoAte }),
    }),
    [status, vencimentoAte],
  );

  const parcelasQuery = useQuery<Parcela[]>({
    queryKey: ['parcelas', queryParams],
    queryFn: () => parcelasService.list(queryParams),
  });

  const pagarMutation = useMutation({
    mutationFn: (id: number) => parcelasService.pagar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parcelas'] });
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      setPagarTarget(null);
    },
    onError: () => setPagarTarget(null),
  });

  const estornarMutation = useMutation({
    mutationFn: (id: number) => parcelasService.estornar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parcelas'] });
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      setEstornarTarget(null);
    },
    onError: () => setEstornarTarget(null),
  });

  return (
    <div className="space-y-6 bg-white px-4 text-slate-800 md:px-0">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Parcelas</h1>
        <p className="text-sm text-slate-500">Acompanhamento financeiro e baixa de pagamentos.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-md border border-slate-200 bg-white p-4 md:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-slate-800">Status</span>
          <select
            value={status}
            onChange={event => setStatus(event.target.value)}
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
          >
            <option value="">Todos</option>
            <option value="PENDING">Pendente</option>
            <option value="PAID">Pago</option>
            <option value="OVERDUE">Atrasado</option>
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-slate-800">Vencimento até</span>
          <input
            type="date"
            value={vencimentoAte}
            onChange={event => setVencimentoAte(event.target.value)}
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
          />
        </label>
      </div>

      {pagarMutation.isError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Não foi possível registrar o pagamento.
        </p>
      )}

      <div className="space-y-3 md:hidden">
        {parcelasQuery.isLoading && (
          <div className="rounded-lg border border-slate-200 p-4 text-center text-sm text-slate-500">
            Carregando parcelas...
          </div>
        )}
        {parcelasQuery.isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
            Não foi possível carregar as parcelas.
          </div>
        )}
        {parcelasQuery.data?.length === 0 && (
          <div className="rounded-lg border border-slate-200 p-4 text-center text-sm text-slate-500">
            Nenhuma parcela encontrada.
          </div>
        )}
        {parcelasQuery.data?.map(parcela => {
          const overdue = isOverdue(parcela);
          const visualStatus = overdue ? 'OVERDUE' : parcela.status;
          const paid = parcela.status === 'PAID';

          return (
            <div
              key={parcela.id}
              className={`rounded-lg border border-slate-200 p-4 ${overdue ? 'bg-red-50' : 'bg-white'} ${paid ? 'text-slate-400' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className={`font-semibold ${paid ? 'text-slate-400' : 'text-slate-800'}`}>
                    {parcela.sale.documentNumber} · Parcela {parcela.number}
                  </h3>
                  <p className={paid ? 'text-sm text-slate-400' : 'text-sm text-slate-500'}>
                    {parcela.sale.client.fullName}
                  </p>
                </div>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses[visualStatus]}`}>
                  {statusLabels[visualStatus]}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-slate-500">Vencimento</p>
                  <p className={overdue ? 'font-semibold text-red-700' : paid ? 'text-slate-400' : 'text-slate-800'}>
                    {formatDate(parcela.dueDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500">Valor</p>
                  <p className={paid ? 'font-semibold text-slate-400' : 'font-semibold text-slate-800'}>
                    {formatCurrency(parcela.value)}
                  </p>
                </div>
              </div>
              {!paid && (
                <button
                  type="button"
                  onClick={() => setPagarTarget(parcela)}
                  disabled={pagarMutation.isPending}
                  className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-amber-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {pagarMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Marcar como pago
                </button>
              )}
              {paid && (
                <button
                  type="button"
                  onClick={() => setEstornarTarget(parcela)}
                  disabled={estornarMutation.isPending}
                  className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-600 transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                >
                  {estornarMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                  Estornar
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="hidden overflow-hidden rounded-md border border-slate-200 bg-white md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-800">Nº Doc</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-800">Cliente</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-800">Parcela Nº</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-800">Valor</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-800">Vencimento</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-800">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-800">Pago Em</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-800">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {parcelasQuery.isLoading && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Carregando parcelas...
                  </td>
                </tr>
              )}

              {parcelasQuery.isError && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-red-600">
                    Não foi possível carregar as parcelas.
                  </td>
                </tr>
              )}

              {parcelasQuery.data?.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Nenhuma parcela encontrada.
                  </td>
                </tr>
              )}

              {parcelasQuery.data?.map(parcela => {
                const overdue = isOverdue(parcela);
                const visualStatus = overdue ? 'OVERDUE' : parcela.status;
                const paid = parcela.status === 'PAID';

                return (
                  <tr
                    key={parcela.id}
                    className={`${overdue ? 'bg-red-50' : 'hover:bg-slate-50'} ${paid ? 'text-slate-400' : ''}`}
                  >
                    <td className={`px-4 py-3 font-medium ${paid ? 'text-slate-400' : 'text-slate-800'}`}>
                      {parcela.sale.documentNumber}
                    </td>
                    <td className={`px-4 py-3 ${paid ? 'text-slate-400' : 'text-slate-500'}`}>
                      {parcela.sale.client.fullName}
                    </td>
                    <td className={`px-4 py-3 ${paid ? 'text-slate-400' : 'text-slate-500'}`}>
                      {parcela.number}
                    </td>
                    <td className={`px-4 py-3 text-right ${paid ? 'text-slate-400' : 'text-slate-800'}`}>
                      {formatCurrency(parcela.value)}
                    </td>
                    <td className={`px-4 py-3 ${paid ? 'text-slate-400' : overdue ? 'font-semibold text-red-700' : 'text-slate-500'}`}>
                      {formatDate(parcela.dueDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses[visualStatus]}`}>
                        {statusLabels[visualStatus]}
                      </span>
                    </td>
                    <td className={`px-4 py-3 ${paid ? 'text-slate-400' : 'text-slate-500'}`}>
                      {formatDate(parcela.paidAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!paid && (
                        <button
                          type="button"
                          onClick={() => setPagarTarget(parcela)}
                          disabled={pagarMutation.isPending}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-amber-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {pagarMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                          Registrar Pagamento
                        </button>
                      )}
                      {paid && (
                        <button
                          type="button"
                          onClick={() => setEstornarTarget(parcela)}
                          disabled={estornarMutation.isPending}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-600 transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                        >
                          {estornarMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                          Estornar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <ConfirmDialog
        isOpen={!!pagarTarget}
        variant="warning"
        title="Confirmar recebimento"
        description={`Registrar pagamento de ${pagarTarget ? formatCurrency(pagarTarget.value) : ''} referente à parcela ${pagarTarget?.number} da venda ${pagarTarget?.sale.documentNumber}?`}
        confirmLabel="Confirmar pagamento"
        isLoading={pagarMutation.isPending}
        onConfirm={() => pagarTarget && pagarMutation.mutate(pagarTarget.id)}
        onCancel={() => setPagarTarget(null)}
      />

      <ConfirmDialog
        isOpen={!!estornarTarget}
        variant="danger"
        title="Estornar pagamento"
        description={`Estornar ${estornarTarget ? formatCurrency(estornarTarget.value) : ''} da parcela ${estornarTarget?.number}? O valor voltará como pendente na venda.`}
        confirmLabel="Confirmar estorno"
        isLoading={estornarMutation.isPending}
        onConfirm={() => estornarTarget && estornarMutation.mutate(estornarTarget.id)}
        onCancel={() => setEstornarTarget(null)}
      />
    </div>
  );
}
