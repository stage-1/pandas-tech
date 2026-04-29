/* global React */
const { useState } = React;

const SEED_ROS = [
  {
    id: '0241', vehicle: 'Mazda 3 · 2018', plate: 'ABC-123',
    vin: '1HGBH41JXMN109186', customer: 'Diego Restrepo',
    status: 'in-progress', topPriority: 'critical',
    itemCount: 6, total: 1840000,
    items: [
      { id:'a', kind:'parts', title:'Pastillas de freno cerámicas', detail:'Delanteras · marca Brembo', priority:'critical', qty: 1, price: 240000 },
      { id:'b', kind:'labor', title:'Cambio de pastillas + revisión disco', detail:'Mano de obra · Hugo', priority:'critical', qty: 1, price: 120000 },
      { id:'c', kind:'parts', title:'Filtro de aceite', detail:'Original Mazda', priority:'medium', qty: 1, price: 65000 },
      { id:'d', kind:'parts', title:'Aceite 5W-30 sintético', detail:'4 litros · Mobil 1', priority:'medium', qty: 4, price: 75000 },
      { id:'e', kind:'labor', title:'Cambio de aceite + filtro', detail:'Mano de obra · Hugo', priority:'medium', qty: 1, price: 80000 },
      { id:'f', kind:'parts', title:'Limpiaparabrisas', detail:'Par · 22"/18"', priority:'low', qty: 1, price: 55000 },
    ]
  },
  {
    id: '0242', vehicle: 'Renault Logan · 2020', plate: 'GFC-440',
    vin: 'KMHWF35V8WA123456', customer: 'María Ortiz',
    status: 'todo', topPriority: 'medium', itemCount: 3, total: 620000, items: []
  },
  {
    id: '0243', vehicle: 'Chevrolet Spark · 2016', plate: 'TWS-882',
    vin: 'KL8MD6A07GC123456', customer: 'Andrés Gil',
    status: 'todo', topPriority: 'low', itemCount: 2, total: 180000, items: []
  },
  {
    id: '0240', vehicle: 'Toyota Hilux · 2019', plate: 'BRT-009',
    vin: '4T1BF1FK6GU123456', customer: 'Luz Martínez',
    status: 'in-progress', topPriority: 'critical', itemCount: 8, total: 3200000, items: []
  },
  {
    id: '0238', vehicle: 'Kia Picanto · 2021', plate: 'JKL-557',
    vin: 'KNADN412ALA123456', customer: 'Carlos Vargas',
    status: 'ready', topPriority: 'medium', itemCount: 4, total: 740000, items: []
  },
  {
    id: '0237', vehicle: 'Nissan Sentra · 2017', plate: 'XYZ-301',
    vin: '3N1AB7AP8HY123456', customer: 'Paola Henao',
    status: 'done', topPriority: 'done', itemCount: 5, total: 980000, items: []
  },
];

const COLUMNS = [
  { status:'todo', title:'Recibido', color:'#706D66' },
  { status:'in-progress', title:'En taller', color:'#C48A08' },
  { status:'ready', title:'Listo', color:'#30597C' },
  { status:'done', title:'Entregado', color:'#2E8B36' },
];

function KanbanScreen({ onSelect }) {
  const [filter, setFilter] = useState('all');
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <AppBar
        title="Taller"
        subtitle="6 órdenes · 2 críticas"
        leading={<Icon name="menu" size={22} />}
        trailing={[
          <IconButton key="s" name="search" />,
          <IconButton key="f" name="bell" />,
        ]}
      />
      {/* Filter chips */}
      <div style={{ display:'flex', gap: 8, padding:'12px 16px',
        background:'#F8F6F2', overflowX:'auto', borderBottom:'1px solid #E6E2DB' }}>
        {[
          { id:'all', label:'Todas', count: 6 },
          { id:'crit', label:'Críticas', count: 2 },
          { id:'mine', label:'Mías', count: 3 },
          { id:'today', label:'Hoy', count: 4 },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            height: 36, padding:'0 14px', borderRadius: 9999,
            background: filter === f.id ? '#1A3650' : '#fff',
            color: filter === f.id ? '#fff' : '#141412',
            border: filter === f.id ? '1px solid #0D1E2E' : '1px solid #E6E2DB',
            fontFamily:'DM Sans', fontSize: 13, fontWeight: 600,
            display:'inline-flex', alignItems:'center', gap: 6,
            whiteSpace:'nowrap', cursor:'pointer'
          }}>
            {f.label}
            <span style={{
              background: filter === f.id ? '#0D1E2E' : '#F0EDE8',
              color: filter === f.id ? '#94B5D8' : '#706D66',
              padding:'1px 7px', borderRadius: 9999, fontSize: 11
            }}>{f.count}</span>
          </button>
        ))}
      </div>
      {/* Kanban scroll */}
      <div style={{
        flex: 1, overflowX:'auto', overflowY:'hidden',
        scrollSnapType:'x mandatory',
        display:'flex', gap: 12, padding:'0 12px',
        background:'#F8F6F2'
      }}>
        {COLUMNS.map(col => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            title={col.title}
            color={col.color}
            ros={SEED_ROS.filter(r => r.status === col.status)}
            onSelect={onSelect}
          />
        ))}
      </div>
      {/* Bottom */}
      <BottomBar>
        <div style={{ flex: 1, display:'flex', justifyContent:'space-around' }}>
          <NavTab name="layout-grid" label="Taller" active />
          <NavTab name="users" label="Clientes" />
          <NavTab name="bar-chart-3" label="Reportes" />
          <NavTab name="user" label="Cuenta" />
        </div>
      </BottomBar>
    </div>
  );
}

function NavTab({ name, label, active }) {
  const color = active ? '#C01E1E' : '#706D66';
  return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center', gap: 2,
      minWidth: 60, paddingTop: 4, cursor:'pointer'
    }}>
      <Icon name={name} size={22} color={color} />
      <div style={{ fontFamily:'DM Sans', fontSize: 11, fontWeight: 600, color }}>{label}</div>
    </div>
  );
}

function ROScreen({ ro, onBack, onPrint }) {
  const subtotal = ro.items.reduce((s, i) => s + i.price * i.qty, 0);
  const iva = Math.round(subtotal * 0.19);
  const total = subtotal + iva;
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#F8F6F2' }}>
      <AppBar
        title={`OT-${ro.id}`}
        subtitle={ro.vehicle}
        leading={<IconButton name="arrow-left" onClick={onBack} />}
        trailing={[
          <IconButton key="m" name="more-vertical" />,
        ]}
      />
      <div style={{ flex: 1, overflowY:'auto', padding: 16, display:'flex', flexDirection:'column', gap: 14 }}>
        <VehicleHeader ro={ro} />
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop: 4 }}>
          <div style={{
            fontFamily:'Barlow Condensed', fontSize: 14, fontWeight: 700,
            letterSpacing:'0.10em', textTransform:'uppercase', color:'#3E3C38'
          }}>Ítems · {ro.items.length}</div>
          <button style={{
            height: 36, padding:'0 12px', borderRadius: 6,
            background:'#fff', border:'1px solid #B2AFA8',
            fontFamily:'DM Sans', fontSize: 13, fontWeight: 600,
            display:'inline-flex', alignItems:'center', gap: 6, cursor:'pointer'
          }}><Icon name="plus" size={16} /> Agregar</button>
        </div>
        {ro.items.map(item => <LineItemRow key={item.id} item={item} />)}
        <StickyTotals subtotal={subtotal} iva={iva} total={total} />
        {/* Brand-accent CTA */}
        <div style={{
          background:'#C01E1E', color:'#fff',
          borderRadius: 12, padding: 16,
          display:'flex', alignItems:'center', gap: 12
        }}>
          <Icon name="alert-triangle" size={22} color="#fff" />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily:'DM Sans', fontSize: 14, fontWeight: 600 }}>Pago pendiente</div>
            <div style={{ fontFamily:'DM Sans', fontSize: 12, color:'#FDEAEA' }}>Cobrar antes de entregar el vehículo.</div>
          </div>
        </div>
        <div style={{ height: 8 }}></div>
      </div>
      <BottomBar>
        <SecondaryButton icon="printer" onClick={onPrint}>PDF</SecondaryButton>
        <div style={{ flex: 1 }}></div>
        <PrimaryButton icon="send">Enviar al cliente</PrimaryButton>
      </BottomBar>
    </div>
  );
}

function PDFPreview({ ro, onBack }) {
  const subtotal = ro.items.reduce((s, i) => s + i.price * i.qty, 0);
  const iva = Math.round(subtotal * 0.19);
  const total = subtotal + iva;
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#222120' }}>
      <AppBar
        title="Vista previa"
        subtitle="PDF · cotización"
        leading={<IconButton name="arrow-left" onClick={onBack} />}
        trailing={[<IconButton key="d" name="download" />]}
      />
      <div style={{ flex: 1, overflowY:'auto', padding: 16, display:'grid', placeItems:'start center' }}>
        <div style={{
          width: '100%', maxWidth: 320,
          background:'#fff', borderRadius: 8,
          boxShadow:'0 10px 15px rgba(0,0,0,0.4)',
          padding: 20, display:'flex', flexDirection:'column', gap: 14
        }}>
          {/* PDF header */}
          <div style={{ display:'flex', alignItems:'center', gap: 10, paddingBottom: 12, borderBottom:'2px solid #C01E1E' }}>
            <img src="../../assets/panda_logo.png" alt="" style={{ width: 48, height: 48, objectFit:'contain' }} />
            <div>
              <div style={{
                fontFamily:'Barlow Condensed', fontWeight: 700, fontSize: 18,
                letterSpacing:'0.06em', textTransform:'uppercase', color:'#141412', lineHeight: 1
              }}>Panda Automotriz</div>
              <div style={{
                fontFamily:'Barlow Condensed', fontWeight: 500, fontSize: 10,
                letterSpacing:'0.10em', textTransform:'uppercase', color:'#706D66', marginTop: 2
              }}>Centro de mantenimiento</div>
            </div>
          </div>
          {/* meta */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 8, fontFamily:'DM Sans' }}>
            <div>
              <div style={{ fontSize: 9, color:'#706D66', letterSpacing:'0.04em', textTransform:'uppercase', fontWeight: 600 }}>Cotización</div>
              <div style={{ fontFamily:'JetBrains Mono', fontSize: 13 }}>OT-{ro.id}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color:'#706D66', letterSpacing:'0.04em', textTransform:'uppercase', fontWeight: 600 }}>Fecha</div>
              <div style={{ fontFamily:'JetBrains Mono', fontSize: 13 }}>2026-04-29</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color:'#706D66', letterSpacing:'0.04em', textTransform:'uppercase', fontWeight: 600 }}>Cliente</div>
              <div style={{ fontSize: 13 }}>{ro.customer}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color:'#706D66', letterSpacing:'0.04em', textTransform:'uppercase', fontWeight: 600 }}>Vehículo</div>
              <div style={{ fontSize: 13 }}>{ro.vehicle}</div>
            </div>
          </div>
          {/* items */}
          <div style={{ borderTop:'1px solid #E6E2DB', paddingTop: 10 }}>
            {ro.items.map(item => (
              <div key={item.id} style={{
                display:'flex', justifyContent:'space-between', alignItems:'flex-start',
                padding:'6px 0', borderBottom:'1px solid #F0EDE8', gap: 8
              }}>
                <div style={{ flex: 1, fontFamily:'DM Sans', fontSize: 11 }}>
                  <div style={{ fontWeight: 600 }}>{item.title}</div>
                  <div style={{ color:'#706D66', fontSize: 10 }}>{item.detail} · x{item.qty}</div>
                </div>
                <div style={{ fontFamily:'JetBrains Mono', fontSize: 11 }}>$ {(item.price * item.qty).toLocaleString('es-CO')}</div>
              </div>
            ))}
          </div>
          {/* total */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', paddingTop: 8 }}>
            <div style={{
              fontFamily:'Barlow Condensed', fontSize: 12, fontWeight: 700,
              letterSpacing:'0.10em', textTransform:'uppercase', color:'#3E3C38'
            }}>Total</div>
            <div style={{
              fontFamily:'Barlow Condensed', fontSize: 24, fontWeight: 700,
              letterSpacing:'0.04em', color:'#C01E1E'
            }}>$ {total.toLocaleString('es-CO')}</div>
          </div>
        </div>
      </div>
      <BottomBar>
        <PrimaryButton icon="send" full>Enviar por WhatsApp</PrimaryButton>
      </BottomBar>
    </div>
  );
}

Object.assign(window, { SEED_ROS, COLUMNS, KanbanScreen, ROScreen, PDFPreview, NavTab });
