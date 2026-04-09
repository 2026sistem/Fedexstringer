import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { Card, Btn, Input, Select, Spinner, EmptyState } from '../components/UI'

const TIPOS = ['Policéster', 'Multifilamento', 'Nylon', 'Kevlar', 'Natural', 'Híbrido'].map(t => ({ value: t, label: t }))
const CALIBRES = ['1.15', '1.18', '1.20', '1.23', '1.25', '1.27', '1.30', '1.35'].map(c => ({ value: c, label: c + ' mm' }))

function empty() { return { nombre: '', marca: '', tipo: '', calibre: '', precio_set: '', stock: '', stock_minimo: '3' } }

function StockBar({ stock, min }) {
  const pct = Math.min(100, (stock / Math.max(min * 3, 1)) * 100)
  const color = stock <= 0 ? '#c0392b' : stock <= min ? '#b7600a' : '#1a472a'
  return (
    <div style={{ width: 80, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2 }} />
    </div>
  )
}

export default function Inventario() {
  const [cuerdas, setCuerdas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(empty())
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState(null)

  async function load() {
    const { data } = await supabase.from('cuerdas').select('*').order('nombre')
    setCuerdas(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function save() {
    if (!form.nombre) return alert('El nombre es obligatorio')
    setSaving(true)
    const data = { ...form, precio_set: form.precio_set ? Number(form.precio_set) : null, stock: Number(form.stock) || 0, stock_minimo: Number(form.stock_minimo) || 3 }
    if (editId) {
      await supabase.from('cuerdas').update(data).eq('id', editId)
    } else {
      await supabase.from('cuerdas').insert(data)
    }
    setSaving(false)
    setShowForm(false)
    setEditId(null)
    setForm(empty())
    load()
  }

  async function del(id) {
    if (!confirm('¿Eliminar esta cuerda?')) return
    await supabase.from('cuerdas').delete().eq('id', id)
    load()
  }

  async function ajustarStock(id, delta) {
    const c = cuerdas.find(c => c.id === id)
    const nuevo = Math.max(0, (c.stock || 0) + delta)
    await supabase.from('cuerdas').update({ stock: nuevo }).eq('id', id)
    load()
  }

  function edit(c) {
    setForm({ nombre: c.nombre || '', marca: c.marca || '', tipo: c.tipo || '', calibre: c.calibre || '', precio_set: c.precio_set || '', stock: c.stock || '', stock_minimo: c.stock_minimo || '3' })
    setEditId(c.id)
    setShowForm(true)
  }

  const bajoStock = cuerdas.filter(c => (c.stock || 0) <= (c.stock_minimo || 3))
  const grid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        {bajoStock.length > 0 ? (
          <div style={{ background: 'var(--warn-light)', color: 'var(--warn)', padding: '8px 14px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500 }}>
            ⚠ {bajoStock.length} {bajoStock.length === 1 ? 'cuerda con stock bajo' : 'cuerdas con stock bajo'}
          </div>
        ) : <div />}
        <Btn variant="primary" onClick={() => { setForm(empty()); setEditId(null); setShowForm(true) }}>+ Agregar cuerda</Btn>
      </div>

      {showForm && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 500, marginBottom: 16 }}>{editId ? 'Editar cuerda' : 'Nueva cuerda'}</div>
          <div style={grid}>
            <Input label="Nombre *" value={form.nombre} onChange={v => set('nombre', v)} placeholder="ALU Power 1.25" required />
            <Input label="Marca" value={form.marca} onChange={v => set('marca', v)} placeholder="Luxilon" />
            <Select label="Tipo" value={form.tipo} onChange={v => set('tipo', v)} options={TIPOS} />
            <Select label="Calibre" value={form.calibre} onChange={v => set('calibre', v)} options={CALIBRES} />
            <Input label="Precio por set ($)" type="number" value={form.precio_set} onChange={v => set('precio_set', v)} placeholder="4500" />
            <Input label="Stock actual (sets)" type="number" value={form.stock} onChange={v => set('stock', v)} placeholder="10" />
            <Input label="Stock mínimo (alerta)" type="number" value={form.stock_minimo} onChange={v => set('stock_minimo', v)} placeholder="3" />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <Btn variant="primary" onClick={save} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Btn>
            <Btn onClick={() => { setShowForm(false); setEditId(null) }}>Cancelar</Btn>
          </div>
        </Card>
      )}

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <Spinner /> : cuerdas.length === 0 ? <EmptyState message="No hay cuerdas en el inventario." /> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Cuerda', 'Tipo', 'Calibre', 'Precio/set', 'Stock', '', ''].map((h, i) => (
                  <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 500, color: 'var(--text-2)', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cuerdas.map(c => {
                const bajo = (c.stock || 0) <= (c.stock_minimo || 3)
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border)', background: bajo ? 'var(--warn-light)' : 'transparent' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 500 }}>{c.nombre}</div>
                      {c.marca && <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{c.marca}</div>}
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-2)' }}>{c.tipo || '—'}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-2)' }}>{c.calibre ? `${c.calibre} mm` : '—'}</td>
                    <td style={{ padding: '10px 14px' }}>{c.precio_set ? `$${Number(c.precio_set).toLocaleString('es-AR')}` : '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 500, color: bajo ? 'var(--warn)' : 'var(--text)' }}>{c.stock || 0} sets</div>
                      <StockBar stock={c.stock || 0} min={c.stock_minimo || 3} />
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button onClick={() => ajustarStock(c.id, -1)} style={{ width: 24, height: 24, borderRadius: 4, border: '1px solid var(--border-strong)', background: 'var(--surface)', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 14 }}>−</button>
                        <button onClick={() => ajustarStock(c.id, 1)} style={{ width: 24, height: 24, borderRadius: 4, border: '1px solid var(--border-strong)', background: 'var(--surface)', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 14 }}>+</button>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => edit(c)} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)' }}>Editar</button>
                        <button onClick={() => del(c.id)} style={{ fontSize: 12, color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)' }}>Borrar</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
