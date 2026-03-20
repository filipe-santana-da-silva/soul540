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
import Permissoes from '@frontend/pages/Permissoes/Permissoes';

function PrivateRoute() {
  const { authenticated, loading } = useAuth();
  if (loading) return null;
  return authenticated ? <Outlet /> : <Navigate to={ROUTES.LOGIN} replace />;
}

function PermissionRoute({ routeKey }: { routeKey: string }) {
  const { permissions, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (isAdmin || permissions.includes(routeKey)) return <Outlet />;
  return <Navigate to={ROUTES.DASHBOARD} replace />;
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
                  <Route element={<PermissionRoute routeKey="financeiro" />}>
                    <Route path={ROUTES.FINANCEIRO} element={<Financeiro />} />
                  </Route>
                  <Route element={<PermissionRoute routeKey="notas-fiscais" />}>
                    <Route path={ROUTES.NOTAS_FISCAIS} element={<NotasFiscais />} />
                  </Route>
                  <Route element={<PermissionRoute routeKey="usuario" />}>
                    <Route path={ROUTES.USUARIO} element={<Usuario />} />
                  </Route>
                  <Route element={<PermissionRoute routeKey="eventos" />}>
                    <Route path={ROUTES.EVENTOS} element={<Eventos />} />
                  </Route>
                  <Route element={<PermissionRoute routeKey="tarefas" />}>
                    <Route path={ROUTES.TAREFAS} element={<Tarefas />} />
                  </Route>
                  <Route element={<PermissionRoute routeKey="funcionarios" />}>
                    <Route path={ROUTES.FUNCIONARIOS} element={<Funcionarios />} />
                  </Route>
                  <Route element={<PermissionRoute routeKey="contratantes" />}>
                    <Route path={ROUTES.CONTRATANTES} element={<Contratantes />} />
                  </Route>
                  <Route element={<PermissionRoute routeKey="contratos" />}>
                    <Route path={ROUTES.CONTRATOS} element={<Contratos />} />
                  </Route>
                  <Route element={<PermissionRoute routeKey="franquias" />}>
                    <Route path={ROUTES.FRANQUIAS} element={<Franquias />} />
                  </Route>
                  <Route element={<PermissionRoute routeKey="cardapios" />}>
                    <Route path={ROUTES.CARDAPIOS} element={<Cardapios />} />
                  </Route>
                  <Route element={<PermissionRoute routeKey="estoque-insumos" />}>
                    <Route path={ROUTES.ESTOQUE_INSUMOS} element={<EstoqueInsumos />} />
                  </Route>
                  <Route element={<PermissionRoute routeKey="estoque-utensilios" />}>
                    <Route path={ROUTES.ESTOQUE_UTENSILIOS} element={<EstoqueUtensilios />} />
                  </Route>
                  <Route element={<PermissionRoute routeKey="chat" />}>
                    <Route path={ROUTES.CHAT} element={<Chat />} />
                  </Route>
                  <Route element={<PermissionRoute routeKey="__admin__" />}>
                    <Route path={ROUTES.PERMISSOES} element={<Permissoes />} />
                  </Route>
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
