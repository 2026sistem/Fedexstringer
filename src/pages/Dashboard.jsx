import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { MetricCard, Badge, Spinner, EmptyState } from '../components/UI'

export default function Dashboard({ navigate }) {
  const [pedidos, setPedidos] = useState([])
  const [clientes, setClientes] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: p }, { count: c }] = await Promise.all([
        supabase.from('pedidos').select('*, clientes(nombre), cuerdas(nombre)').order('created_at', { ascending: false }).limit(6),
        supabase.from('clientes').select('*', { count: 'exact', head: true })
      ])
      setPedidos(p || [])
      setClientes(c || 0)
      setLoading(false)
    }
    load()
  }, [])

  const mes = pedidos.filter(p => {
    const d = new Date(p.created_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const enProceso = pedidos.filter(p => p.estado === 'en_proceso').length
  const ingresos = mes.filter(p => p.estado !== 'pendiente').reduce((a, p) => a + (p.precio || 0), 0)

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <MetricCard label="Pedidos del mes" value={mes.length} sub="este mes" />
        <MetricCard label="En proceso" value={enProceso} sub="activos ahora" color={enProceso > 0 ? 'var(--info)' : undefined} />
        <MetricCard label="Clientes" value={clientes} sub="registrados" />
        <MetricCard label="Ingresos del mes" value={`$${ingresos.toLocaleString('es-AR')}`} sub="trabajos realizados" color="var(--accent)" />
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 500 }}>Últimos pedidos</div>
          <button onClick={() => navigate('pedidos')} style={{ fontSize: 13, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)' }}>
            + Nuevo pedido
          </button>
        </div>
        {loading ? <Spinner /> : pedidos.length === 0 ? <EmptyState message="Todavía no hay pedidos. ¡Creá el primero!" /> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Cliente', 'Raqueta', 'Cuerda', 'Tensión', 'Estado'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 500, color: 'var(--text-2)', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pedidos.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '11px 16px', fontWeight: 500 }}>{p.clientes?.nombre || '—'}</td>
                  <td style={{ padding: '11px 16px', color: 'var(--text-2)' }}>{p.marca_raqueta} {p.modelo_raqueta}</td>
                  <td style={{ padding: '11px 16px', color: 'var(--text-2)' }}>{p.cuerdas?.nombre || '—'}</td>
                  <td style={{ padding: '11px 16px', color: 'var(--text-2)' }}>{p.tension_kg ? `${p.tension_kg} kg` : '—'}</td>
                  <td style={{ padding: '11px 16px' }}><Badge status={p.estado} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
