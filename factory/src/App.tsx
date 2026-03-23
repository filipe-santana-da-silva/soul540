import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AppProvider } from '@/contexts/AppContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ROUTES } from '@/routes';
import Login from '@/pages/Login/Login';
import Layout from '@/components/Layout/Layout';
import Funcionarios from '@/pages/Funcionarios/Funcionarios/Funcionarios';
import Contratantes from '@/pages/Contratantes/Contratantes/Contratantes';
import Eventos from '@/pages/Eventos/Eventos/Eventos';
import EstoqueInsumos from '@/pages/EstoqueInsumos/EstoqueInsumos/EstoqueInsumos';
import EstoqueUtensilios from '@/pages/EstoqueUtensilios/EstoqueUtensilios/EstoqueUtensilios';
import Permissoes from '@/pages/Permissoes/Permissoes/Permissoes';
import Financeiro from '@/pages/Financeiro/Financeiro/Financeiro';
import Tarefas from '@/pages/Tarefas/Tarefas/Tarefas';
import MinhaConta from '@/pages/MinhaConta/MinhaConta';

function PrivateRoute() {
  const { authenticated, loading } = useAuth();
  if (loading) return null;
  return authenticated ? <Outlet /> : <Navigate to={ROUTES.LOGIN} replace />;
}

function PublicRoute() {
  const { authenticated, loading } = useAuth();
  if (loading) return null;
  return authenticated ? <Navigate to={ROUTES.EVENTOS} replace /> : <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter basename="/fabrica">
      <ThemeProvider>
      <AuthProvider>
        <AppProvider>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path={ROUTES.LOGIN} element={<Login />} />
          </Route>
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path={ROUTES.FUNCIONARIOS} element={<Funcionarios />} />
              <Route path={ROUTES.CONTRATANTES} element={<Contratantes />} />
              <Route path={ROUTES.EVENTOS} element={<Eventos />} />
              <Route path={ROUTES.ESTOQUE_INSUMOS} element={<EstoqueInsumos />} />
              <Route path={ROUTES.ESTOQUE_UTENSILIOS} element={<EstoqueUtensilios />} />
              <Route path={ROUTES.PERMISSOES} element={<Permissoes />} />
              <Route path={ROUTES.FINANCEIRO} element={<Financeiro />} />
              <Route path={ROUTES.TAREFAS} element={<Tarefas />} />
              <Route path={ROUTES.USUARIO} element={<MinhaConta />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
        </Routes>
        </AppProvider>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
