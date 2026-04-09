import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { Card, Badge, Btn, Input, Select, Spinner, EmptyState } from '../components/UI'

const ESTADOS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'listo', label: 'Listo' },
  { value: 'entregado', label: 'Entregado' },
]

const MARCAS = ['Babolat', 'Head', 'Wilson', 'Yonex', 'Tecnifibre', 'Prince', 'Dunlop', 'Volkl', 'Otra'].map(m => ({ value: m, label: m }))

function empty() {
  return { cliente_id: '', cuerda_id: '', marca_raqueta: '', modelo_raqueta: '', tension_kg: '', precio: '', estado: 'pendiente', fecha_entrega: '', notas: '' }
}

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([])
  const [clientes, setClientes] = useState([])
  const [cuerdas, setCuerdas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(empty())
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState(null)

  async function load() {
    const [{ data: p }, { data: cl }, { data: cu }] = await Promise.all([
      supabase.from('pedidos').select('*, clientes(nombre), cuerdas(nombre)').order('created_at', { ascending: false }),
      supabase.from('clientes').select('id, nombre').order('nombre'),
      supabase.from('cuerdas').select('id, nombre').order('nombre'),
    ])
    setPedidos(p || [])
    setClientes(cl || [])
    setCuerdas(cu || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function save() {
    if (!form.cliente_id) return alert('Seleccioná un cliente')
    setSaving(true)
    const data = { ...form, tension_kg: form.tension_kg ? Number(form.tension_kg) : null, precio: form.precio ? Number(form.precio) : null }
    if (!data.cuerda_id) data.cuerda_id = null
    if (!data.fecha_entrega) data.fecha_entrega = null
    if (editId) {
      await supabase.from('pedidos').update(data).eq('id', editId)
    } else {
      await supabase.from('pedidos').insert(data)
    }
    setSaving(false)
    setShowForm(false)
    setEditId(null)
    setForm(empty())
    load()
  }

  async function del(id) {
    if (!confirm('¿Eliminar este pedido?')) return
    await supabase.from('pedidos').delete().eq('id', id)
    load()
  }

  function edit(p) {
    setForm({
      cliente_id: p.cliente_id || '',
      cuerda_id: p.cuerda_id || '',
      marca_raqueta: p.marca_raqueta || '',
      modelo_raqueta: p.modelo_raqueta || '',
      tension_kg: p.tension_kg || '',
      precio: p.precio || '',
      estado: p.estado || 'pendiente',
      fecha_entrega: p.fecha_entrega || '',
      notas: p.notas || '',
    })
    setEditId(p.id)
    setShowForm(true)
  }

  const grid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div />
        <Btn variant="primary" onClick={() => { setForm(empty()); setEditId(null); setShowForm(true) }}>+ Nuevo pedido</Btn>
      </div>

      {showForm && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 500, marginBottom: 16 }}>{editId ? 'Editar pedido' : 'Nuevo pedido'}</div>
          <div style={grid}>
            <Select label="Cliente *" value={form.cliente_id} onChange={v => set('cliente_id', v)}
              options={clientes.map(c => ({ value: c.id, label: c.nombre }))} required />
            <Select label="Cuerda" value={form.cuerda_id} onChange={v => set('cuerda_id', v)}
              options={cuerdas.map(c => ({ value: c.id, label: c.nombre }))} />
            <Select label="Marca de raqueta" value={form.marca_raqueta} onChange={v => set('marca_raqueta', v)} options={MARCAS} />
            <Input label="Modelo" value={form.modelo_raqueta} onChange={v => set('modelo_raqueta', v)} placeholder="ej: Pro Staff 97" />
            <Input label="Tensión (kg)" type="number" value={form.tension_kg} onChange={v => set('tension_kg', v)} placeholder="25" />
            <Input label="Precio ($)" type="number" value={form.precio} onChange={v => set('precio', v)} placeholder="8000" />
            <Select label="Estado" value={form.estado} onChange={v => set('estado', v)} options={ESTADOS} />
            <Input label="Fecha de entrega" type="date" value={form.fecha_entrega} onChange={v => set('fecha_entrega', v)} />
            <div style={{ gridColumn: '1/-1' }}>
              <Input label="Notas" value={form.notas} onChange={v => set('notas', v)} placeholder="ej: encordado híbrido..." />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <Btn variant="primary" onClick={save} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Btn>
            <Btn onClick={() => { setShowForm(false); setEditId(null) }}>Cancelar</Btn>
          </div>
        </Card>
      )}

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <Spinner /> : pedidos.length === 0 ? <EmptyState message="No hay pedidos todavía." /> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Cliente', 'Raqueta', 'Cuerda', 'Tensión', 'Precio', 'Estado', 'Entrega', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 500, color: 'var(--text-2)', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pedidos.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '10px 14px', fontWeight: 500 }}>{p.clientes?.nombre || '—'}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-2)' }}>{p.marca_raqueta} {p.modelo_raqueta}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-2)' }}>{p.cuerdas?.nombre || '—'}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-2)' }}>{p.tension_kg ? `${p.tension_kg} kg` : '—'}</td>
                  <td style={{ padding: '10px 14px' }}>{p.precio ? `$${Number(p.precio).toLocaleString('es-AR')}` : '—'}</td>
                  <td style={{ padding: '10px 14px' }}><Badge status={p.estado} /></td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-2)' }}>{p.fecha_entrega ? new Date(p.fecha_entrega + 'T00:00:00').toLocaleDateString('es-AR') : '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => edit(p)} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)' }}>Editar</button>
                      <button onClick={() => del(p.id)} style={{ fontSize: 12, color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)' }}>Borrar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
