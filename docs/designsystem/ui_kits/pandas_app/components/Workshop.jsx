/* global React */
const { useState } = React;

function ROCard({ ro, onClick, dragging }) {
  const top = PRIORITY[ro.topPriority];
  return (
    <div onClick={onClick} style={{
      background:'#FFFFFF', border:'1px solid #E6E2DB',
      borderRadius: 12, padding: 14,
      boxShadow: dragging ? '0 10px 15px rgba(20,20,18,0.10)' : '0 1px 3px rgba(20,20,18,0.10)',
      transform: dragging ? 'scale(1.02)' : 'none',
      cursor:'pointer', display:'flex', flexDirection:'column', gap: 8,
      transition:'box-shadow 200ms, transform 200ms'
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{
          fontFamily:'JetBrains Mono', fontSize: 11, color:'#706D66',
          letterSpacing:'0.04em'
        }}>OT-{ro.id}</div>
        <PriorityBadge level={ro.topPriority} />
      </div>
      <div style={{ fontFamily:'DM Sans', fontSize: 16, fontWeight: 600, color:'#141412', lineHeight: 1.3 }}>
        {ro.vehicle}
      </div>
      <div style={{ fontFamily:'DM Sans', fontSize: 13, color:'#706D66' }}>
        {ro.customer} · <span style={{ fontFamily:'JetBrains Mono', fontSize: 12 }}>{ro.plate}</span>
      </div>
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        paddingTop: 8, borderTop:'1px solid #F0EDE8'
      }}>
        <div style={{ display:'flex', alignItems:'center', gap: 6, color:'#706D66', fontFamily:'DM Sans', fontSize: 12 }}>
          <Icon name="list" size={14} color="#706D66" />
          {ro.itemCount} ítems
        </div>
        <div style={{ fontFamily:'Barlow Condensed', fontWeight: 700, fontSize: 18,
          letterSpacing:'0.04em', color:'#141412' }}>
          $ {ro.total.toLocaleString('es-CO')}
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({ status, title, color, ros, onSelect, isActive }) {
  return (
    <div style={{
      flex: '0 0 280px',
      scrollSnapAlign:'start',
      display:'flex', flexDirection:'column',
      height:'100%',
    }}>
      <div style={{
        display:'flex', alignItems:'center', gap: 8,
        padding:'12px 4px 10px',
        borderBottom:`2px solid ${color}`,
      }}>
        <div style={{ width: 8, height: 8, borderRadius:'50%', background: color }}></div>
        <div style={{
          fontFamily:'Barlow Condensed', fontWeight: 700, fontSize: 14,
          letterSpacing:'0.10em', textTransform:'uppercase', color:'#141412'
        }}>{title}</div>
        <div style={{
          background:'#F0EDE8', color:'#3E3C38',
          padding:'2px 8px', borderRadius: 9999,
          fontFamily:'DM Sans', fontSize: 11, fontWeight: 600
        }}>{ros.length}</div>
      </div>
      <div style={{
        flex: 1, overflowY:'auto', padding:'12px 4px',
        display:'flex', flexDirection:'column', gap: 10
      }}>
        {ros.map(ro => <ROCard key={ro.id} ro={ro} onClick={() => onSelect(ro)} />)}
        {ros.length === 0 && (
          <div style={{
            border:'1px dashed #E6E2DB', borderRadius: 12, padding: 20,
            color:'#B2AFA8', fontFamily:'DM Sans', fontSize: 13, textAlign:'center'
          }}>Sin órdenes en esta columna</div>
        )}
      </div>
    </div>
  );
}

function LineItemRow({ item, onChangePriority, onDelete }) {
  const p = PRIORITY[item.priority];
  return (
    <div style={{
      background:'#fff', border:`1px solid #E6E2DB`,
      borderRadius: 12, padding: '12px 14px',
      display:'flex', alignItems:'flex-start', gap: 12,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: '#1A3650', color: '#1A3650',
        display:'grid', placeItems:'center', flexShrink: 0,
        border:'1px solid #1A3650'
      }}>
        <Icon name={item.kind === 'parts' ? 'package' : 'wrench'} size={18} color="#FFFFFF" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap: 8 }}>
          <div style={{ fontFamily:'DM Sans', fontSize: 15, fontWeight: 600, color:'#141412' }}>{item.title}</div>
          <div style={{ fontFamily:'JetBrains Mono', fontSize: 14, color:'#141412' }}>$ {item.price.toLocaleString('es-CO')}</div>
        </div>
        <div style={{ fontFamily:'DM Sans', fontSize: 13, color:'#706D66', marginTop: 2 }}>
          {item.detail}
        </div>
        <div style={{ display:'flex', gap: 8, marginTop: 8, alignItems:'center' }}>
          <PriorityBadge level={item.priority} />
          <span style={{ fontFamily:'DM Sans', fontSize: 11, color:'#706D66' }}>x{item.qty}</span>
        </div>
      </div>
    </div>
  );
}

function StickyTotals({ subtotal, iva, total, onPrimary }) {
  return (
    <div style={{
      background:'#FFFFFF', border:'1px solid #B2AFA8',
      borderRadius: 16, padding: 16,
      boxShadow:'0 4px 6px rgba(20,20,18,0.08)',
      display:'flex', flexDirection:'column', gap: 10
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontFamily:'DM Sans', fontSize: 14, color:'#3E3C38' }}>
        <span>Subtotal</span>
        <span style={{ fontFamily:'JetBrains Mono' }}>$ {subtotal.toLocaleString('es-CO')}</span>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', fontFamily:'DM Sans', fontSize: 14, color:'#3E3C38' }}>
        <span>IVA 19%</span>
        <span style={{ fontFamily:'JetBrains Mono' }}>$ {iva.toLocaleString('es-CO')}</span>
      </div>
      <div style={{
        display:'flex', justifyContent:'space-between', alignItems:'baseline',
        paddingTop: 10, borderTop:'1px solid #E6E2DB'
      }}>
        <span style={{
          fontFamily:'Barlow Condensed', fontSize: 14, fontWeight: 700,
          letterSpacing:'0.10em', textTransform:'uppercase', color:'#3E3C38'
        }}>Total</span>
        <span style={{
          fontFamily:'Barlow Condensed', fontSize: 32, fontWeight: 700,
          letterSpacing:'0.04em', color:'#141412'
        }}>$ {total.toLocaleString('es-CO')}</span>
      </div>
    </div>
  );
}

function VehicleHeader({ ro }) {
  return (
    <div style={{
      background:'#1A3650', color:'#F8F6F2',
      padding: 16, borderRadius: 12,
      display:'flex', flexDirection:'column', gap: 8,
      border:'1px solid #0D1E2E'
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{
          fontFamily:'JetBrains Mono', fontSize: 11,
          color:'#94B5D8', letterSpacing:'0.04em'
        }}>OT-{ro.id}</div>
        <PriorityBadge level={ro.topPriority} solid />
      </div>
      <div style={{
        fontFamily:'Barlow Condensed', fontSize: 28, fontWeight: 700,
        letterSpacing:'0.06em', textTransform:'uppercase', lineHeight: 1.05
      }}>{ro.vehicle}</div>
      <div style={{ display:'flex', gap: 16, marginTop: 4 }}>
        <div>
          <div style={{ fontFamily:'DM Sans', fontSize: 10, fontWeight: 600,
            letterSpacing:'0.04em', textTransform:'uppercase', color:'#94B5D8' }}>Placa</div>
          <div style={{ fontFamily:'JetBrains Mono', fontSize: 14, color:'#F8F6F2' }}>{ro.plate}</div>
        </div>
        <div>
          <div style={{ fontFamily:'DM Sans', fontSize: 10, fontWeight: 600,
            letterSpacing:'0.04em', textTransform:'uppercase', color:'#94B5D8' }}>VIN</div>
          <div style={{ fontFamily:'JetBrains Mono', fontSize: 13, color:'#F8F6F2' }}>{ro.vin}</div>
        </div>
        <div>
          <div style={{ fontFamily:'DM Sans', fontSize: 10, fontWeight: 600,
            letterSpacing:'0.04em', textTransform:'uppercase', color:'#94B5D8' }}>Cliente</div>
          <div style={{ fontFamily:'DM Sans', fontSize: 14, fontWeight: 500, color:'#F8F6F2' }}>{ro.customer}</div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ROCard, KanbanColumn, LineItemRow, StickyTotals, VehicleHeader });
