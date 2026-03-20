# Design: Tela de Permissões

**Data:** 2026-03-20

## Objetivo

Adicionar uma tela de gerenciamento de usuários e permissões ao sistema Soul540, permitindo que o administrador crie contas e defina quais páginas cada usuário pode acessar.

---

## Decisões de Design

| Pergunta | Decisão |
|----------|---------|
| Modelo de permissão | Por usuário individual — checkboxes por página |
| Páginas sem acesso | Somem do menu lateral; URL direta redireciona ao Dashboard |
| Dados da conta | Simples: nome, email, senha |
| Quem gerencia | Só usuários com `isAdmin: true` |
| Como definir admin | Campo `isAdmin` no documento do usuário |

---

## Modelo de Dados

### User (MongoDB)
```
name:         string   (obrigatório)
email:        string   (obrigatório, único)
passwordHash: string
isAdmin:      boolean  (default: false)
permissions:  string[] (array de chaves de rota, ex: ['dashboard', 'eventos'])
createdAt:    Date
```

---

## Backend — Novas Rotas

`server/routes/users.ts` montado em `/api/users`:

| Método | Path | Ação |
|--------|------|------|
| GET | `/api/users` | Lista todos os usuários |
| POST | `/api/users` | Cria usuário (name, email, password, isAdmin, permissions) |
| PUT | `/api/users/:id` | Atualiza nome, permissões ou isAdmin |
| DELETE | `/api/users/:id` | Remove usuário |

O endpoint de login existente passa a retornar `permissions` e `isAdmin` junto com o usuário.

---

## Frontend

### AuthContext
- Adicionar `permissions: string[]` e `isAdmin: boolean` ao estado do usuário
- Expor via hook `useAuth()`

### Sidebar
- Filtrar itens de nav: só exibe se `permissions` inclui a chave da rota
- Admin vê todos os itens incondicionalmente
- Item "Permissões" visível apenas para `isAdmin: true`

### PrivateRoute
- Além de checar autenticação, verifica se o usuário tem a permissão da rota
- Se não tiver: redireciona para Dashboard

### Nova página: `Permissoes`
- Rota: `/permissoes`
- Layout dois painéis:
  - **Esquerdo**: lista de usuários (avatar com iniciais, badge Admin, botão excluir)
  - **Direito**: checkboxes agrupados por categoria + botão Salvar
- Modal criar usuário: nome, email, senha, checkbox "Administrador"
- Grupos de permissões: Principal, Gestão, Financeiro, Operações, Sistema

### routes.ts
- Adicionar `PERMISSOES: '/permissoes'`

---

## Páginas com permissão configurável (14)

| Chave | Página |
|-------|--------|
| dashboard | Dashboard |
| eventos | Eventos |
| tarefas | Tarefas |
| funcionarios | Funcionários |
| contratantes | Contratantes |
| financeiro | Financeiro |
| notas-fiscais | Notas Fiscais |
| contratos | Contratos |
| franquias | Franquias |
| cardapios | Cardápios |
| estoque-insumos | Est. Insumos |
| estoque-utensilios | Est. Utensílios |
| chat | Chat IA |
| usuario | Minha Conta |
