import { useCallback, useEffect, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  Download,
  Plus,
  Search,
  Users,
  Wallet,
} from "lucide-react";
import {
  getCreditAccounts,
  getClosure,
  createCreditAccount,
  registerCreditAccountPayment,
  settleCreditAccount,
} from "../services/api";
import { formatCurrency, formatDate, formatQuantity } from "../utils/format";
import {
  Badge,
  Banner,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  StatCard,
  cn,
} from "./ui";

const PAYMENT_METHODS = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "MERCADO_PAGO", label: "Mercado Pago" },
  { value: "CUENTA_DNI", label: "Cuenta DNI" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
];

const PAYMENT_METHOD_LABELS = Object.fromEntries(
  PAYMENT_METHODS.map((method) => [method.value, method.label])
);

export default function CreditAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [createError, setCreateError] = useState(null);
  const [creating, setCreating] = useState(false);

  const [closure, setClosure] = useState(null);
  const [loadingClosureId, setLoadingClosureId] = useState(null);
  const [confirmSettle, setConfirmSettle] = useState(false);
  const [settling, setSettling] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("EFECTIVO");
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [registeringPayment, setRegisteringPayment] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getCreditAccounts();
      setAccounts(data);
    } catch (err) {
      setError(err.message || "No se pudieron cargar las cuentas corrientes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(event) {
    event.preventDefault();
    setCreateError(null);
    setCreating(true);

    try {
      await createCreditAccount({ name: name.trim() });
      setName("");
      setFormOpen(false);
      await load();
    } catch (err) {
      setCreateError(err.message || "No se pudo crear la cuenta");
    } finally {
      setCreating(false);
    }
  }

  async function handleViewClosure(account) {
    setError(null);
    setSuccess(null);
    setPaymentAmount("");
    setPaymentMethod("EFECTIVO");
    setPaymentError(null);
    setPaymentSuccess(null);
    setLoadingClosureId(account.id);

    try {
      const data = await getClosure(account.id);
      setClosure(data);
      setConfirmSettle(false);
    } catch (err) {
      setError(err.message || "No se pudo cargar el cierre");
    } finally {
      setLoadingClosureId(null);
    }
  }

  async function handleRegisterPayment(event) {
    event.preventDefault();
    if (!closure) return;

    const amount = Number.parseFloat(paymentAmount);
    const balance = Number.parseFloat(closure.balance);

    setPaymentError(null);
    setPaymentSuccess(null);

    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentError("Ingresá un monto mayor a cero.");
      return;
    }

    if (amount > balance) {
      setPaymentError("El pago no puede superar el saldo pendiente.");
      return;
    }

    setRegisteringPayment(true);

    try {
      const methodLabel = PAYMENT_METHOD_LABELS[paymentMethod] || paymentMethod;
      const updated = await registerCreditAccountPayment(closure.id, {
        amount,
        paymentMethod,
      });
      setClosure(updated);
      setPaymentAmount("");
      setPaymentMethod("EFECTIVO");
      setPaymentSuccess(
        `Pago de ${formatCurrency(amount)} (${methodLabel}) registrado. Saldo actualizado: ${formatCurrency(
          updated.balance
        )}.`
      );
      await load();
    } catch (err) {
      setPaymentError(err.message || "No se pudo registrar el pago.");
    } finally {
      setRegisteringPayment(false);
    }
  }

  async function handleDownloadPdf() {
    if (!closure) return;

    try {
      const { downloadClosurePdf } = await import("../utils/pdf");
      downloadClosurePdf(closure, { paid: Number.parseFloat(closure.balance) <= 0 });
    } catch {
      setError("No se pudo generar el PDF del cierre.");
    }
  }

  async function handleSettle() {
    if (!closure) return;

    const closureToSettle = closure;
    setSettling(true);
    setError(null);
    setPaymentError(null);
    setPaymentSuccess(null);

    try {
      await settleCreditAccount(closureToSettle.id);
      setSuccess(`Cuenta de ${closureToSettle.name} cerrada correctamente.`);
      setClosure(null);
      setConfirmSettle(false);
      await load();

      try {
        const { downloadClosurePdf } = await import("../utils/pdf");
        downloadClosurePdf(closureToSettle, { paid: true });
      } catch {
        setError("La cuenta se cerró, pero no se pudo generar el PDF automáticamente.");
      }
    } catch (err) {
      setError(err.message || "No se pudo cerrar la cuenta");
    } finally {
      setSettling(false);
    }
  }

  function closeClosure() {
    setClosure(null);
    setConfirmSettle(false);
    setPaymentAmount("");
    setPaymentMethod("EFECTIVO");
    setPaymentError(null);
    setPaymentSuccess(null);
  }

  const filteredAccounts = accounts.filter((account) =>
    account.name.toLowerCase().includes(search.toLowerCase())
  );
  const pendingAccounts = accounts.filter((account) => Number.parseFloat(account.balance) > 0);
  const settledAccounts = accounts.filter((account) => Number.parseFloat(account.balance) <= 0);
  const totalPending = pendingAccounts.reduce(
    (sum, account) => sum + Number.parseFloat(account.balance),
    0
  );

  const closureBalance = closure ? Number.parseFloat(closure.balance) : 0;
  const closureActiveItems = closure?.activeItemsCount || closure?.items?.length || 0;

  return (
    <div>
      <PageHeader
        title="Cuentas corrientes"
        subtitle="Fiados, pagos parciales y cierres de cada cliente."
        icon={Wallet}
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Nueva cuenta
          </Button>
        }
      />

      {error && <Banner tone="error" className="mb-4">{error}</Banner>}
      {success && <Banner tone="success" className="mb-4">{success}</Banner>}

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Total pendiente"
          value={formatCurrency(totalPending)}
          hint={`${pendingAccounts.length} cuenta(s) con saldo`}
          tone="red"
          icon={CircleDollarSign}
        />
        <StatCard
          label="Cuentas con saldo"
          value={pendingAccounts.length}
          hint="Pendientes de cobro"
          tone="amber"
          icon={Users}
        />
        <StatCard
          label="Cuentas sin saldo"
          value={settledAccounts.length}
          hint="Cobradas o a archivar"
          tone="emerald"
          icon={CheckCircle2}
        />
      </div>

      <Card className="mb-5 p-3 sm:p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar cuenta por nombre..."
            className="pl-9"
          />
        </div>
      </Card>

      {loading ? (
        <Card className="p-10 text-center text-sm text-stone-500">Cargando cuentas...</Card>
      ) : filteredAccounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No hay cuentas corrientes"
          message={
            accounts.length === 0
              ? "Creá la primera cuenta para empezar a registrar fiados."
              : "No encontramos cuentas con ese nombre."
          }
          action={
            accounts.length === 0 ? (
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4" />
                Nueva cuenta
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredAccounts.map((account) => {
            const balance = Number.parseFloat(account.balance);
            const activeItemsCount = account.activeItemsCount || 0;
            const hasBalance = balance > 0;
            const hasActiveItems = activeItemsCount > 0;
            const canView = hasBalance || hasActiveItems;
            const tone = hasBalance ? "red" : hasActiveItems ? "amber" : "emerald";
            const label = hasBalance ? "Con saldo" : hasActiveItems ? "A cerrar" : "Saldada";

            return (
              <Card key={account.id} className="flex flex-col p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold text-stone-900">{account.name}</h2>
                    <p
                      className={cn(
                        "mt-1 text-2xl font-bold tracking-tight",
                        hasBalance ? "text-red-700" : "text-emerald-700"
                      )}
                    >
                      {formatCurrency(balance)}
                    </p>
                  </div>
                  <Badge tone={tone}>{label}</Badge>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {hasActiveItems && (
                    <Badge tone="stone">
                      {activeItemsCount} movimiento(s)
                    </Badge>
                  )}
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-stone-100 pt-3">
                  <span className="text-xs text-stone-400">Cuenta #{account.id}</span>
                  {canView ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleViewClosure(account)}
                      disabled={loadingClosureId === account.id}
                    >
                      {loadingClosureId === account.id ? "Cargando..." : "Ver cierre"}
                    </Button>
                  ) : (
                    <span className="text-xs font-medium text-emerald-600">Sin deuda</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setCreateError(null);
        }}
        title="Nueva cuenta corriente"
        subtitle="Después podés fiarle ventas a esta persona."
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setFormOpen(false);
                setCreateError(null);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" form="create-account-form" disabled={creating}>
              {creating ? "Creando..." : "Crear cuenta"}
            </Button>
          </>
        }
      >
        <form id="create-account-form" onSubmit={handleCreate} className="space-y-4">
          {createError && <Banner tone="error">{createError}</Banner>}
          <Field label="Nombre de la persona" htmlFor="account-name">
            <Input
              id="account-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej: Juan Pérez"
              required
              autoFocus
            />
          </Field>
        </form>
      </Modal>

      <Modal
        open={Boolean(closure)}
        onClose={closeClosure}
        title={closure?.name || "Cierre de cuenta"}
        subtitle="Cargos, pagos parciales y saldo restante."
        size="lg"
        footer={
          confirmSettle ? (
            <>
              <Button variant="secondary" onClick={() => setConfirmSettle(false)}>
                Volver
              </Button>
              <Button variant="secondary" onClick={handleDownloadPdf}>
                <Download className="h-4 w-4" />
                PDF
              </Button>
              <Button variant="success" onClick={handleSettle} disabled={settling}>
                {settling ? "Procesando..." : "Confirmar cierre"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={handleDownloadPdf}>
                <Download className="h-4 w-4" />
                Descargar PDF
              </Button>
              <Button
                onClick={() => setConfirmSettle(true)}
                disabled={closureActiveItems === 0}
              >
                <CheckCircle2 className="h-4 w-4" />
                Cerrar cuenta
              </Button>
            </>
          )
        }
      >
        {closure && (
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                  Cargos
                </p>
                <p className="mt-1 text-lg font-bold tracking-tight text-stone-900">
                  {formatCurrency(closure.totalCharges ?? 0)}
                </p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                  Pagos parciales
                </p>
                <p className="mt-1 text-lg font-bold tracking-tight text-emerald-900">
                  {formatCurrency(closure.totalPayments ?? 0)}
                </p>
              </div>
              <div
                className={cn(
                  "rounded-xl border p-3",
                  closureBalance > 0
                    ? "border-red-200 bg-red-50"
                    : "border-emerald-200 bg-emerald-50"
                )}
              >
                <p
                  className={cn(
                    "text-[11px] font-semibold uppercase tracking-wide",
                    closureBalance > 0 ? "text-red-700" : "text-emerald-700"
                  )}
                >
                  Saldo restante
                </p>
                <p
                  className={cn(
                    "mt-1 text-lg font-bold tracking-tight",
                    closureBalance > 0 ? "text-red-900" : "text-emerald-900"
                  )}
                >
                  {formatCurrency(closure.balance)}
                </p>
              </div>
            </div>

            {confirmSettle && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-semibold text-amber-900">
                  {closureBalance > 0
                    ? `¿Cerrar la cuenta con un saldo de ${formatCurrency(closureBalance)}?`
                    : "¿Cerrar la cuenta?"}
                </p>
                <p className="mt-1 text-xs leading-5 text-amber-800">
                  {closureBalance > 0
                    ? "Se registrará el saldo restante como cobrado, se archivarán los movimientos y se descargará el comprobante PDF."
                    : "El saldo ya está cubierto. Se archivarán los movimientos y se descargará el comprobante PDF."}
                </p>
              </div>
            )}

            {paymentSuccess && <Banner tone="success">{paymentSuccess}</Banner>}
            {paymentError && <Banner tone="error">{paymentError}</Banner>}

            {!confirmSettle && closureBalance > 0 && (
              <form
                onSubmit={handleRegisterPayment}
                className="rounded-xl border border-emerald-200 bg-emerald-50 p-3"
              >
                <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end">
                  <Field
                    label="Registrar pago parcial"
                    htmlFor="partial-payment"
                    hint={`Saldo disponible: ${formatCurrency(closureBalance)}`}
                  >
                    <Input
                      id="partial-payment"
                      type="number"
                      min="0.01"
                      max={closureBalance}
                      step="0.01"
                      value={paymentAmount}
                      onChange={(event) => {
                        setPaymentAmount(event.target.value);
                        setPaymentError(null);
                      }}
                      placeholder="0.00"
                    />
                  </Field>
                  <Field label="Método de pago" htmlFor="partial-payment-method">
                    <Select
                      id="partial-payment-method"
                      value={paymentMethod}
                      onChange={(event) => setPaymentMethod(event.target.value)}
                    >
                      {PAYMENT_METHODS.map((method) => (
                        <option key={method.value} value={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Button
                    type="submit"
                    disabled={registeringPayment}
                    className="w-full sm:w-auto"
                  >
                    <Banknote className="h-4 w-4" />
                    {registeringPayment ? "Registrando..." : "Registrar pago"}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-emerald-700">
                  El monto se descuenta del saldo y el restante queda pendiente.
                </p>
              </form>
            )}

            {!confirmSettle && closureBalance <= 0 && closureActiveItems > 0 && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                El saldo quedó cubierto con los pagos parciales. Podés cerrar la cuenta para
                archivar los movimientos.
              </div>
            )}

            <div>
              <h3 className="mb-2 text-sm font-semibold text-stone-900">Movimientos</h3>
              {(closure.items || []).length === 0 ? (
                <p className="rounded-xl border border-dashed border-stone-300 p-4 text-center text-sm text-stone-500">
                  No hay movimientos pendientes.
                </p>
              ) : (
                <div className="space-y-2">
                  {closure.items.map((item) => {
                    const isPayment = item.type === "PAGO";

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "rounded-xl border p-3",
                          isPayment
                            ? "border-emerald-200 bg-emerald-50/60"
                            : "border-stone-200"
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge>{formatDate(item.date)}</Badge>
                            {isPayment ? (
                              <Badge tone="emerald">Pago parcial</Badge>
                            ) : item.saleId ? (
                              <Badge tone="stone">Venta #{item.saleId}</Badge>
                            ) : (
                              <Badge tone="stone">Cargo</Badge>
                            )}
                            {isPayment && item.paymentMethod && (
                              <Badge tone="sky">
                                {PAYMENT_METHOD_LABELS[item.paymentMethod] ||
                                  item.paymentMethod}
                              </Badge>
                            )}
                          </div>
                          <p
                            className={cn(
                              "text-sm font-bold",
                              isPayment ? "text-emerald-700" : "text-stone-900"
                            )}
                          >
                            {isPayment
                              ? `- ${formatCurrency(Math.abs(Number.parseFloat(item.amount)))}`
                              : formatCurrency(item.amount)}
                          </p>
                        </div>

                        {!isPayment && item.Sale?.SaleItems?.length > 0 && (
                          <div className="mt-2 space-y-1 border-t border-stone-100 pt-2">
                            {item.Sale.SaleItems.map((saleItem) => (
                              <div
                                key={saleItem.id}
                                className="flex items-center justify-between gap-3 text-xs"
                              >
                                <span className="text-stone-600">
                                  {saleItem.Product ? saleItem.Product.name : saleItem.customName}
                                  {saleItem.Product && (
                                    <span className="ml-1 text-stone-400">
                                      ({formatQuantity(saleItem.quantity)}{" "}
                                      {saleItem.Product.saleType === "kilo" ? "kg" : "u"})
                                    </span>
                                  )}
                                </span>
                                <span className="font-medium text-stone-700">
                                  {formatCurrency(saleItem.subtotal)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {isPayment && (
                          <p className="mt-1 text-xs text-emerald-700">Pago a cuenta del saldo.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
