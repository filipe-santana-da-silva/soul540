import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from '@frontend/contexts/ThemeContext';
import { AuthProvider } from '@frontend/contexts/AuthContext';
import { AppProvider } from '@frontend/contexts/AppContext';
import { useAuth } from '@frontend/hooks/useAuth';
import { ROUTES } from '@frontend/routes';
import Login from '@frontend/pages/Login/Login';
import Layout from '@frontend/components/Layout/Layout';
import Dashboard from '@frontend/pages/Dashboard/Dashboard';
import Financeiro from '@frontend/pages/Financeiro/Financeiro';
import NotasFiscais from '@frontend/pages/NotasFiscais/NotasFiscais';
import Usuario from '@frontend/pages/Usuario/Usuario';
import Eventos from '@frontend/pages/Eventos/Eventos';
import Tarefas from '@frontend/pages/Tarefas/Tarefas';
import Funcionarios from '@frontend/pages/Funcionarios/Funcionarios';
import Contratantes from '@frontend/pages/Contratantes/Contratantes';
import Contratos from '@frontend/pages/Contratos/Contratos';
import Franquias from '@frontend/pages/Franquias/Franquias';
import Cardapios from '@frontend/pages/Cardapios/Cardapios';
import EstoqueInsumos from '@frontend/pages/EstoqueInsumos/EstoqueInsumos';
import EstoqueUtensilios from '@frontend/pages/EstoqueUtensilios/EstoqueUtensilios';
import Chat from '@frontend/pages/Chat/Chat';

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
      <ThemeProvider>
        <AuthProvider>
          <AppProvider>
            <Routes>
              <Route element={<PublicRoute />}>
                <Route path={ROUTES.LOGIN} element={<Login />} />
              </Route>
              <Route element={<PrivateRoute />}>
                <Route element={<Layout />}>
                  <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
                  <Route path={ROUTES.FINANCEIRO} element={<Financeiro />} />
                  <Route path={ROUTES.NOTAS_FISCAIS} element={<NotasFiscais />} />
                  <Route path={ROUTES.USUARIO} element={<Usuario />} />
                  <Route path={ROUTES.EVENTOS} element={<Eventos />} />
                  <Route path={ROUTES.TAREFAS} element={<Tarefas />} />
                  <Route path={ROUTES.FUNCIONARIOS} element={<Funcionarios />} />
                  <Route path={ROUTES.CONTRATANTES} element={<Contratantes />} />
                  <Route path={ROUTES.CONTRATOS} element={<Contratos />} />
                  <Route path={ROUTES.FRANQUIAS} element={<Franquias />} />
                  <Route path={ROUTES.CARDAPIOS} element={<Cardapios />} />
                  <Route path={ROUTES.ESTOQUE_INSUMOS} element={<EstoqueInsumos />} />
                  <Route path={ROUTES.ESTOQUE_UTENSILIOS} element={<EstoqueUtensilios />} />
                  <Route path={ROUTES.CHAT} element={<Chat />} />
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
