import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AppProvider } from '@/contexts/AppContext';
import { ROUTES } from '@/routes';
import Login from '@/pages/Login/Login';
import Layout from '@/components/Layout/Layout';
import Dashboard from '@/pages/Dashboard/Dashboard';
import Funcionarios from '@/pages/Funcionarios/Funcionarios';
import Contratantes from '@/pages/Contratantes/Contratantes';
import Eventos from '@/pages/Eventos/Eventos';
import EstoqueInsumos from '@/pages/EstoqueInsumos/EstoqueInsumos';
import EstoqueUtensilios from '@/pages/EstoqueUtensilios/EstoqueUtensilios';
import Cardapios from '@/pages/Cardapios/Cardapios';
import Permissoes from '@/pages/Permissoes/Permissoes';
import Financeiro from '@/pages/Financeiro/Financeiro';

function PrivateRoute() {
  const { authenticated, loading } = useAuth();
  if (loading) return null;
  return authenticated ? <Outlet /> : <Navigate to={ROUTES.LOGIN} replace />;
}

function PublicRoute() {
  const { authenticated, loading } = useAuth();
  if (loading) return null;
  return authenticated ? <Navigate to={ROUTES.DASHBOARD} replace /> : <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path={ROUTES.LOGIN} element={<Login />} />
          </Route>
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
              <Route path={ROUTES.FUNCIONARIOS} element={<Funcionarios />} />
              <Route path={ROUTES.CONTRATANTES} element={<Contratantes />} />
              <Route path={ROUTES.EVENTOS} element={<Eventos />} />
              <Route path={ROUTES.ESTOQUE_INSUMOS} element={<EstoqueInsumos />} />
              <Route path={ROUTES.ESTOQUE_UTENSILIOS} element={<EstoqueUtensilios />} />
              <Route path={ROUTES.CARDAPIOS} element={<Cardapios />} />
              <Route path={ROUTES.PERMISSOES} element={<Permissoes />} />
              <Route path={ROUTES.FINANCEIRO} element={<Financeiro />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
        </Routes>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
