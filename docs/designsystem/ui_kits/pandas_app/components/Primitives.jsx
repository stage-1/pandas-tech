/* global React */
const { useState } = React;

const PRIORITY = {
  critical: { bg:'#FDEAEA', border:'#F29090', text:'#7A1010', icon:'#C01E1E', dot:'#C01E1E', label:'Crítico' },
  medium:   { bg:'#FFF6E6', border:'#FAD888', text:'#7A5205', icon:'#C48A08', dot:'#C48A08', label:'Medio' },
  low:      { bg:'#EDF2F8', border:'#94B5D8', text:'#1A3650', icon:'#30597C', dot:'#30597C', label:'Bajo' },
  done:     { bg:'#EDF7EE', border:'#9DD4A2', text:'#1D5C22', icon:'#2E8B36', dot:'#2E8B36', label:'Hecho' },
};

function Icon({ name, size = 20, color, style }) {
  return React.createElement('i', {
    'data-lucide': name,
    style: { width: size, height: size, color, display: 'inline-flex', ...style }
  });
}

function PriorityBadge({ level, solid }) {
  const p = PRIORITY[level];
  if (!p) return null;
  if (solid) {
    return (
      <span style={{
        display:'inline-flex', alignItems:'center', gap:6,
        padding:'4px 10px', borderRadius: 9999,
        background: p.icon, color:'#fff',
        fontFamily:'DM Sans', fontSize: 11, fontWeight: 700,
        letterSpacing:'0.06em', textTransform:'uppercase',
      }}>{p.label}</span>
    );
  }
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:6,
      padding:'4px 10px', borderRadius: 9999,
      background: p.bg, color: p.text, border: `1px solid ${p.border}`,
      fontFamily:'DM Sans', fontSize: 11, fontWeight: 600,
      letterSpacing:'0.06em', textTransform:'uppercase',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.dot }}></span>
      {p.label}
    </span>
  );
}

function StatusBar() {
  return (
    <div style={{
      height: 44, background:'transparent', display:'flex',
      justifyContent:'space-between', alignItems:'center',
      padding:'0 22px', fontFamily:'DM Sans', fontSize: 14, fontWeight: 600,
      color:'#141412'
    }}>
      <span>9:41</span>
      <span style={{ display:'inline-flex', gap: 6, alignItems:'center' }}>
        <Icon name="signal" size={14} />
        <Icon name="wifi" size={14} />
        <Icon name="battery-full" size={16} />
      </span>
    </div>
  );
}

function AppBar({ title, subtitle, leading, trailing, accent }) {
  return (
    <div style={{
      height: 56, padding:'0 16px', background: accent ? '#C01E1E' : '#FFFFFF',
      borderBottom: accent ? 'none' : '1px solid #E6E2DB',
      display:'flex', alignItems:'center', gap: 12,
      color: accent ? '#fff' : '#141412'
    }}>
      <div style={{ width: 32, height: 32, display:'grid', placeItems:'center' }}>
        {leading || <Icon name="menu" size={22} color={accent ? '#fff' : '#141412'} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily:'Barlow Condensed', fontWeight: 700, fontSize: 22, lineHeight: 1,
          letterSpacing:'0.06em', textTransform:'uppercase'
        }}>{title}</div>
        {subtitle && (
          <div style={{ fontFamily:'DM Sans', fontSize: 11, opacity: accent ? 0.85 : 0.65,
            letterSpacing:'0.04em', textTransform:'uppercase', marginTop: 2 }}>{subtitle}</div>
        )}
      </div>
      <div style={{ display:'flex', gap: 4 }}>
        {trailing}
      </div>
    </div>
  );
}

function BottomBar({ children }) {
  return (
    <div style={{
      height: 64, background:'#FFFFFF',
      borderTop:'1px solid #E6E2DB',
      display:'flex', alignItems:'center', padding:'0 16px',
      gap: 8, boxShadow:'0 -4px 6px rgba(20,20,18,0.04)'
    }}>{children}</div>
  );
}

function PrimaryButton({ children, onClick, icon, full }) {
  return (
    <button onClick={onClick} style={{
      height: 44, padding:'0 20px', border:'none', borderRadius: 6,
      background:'#C01E1E', color:'#fff',
      fontFamily:'DM Sans', fontSize: 15, fontWeight: 600,
      display:'inline-flex', alignItems:'center', justifyContent:'center', gap: 8,
      cursor:'pointer', width: full ? '100%' : undefined
    }}>
      {icon && <Icon name={icon} size={18} color="#fff" />}
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick, icon, full }) {
  return (
    <button onClick={onClick} style={{
      height: 44, padding:'0 16px', border:'1px solid #B2AFA8', borderRadius: 6,
      background:'#fff', color:'#141412',
      fontFamily:'DM Sans', fontSize: 15, fontWeight: 500,
      display:'inline-flex', alignItems:'center', justifyContent:'center', gap: 8,
      cursor:'pointer', width: full ? '100%' : undefined
    }}>
      {icon && <Icon name={icon} size={18} color="#3E3C38" />}
      {children}
    </button>
  );
}

function IconButton({ name, color = '#141412', onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 44, height: 44, border:'none', background:'transparent',
      display:'grid', placeItems:'center', cursor:'pointer', borderRadius: 6
    }}><Icon name={name} size={22} color={color} /></button>
  );
}

Object.assign(window, { PRIORITY, Icon, PriorityBadge, StatusBar, AppBar, BottomBar, PrimaryButton, SecondaryButton, IconButton });
