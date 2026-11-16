import { useCallback, useEffect, useState } from "react";
import { Plus, Receipt, Search, Trash2 } from "lucide-react";
import { getExpenses, createExpense, deleteExpense } from "../services/api";
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
} from "./ui";

const CATEGORIES = ["mercadería", "servicios", "insumos", "otros"];

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [concept, setConcept] = useState("");
  const [category, setCategory] = useState("otros");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch (err) {
      setError(err.message || "No se pudieron cargar los gastos");
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
      await createExpense({
        amount: Number.parseFloat(amount),
        concept: concept.trim(),
        category,
      });
      setAmount("");
      setConcept("");
      setCategory("otros");
      setFormOpen(false);
      setSuccess("Gasto registrado correctamente.");
      await load();
    } catch (err) {
      setFormError(err.message || "No se pudo registrar el gasto");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);

    try {
      await deleteExpense(deleteTarget.id);
      setDeleteTarget(null);
      setSuccess("Gasto eliminado.");
      await load();
    } catch (err) {
      setError(err.message || "No se pudo eliminar el gasto");
    } finally {
      setDeleting(false);
    }
  }

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch = expense.concept.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !filterCategory || expense.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const total = expenses.reduce((sum, expense) => sum + Number.parseFloat(expense.amount), 0);

  return (
    <div>
      <PageHeader
        title="Gastos"
        subtitle="Compras informales y gastos del día."
        icon={Receipt}
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Nuevo gasto
          </Button>
        }
      />

      {error && <Banner tone="error" className="mb-4">{error}</Banner>}
      {success && <Banner tone="success" className="mb-4">{success}</Banner>}

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <StatCard
          label="Total gastos"
          value={formatCurrency(total)}
          hint={`${expenses.length} movimiento(s)`}
          tone="red"
          icon={Receipt}
        />
        <StatCard
          label="Promedio por gasto"
          value={formatCurrency(expenses.length ? total / expenses.length : 0)}
          hint="Sobre los gastos cargados"
          tone="stone"
        />
      </div>

      <Card className="mb-5 p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por concepto..."
              className="pl-9"
            />
          </div>
          <Select
            value={filterCategory}
            onChange={(event) => setFilterCategory(event.target.value)}
            className="sm:w-48"
          >
            <option value="">Todas las categorías</option>
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {loading ? (
        <Card className="p-10 text-center text-sm text-stone-500">Cargando gastos...</Card>
      ) : filteredExpenses.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No hay gastos para mostrar"
          message={
            expenses.length === 0
              ? "Cargá el primer gasto del almacén."
              : "Probá con otra búsqueda o categoría."
          }
          action={
            expenses.length === 0 ? (
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4" />
                Nuevo gasto
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredExpenses.map((expense) => (
            <Card key={expense.id} className="flex flex-col p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-stone-900">
                    {expense.concept}
                  </h2>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
                    {formatCurrency(expense.amount)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteTarget(expense)}
                  className="text-red-500 hover:bg-red-50 hover:text-red-700"
                  aria-label="Eliminar gasto"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge>{expense.category}</Badge>
                <Badge tone="stone">{formatDate(expense.date)}</Badge>
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
        title="Nuevo gasto"
        subtitle="Registrá una salida de caja del almacén."
        size="sm"
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
            <Button type="submit" form="create-expense-form" disabled={saving}>
              {saving ? "Guardando..." : "Guardar gasto"}
            </Button>
          </>
        }
      >
        <form id="create-expense-form" onSubmit={handleCreate} className="space-y-4">
          {formError && <Banner tone="error">{formError}</Banner>}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Monto" htmlFor="expense-amount">
              <Input
                id="expense-amount"
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
            <Field label="Categoría" htmlFor="expense-category">
              <Select
                id="expense-category"
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
          </div>

          <Field label="Concepto" htmlFor="expense-concept">
            <Input
              id="expense-concept"
              value={concept}
              onChange={(event) => setConcept(event.target.value)}
              placeholder="Ej: Verdura para el día"
              required
            />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar gasto"
        message={`¿Seguro que querés eliminar "${deleteTarget?.concept || ""}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        tone="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
