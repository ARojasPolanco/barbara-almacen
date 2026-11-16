import { useCallback, useEffect, useState } from 'react';
import {
  Eye,
  EyeOff,
  Package,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  createCategory,
} from '../services/api';
import { formatCurrency } from '../utils/format';
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
  cn,
} from './ui';

function ProductFormModal({ open, onClose, product, categories, onSave, onCategoryCreated }) {
  const [form, setForm] = useState({
    name: '',
    price: '',
    categoryId: '',
    saleType: 'unidad',
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categoryError, setCategoryError] = useState(null);
  const [creatingCategory, setCreatingCategory] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      name: product?.name || '',
      price: product?.price !== undefined ? String(product.price) : '',
      categoryId: product?.categoryId ? String(product.categoryId) : '',
      saleType: product?.saleType || 'unidad',
    });
    setError(null);
    setShowCategoryForm(false);
    setNewCategory('');
    setCategoryError(null);
  }, [open, product]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleCreateCategory() {
    const name = newCategory.trim();

    if (!name) {
      setCategoryError('Ingresá un nombre para la categoría.');
      return;
    }

    setCreatingCategory(true);
    setCategoryError(null);

    try {
      const created = await createCategory({ name });
      updateField('categoryId', String(created.id));
      setNewCategory('');
      setShowCategoryForm(false);
      await onCategoryCreated?.();
    } catch (err) {
      setCategoryError(err.message || 'No se pudo crear la categoría.');
    } finally {
      setCreatingCategory(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.price || Number.isNaN(Number.parseFloat(form.price))) {
      setError('Completá el nombre y un precio válido.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        price: Number.parseFloat(form.price),
        saleType: form.saleType,
      };

      if (form.categoryId) {
        payload.categoryId = Number.parseInt(form.categoryId, 10);
      } else if (product) {
        payload.categoryId = null;
      }

      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el producto');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={product ? 'Editar producto' : 'Nuevo producto'}
      subtitle="Completá los datos de venta del producto."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="product-form" disabled={saving}>
            {saving ? 'Guardando...' : product ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
        {error && <Banner tone="error">{error}</Banner>}

        <Field label="Nombre" htmlFor="product-name">
          <Input
            id="product-name"
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            placeholder="Ej: Yerba mate 1 kg"
            required
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Precio" htmlFor="product-price">
            <Input
              id="product-price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(event) => updateField('price', event.target.value)}
              placeholder="0.00"
              required
            />
          </Field>

          <Field label="Se vende por" htmlFor="product-sale-type">
            <Select
              id="product-sale-type"
              value={form.saleType}
              onChange={(event) => updateField('saleType', event.target.value)}
            >
              <option value="unidad">Unidad</option>
              <option value="kilo">Kilo</option>
            </Select>
          </Field>
        </div>

        <div>
          <div className="flex items-end gap-2">
            <Field label="Categoría" htmlFor="product-category" className="flex-1">
              <Select
                id="product-category"
                value={form.categoryId}
                onChange={(event) => updateField('categoryId', event.target.value)}
              >
                <option value="">Sin categoría</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Button
              variant="secondary"
              onClick={() => {
                setShowCategoryForm((current) => !current);
                setCategoryError(null);
              }}
              className="mb-[1px]"
            >
              <Plus className="h-4 w-4" />
              Nueva
            </Button>
          </div>

          {showCategoryForm && (
            <div className="mt-2 space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              {categoryError && <Banner tone="error">{categoryError}</Banner>}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={newCategory}
                  onChange={(event) => setNewCategory(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleCreateCategory();
                    }
                  }}
                  placeholder="Ej: Almacén"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button onClick={handleCreateCategory} disabled={creatingCategory}>
                    {creatingCategory ? 'Creando...' : 'Crear categoría'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowCategoryForm(false);
                      setNewCategory('');
                      setCategoryError(null);
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}

export default function ProductList({ user }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [availability, setAvailability] = useState('all');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = user?.role === 'administrador';

  const load = useCallback(async () => {
    setError(null);
    try {
      const [productsData, categoriesData] = await Promise.all([
        getProducts(search, filterCategory || undefined),
        getCategories(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  }, [search, filterCategory]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(payload) {
    if (editingProduct) {
      await updateProduct(editingProduct.id, payload);
    } else {
      await createProduct(payload);
    }
    await load();
  }

  async function handleToggleAvailable(product) {
    setError(null);
    try {
      await updateProduct(product.id, { available: !product.available });
      await load();
    } catch (err) {
      setError(err.message || 'No se pudo cambiar la disponibilidad');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteProduct(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el producto');
    } finally {
      setDeleting(false);
    }
  }

  function openCreate() {
    setEditingProduct(null);
    setFormOpen(true);
  }

  function openEdit(product) {
    setEditingProduct(product);
    setFormOpen(true);
  }

  const visibleProducts = products.filter((product) => {
    if (availability === 'available') return product.available;
    if (availability === 'unavailable') return !product.available;
    return true;
  });

  const availableCount = products.filter((product) => product.available).length;

  return (
    <div>
      <PageHeader
        title="Productos"
        subtitle="Precios, categorías y disponibilidad del almacén."
        icon={Package}
        actions={
          isAdmin ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Nuevo producto
            </Button>
          ) : null
        }
      />

      {error && (
        <Banner tone="error" className="mb-4">
          {error}
        </Banner>
      )}

      <Card className="mb-5 p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre..."
              className="pl-9"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Select
              value={filterCategory}
              onChange={(event) => setFilterCategory(event.target.value)}
              className="sm:w-48"
            >
              <option value="">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
            <Select
              value={availability}
              onChange={(event) => setAvailability(event.target.value)}
              className="sm:w-44"
            >
              <option value="all">Todos</option>
              <option value="available">Disponibles</option>
              <option value="unavailable">No disponibles</option>
            </Select>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-stone-500">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>{visibleProducts.length} producto(s)</span>
          <span className="text-stone-300">·</span>
          <span>{availableCount} disponible(s)</span>
        </div>
      </Card>

      {loading ? (
        <Card className="p-10 text-center text-sm text-stone-500">Cargando productos...</Card>
      ) : visibleProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No hay productos para mostrar"
          message={
            isAdmin
              ? 'Creá el primer producto o cambiá los filtros de búsqueda.'
              : 'Probá con otra búsqueda o categoría.'
          }
          action={
            isAdmin ? (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Nuevo producto
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visibleProducts.map((product) => (
            <Card
              key={product.id}
              className={cn(
                'flex flex-col p-4',
                !product.available && 'border-red-200 bg-red-50/50'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-stone-900">{product.name}</h2>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
                    {formatCurrency(product.price)}
                    <span className="ml-1 text-xs font-medium text-stone-400">
                      / {product.saleType === 'kilo' ? 'kg' : 'u'}
                    </span>
                  </p>
                </div>
                <Badge tone={product.available ? 'emerald' : 'red'}>
                  {product.available ? 'Disponible' : 'No disponible'}
                </Badge>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {product.Category && <Badge>{product.Category.name}</Badge>}
                <Badge tone="stone">
                  {product.saleType === 'kilo' ? 'Por kilo' : 'Por unidad'}
                </Badge>
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-stone-100 pt-3">
                <span className="text-xs text-stone-400">Producto #{product.id}</span>
                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleAvailable(product)}
                      title={product.available ? 'Marcar no disponible' : 'Marcar disponible'}
                    >
                      {product.available ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(product)}
                      title="Editar producto"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(product)}
                      title="Eliminar producto"
                      className="text-red-500 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <ProductFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        product={editingProduct}
        categories={categories}
        onSave={handleSave}
        onCategoryCreated={load}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar producto"
        message={`¿Seguro que querés eliminar "${deleteTarget?.name || ''}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        tone="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
