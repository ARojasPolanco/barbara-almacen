import { useEffect, useRef, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Minus,
  Plus,
  Scale,
  Search,
  ShoppingCart,
  Smartphone,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { getProducts, getCreditAccounts, createSale } from "../services/api";
import { formatCurrency, formatDateTime, formatQuantity } from "../utils/format";
import {
  Badge,
  Banner,
  Button,
  Card,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  cn,
} from "./ui";

const PAYMENT_METHODS = [
  { value: "EFECTIVO", label: "Efectivo", icon: Banknote },
  { value: "MERCADO_PAGO", label: "Mercado Pago", icon: Smartphone },
  { value: "CUENTA_DNI", label: "Cuenta DNI", icon: CreditCard },
  { value: "CUENTA_CORRIENTE", label: "Cuenta corriente", icon: Wallet },
];

const PAYMENT_LABELS = Object.fromEntries(
  PAYMENT_METHODS.map((method) => [method.value, method.label])
);

export default function SaleForm() {
  const [products, setProducts] = useState([]);
  const [creditAccounts, setCreditAccounts] = useState([]);
  const [items, setItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("EFECTIVO");
  const [creditAccountId, setCreditAccountId] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);

  const [addMode, setAddMode] = useState("catalog");
  const [searchText, setSearchText] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [justSelected, setJustSelected] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [customName, setCustomName] = useState("");
  const [customSubtotal, setCustomSubtotal] = useState("");

  const dropdownRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const [productsData, accountsData] = await Promise.all([
          getProducts(),
          getCreditAccounts(),
        ]);
        setProducts(productsData.filter((product) => product.available));
        setCreditAccounts(accountsData);
      } catch (err) {
        setError(err.message || "No se pudieron cargar los productos");
      }
    }

    load();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredProducts =
    searchText.length > 0
      ? products
          .filter((product) => product.name.toLowerCase().includes(searchText.toLowerCase()))
          .slice(0, 8)
      : [];

  function selectProduct(product) {
    setSelectedProduct(product);
    setSearchText(product.name);
    setShowDropdown(false);
    setJustSelected(true);
    setQuantity(1);
  }

  function clearSelection() {
    setSelectedProduct(null);
    setSearchText("");
    setQuantity(1);
    setJustSelected(false);
    setShowDropdown(false);
  }

  function addItem() {
    setError(null);

    if (addMode === "catalog") {
      if (!selectedProduct || quantity <= 0) return;

      const unitPrice = Number.parseFloat(selectedProduct.price);
      const subtotal = unitPrice * quantity;

      setItems((current) => [
        ...current,
        {
          type: "catalog",
          productId: selectedProduct.id,
          name: selectedProduct.name,
          saleType: selectedProduct.saleType,
          quantity,
          unitPrice,
          subtotal,
        },
      ]);
      clearSelection();
      return;
    }

    if (!customName.trim() || !customSubtotal || Number.parseFloat(customSubtotal) <= 0) {
      return;
    }

    const subtotal = Number.parseFloat(customSubtotal);
    setItems((current) => [
      ...current,
      {
        type: "custom",
        customName: customName.trim(),
        quantity: 1,
        unitPrice: subtotal,
        subtotal,
      },
    ]);
    setCustomName("");
    setCustomSubtotal("");
  }

  function removeItem(index) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function updateItemQuantity(index, direction) {
    setItems((current) =>
      current
        .map((item, itemIndex) => {
          if (itemIndex !== index || item.type !== "catalog") return item;

          const step = item.saleType === "kilo" ? 0.1 : 1;
          const nextQuantity = Math.round((item.quantity + direction * step) * 1000) / 1000;

          if (nextQuantity <= 0) return null;

          return {
            ...item,
            quantity: nextQuantity,
            subtotal: item.unitPrice * nextQuantity,
          };
        })
        .filter(Boolean)
    );
  }

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  async function handleSubmit(event) {
    event.preventDefault();

    if (items.length === 0) {
      setError("Agregá al menos un producto");
      return;
    }

    if (paymentMethod === "CUENTA_CORRIENTE" && !creditAccountId) {
      setError("Seleccioná una cuenta corriente");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const payload = {
        paymentMethod,
        items: items.map((item) => {
          if (item.type === "catalog") {
            return { type: "catalog", productId: item.productId, quantity: item.quantity };
          }
          return { type: "custom", customName: item.customName, subtotal: item.subtotal };
        }),
      };

      if (paymentMethod === "CUENTA_CORRIENTE" && creditAccountId) {
        payload.creditAccountId = Number.parseInt(creditAccountId, 10);
      }

      const sale = await createSale(payload);
      setCompletedSale(sale);
      setItems([]);
      setPaymentMethod("EFECTIVO");
      setCreditAccountId("");
    } catch (err) {
      setError(err.message || "No se pudo registrar la venta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Nueva venta"
        subtitle="Cargá los productos, elegí el medio de pago y confirmá."
        icon={ShoppingCart}
      />

      {error && <Banner tone="error" className="mb-4">{error}</Banner>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,1fr)] lg:items-start">
        <div className="space-y-4">
          <Card className="p-4">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-stone-900">Agregar producto</h2>
                <p className="text-xs text-stone-500">Buscá en el catálogo o cargá un total libre.</p>
              </div>
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-stone-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setAddMode("catalog");
                    setShowDropdown(false);
                  }}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                    addMode === "catalog"
                      ? "bg-white text-stone-900 shadow-sm"
                      : "text-stone-500 hover:text-stone-800"
                  )}
                >
                  Catálogo
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode("custom")}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                    addMode === "custom"
                      ? "bg-white text-stone-900 shadow-sm"
                      : "text-stone-500 hover:text-stone-800"
                  )}
                >
                  Libre / balanza
                </button>
              </div>
            </div>

            {addMode === "catalog" ? (
              <div className="space-y-3">
                <div className="relative" ref={dropdownRef}>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <Input
                      type="text"
                      placeholder="Buscar producto..."
                      value={searchText}
                      onChange={(event) => {
                        setSearchText(event.target.value);
                        setShowDropdown(true);
                        setJustSelected(false);
                        if (selectedProduct) setSelectedProduct(null);
                      }}
                      onFocus={() => {
                        if (!justSelected) setShowDropdown(true);
                      }}
                      className="pl-9 pr-9"
                    />
                    {searchText && (
                      <button
                        type="button"
                        onClick={clearSelection}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                        aria-label="Limpiar búsqueda"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {showDropdown && filteredProducts.length > 0 && (
                    <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-stone-200 bg-white py-1 shadow-xl">
                      {filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => selectProduct(product)}
                          className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-emerald-50"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-stone-800">
                              {product.name}
                            </p>
                            <p className="text-xs text-stone-400">
                              {product.Category?.name || "Sin categoría"}
                            </p>
                          </div>
                          <span className="shrink-0 text-sm font-semibold text-emerald-700">
                            {formatCurrency(product.price)}
                            <span className="ml-1 text-xs font-medium text-stone-400">
                              / {product.saleType === "kilo" ? "kg" : "u"}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {showDropdown && searchText && filteredProducts.length === 0 && (
                    <div className="absolute z-20 mt-1 w-full rounded-xl border border-stone-200 bg-white p-4 text-center text-sm text-stone-500 shadow-xl">
                      No se encontraron productos disponibles.
                    </div>
                  )}
                </div>

                {selectedProduct ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-emerald-950">
                          {selectedProduct.name}
                        </p>
                        <p className="mt-0.5 text-xs text-emerald-700">
                          {formatCurrency(selectedProduct.price)} /{" "}
                          {selectedProduct.saleType === "kilo" ? "kg" : "u"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={clearSelection}
                        className="text-emerald-600 hover:text-emerald-900"
                        aria-label="Quitar selección"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <div className="flex flex-1 items-center justify-between rounded-xl border border-emerald-200 bg-white">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setQuantity((current) =>
                              Math.max(
                                selectedProduct.saleType === "kilo" ? 0.1 : 1,
                                Math.round((current - (selectedProduct.saleType === "kilo" ? 0.1 : 1)) * 100) / 100
                              )
                            )
                          }
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-semibold text-stone-900">
                          {formatQuantity(quantity)}{" "}
                          {selectedProduct.saleType === "kilo" ? "kg" : "u"}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setQuantity((current) =>
                              Math.round(
                                (current + (selectedProduct.saleType === "kilo" ? 0.1 : 1)) * 100
                              ) / 100
                            )
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button onClick={addItem} className="sm:w-auto">
                        <Plus className="h-4 w-4" />
                        Agregar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-5 text-sm text-stone-500">
                    <Search className="h-5 w-5 text-stone-400" />
                    Buscá un producto para ver el precio y agregarlo a la venta.
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
                  <Field label="Nombre" htmlFor="custom-name">
                    <Input
                      id="custom-name"
                      placeholder="Ej: Fiambre"
                      value={customName}
                      onChange={(event) => setCustomName(event.target.value)}
                    />
                  </Field>
                  <Field label="Total" htmlFor="custom-subtotal">
                    <Input
                      id="custom-subtotal"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={customSubtotal}
                      onChange={(event) => setCustomSubtotal(event.target.value)}
                    />
                  </Field>
                </div>
                <Button onClick={addItem} variant="secondary">
                  <Scale className="h-4 w-4" />
                  Agregar producto libre
                </Button>
              </div>
            )}
          </Card>

          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-stone-900">Detalle de la venta</h2>
                <Badge tone="stone">{items.length}</Badge>
              </div>
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => setItems([])}
                  className="text-xs font-medium text-stone-400 hover:text-red-600"
                >
                  Vaciar
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-8 text-center">
                <ShoppingCart className="mx-auto h-8 w-8 text-stone-300" />
                <p className="mt-2 text-sm font-medium text-stone-600">Todavía no hay productos</p>
                <p className="text-xs text-stone-400">Agregá el primero desde el buscador.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div
                    key={`${item.type}-${item.productId || item.customName}-${index}`}
                    className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-stone-900">
                        {item.type === "catalog" ? item.name : item.customName}
                      </p>
                      <p className="mt-0.5 text-xs text-stone-500">
                        {item.type === "catalog" ? (
                          <>
                            {formatQuantity(item.quantity)}{" "}
                            {item.saleType === "kilo" ? "kg" : "u"} ×{" "}
                            {formatCurrency(item.unitPrice)}
                          </>
                        ) : (
                          "Producto libre"
                        )}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 sm:justify-end">
                      {item.type === "catalog" && (
                        <div className="flex items-center rounded-lg border border-stone-200 bg-white">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => updateItemQuantity(index, -1)}
                            aria-label="Restar cantidad"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-12 text-center text-sm font-medium text-stone-800">
                            {formatQuantity(item.quantity)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => updateItemQuantity(index, 1)}
                            aria-label="Sumar cantidad"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      <p className="min-w-20 text-right text-sm font-bold text-stone-900">
                        {formatCurrency(item.subtotal)}
                      </p>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        className="text-red-500 hover:bg-red-50 hover:text-red-700"
                        aria-label="Quitar producto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card className="p-4 lg:sticky lg:top-6">
          <h2 className="text-sm font-semibold text-stone-900">Resumen y pago</h2>

          <div className="mt-4 rounded-2xl bg-emerald-800 p-4 text-white">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-200">
              Total de la venta
            </p>
            <p className="mt-1 text-3xl font-bold tracking-tight">{formatCurrency(total)}</p>
            <p className="mt-1 text-xs text-emerald-200">
              {items.length} producto(s) en el detalle
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                Medio de pago
              </p>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  const active = paymentMethod === method.value;

                  return (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setPaymentMethod(method.value)}
                      className={cn(
                        "flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-colors",
                        active
                          ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                          : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                      )}
                    >
                      <Icon className={cn("h-4 w-4", active ? "text-emerald-700" : "text-stone-400")} />
                      <span className="text-xs font-semibold">{method.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {paymentMethod === "CUENTA_CORRIENTE" && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                {creditAccounts.length > 0 ? (
                  <Field label="Cuenta corriente" htmlFor="credit-account">
                    <Select
                      id="credit-account"
                      value={creditAccountId}
                      onChange={(event) => setCreditAccountId(event.target.value)}
                    >
                      <option value="">Seleccionar cuenta</option>
                      {creditAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ) : (
                  <p className="text-xs leading-5 text-amber-800">
                    No hay cuentas corrientes creadas. Pedile al administrador que cree una antes
                    de fiar esta venta.
                  </p>
                )}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading || items.length === 0}>
              {loading ? "Registrando..." : "Registrar venta"}
            </Button>
          </form>
        </Card>
      </div>

      <Modal
        open={Boolean(completedSale)}
        onClose={() => setCompletedSale(null)}
        title="Venta registrada"
        subtitle="El comprobante queda disponible en pantalla."
        footer={
          <Button onClick={() => setCompletedSale(null)}>
            <CheckCircle2 className="h-4 w-4" />
            Nueva venta
          </Button>
        }
      >
        {completedSale && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-950">Venta #{completedSale.id}</p>
                <p className="text-xs text-emerald-700">{formatDateTime(completedSale.date)}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="emerald">
                {PAYMENT_LABELS[completedSale.paymentMethod] || completedSale.paymentMethod}
              </Badge>
              {completedSale.CreditAccount && (
                <Badge tone="amber">{completedSale.CreditAccount.name}</Badge>
              )}
            </div>

            <div className="space-y-2">
              {completedSale.SaleItems?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-stone-800">
                      {item.Product ? item.Product.name : item.customName}
                    </p>
                    <p className="text-xs text-stone-500">
                      {item.Product
                        ? `${formatQuantity(item.quantity)} ${
                            item.Product.saleType === "kilo" ? "kg" : "u"
                          } × ${formatCurrency(item.unitPriceAtSale)}`
                        : "Producto libre"}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-stone-900">
                    {formatCurrency(item.subtotal)}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between rounded-xl bg-stone-900 px-4 py-3 text-white">
              <span className="text-sm font-medium text-stone-300">Total</span>
              <span className="text-xl font-bold">{formatCurrency(completedSale.total)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
