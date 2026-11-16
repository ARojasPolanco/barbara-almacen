import { useState, useEffect } from "react";
import {
  BarChart3,
  FileText,
  LogOut,
  Menu,
  Package,
  Receipt,
  ShoppingCart,
  Store,
  Wallet,
  X,
} from "lucide-react";
import Login from "./components/Login";
import ProductList from "./components/ProductList";
import CreditAccounts from "./components/CreditAccounts";
import SaleForm from "./components/SaleForm";
import Expenses from "./components/Expenses";
import Invoices from "./components/Invoices";
import Reports from "./components/Reports";
import { Button, cn } from "./components/ui";

const NAV_ITEMS = [
  { key: "products", label: "Productos", icon: Package },
  { key: "new-sale", label: "Nueva venta", icon: ShoppingCart },
  { key: "credit-accounts", label: "Cuentas corrientes", icon: Wallet, adminOnly: true },
  { key: "expenses", label: "Gastos", icon: Receipt, adminOnly: true },
  { key: "invoices", label: "Facturas", icon: FileText, adminOnly: true },
  { key: "reports", label: "Reportes", icon: BarChart3, adminOnly: true },
];

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-sm">
        <Store className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-bold tracking-tight text-stone-900">Barbara Almacen</p>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
          Gestión
        </p>
      </div>
    </div>
  );
}

function NavLinks({ items, view, onNavigate }) {
  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = view === item.key;

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onNavigate(item.key)}
            className={cn(
              "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
              active
                ? "bg-emerald-50 text-emerald-800"
                : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5 shrink-0",
                active ? "text-emerald-700" : "text-stone-400 group-hover:text-stone-600"
              )}
            />
            <span className="truncate">{item.label}</span>
            {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-600" />}
          </button>
        );
      })}
    </nav>
  );
}

function UserCard({ user, onLogout }) {
  const initials = (user?.username || "?").slice(0, 2).toUpperCase();

  return (
    <div className="border-t border-stone-200 p-3">
      <div className="flex items-center gap-3 rounded-xl bg-stone-50 px-3 py-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-emerald-700 ring-1 ring-stone-200">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-stone-800">{user?.username}</p>
          <p className="text-xs capitalize text-stone-500">{user?.role}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onLogout} aria-label="Cerrar sesión">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [view, setView] = useState("products");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = readStoredUser();

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(savedUser);
    }
  }, []);

  function handleLogin(nextToken, nextUser) {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem("token", nextToken);
    localStorage.setItem("user", JSON.stringify(nextUser));
  }

  function handleLogout() {
    setToken(null);
    setUser(null);
    setMobileNavOpen(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  function navigateTo(viewName) {
    setView(viewName);
    setMobileNavOpen(false);
  }

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  const isAdmin = user?.role === "administrador";
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  function renderView() {
    if (view === "products") return <ProductList user={user} />;
    if (view === "new-sale") return <SaleForm />;
    if (view === "credit-accounts" && isAdmin) return <CreditAccounts />;
    if (view === "expenses" && isAdmin) return <Expenses />;
    if (view === "invoices" && isAdmin) return <Invoices />;
    if (view === "reports" && isAdmin) return <Reports />;
    return <ProductList user={user} />;
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3 md:hidden">
        <Brand />
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </header>

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-stone-200 bg-white md:flex">
        <div className="px-5 py-5">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
            {isAdmin ? "Administración" : "Mostrador"}
          </p>
          <NavLinks items={items} view={view} onNavigate={navigateTo} />
        </div>
        <UserCard user={user} onLogout={handleLogout} />
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="presentation">
          <div
            className="absolute inset-0 bg-slate-950/50"
            onClick={() => setMobileNavOpen(false)}
            role="presentation"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between px-4 py-4">
              <Brand />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-2">
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                {isAdmin ? "Administración" : "Mostrador"}
              </p>
              <NavLinks items={items} view={view} onNavigate={navigateTo} />
            </div>
            <UserCard user={user} onLogout={handleLogout} />
          </div>
        </div>
      )}

      <main className="md:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {renderView()}
        </div>
      </main>
    </div>
  );
}
