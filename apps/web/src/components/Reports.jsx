import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  FileText,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  getSalesReport,
  getIncomeReport,
  getExpensesReport,
  getInvoicesReport,
  getPendingCreditAccountsReport,
} from "../services/api";
import { formatCurrency, formatDate } from "../utils/format";
import { Banner, Card, PageHeader, StatCard, cn } from "./ui";

const PERIODS = [
  { value: "diario", label: "Hoy" },
  { value: "semanal", label: "7 días" },
  { value: "quincenal", label: "15 días" },
  { value: "mensual", label: "Este mes" },
];

const TABS = [
  { value: "sales", label: "Ventas", icon: TrendingUp },
  { value: "income", label: "Ingresos", icon: Wallet },
  { value: "expenses", label: "Gastos", icon: Receipt },
  { value: "invoices", label: "Facturas", icon: FileText },
  { value: "credit-accounts", label: "Ctas ctes", icon: CalendarDays },
];

function reportDate(value) {
  if (!value) return "-";
  const raw = String(value);
  return formatDate(raw.includes("T") ? raw : `${raw}T12:00:00`);
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState("sales");
  const [period, setPeriod] = useState("diario");
  const [salesData, setSalesData] = useState(null);
  const [incomeData, setIncomeData] = useState(null);
  const [expensesData, setExpensesData] = useState(null);
  const [invoicesData, setInvoicesData] = useState(null);
  const [pendingAccounts, setPendingAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      switch (activeTab) {
        case "sales": {
          setSalesData(await getSalesReport(period));
          break;
        }
        case "income": {
          setIncomeData(await getIncomeReport(period));
          break;
        }
        case "expenses": {
          setExpensesData(await getExpensesReport(period));
          break;
        }
        case "invoices": {
          setInvoicesData(await getInvoicesReport());
          break;
        }
        case "credit-accounts": {
          setPendingAccounts(await getPendingCreditAccountsReport());
          break;
        }
        default:
          break;
      }
    } catch (err) {
      setError(err.message || "No se pudo cargar el reporte");
    } finally {
      setLoading(false);
    }
  }, [activeTab, period]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const showPeriodSelector = activeTab !== "invoices" && activeTab !== "credit-accounts";

  return (
    <div>
      <PageHeader
        title="Reportes"
        subtitle="Cómo viene el movimiento del almacén."
        icon={BarChart3}
      />

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-stone-200 bg-white p-1 shadow-sm">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.value;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                active
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "text-stone-500 hover:bg-stone-50 hover:text-stone-800"
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-white" : "text-stone-400")} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {showPeriodSelector && (
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl border border-stone-200 bg-white p-1 shadow-sm sm:grid-cols-4">
          {PERIODS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setPeriod(item.value)}
              className={cn(
                "rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                period === item.value
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "text-stone-500 hover:bg-stone-50 hover:text-stone-800"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {error && <Banner tone="error" className="mb-4">{error}</Banner>}

      {loading ? (
        <Card className="p-10 text-center text-sm text-stone-500">Cargando reporte...</Card>
      ) : (
        <>
          {activeTab === "sales" && salesData && (
            <div className="space-y-4">
              <StatCard
                label="Total ventas"
                value={formatCurrency(salesData.total)}
                hint={`${salesData.byDate.length} día(s) con movimiento`}
                tone="emerald"
                icon={TrendingUp}
              />
              <ReportList
                items={salesData.byDate}
                emptyMessage="Sin ventas en este período."
                renderItem={(item) => (
                  <>
                    <div>
                      <p className="text-sm font-medium text-stone-800">
                        {reportDate(item.date)}
                      </p>
                      <p className="text-xs text-stone-500">
                        {item.count} venta{item.count !== "1" ? "s" : ""}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-stone-900">
                      {formatCurrency(item.total)}
                    </p>
                  </>
                )}
              />
            </div>
          )}

          {activeTab === "income" && incomeData && (
            <div className="space-y-4">
              <StatCard
                label="Total ingresos"
                value={formatCurrency(incomeData.total)}
                hint="Efectivo, MP, DNI y cobros de cuenta corriente"
                tone="emerald"
                icon={Wallet}
              />
              <ReportList
                items={incomeData.byDate}
                emptyMessage="Sin ingresos en este período."
                renderItem={(item) => (
                  <>
                    <p className="text-sm font-medium text-stone-800">{reportDate(item.date)}</p>
                    <p className="text-sm font-bold text-emerald-700">
                      {formatCurrency(item.total)}
                    </p>
                  </>
                )}
              />
            </div>
          )}

          {activeTab === "expenses" && expensesData && (
            <div className="space-y-4">
              <StatCard
                label="Total gastos"
                value={formatCurrency(expensesData.total)}
                hint="Gastos informales del período"
                tone="red"
                icon={TrendingDown}
              />
              <ReportList
                items={expensesData.byDate}
                emptyMessage="Sin gastos en este período."
                renderItem={(item) => (
                  <>
                    <div>
                      <p className="text-sm font-medium text-stone-800">
                        {reportDate(item.date)}
                      </p>
                      <p className="text-xs text-stone-500">
                        {item.count} gasto{item.count !== "1" ? "s" : ""}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-red-700">{formatCurrency(item.total)}</p>
                  </>
                )}
              />
            </div>
          )}

          {activeTab === "invoices" && invoicesData && (
            <div className="grid gap-3 sm:grid-cols-2">
              <StatCard
                label="Pendiente"
                value={formatCurrency(invoicesData.pending.total)}
                hint={`${invoicesData.pending.count} factura(s)`}
                tone="amber"
                icon={FileText}
              />
              <StatCard
                label="Pagado"
                value={formatCurrency(invoicesData.paid.total)}
                hint={`${invoicesData.paid.count} factura(s)`}
                tone="emerald"
                icon={FileText}
              />
            </div>
          )}

          {activeTab === "credit-accounts" && (
            <div className="space-y-4">
              <StatCard
                label="Total pendiente"
                value={formatCurrency(
                  pendingAccounts.reduce(
                    (sum, account) => sum + Number.parseFloat(account.balance),
                    0
                  )
                )}
                hint={`${pendingAccounts.length} cuenta(s) con saldo`}
                tone="red"
                icon={Wallet}
              />

              {pendingAccounts.length === 0 ? (
                <Card className="p-8 text-center text-sm text-stone-500">
                  No hay cuentas corrientes pendientes.
                </Card>
              ) : (
                <Card className="divide-y divide-stone-100">
                  {pendingAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <p className="text-sm font-medium text-stone-800">{account.name}</p>
                      <p className="text-sm font-bold text-red-700">
                        {formatCurrency(account.balance)}
                      </p>
                    </div>
                  ))}
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ReportList({ items, emptyMessage, renderItem }) {
  if (!items || items.length === 0) {
    return <Card className="p-8 text-center text-sm text-stone-500">{emptyMessage}</Card>;
  }

  return (
    <Card className="divide-y divide-stone-100">
      {items.map((item) => (
        <div key={item.date} className="flex items-center justify-between gap-3 px-4 py-3">
          {renderItem(item)}
        </div>
      ))}
    </Card>
  );
}
