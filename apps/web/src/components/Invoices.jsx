import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, FileText, Plus, Trash2 } from "lucide-react";
import {
  getInvoices,
  createInvoice,
  markInvoiceAsPaid,
  deleteInvoice,
} from "../services/api";
import { formatCurrency, formatDate } from "../utils/format";
import {
  Badge,
  Banner,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  StatCard,
  cn,
} from "./ui";

const CATEGORIES = ["mercadería", "servicios", "insumos", "otros"];

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState("PENDIENTE");

  const [formOpen, setFormOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [supplier, setSupplier] = useState("");
  const [concept, setConcept] = useState("");
  const [category, setCategory] = useState("otros");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const [confirmAction, setConfirmAction] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getInvoices();
      setInvoices(data);
    } catch (err) {
      setError(err.message || "No se pudieron cargar las facturas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(event) {
    event.preventDefault();
    setFormError(null);
    setSaving(true);

    try {
      await createInvoice({
        amount: Number.parseFloat(amount),
        supplier: supplier.trim(),
        concept: concept.trim(),
        category,
        invoiceNumber: invoiceNumber.trim() || undefined,
      });
      setAmount("");
      setSupplier("");
      setConcept("");
      setCategory("otros");
      setInvoiceNumber("");
      setFormOpen(false);
      setSuccess("Factura registrada correctamente.");
      setActiveTab("PENDIENTE");
      await load();
    } catch (err) {
      setFormError(err.message || "No se pudo registrar la factura");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirm() {
    if (!confirmAction) return;

    const { type, invoice } = confirmAction;
    setConfirming(true);
    setError(null);

    try {
      if (type === "pay") {
        await markInvoiceAsPaid(invoice.id);
        setSuccess(`Factura de ${invoice.supplier} marcada como pagada.`);
      } else {
        await deleteInvoice(invoice.id);
        setSuccess("Factura eliminada.");
      }

      setConfirmAction(null);
      await load();
    } catch (err) {
      setError(err.message || "No se pudo completar la acción");
    } finally {
      setConfirming(false);
    }
  }

  const pendingInvoices = invoices.filter((invoice) => invoice.status === "PENDIENTE");
  const paidInvoices = invoices.filter((invoice) => invoice.status === "PAGADA");
  const totalPending = pendingInvoices.reduce(
    (sum, invoice) => sum + Number.parseFloat(invoice.amount),
    0
  );
  const totalPaid = paidInvoices.reduce(
    (sum, invoice) => sum + Number.parseFloat(invoice.amount),
    0
  );
  const visibleInvoices = activeTab === "PENDIENTE" ? pendingInvoices : paidInvoices;

  return (
    <div>
      <PageHeader
        title="Facturas"
        subtitle="Facturas de proveedores y control de pagos."
        icon={FileText}
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Nueva factura
          </Button>
        }
      />

      {error && <Banner tone="error" className="mb-4">{error}</Banner>}
      {success && <Banner tone="success" className="mb-4">{success}</Banner>}

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Pendiente"
          value={formatCurrency(totalPending)}
          hint={`${pendingInvoices.length} factura(s)`}
          tone="amber"
          icon={FileText}
        />
        <StatCard
          label="Pagado"
          value={formatCurrency(totalPaid)}
          hint={`${paidInvoices.length} factura(s)`}
          tone="emerald"
          icon={CheckCircle2}
        />
        <StatCard
          label="Total"
          value={formatCurrency(totalPending + totalPaid)}
          hint={`${invoices.length} factura(s) en total`}
          tone="stone"
        />
      </div>

      <div className="mb-4 flex gap-1 rounded-xl border border-stone-200 bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab("PENDIENTE")}
          className={cn(
            "flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
            activeTab === "PENDIENTE"
              ? "bg-emerald-700 text-white shadow-sm"
              : "text-stone-500 hover:bg-stone-50 hover:text-stone-800"
          )}
        >
          Pendientes ({pendingInvoices.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("PAGADA")}
          className={cn(
            "flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
            activeTab === "PAGADA"
              ? "bg-emerald-700 text-white shadow-sm"
              : "text-stone-500 hover:bg-stone-50 hover:text-stone-800"
          )}
        >
          Pagadas ({paidInvoices.length})
        </button>
      </div>

      {loading ? (
        <Card className="p-10 text-center text-sm text-stone-500">Cargando facturas...</Card>
      ) : visibleInvoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={activeTab === "PENDIENTE" ? "No hay facturas pendientes" : "No hay facturas pagadas"}
          message={
            activeTab === "PENDIENTE"
              ? "Cargá una factura de proveedor para empezar."
              : "Las facturas que marques como pagadas van a aparecer acá."
          }
          action={
            activeTab === "PENDIENTE" ? (
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4" />
                Nueva factura
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visibleInvoices.map((invoice) => (
            <Card key={invoice.id} className="flex flex-col p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-stone-900">
                    {invoice.supplier}
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-stone-500">{invoice.concept}</p>
                  <p
                    className={cn(
                      "mt-2 text-2xl font-bold tracking-tight",
                      invoice.status === "PENDIENTE" ? "text-stone-900" : "text-emerald-700"
                    )}
                  >
                    {formatCurrency(invoice.amount)}
                  </p>
                </div>
                <Badge tone={invoice.status === "PENDIENTE" ? "amber" : "emerald"}>
                  {invoice.status === "PENDIENTE" ? "Pendiente" : "Pagada"}
                </Badge>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge>{invoice.category}</Badge>
                {invoice.invoiceNumber && <Badge tone="stone">#{invoice.invoiceNumber}</Badge>}
                <Badge tone="stone">{formatDate(invoice.date)}</Badge>
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-stone-100 pt-3">
                <span className="text-xs text-stone-400">
                  {invoice.status === "PAGADA" && invoice.paidAt
                    ? `Pagada el ${formatDate(invoice.paidAt)}`
                    : `Factura #${invoice.id}`}
                </span>
                <div className="flex items-center gap-1">
                  {invoice.status === "PENDIENTE" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setConfirmAction({ type: "pay", invoice })}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Pagar
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setConfirmAction({ type: "delete", invoice })}
                    className="text-red-500 hover:bg-red-50 hover:text-red-700"
                    aria-label="Eliminar factura"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setFormError(null);
        }}
        title="Nueva factura"
        subtitle="Datos de la factura del proveedor."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setFormOpen(false);
                setFormError(null);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" form="create-invoice-form" disabled={saving}>
              {saving ? "Guardando..." : "Guardar factura"}
            </Button>
          </>
        }
      >
        <form id="create-invoice-form" onSubmit={handleCreate} className="space-y-4">
          {formError && <Banner tone="error">{formError}</Banner>}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Monto" htmlFor="invoice-amount">
              <Input
                id="invoice-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                required
                autoFocus
              />
            </Field>
            <Field label="Proveedor" htmlFor="invoice-supplier">
              <Input
                id="invoice-supplier"
                value={supplier}
                onChange={(event) => setSupplier(event.target.value)}
                placeholder="Ej: Distribuidora Norte"
                required
              />
            </Field>
          </div>

          <Field label="Concepto" htmlFor="invoice-concept">
            <Input
              id="invoice-concept"
              value={concept}
              onChange={(event) => setConcept(event.target.value)}
              placeholder="Ej: Mercadería de reposición"
              required
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Categoría" htmlFor="invoice-category">
              <Select
                id="invoice-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Nº de factura" htmlFor="invoice-number" hint="Opcional">
              <Input
                id="invoice-number"
                value={invoiceNumber}
                onChange={(event) => setInvoiceNumber(event.target.value)}
                placeholder="Ej: 0001-00001234"
              />
            </Field>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction?.type === "pay" ? "Marcar factura como pagada" : "Eliminar factura"}
        message={
          confirmAction?.type === "pay"
            ? `¿Confirmás el pago de ${formatCurrency(confirmAction?.invoice?.amount || 0)} a ${confirmAction?.invoice?.supplier || ""}?`
            : `¿Seguro que querés eliminar la factura de "${confirmAction?.invoice?.supplier || ""}"? Esta acción no se puede deshacer.`
        }
        confirmLabel={confirmAction?.type === "pay" ? "Marcar pagada" : "Eliminar"}
        tone={confirmAction?.type === "pay" ? "primary" : "danger"}
        loading={confirming}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
