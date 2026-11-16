import { useState } from 'react';
import { CheckCircle2, LogIn, Store } from 'lucide-react';
import { login } from '../services/api';
import { Banner, Button, Field, Input } from './ui';

const FEATURES = [
  'Productos y precios siempre al día',
  'Ventas rápidas desde el mostrador',
  'Cuentas corrientes y cobros ordenados',
];

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await login(username, password);
      onLogin(data.token, data.user);
    } catch (err) {
      setError(
        err.message === 'Invalid credentials' ? 'Usuario o contraseña incorrectos' : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4 py-8">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xl md:grid-cols-[1.05fr_1fr]">
        <div className="hidden flex-col justify-between bg-emerald-900 p-10 text-white md:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight">Barbara Almacen</p>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-200">
                Gestión del almacén
              </p>
            </div>
          </div>

          <div className="py-10">
            <h2 className="max-w-sm text-3xl font-bold leading-tight tracking-tight">
              Todo tu almacén, en orden.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-emerald-100">
              Cargá ventas, seguí las cuentas corrientes y consultá cómo viene el día desde
              cualquier dispositivo.
            </p>
            <ul className="mt-8 space-y-3">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-emerald-50">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-emerald-200">Barbara Almacen · Sistema de gestión</p>
        </div>

        <div className="p-6 sm:p-10">
          <div className="mb-8 flex items-center gap-3 md:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-700 text-white">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-stone-900">Barbara Almacen</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                Gestión
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">Ingresar</h1>
            <p className="mt-1 text-sm text-stone-500">Acceso para vendedores y administración.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Banner tone="error">{error}</Banner>}

            <Field label="Usuario" htmlFor="username">
              <Input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="Tu usuario"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </Field>

            <Field label="Contraseña" htmlFor="password">
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Tu contraseña"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </Field>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? (
                'Ingresando...'
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Ingresar
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-stone-400">
            Sistema interno de Barbara Almacen
          </p>
        </div>
      </div>
    </div>
  );
}
