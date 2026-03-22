import { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp } from '@frontend/contexts/AppContext';
import styles from './Cardapios.module.scss';
import ConfirmModal from '@frontend/components/ConfirmModal/ConfirmModal';

async function generateMenuPdf(menu: StaticMenu) {
  const html2pdf = (await import('html2pdf.js')).default;

  const isSweetCat = (name: string) => name.toLowerCase().includes('doce');

  const categoriesHtml = menu.categories.map((cat) => `
    <div class="section">
      <div class="cat-title ${isSweetCat(cat.name) ? 'cat-sweet' : ''}">${cat.name}</div>
      <div class="items">
        ${cat.items.map((item) => `
          <div class="item">
            <div class="item-header">
              <span class="item-name">${item.name}</span>
              ${item.subtitle ? `<span class="item-sub">${item.subtitle}</span>` : ''}
            </div>
            ${item.description ? `<p class="item-desc">${item.description}</p>` : ''}
            ${item.harmonization ? `<p class="item-harm"><strong>Harmonização:</strong> ${item.harmonization}</p>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  const html = `
    <div id="menu-pdf" style="font-family: Arial, sans-serif; background: #fff; color: #1a1a1a; padding: 0; margin: 0; width: 210mm;">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        #menu-pdf { font-family: Arial, sans-serif; background: #fff; color: #1a1a1a; }
        .doc-header { background: #111; color: #fff; text-align: center; padding: 28px 40px 22px; border-bottom: 3px solid #8b1a1a; }
        .brand { font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
        .brand span { color: #f59e0b; }
        .tagline { font-size: 10px; color: rgba(255,255,255,0.45); letter-spacing: 2px; margin: 3px 0 14px; }
        .menu-title-wrap { display: inline-block; background: #8b1a1a; padding: 5px 22px; border-radius: 2px; }
        .menu-title { font-size: 18px; font-weight: 800; color: #fff; text-transform: uppercase; letter-spacing: 2px; }
        .menu-sub { font-size: 11px; color: rgba(255,255,255,0.4); font-style: italic; margin-top: 8px; }
        .body { padding: 24px 40px 32px; }
        .section { margin-bottom: 24px; }
        .cat-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; background: #8b1a1a; color: #fff; display: inline-block; padding: 4px 14px; border-radius: 2px; margin-bottom: 14px; }
        .cat-sweet { background: #6d28d9; }
        .items { display: flex; flex-direction: column; gap: 14px; }
        .item { padding-bottom: 14px; border-bottom: 1px solid #e5e7eb; }
        .item:last-child { border-bottom: none; padding-bottom: 0; }
        .item-header { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px; margin-bottom: 4px; }
        .item-name { font-size: 13px; font-weight: 700; color: #111; }
        .item-sub { font-size: 11px; color: #6b7280; font-style: italic; }
        .item-desc { font-size: 12px; line-height: 1.65; color: #374151; }
        .item-harm { font-size: 11px; color: #9ca3af; font-style: italic; margin-top: 5px; line-height: 1.5; }
        .item-harm strong { color: #6b7280; font-style: normal; }
        .obs { font-size: 10px; color: #9ca3af; font-style: italic; padding: 10px 14px; background: #f9fafb; border-radius: 4px; border: 1px solid #e5e7eb; margin-bottom: 20px; }
        .footer { background: #8b1a1a; color: #fff; text-align: center; padding: 14px 40px; display: flex; align-items: center; justify-content: center; gap: 32px; font-size: 13px; font-weight: 700; }
      </style>
      <div class="doc-header">
        <div class="brand">Soul<span>540</span> Pizzas</div>
        <div class="tagline">· artesanal food ·</div>
        <div class="menu-title-wrap"><div class="menu-title">${menu.name}</div></div>
        <div class="menu-sub">${menu.tagline}</div>
      </div>
      <div class="body">
        ${categoriesHtml}
        ${menu.obs ? `<div class="obs">OBS * ${menu.obs}</div>` : ''}
      </div>
      <div class="footer">
        <span>@soul.pizzas</span>
        <span>19 98160-5481</span>
      </div>
    </div>
  `;

  const container = document.createElement('div');
  container.style.cssText = 'position:absolute;left:-9999px;top:0;width:210mm;';
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    await html2pdf().set({
      margin: 0,
      filename: `${menu.name.toLowerCase().replace(/\s+/g, '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    }).from(container.querySelector('#menu-pdf')).save();
  } finally {
    document.body.removeChild(container);
  }
}

type MenuItem = { id: string; name: string; description: string; price: number; harmonization?: string; subtitle?: string; };
type MenuCategory = { id: string; name: string; items: MenuItem[]; };
type Menu = { id: string; name: string; eventId?: string; headerText: string; footerText: string; categories: MenuCategory[]; createdAt: string; };

// ── Soul540 Standard Menus ─────────────────────────────────────────────────────
type StaticItem = { name: string; subtitle?: string; description: string; harmonization?: string; };
type StaticCategory = { name: string; items: StaticItem[]; };
type StaticMenu = { id: string; name: string; tagline: string; obs?: string; categories: StaticCategory[]; };

const SOUL540_MENUS: StaticMenu[] = [
  {
    id: 'eccezionale',
    name: 'Menu Eccezionale',
    tagline: 'Experiência máxima com ingredientes selecionados',
    categories: [
      {
        name: 'Entradas',
        items: [
          { name: 'Bordinhas Crocantes di Pesto e Gorgonzola', description: 'Massa fina, crocante, pincelada com pesto fresco e finalizada com gorgonzola derretido.', harmonization: 'Cerveja Witbier ou vinho branco fresco (Sauvignon Blanc).' },
          { name: 'Bordinhas Crocantes di Alici e Pomodoro', description: 'Delicada massa crocante com toque de azeite extravirgem, aliche premium e tomates confitados.', harmonization: 'Cerveja Pilsen artesanal ou vinho branco seco (Vermentino).' },
          { name: 'Crostini de Parmesão e Gorgonzola', description: '' },
        ],
      },
      {
        name: 'Pizzas Salgadas',
        items: [
          { name: '1. Ouro Verde Bianca', subtitle: 'Bianca al Pesto e Mandorlo', description: 'Molho pesto artesanal, parmesão, mozzarella de búfala cremosa, amêndoas laminadas crocantes e manjericão fresco regado com azeite extravirgem.', harmonization: 'Cerveja Belgian Blond Ale ou vinho branco aromático (Chardonnay).' },
          { name: '2. Blu Agridoce', subtitle: 'Gorgonzola e Bacon con Geléia di Peperoncino', description: 'Base de molho de tomate italiano, geleia de pimenta agridoce, mozzarella, gorgonzola cremoso e cubos de bacon artesanal finalizados com orégano fresco.', harmonization: 'Cerveja IPA ou vinho tinto leve (Pinot Noir).' },
          { name: '3. Bracciata di Rucola & Parma', subtitle: 'Rucola e Prosciutto di Parma', description: 'Montagem delicada, assada e finalizada com pesto suave, mozzarella de búfala, tomate seco artesanal, folhas frescas de rúcula e finas fatias de presunto Parma.', harmonization: 'Cerveja Pilsen Premium ou espumante brut.' },
          { name: '4. Brie e Frutas Vermelhas', subtitle: 'Brie e Frutti Rossi', description: 'Base de mozzarella de búfala, lâminas de queijo brie e geleia artesanal de frutas vermelhas. Sutil, doce e sofisticada.', harmonization: 'Cerveja Weiss ou espumante moscatel.' },
          { name: '5. Brie & Pera Pistacchio', description: 'Finas fatias de pera grelhada com brie derretido, pistaches crocantes e um leve fio de mel. Doce, cremoso e crocante na medida.', harmonization: 'Espumante moscatel ou vinho branco frutado.' },
          { name: '6. Provolone e Bacon Piccante', description: 'Provolone defumado, tiras crocantes de bacon artesanal, finalizados com mel levemente picante. Uma explosão de sabores intensos.', harmonization: 'Cerveja Stout ou vinho Syrah.' },
          { name: '7. Alici Tradizionale', description: 'Base de molho de tomate pelati artesanal, temperado com azeite extravirgem e ervas frescas. Cobertura com aliche (anchova) premium, cebola roxa confitada, azeitonas pretas Kalamata e orégano fresco. Finalizada com fio de azeite de oliva.', harmonization: 'Vinho branco seco e mineral – Vermentino ou Sauvignon Blanc. Cerveja Pilsen artesanal ou Witbier cítrica.' },
          { name: '8. Margherita Bufala', description: 'Molho de tomate, mozzarella de búfala, manjericão, parmesão, orégano e azeite.', harmonization: 'Cerveja Witbier ou Vinho Pinot Noir.' },
          { name: '9. Calabresa Artesanal Curada', description: 'Molho tomate, fatias de calabresa artesanal curada e generosas porções de brie, sobre uma base cremosa. Um toque terroso e sofisticado.', harmonization: 'Cerveja Bock ou Vinho Tinto de Médio Corpo – Syrah (Shiraz).' },
          { name: '10. Peperoni Cremosi', subtitle: 'Peperoni Reale al Gorgonzola', description: 'Feito em massa recheada com mozarella e gorgonzola. Molho de tomate pelati rústico, com azeite extravirgem e leve toque de alho. Catupiry e pepperoni fatiado fino, levemente apimentado, finalizado com parmesão.', harmonization: 'Vinho Tinto Encorpado – Nero d\'Avola ou Cabernet Franc.' },
        ],
      },
      {
        name: 'Pizzas Doces',
        items: [
          { name: '11. Cioccolato Classico', description: 'Chocolate derretido sobre massa fina, finalizado com lascas crocantes.', harmonization: 'Cerveja Porter ou vinho do Porto.' },
          { name: '12. Nutella Cremosa', description: 'Camada generosa de Nutella finalizada com confeitos ou castanhas a gosto.', harmonization: 'Cerveja Stout ou vinho licoroso.' },
          { name: '13. Banana & Canella', subtitle: 'Banana e Cannella Tradizionale', description: 'Fatias de banana caramelizada, toque de canela, açúcar mascavo e finalização de mel.', harmonization: 'Cerveja Weiss ou espumante doce.' },
          { name: '14. Pistache', description: '', harmonization: 'Espumante Brut Rosé ou Moscatel seco.' },
        ],
      },
    ],
  },
  {
    id: 'superiore',
    name: 'Menu Superiore',
    tagline: 'Sabores clássicos com toque artesanal',
    categories: [
      {
        name: 'Entradinhas',
        items: [
          { name: '1. Crostini', description: '' },
          { name: '2. Bordinha de Calabresa', description: '' },
          { name: '3. Bordinha de Queijo', description: '' },
        ],
      },
      {
        name: 'Tradicionais',
        items: [
          { name: '1. Margherita Bufala', description: 'Molho de tomate, mozzarella de búfala, manjoricão, parmesão, orégano e azeite.' },
          { name: '2. Calabresa Tradizionale', description: 'Molho de tomate, mozzarella, calabresa, cobola, azeitona e orégano.' },
          { name: '3. Mozzarella Speciali', description: 'Molho de tomate, mozzarella, tomate em pedaços, azeitona, parmesão, manjericão, orégano e azeite.' },
          { name: '4. Pepperoni Formaggio', description: 'Molho de tomate, mozzarella, pepperoni, parmesão e orégano.' },
          { name: '5. Duo Frango e Bacon', description: 'Molho de tomate, mozzarella, frango desfiado, bacon, catupiry, orégano e azeite.' },
          { name: '6. Quattro Formaggio', description: 'Molho de tomate, mozzarella, gorgonzola, parmesão, catupiry e orégano.' },
          { name: '7. Zucchini Speciali', description: 'Molho de tomate, abobrinha, alho frito, mozzarella, parmesão e azeite.' },
          { name: '8. Blu Agridoce', description: 'Molho de tomate, geleia de pimenta, mozzarella, gorgonzola, bacon e orégano.' },
          { name: '9. Blue e Bianca', description: 'Nossa pizza sem molho, massa, catupiry, búfala, gorgonzola, azeite e orégano.' },
          { name: '10. Orto Italia', description: 'Molho de tomate, mozzarella de búfala, abobrinha em lâminas, bacon, alho frito, orégano, parmesão e azeite.' },
          { name: '11. Mozzarela Tradizionale', description: 'Molho de tomate, mozzarela e orégano.' },
        ],
      },
      {
        name: 'Pizzas Doces',
        items: [
          { name: '12. Cioccolato Classico', description: 'Chocolate derretido sobre massa fina, finalizado com lascas crocantes.' },
          { name: '13. Banana & Canella', subtitle: 'Banana e Cannella Tradizionale', description: 'Fatias de banana caramelizada, toque de canela, açúcar mascavo e finalização de mel.' },
          { name: '14. Pistache', description: '' },
        ],
      },
    ],
  },
  {
    id: 'raffinato',
    name: 'Menu Raffinato',
    tagline: 'Requinte e sofisticação em cada fatia',
    obs: 'Podem ser incluídas qualquer pizza do menu Superiore, acrescentando 8 sabores incríveis.',
    categories: [
      {
        name: 'Entradas',
        items: [
          { name: '1. Bordinha de 4 Queijos', description: 'Nossa massa crocante, recheada de mussarela búfala, catupiry, provolone e parmesão.' },
          { name: '2. Bordinha de Calabresa Cremosi', description: 'Nossa massa crocante, recheada com linguiça calabresa, catupiry e azeitonas pretas sem caroço.' },
          { name: '3. Crostini Parmesão', description: '' },
        ],
      },
      {
        name: 'Pizzas Salgadas',
        items: [
          { name: '3. Brie & Parma al Miele Tartufato', description: 'Base de azeite e uma combinação refinada de queijo brie derretido com presunto de Parma, finalizada com mel trufado e rúcula fresca. Um sabor delicado e elegante.', harmonization: 'Espumante brut ou Chardonnay.' },
          { name: '4. Calabresa Artesanal Curada e Brie', description: 'Molho tomate, fatias de calabresa artesanal curada e generosas porções de brie, sobre uma base cremosa. Um toque terroso e sofisticado.', harmonization: 'Pinot Noir ou vinho branco aromático.' },
          { name: '5. Provolone Affumicato', description: 'Molho de tomates, provolone defumado, tomates secos e azeite de oliva, finalizados com manjericão fresco. Sabor marcante e leve toque defumado.', harmonization: 'Cerveja IPA ou vinho tinto jovem.' },
          { name: '6. Ouro Verde Bianca', description: 'Molho pesto, parmesão, mozzarella de búfala, catupiry, finalizados com amêndoas em fatias, manjericão e azeite.' },
          { name: '7. Duo com Copa', description: 'Massa aberta com borda Vulcão de catupiry, molho de tomate, mozzarella, gorgonzola e fatias de copa.', harmonization: 'Pinot Noir ou vinho branco aromático.' },
          { name: '8. Peperoni Cremosi', subtitle: 'Peperoni Reale al Gorgonzola', description: 'Feito em massa recheada com mozarella e gorgonzola. Molho de tomate pelati rústico, com azeite extravirgem e leve toque de alho. Catupiry e pepperoni fatiado fino, levemente apimentado, finalizado com parmesão.', harmonization: 'Cerveja IPA ou vinho tinto jovem.' },
          { name: '9. Margherita Bufala', description: 'Molho de tomate, mozzarella de búfala, manjoricão, parmesão, orégano e azeite.', harmonization: 'Cerveja Witbier ou Vinho Pinot Noir.' },
          { name: '10. Blu Agridoce', description: 'Molho de tomate, geléia de pimenta, mozzarella, gorgonzola, bacon e orégano.', harmonization: 'Cerveja Dubbel (estilo belga) ou vinho Zinfandel ou Primitivo.' },
          { name: '11. Bracciata di Pomodori Secchi e Rucola', description: 'Nossa massa especial que abraça o recheio de búfala fresca, molho pesto, rúcula e tomates secos, finalizada com parmesão e azeite.', harmonization: 'Vinho branco – Vermentino ou Sauvignon Blanc.' },
        ],
      },
      {
        name: 'Pizzas Doces',
        items: [
          { name: '12. Cioccolato Classico', description: 'Chocolate derretido sobre massa fina, finalizado com lascas crocantes.', harmonization: 'Cerveja Porter ou vinho do Porto.' },
          { name: '13. Banana & Canella', subtitle: 'Banana e Cannella Tradizionale', description: 'Fatias de banana caramelizada, toque de canela, açúcar mascavo e finalização de mel.', harmonization: 'Cerveja Weiss ou espumante doce.' },
          { name: '14. Pistache', description: '', harmonization: 'Espumante Brut Rosé ou Moscatel seco.' },
        ],
      },
    ],
  },
];

const MENU_COLORS: Record<string, string> = {
  eccezionale: styles.menuAmber,
  superiore: styles.menuRed,
  raffinato: styles.menuGold,
};

export default function Cardapios() {
  const { events } = useApp();
  const [menus, setMenus] = useState<Menu[]>([]);

  useEffect(() => {
    fetch('/api/menus').then(r => r.json()).then(setMenus).catch(() => {});
  }, []);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewMenu, setPreviewMenu] = useState<Menu | null>(null);
  const [previewStatic, setPreviewStatic] = useState<StaticMenu | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);

  const handleGeneratePdf = useCallback(async (menu: StaticMenu) => {
    setGeneratingPdf(menu.id);
    try { await generateMenuPdf(menu); } finally { setGeneratingPdf(null); }
  }, []);

  const [formName, setFormName] = useState('');
  const [formEventId, setFormEventId] = useState('');
  const [formHeaderText, setFormHeaderText] = useState('');
  const [formFooterText, setFormFooterText] = useState('');
  const [formCategories, setFormCategories] = useState<MenuCategory[]>([]);

  const eventMap = useMemo(() => {
    const m: Record<string, string> = {};
    events.forEach((e) => { m[e.id] = e.name; });
    return m;
  }, [events]);

  const filtered = menus.filter((m) =>
    !search || m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.eventId && eventMap[m.eventId]?.toLowerCase().includes(search.toLowerCase()))
  );

  const resetForm = () => { setFormName(''); setFormEventId(''); setFormHeaderText(''); setFormFooterText(''); setFormCategories([]); };
  const openCreate = () => { resetForm(); setEditingId(null); setShowModal(true); };
  const openEdit = (menu: Menu) => {
    setFormName(menu.name); setFormEventId(menu.eventId || ''); setFormHeaderText(menu.headerText); setFormFooterText(menu.footerText);
    setFormCategories(JSON.parse(JSON.stringify(menu.categories))); setEditingId(menu.id); setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditingId(null); resetForm(); };

  const handleSubmit = async () => {
    if (!formName) return;
    const data = { name: formName, eventId: formEventId || '', headerText: formHeaderText, footerText: formFooterText, categories: formCategories };
    if (editingId) {
      const res = await fetch(`/api/menus/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const updated: Menu = await res.json();
      setMenus((prev) => prev.map((m) => m.id === editingId ? updated : m));
    } else {
      const res = await fetch('/api/menus', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const created: Menu = await res.json();
      setMenus((prev) => [created, ...prev]);
    }
    closeModal();
  };

  const handleDelete = (id: string) => { setDeleteTargetId(id); };
  const confirmDelete = async () => {
    if (deleteTargetId) { await fetch(`/api/menus/${deleteTargetId}`, { method: 'DELETE' }); setMenus((prev) => prev.filter((m) => m.id !== deleteTargetId)); }
    setDeleteTargetId(null);
  };

  const addCategory = () => setFormCategories((prev) => [...prev, { id: `cat-${Date.now()}`, name: 'Nova Categoria', items: [] }]);
  const removeCategory = (catId: string) => setFormCategories((prev) => prev.filter((c) => c.id !== catId));
  const updateCategoryName = (catId: string, name: string) => setFormCategories((prev) => prev.map((c) => c.id === catId ? { ...c, name } : c));
  const addItem = (catId: string) => setFormCategories((prev) => prev.map((c) => c.id === catId ? { ...c, items: [...c.items, { id: `item-${Date.now()}`, name: '', description: '', price: 0 }] } : c));
  const removeItem = (catId: string, itemId: string) => setFormCategories((prev) => prev.map((c) => c.id === catId ? { ...c, items: c.items.filter((i) => i.id !== itemId) } : c));
  const updateItem = (catId: string, itemId: string, field: keyof MenuItem, value: string | number) => setFormCategories((prev) => prev.map((c) => c.id === catId ? { ...c, items: c.items.map((i) => i.id === itemId ? { ...i, [field]: value } : i) } : c));
  const totalItems = (menu: Menu) => menu.categories.reduce((acc, c) => acc + c.items.length, 0);
  const totalStaticItems = (menu: StaticMenu) => menu.categories.reduce((acc, c) => acc + c.items.length, 0);

  const isSalty = (cat: StaticCategory) => cat.name.toLowerCase().includes('salgad') || cat.name.toLowerCase().includes('tradicional') || cat.name.toLowerCase().includes('entrada');
  const isSweet = (cat: StaticCategory) => cat.name.toLowerCase().includes('doce');

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Cardápios</h1>
          <p className={styles.subtitle}>Menus Soul540 e cardápios personalizados de eventos</p>
        </div>
        <button className={styles.btnPrimary} onClick={openCreate}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo Cardápio
        </button>
      </div>

      {/* Soul540 Standard Menus */}
      <div className={styles.sectionLabel}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        Menus Soul540
      </div>
      <div className={styles.standardGrid}>
        {SOUL540_MENUS.map((menu) => {
          const colorClass = MENU_COLORS[menu.id] || '';
          const totalPizzas = menu.categories.find(c => c.name.toLowerCase().includes('salgad') || c.name.toLowerCase().includes('tradicional'))?.items.length || 0;
          return (
            <div key={menu.id} className={`${styles.standardCard} ${colorClass}`}>
              <div className={styles.standardCardTop}>
                <div className={styles.standardBadge}>Soul540</div>
                <div className={styles.standardStatsRow}>
                  {menu.categories.map((cat) => (
                    <span key={cat.id} className={styles.standardStat}>
                      <strong>{cat.items.length}</strong> {cat.name.toLowerCase().includes('entrada') ? 'entradas' : cat.name.toLowerCase().includes('doce') ? 'doces' : 'sabores'}
                    </span>
                  ))}
                </div>
              </div>
              <h3 className={styles.standardName}>{menu.name}</h3>
              <p className={styles.standardTagline}>{menu.tagline}</p>
              <div className={styles.standardCategories}>
                {menu.categories.map((cat) => (
                  <div key={cat.name} className={`${styles.standardCatTag} ${isSweet(cat) ? styles.sweetTag : ''}`}>
                    {cat.name}
                  </div>
                ))}
              </div>
              <div className={styles.standardTotal}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {totalStaticItems(menu)} itens no total · {totalPizzas} sabores de pizza
              </div>
              <div className={styles.standardCardFooter}>
                <button className={styles.btnViewMenu} onClick={() => setPreviewStatic(menu)}>
                  Ver Cardápio
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
                <button
                  className={styles.btnPdf}
                  onClick={() => handleGeneratePdf(menu)}
                  disabled={generatingPdf === menu.id}
                  title="Gerar PDF"
                >
                  {generatingPdf === menu.id ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.spinning}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                  )}
                  PDF
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Menus */}
      <div className={styles.sectionLabel}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        Cardápios Personalizados
      </div>

      <div className={styles.controls}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input className={styles.searchInput} placeholder="Buscar cardápios personalizados..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>Nenhum cardápio personalizado criado ainda.</div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((menu) => (
            <div key={menu.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardName}>{menu.name}</h3>
                  {menu.eventId && <p className={styles.cardEvent}>{eventMap[menu.eventId]}</p>}
                </div>
                <div className={styles.cardStats}>
                  <span className={styles.statBadge}>{menu.categories.length} cats.</span>
                  <span className={styles.statBadge}>{totalItems(menu)} itens</span>
                </div>
              </div>
              {menu.headerText && <p className={styles.cardSubText}>{menu.headerText}</p>}
              <div className={styles.categoriesList}>
                {menu.categories.map((cat) => (
                  <div key={cat.id} className={styles.catItem}>
                    <span className={styles.catName}>{cat.name}</span>
                    <span className={styles.catCount}>{cat.items.length} itens</span>
                  </div>
                ))}
              </div>
              <div className={styles.cardActions}>
                <button className={styles.btnView} onClick={() => setPreviewMenu(menu)}>Visualizar</button>
                <button className={styles.btnEdit} onClick={() => openEdit(menu)}>Editar</button>
                <button className={styles.btnDelete} onClick={() => handleDelete(menu.id)}>Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showModal && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editingId ? 'Editar Cardápio' : 'Novo Cardápio'}</h2>
              <button className={styles.modalClose} onClick={closeModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nome do Cardápio *</label>
                  <input className={styles.input} value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ex: Cardápio Corporativo" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Evento Vinculado</label>
                  <select className={styles.input} value={formEventId} onChange={(e) => setFormEventId(e.target.value)}>
                    <option value="">Nenhum</option>
                    {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Cabeçalho</label>
                  <input className={styles.input} value={formHeaderText} onChange={(e) => setFormHeaderText(e.target.value)} placeholder="Soul540 - Pizzas Artesanais" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Rodapé</label>
                  <input className={styles.input} value={formFooterText} onChange={(e) => setFormFooterText(e.target.value)} placeholder="Ingredientes frescos..." />
                </div>
              </div>
              <div className={styles.categoriesSection}>
                <div className={styles.categoriesHeader}>
                  <span className={styles.categoriesTitle}>Categorias e Itens</span>
                  <button className={styles.btnAddCat} type="button" onClick={addCategory}>+ Categoria</button>
                </div>
                {formCategories.map((cat) => (
                  <div key={cat.id} className={styles.catBlock}>
                    <div className={styles.catBlockHeader}>
                      <input className={styles.catNameInput} value={cat.name} onChange={(e) => updateCategoryName(cat.id, e.target.value)} placeholder="Nome da categoria" />
                      <button className={styles.btnRemoveCat} type="button" onClick={() => removeCategory(cat.id)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                    {cat.items.map((item) => (
                      <div key={item.id} className={styles.itemRow}>
                        <input className={styles.itemInput} value={item.name} onChange={(e) => updateItem(cat.id, item.id, 'name', e.target.value)} placeholder="Nome do item" />
                        <input className={`${styles.itemInput} ${styles.itemDesc}`} value={item.description} onChange={(e) => updateItem(cat.id, item.id, 'description', e.target.value)} placeholder="Descrição" />
                        <input className={`${styles.itemInput} ${styles.itemPrice}`} type="number" value={item.price} onChange={(e) => updateItem(cat.id, item.id, 'price', Number(e.target.value))} placeholder="R$" />
                        <button className={styles.btnRemoveItem} type="button" onClick={() => removeItem(cat.id, item.id)}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    ))}
                    <button className={styles.btnAddItem} type="button" onClick={() => addItem(cat.id)}>+ Item</button>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={closeModal}>Cancelar</button>
              <button className={styles.btnPrimary} onClick={handleSubmit} disabled={!formName}>{editingId ? 'Salvar' : 'Criar Cardápio'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Menu Preview */}
      {previewMenu && (
        <div className={styles.overlay} onClick={() => setPreviewMenu(null)}>
          <div className={styles.preview} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Visualizar Cardápio</h2>
              <button className={styles.modalClose} onClick={() => setPreviewMenu(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className={styles.previewBody}>
              {previewMenu.headerText && <div className={styles.previewHeader}>{previewMenu.headerText}</div>}
              <h3 className={styles.previewTitle}>{previewMenu.name}</h3>
              {previewMenu.eventId && <p className={styles.previewEvent}>{eventMap[previewMenu.eventId]}</p>}
              {previewMenu.categories.map((cat) => (
                <div key={cat.id} className={styles.previewCat}>
                  <h4 className={styles.previewCatName}>{cat.name}</h4>
                  {cat.items.map((item) => (
                    <div key={item.id} className={styles.previewItem}>
                      <div>
                        <p className={styles.previewItemName}>{item.name}</p>
                        {item.description && <p className={styles.previewItemDesc}>{item.description}</p>}
                      </div>
                      <span className={styles.previewItemPrice}>R$ {item.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ))}
              {previewMenu.footerText && <div className={styles.previewFooter}>{previewMenu.footerText}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Static Menu Preview */}
      {previewStatic && (
        <div className={styles.overlay} onClick={() => setPreviewStatic(null)}>
          <div className={styles.menuOverlay} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className={styles.menuDocHeader}>
              <div className={styles.menuDocBrand}>Soul<span>540</span> Pizzas</div>
              <div className={styles.menuDocTagline}>· artesanal food ·</div>
              <h2 className={styles.menuDocTitle}>{previewStatic.name}</h2>
              <p className={styles.menuDocSub}>{previewStatic.tagline}</p>
            </div>
            <div className={styles.menuTopActions}>
              <button
                className={styles.btnPdfModal}
                onClick={() => handleGeneratePdf(previewStatic)}
                disabled={generatingPdf === previewStatic.id}
              >
                {generatingPdf === previewStatic.id ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.spinning}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                )}
                Gerar PDF
              </button>
              <button className={styles.menuClose} onClick={() => setPreviewStatic(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            {/* Body */}
            <div className={styles.menuDocBody}>
              {previewStatic.categories.map((cat) => (
                <div key={cat.name} className={styles.menuDocSection}>
                  <div className={`${styles.menuDocCatTitle} ${isSweet(cat) ? styles.menuDocCatSweet : ''}`}>
                    {cat.name}
                  </div>
                  <div className={styles.menuDocItems}>
                    {cat.items.map((item) => (
                      <div key={item.name} className={styles.menuDocItem}>
                        <div className={styles.menuDocItemHeader}>
                          <span className={styles.menuDocItemName}>{item.name}</span>
                          {item.subtitle && <span className={styles.menuDocItemSub}>{item.subtitle}</span>}
                        </div>
                        {item.description && <p className={styles.menuDocItemDesc}>{item.description}</p>}
                        {item.harmonization && (
                          <p className={styles.menuDocItemHarm}><strong>Harmonização:</strong> {item.harmonization}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {previewStatic.obs && (
                <div className={styles.menuDocObs}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  OBS * {previewStatic.obs}
                </div>
              )}
              <div className={styles.menuDocContact}>
                <span>@soul.pizzas</span>
                <span>19 98160-5481</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTargetId && (
        <ConfirmModal
          title="Excluir Cardápio"
          message={<>Tem certeza que deseja excluir <strong>{menus.find((m) => m.id === deleteTargetId)?.name}</strong>? Esta ação não pode ser desfeita.</>}
          confirmLabel="Excluir"
          variant="danger"
          onConfirm={confirmDelete}
          onClose={() => setDeleteTargetId(null)}
        />
      )}
    </div>
  );
}
