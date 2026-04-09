import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { Card, Btn, Input, Spinner, EmptyState } from '../components/UI'

function empty() {
  return { nombre: '', telefono: '', email: '', direccion: '', notas: '' }
}

function Avatar({ nombre }) {
  const initials = nombre.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  const colors = ['#e8f0eb', '#eaf2fb', '#faeeda', '#fbeaf0', '#eeedfe']
  const textColors = ['#1a472a', '#1a5276', '#854F0B', '#72243E', '#3C3489']
  const idx = nombre.charCodeAt(0) % 5
  return (
    <div style={{
      width: 38, height: 38, borderRadius: '50%', background: colors[idx],
      color: textColors[idx], display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 600, flexShrink: 0
    }}>{initials}</div>
  )
}

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(empty())
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState(null)
  const [search, setSearch] = useState('')
  const [counts, setCounts] = useState({})

  async function load() {
    const [{ data: cl }, { data: pedidos }] = await Promise.all([
      supabase.from('clientes').select('*').order('nombre'),
      supabase.from('pedidos').select('cliente_id'),
    ])
    setClientes(cl || [])
    const c = {}
    for (const p of pedidos || []) c[p.cliente_id] = (c[p.cliente_id] || 0) + 1
    setCounts(c)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function save() {
    if (!form.nombre) return alert('El nombre es obligatorio')
    setSaving(true)
    if (editId) {
      await supabase.from('clientes').update(form).eq('id', editId)
    } else {
      await supabase.from('clientes').insert(form)
    }
    setSaving(false)
    setShowForm(false)
    setEditId(null)
    setForm(empty())
    load()
  }

  async function del(id) {
    if (!confirm('¿Eliminar este cliente?')) return
    await supabase.from('clientes').delete().eq('id', id)
    load()
  }

  function edit(c) {
    setForm({ nombre: c.nombre || '', telefono: c.telefono || '', email: c.email || '', direccion: c.direccion || '', notas: c.notas || '' })
    setEditId(c.id)
    setShowForm(true)
  }

  const filtered = clientes.filter(c =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (c.telefono || '').includes(search) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  )

  const grid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }

  return (
    <div>
      <div
