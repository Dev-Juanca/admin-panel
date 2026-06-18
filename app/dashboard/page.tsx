'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User } from '@/lib/supabase'

function getInitials(name: string) {
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

type NoatechRow = {
  id: number
  created_at: string
  nombre: string
  correo: string
  telefono: number
  servicio: string
  comentario: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [activeModule, setActiveModule] = useState<string | null>(null)

  // Noah Tech table state
  const [rows, setRows] = useState<NoatechRow[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [tableError, setTableError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  // Trazzo table state
  const [trazzoRows, setTrazzoRows] = useState<NoatechRow[]>([])
  const [trazzoLoading, setTrazzoLoading] = useState(false)
  const [trazzoDeletingId, setTrazzoDeletingId] = useState<number | null>(null)
  const [trazzoError, setTrazzoError] = useState('')
  const [trazzoConfirmDelete, setTrazzoConfirmDelete] = useState<number | null>(null)

  // Users management state
  const [userRows, setUserRows] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState('')
  const [userConfirmDelete, setUserConfirmDelete] = useState<number | null>(null)
  const [userDeletingId, setUserDeletingId] = useState<number | null>(null)
  const [userTogglingId, setUserTogglingId] = useState<number | null>(null)
  const [showUserForm, setShowUserForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formTelefono, setFormTelefono] = useState('')
  const [formDni, setFormDni] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formError, setFormError] = useState('')
  const [formSaving, setFormSaving] = useState(false)

  // Stats module state
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState('')
  const [noahStats, setNoahStats] = useState<NoatechRow[]>([])
  const [trazzoStats, setTrazzoStats] = useState<NoatechRow[]>([])
  const [usersCountStats, setUsersCountStats] = useState(0)
  const [activeUsersStats, setActiveUsersStats] = useState(0)

  useEffect(() => {
    const stored = sessionStorage.getItem('admin_user')
    if (!stored) { router.replace('/login'); return }
    setUser(JSON.parse(stored))
  }, [router])

  const fetchNoatech = useCallback(async () => {
    setLoadingData(true)
    setTableError('')
    const { data, error } = await supabase
      .from('noahtech')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) { setTableError(error.message); setLoadingData(false); return }
    setRows(data || [])
    setLoadingData(false)
  }, [])

  useEffect(() => {
    if (activeModule === 'noah') fetchNoatech()
  }, [activeModule, fetchNoatech])

  const fetchTrazzo = useCallback(async () => {
    setTrazzoLoading(true)
    setTrazzoError('')
    const { data, error } = await supabase
      .from('tazzo')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) { setTrazzoError(error.message); setTrazzoLoading(false); return }
    setTrazzoRows(data || [])
    setTrazzoLoading(false)
  }, [])

  useEffect(() => {
    if (activeModule === 'trazzo') fetchTrazzo()
  }, [activeModule, fetchTrazzo])

  const handleDeleteTrazzo = async (id: number) => {
    setTrazzoDeletingId(id)
    const { error } = await supabase.from('tazzo').delete().eq('id', id)
    if (error) { setTrazzoError(error.message) }
    else { setTrazzoRows(prev => prev.filter(r => r.id !== id)) }
    setTrazzoDeletingId(null)
    setTrazzoConfirmDelete(null)
  }

  // ── Users CRUD ──
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true)
    setUsersError('')
    const { data, error } = await supabase
      .from('user')
      .select('id, created_at, name, email, telefono, dni, password, activo')
      .order('created_at', { ascending: false })
    if (error) { setUsersError(error.message); setUsersLoading(false); return }
    setUserRows(data || [])
    setUsersLoading(false)
  }, [])

  useEffect(() => {
    if (activeModule === 'users') fetchUsers()
  }, [activeModule, fetchUsers])

  const resetForm = () => {
    setFormName(''); setFormEmail(''); setFormTelefono(''); setFormDni(''); setFormPassword('')
    setFormError(''); setEditingUser(null); setShowUserForm(false)
  }

  const openCreateForm = () => {
    resetForm()
    setShowUserForm(true)
  }

  const openEditForm = (u: User) => {
    setEditingUser(u)
    setFormName(u.name)
    setFormEmail(u.email)
    setFormTelefono(String(u.telefono))
    setFormDni(String(u.dni))
    setFormPassword(u.password)
    setFormError('')
    setShowUserForm(true)
  }

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!formName.trim() || !formEmail.trim() || !formTelefono.trim() || !formDni.trim() || !formPassword.trim()) {
      setFormError('Todos los campos son obligatorios.')
      return
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(formEmail.trim())) {
      setFormError('Ingresa un correo válido.')
      return
    }

    setFormSaving(true)

    if (editingUser) {
      const { error } = await supabase
        .from('user')
        .update({
          name: formName.trim(),
          email: formEmail.toLowerCase().trim(),
          telefono: Number(formTelefono),
          dni: Number(formDni),
          password: formPassword,
        })
        .eq('id', editingUser.id)

      if (error) { setFormError(error.message); setFormSaving(false); return }
    } else {
      const { error } = await supabase
        .from('user')
        .insert({
          name: formName.trim(),
          email: formEmail.toLowerCase().trim(),
          telefono: Number(formTelefono),
          dni: Number(formDni),
          password: formPassword,
          activo: true,
        })

      if (error) { setFormError(error.message); setFormSaving(false); return }
    }

    setFormSaving(false)
    resetForm()
    fetchUsers()
  }

  const handleToggleActive = async (u: User) => {
    setUserTogglingId(u.id)
    const { error } = await supabase
      .from('user')
      .update({ activo: !u.activo })
      .eq('id', u.id)
    if (error) { setUsersError(error.message) }
    else { setUserRows(prev => prev.map(r => r.id === u.id ? { ...r, activo: !r.activo } : r)) }
    setUserTogglingId(null)
  }

  const handleDeleteUser = async (id: number) => {
    setUserDeletingId(id)
    const { error } = await supabase.from('user').delete().eq('id', id)
    if (error) { setUsersError(error.message) }
    else { setUserRows(prev => prev.filter(r => r.id !== id)) }
    setUserDeletingId(null)
    setUserConfirmDelete(null)
  }

  // ── Stats fetch (combines noahtech + tazzo + user) ──
  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    setStatsError('')

    const [noahRes, trazzoRes, userRes] = await Promise.all([
      supabase.from('noahtech').select('*'),
      supabase.from('tazzo').select('*'),
      supabase.from('user').select('id, activo'),
    ])

    if (noahRes.error || trazzoRes.error || userRes.error) {
      setStatsError(noahRes.error?.message || trazzoRes.error?.message || userRes.error?.message || 'Error al cargar estadísticas')
      setStatsLoading(false)
      return
    }

    setNoahStats(noahRes.data || [])
    setTrazzoStats(trazzoRes.data || [])
    setUsersCountStats((userRes.data || []).length)
    setActiveUsersStats((userRes.data || []).filter((u: { activo: boolean }) => u.activo).length)
    setStatsLoading(false)
  }, [])

  useEffect(() => {
    if (activeModule === 'stats') fetchStats()
  }, [activeModule, fetchStats])

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    const { error } = await supabase.from('noahtech').delete().eq('id', id)
    if (error) { setTableError(error.message) }
    else { setRows(prev => prev.filter(r => r.id !== id)) }
    setDeletingId(null)
    setConfirmDelete(null)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('admin_user')
    router.replace('/login')
  }

  if (!user) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '32px', height: '32px', border: '2.5px solid #3B6FFF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const initials = getInitials(user.name)

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)', display: 'flex' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: '272px', minWidth: '272px',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid rgba(0,0,0,0.07)',
        display: 'flex', flexDirection: 'column',
        padding: '1.75rem 1.25rem',
        position: 'sticky', top: 0, height: '100vh',
        boxShadow: '2px 0 12px rgba(0,0,0,0.04)',
      }}>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '2rem', paddingLeft: '0.25rem' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0,
            background: 'linear-gradient(135deg, #3B6FFF, #00B896)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 3px 10px rgba(59,111,255,0.28)',
          }}>
            <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
              <path d="M3 3L9 9M9 9L15 3M9 9L3 15M9 9L15 15" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0F1132' }}>NOAH TECH</span>
        </div>

        {/* User Profile */}
        <div style={{
          background: 'linear-gradient(135deg, #F0F4FF 0%, #F0FBF8 100%)',
          border: '1px solid rgba(59,111,255,0.12)',
          borderRadius: '16px', padding: '1.5rem 1.25rem',
          marginBottom: '1.75rem', textAlign: 'center',
        }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #3B6FFF 0%, #00B896 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            fontSize: '1.55rem', fontWeight: 800, color: 'white',
            boxShadow: '0 4px 18px rgba(59,111,255,0.28)',
          }}>{initials}</div>

          <p style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0F1132', marginBottom: '0.75rem', lineHeight: 1.35, textTransform: 'capitalize' }}>
            {user.name.toLowerCase()}
          </p>
          <div style={{ height: '1px', background: 'rgba(0,0,0,0.07)', margin: '0.75rem 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
            <span style={{ fontSize: '0.7rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>DNI</span>
            <span style={{ fontSize: '0.83rem', color: '#0F1132', fontWeight: 600, fontFamily: 'monospace' }}>{user.dni}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Teléfono</span>
            <span style={{ fontSize: '0.83rem', color: '#0F1132', fontWeight: 600, fontFamily: 'monospace' }}>{user.telefono}</span>
          </div>
        </div>

        {/* Módulos */}
        <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.6rem', paddingLeft: '0.25rem' }}>Módulos</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>

          {/* Noah Tech */}
          <button onClick={() => setActiveModule(activeModule === 'noah' ? null : 'noah')} style={{
            display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1rem',
            background: activeModule === 'noah' ? '#EEF2FF' : 'transparent',
            border: activeModule === 'noah' ? '1.5px solid rgba(59,111,255,0.25)' : '1.5px solid transparent',
            borderRadius: '12px', cursor: 'pointer', transition: 'all 0.18s', textAlign: 'left', width: '100%',
          }}
            onMouseEnter={e => { if (activeModule !== 'noah') (e.currentTarget as HTMLElement).style.background = '#F8F9FC' }}
            onMouseLeave={e => { if (activeModule !== 'noah') (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '9px', flexShrink: 0, background: activeModule === 'noah' ? 'rgba(59,111,255,0.14)' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={activeModule === 'noah' ? '#3B6FFF' : '#6B7280'} strokeWidth="1.8" strokeLinecap="round">
                <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
              </svg>
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: activeModule === 'noah' ? '#3B6FFF' : '#0F1132' }}>Noah Tech</p>
              <p style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: '1px' }}>Tecnología & Servicios</p>
            </div>
          </button>

          {/* Trazzo */}
          <button onClick={() => setActiveModule(activeModule === 'trazzo' ? null : 'trazzo')} style={{
            display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1rem',
            background: activeModule === 'trazzo' ? '#ECFDF8' : 'transparent',
            border: activeModule === 'trazzo' ? '1.5px solid rgba(0,184,150,0.25)' : '1.5px solid transparent',
            borderRadius: '12px', cursor: 'pointer', transition: 'all 0.18s', textAlign: 'left', width: '100%',
          }}
            onMouseEnter={e => { if (activeModule !== 'trazzo') (e.currentTarget as HTMLElement).style.background = '#F8F9FC' }}
            onMouseLeave={e => { if (activeModule !== 'trazzo') (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '9px', flexShrink: 0, background: activeModule === 'trazzo' ? 'rgba(0,184,150,0.13)' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={activeModule === 'trazzo' ? '#00B896' : '#6B7280'} strokeWidth="1.8" strokeLinecap="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: activeModule === 'trazzo' ? '#00B896' : '#0F1132' }}>Trazzo</p>
              <p style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: '1px' }}>Diseño & Marca</p>
            </div>
          </button>

          {/* Estadísticas */}
          <button onClick={() => setActiveModule(activeModule === 'stats' ? null : 'stats')} style={{
            display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1rem',
            background: activeModule === 'stats' ? '#FFF7ED' : 'transparent',
            border: activeModule === 'stats' ? '1.5px solid rgba(251,146,60,0.3)' : '1.5px solid transparent',
            borderRadius: '12px', cursor: 'pointer', transition: 'all 0.18s', textAlign: 'left', width: '100%',
          }}
            onMouseEnter={e => { if (activeModule !== 'stats') (e.currentTarget as HTMLElement).style.background = '#F8F9FC' }}
            onMouseLeave={e => { if (activeModule !== 'stats') (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '9px', flexShrink: 0, background: activeModule === 'stats' ? 'rgba(251,146,60,0.15)' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={activeModule === 'stats' ? '#F97316' : '#6B7280'} strokeWidth="1.8" strokeLinecap="round">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: activeModule === 'stats' ? '#F97316' : '#0F1132' }}>Estadísticas</p>
              <p style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: '1px' }}>Métricas & Reportes</p>
            </div>
          </button>

          {/* Agregar Usuarios */}
          <button onClick={() => setActiveModule(activeModule === 'users' ? null : 'users')} style={{
            display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1rem',
            background: activeModule === 'users' ? '#FDF4FF' : 'transparent',
            border: activeModule === 'users' ? '1.5px solid rgba(168,85,247,0.3)' : '1.5px solid transparent',
            borderRadius: '12px', cursor: 'pointer', transition: 'all 0.18s', textAlign: 'left', width: '100%',
          }}
            onMouseEnter={e => { if (activeModule !== 'users') (e.currentTarget as HTMLElement).style.background = '#F8F9FC' }}
            onMouseLeave={e => { if (activeModule !== 'users') (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '9px', flexShrink: 0, background: activeModule === 'users' ? 'rgba(168,85,247,0.12)' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={activeModule === 'users' ? '#A855F7' : '#6B7280'} strokeWidth="1.8" strokeLinecap="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: activeModule === 'users' ? '#A855F7' : '#0F1132' }}>Agregar Usuarios</p>
              <p style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: '1px' }}>Gestión de accesos</p>
            </div>
          </button>
        </div>

        <div style={{ flex: 1 }} />

        {/* Logout */}
        <button onClick={handleLogout} style={{
          display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.7rem 1rem',
          background: 'transparent', border: '1.5px solid #E5E7EB', borderRadius: '10px',
          cursor: 'pointer', color: '#6B7280', fontSize: '0.85rem', fontWeight: 600,
          transition: 'all 0.18s', width: '100%',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='#FECACA'; (e.currentTarget as HTMLElement).style.color='#DC2626'; (e.currentTarget as HTMLElement).style.background='#FEF2F2' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='#E5E7EB'; (e.currentTarget as HTMLElement).style.color='#6B7280'; (e.currentTarget as HTMLElement).style.background='transparent' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          Cerrar sesión
        </button>
      </aside>

      {/* ── MAIN ── */}
      <main style={{ flex: 1, padding: '2.5rem 2.75rem', overflowY: 'auto' }}>

        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '0.75rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 700, marginBottom: '0.3rem' }}>Bienvenido de vuelta</p>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0F1132', letterSpacing: '-0.03em' }}>Panel de Administración</h1>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Estado del sistema', value: 'Activo', color: '#00B896', bg: '#ECFDF8', border: 'rgba(0,184,150,0.18)' },
            { label: 'Módulos disponibles', value: '2', color: '#3B6FFF', bg: '#EEF2FF', border: 'rgba(59,111,255,0.18)' },
            { label: 'Registros Noah Tech', value: rows.length > 0 ? String(rows.length) : '—', color: '#7C3AED', bg: '#F5F3FF', border: 'rgba(124,58,237,0.15)' },
          ].map(stat => (
            <div key={stat.label} style={{ background: stat.bg, border: `1px solid ${stat.border}`, borderRadius: '14px', padding: '1.25rem 1.5rem' }}>
              <p style={{ fontSize: '0.72rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: '0.4rem' }}>{stat.label}</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: stat.color, letterSpacing: '-0.02em' }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* ── NO MODULE ── */}
        {!activeModule && (
          <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '16px', padding: '3rem 2rem', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3B6FFF" strokeWidth="1.8" strokeLinecap="round">
                <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>
              </svg>
            </div>
            <p style={{ color: '#0F1132', fontWeight: 700, fontSize: '1rem', marginBottom: '0.35rem' }}>Selecciona un módulo</p>
            <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Elige Noah Tech o Trazzo desde el panel izquierdo.</p>
          </div>
        )}

        {/* ── NOAH TECH MODULE ── */}
        {activeModule === 'noah' && (
          <div>
            {/* Header de módulo */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '11px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B6FFF" strokeWidth="1.8" strokeLinecap="round">
                    <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                  </svg>
                </div>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F1132' }}>Noah Tech</h2>
                  <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>Registros de clientes y servicios</p>
                </div>
              </div>
              <button onClick={fetchNoatech} style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.55rem 1rem', background: '#EEF2FF',
                border: '1px solid rgba(59,111,255,0.2)', borderRadius: '8px',
                color: '#3B6FFF', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>
                </svg>
                Actualizar
              </button>
            </div>

            {/* Error */}
            {tableError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#DC2626', fontSize: '0.85rem' }}>
                ⚠️ {tableError}
              </div>
            )}

            {/* Loading */}
            {loadingData && (
              <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '3rem', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ width: '28px', height: '28px', border: '2.5px solid #3B6FFF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.75rem' }} />
                <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Cargando registros...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {/* Tabla */}
            {!loadingData && rows.length === 0 && (
              <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '16px', padding: '3rem', textAlign: 'center' }}>
                <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>No hay registros en la tabla.</p>
              </div>
            )}

            {!loadingData && rows.length > 0 && (
              <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ background: '#F8F9FC', borderBottom: '1px solid #E5E7EB' }}>
                        {['ID', 'Nombre', 'Correo', 'Teléfono', 'Servicio', 'Comentario', 'Fecha', 'Acción'].map(col => (
                          <th key={col} style={{
                            padding: '0.85rem 1rem', textAlign: 'left',
                            fontSize: '0.7rem', fontWeight: 700, color: '#6B7280',
                            textTransform: 'uppercase', letterSpacing: '0.07em',
                            whiteSpace: 'nowrap',
                          }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={row.id} style={{ borderBottom: i < rows.length - 1 ? '1px solid #F3F4F6' : 'none', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FAFBFF'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                        >
                          <td style={{ padding: '1rem', color: '#9CA3AF', fontFamily: 'monospace', fontSize: '0.8rem' }}>#{row.id}</td>
                          <td style={{ padding: '1rem', fontWeight: 600, color: '#0F1132', whiteSpace: 'nowrap' }}>{row.nombre}</td>
                          <td style={{ padding: '1rem', color: '#3B6FFF' }}>
                            <a href={`mailto:${row.correo}`} style={{ color: '#3B6FFF', textDecoration: 'none' }}>{row.correo}</a>
                          </td>
                          <td style={{ padding: '1rem', color: '#374151', fontFamily: 'monospace' }}>{row.telefono}</td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{
                              display: 'inline-block', padding: '0.25rem 0.65rem',
                              background: '#EEF2FF', color: '#3B6FFF',
                              borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                            }}>{row.servicio}</span>
                          </td>
                          <td style={{ padding: '1rem', color: '#6B7280', maxWidth: '200px' }}>
                            <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.comentario}>
                              {row.comentario}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', color: '#9CA3AF', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{formatDate(row.created_at)}</td>
                          <td style={{ padding: '1rem' }}>
                            {confirmDelete === row.id ? (
                              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                <button onClick={() => handleDelete(row.id)} disabled={deletingId === row.id} style={{
                                  padding: '0.35rem 0.7rem', background: '#DC2626', border: 'none',
                                  borderRadius: '6px', color: 'white', fontSize: '0.75rem', fontWeight: 700,
                                  cursor: 'pointer',
                                }}>
                                  {deletingId === row.id ? '...' : 'Sí'}
                                </button>
                                <button onClick={() => setConfirmDelete(null)} style={{
                                  padding: '0.35rem 0.7rem', background: '#F3F4F6', border: 'none',
                                  borderRadius: '6px', color: '#374151', fontSize: '0.75rem', fontWeight: 700,
                                  cursor: 'pointer',
                                }}>No</button>
                              </div>
                            ) : (
                              <button onClick={() => setConfirmDelete(row.id)} style={{
                                display: 'flex', alignItems: 'center', gap: '0.35rem',
                                padding: '0.45rem 0.75rem',
                                background: '#FEF2F2', border: '1px solid #FECACA',
                                borderRadius: '8px', color: '#DC2626',
                                fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                                transition: 'all 0.15s', whiteSpace: 'nowrap',
                              }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#DC2626'; (e.currentTarget as HTMLElement).style.color = 'white' }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#FEF2F2'; (e.currentTarget as HTMLElement).style.color = '#DC2626' }}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                                </svg>
                                Eliminar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer de tabla */}
                <div style={{ padding: '0.85rem 1rem', background: '#F8F9FC', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: '#9CA3AF', fontWeight: 500 }}>
                    {rows.length} registro{rows.length !== 1 ? 's' : ''} en total
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>Tabla: noahtech</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TRAZZO MODULE ── */}
        {activeModule === 'trazzo' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '11px', background: '#ECFDF8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00B896" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F1132' }}>Trazzo</h2>
                  <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>Registros de clientes y servicios</p>
                </div>
              </div>
              <button onClick={fetchTrazzo} style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.55rem 1rem', background: '#ECFDF8',
                border: '1px solid rgba(0,184,150,0.25)', borderRadius: '8px',
                color: '#00B896', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>
                </svg>
                Actualizar
              </button>
            </div>

            {trazzoError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#DC2626', fontSize: '0.85rem' }}>
                ⚠️ {trazzoError}
              </div>
            )}

            {trazzoLoading && (
              <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '3rem', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ width: '28px', height: '28px', border: '2.5px solid #00B896', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.75rem' }} />
                <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Cargando registros...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {!trazzoLoading && trazzoRows.length === 0 && (
              <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '16px', padding: '3rem', textAlign: 'center' }}>
                <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>No hay registros en la tabla.</p>
              </div>
            )}

            {!trazzoLoading && trazzoRows.length > 0 && (
              <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,184,150,0.15)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,184,150,0.07)' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ background: '#F0FBF8', borderBottom: '1px solid #D1FAF0' }}>
                        {['ID', 'Nombre', 'Correo', 'Teléfono', 'Servicio', 'Comentario', 'Fecha', 'Acción'].map(col => (
                          <th key={col} style={{
                            padding: '0.85rem 1rem', textAlign: 'left',
                            fontSize: '0.7rem', fontWeight: 700, color: '#059669',
                            textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap',
                          }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {trazzoRows.map((row, i) => (
                        <tr key={row.id} style={{ borderBottom: i < trazzoRows.length - 1 ? '1px solid #F3F4F6' : 'none', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F0FBF8'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                        >
                          <td style={{ padding: '1rem', color: '#9CA3AF', fontFamily: 'monospace', fontSize: '0.8rem' }}>#{row.id}</td>
                          <td style={{ padding: '1rem', fontWeight: 600, color: '#0F1132', whiteSpace: 'nowrap' }}>{row.nombre}</td>
                          <td style={{ padding: '1rem', color: '#00B896' }}>
                            <a href={`mailto:${row.correo}`} style={{ color: '#00B896', textDecoration: 'none' }}>{row.correo}</a>
                          </td>
                          <td style={{ padding: '1rem', color: '#374151', fontFamily: 'monospace' }}>{row.telefono}</td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{
                              display: 'inline-block', padding: '0.25rem 0.65rem',
                              background: '#ECFDF8', color: '#00B896',
                              borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                            }}>{row.servicio}</span>
                          </td>
                          <td style={{ padding: '1rem', color: '#6B7280', maxWidth: '200px' }}>
                            <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.comentario}>
                              {row.comentario}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', color: '#9CA3AF', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{formatDate(row.created_at)}</td>
                          <td style={{ padding: '1rem' }}>
                            {trazzoConfirmDelete === row.id ? (
                              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                <button onClick={() => handleDeleteTrazzo(row.id)} disabled={trazzoDeletingId === row.id} style={{
                                  padding: '0.35rem 0.7rem', background: '#DC2626', border: 'none',
                                  borderRadius: '6px', color: 'white', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                                }}>
                                  {trazzoDeletingId === row.id ? '...' : 'Sí'}
                                </button>
                                <button onClick={() => setTrazzoConfirmDelete(null)} style={{
                                  padding: '0.35rem 0.7rem', background: '#F3F4F6', border: 'none',
                                  borderRadius: '6px', color: '#374151', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                                }}>No</button>
                              </div>
                            ) : (
                              <button onClick={() => setTrazzoConfirmDelete(row.id)} style={{
                                display: 'flex', alignItems: 'center', gap: '0.35rem',
                                padding: '0.45rem 0.75rem',
                                background: '#FEF2F2', border: '1px solid #FECACA',
                                borderRadius: '8px', color: '#DC2626',
                                fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                                transition: 'all 0.15s', whiteSpace: 'nowrap',
                              }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#DC2626'; (e.currentTarget as HTMLElement).style.color = 'white' }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#FEF2F2'; (e.currentTarget as HTMLElement).style.color = '#DC2626' }}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                                </svg>
                                Eliminar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: '0.85rem 1rem', background: '#F0FBF8', borderTop: '1px solid #D1FAF0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: '#6B7280', fontWeight: 500 }}>
                    {trazzoRows.length} registro{trazzoRows.length !== 1 ? 's' : ''} en total
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>Tabla: tazzo</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ESTADÍSTICAS MODULE ── */}
        {activeModule === 'stats' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '11px', background: 'rgba(251,146,60,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="1.8" strokeLinecap="round">
                    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
                  </svg>
                </div>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F1132' }}>Estadísticas</h2>
                  <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>Métricas & Reportes generales</p>
                </div>
              </div>
              <button onClick={fetchStats} style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.55rem 1rem', background: '#FFF7ED',
                border: '1px solid rgba(251,146,60,0.25)', borderRadius: '8px',
                color: '#F97316', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>
                </svg>
                Actualizar
              </button>
            </div>

            {statsError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#DC2626', fontSize: '0.85rem' }}>
                ⚠️ {statsError}
              </div>
            )}

            {statsLoading && (
              <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '3rem', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ width: '28px', height: '28px', border: '2.5px solid #F97316', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.75rem' }} />
                <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Calculando estadísticas...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {!statsLoading && (() => {
              const allServices = [...noahStats, ...trazzoStats]
              const serviceCounts: Record<string, number> = {}
              allServices.forEach(s => {
                const key = (s.servicio || 'Sin especificar').trim()
                serviceCounts[key] = (serviceCounts[key] || 0) + 1
              })
              const sortedServices = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])
              const maxCount = sortedServices.length > 0 ? sortedServices[0][1] : 0
              const totalRegistros = allServices.length
              const topService = sortedServices.length > 0 ? sortedServices[0][0] : 'N/A'

              const noahServiceCounts: Record<string, number> = {}
              noahStats.forEach(s => {
                const key = (s.servicio || 'Sin especificar').trim()
                noahServiceCounts[key] = (noahServiceCounts[key] || 0) + 1
              })
              const trazzoServiceCounts: Record<string, number> = {}
              trazzoStats.forEach(s => {
                const key = (s.servicio || 'Sin especificar').trim()
                trazzoServiceCounts[key] = (trazzoServiceCounts[key] || 0) + 1
              })

              const palette = ['#F97316', '#3B6FFF', '#00B896', '#A855F7', '#EC4899', '#06B6D4', '#EAB308', '#6366F1']

              return (
                <div>
                  {/* KPI Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    {[
                      { label: 'Total de registros', value: String(totalRegistros), color: '#F97316', bg: '#FFF7ED', border: 'rgba(251,146,60,0.18)' },
                      { label: 'Servicio más popular', value: topService, color: '#3B6FFF', bg: '#EEF2FF', border: 'rgba(59,111,255,0.18)', small: true },
                      { label: 'Usuarios del panel', value: String(usersCountStats), color: '#A855F7', bg: '#FAF5FF', border: 'rgba(168,85,247,0.18)' },
                      { label: 'Usuarios activos', value: String(activeUsersStats), color: '#00B896', bg: '#ECFDF8', border: 'rgba(0,184,150,0.18)' },
                    ].map(stat => (
                      <div key={stat.label} style={{ background: stat.bg, border: `1px solid ${stat.border}`, borderRadius: '14px', padding: '1.25rem 1.4rem' }}>
                        <p style={{ fontSize: '0.7rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: '0.5rem' }}>{stat.label}</p>
                        <p style={{ fontSize: stat.small ? '1.15rem' : '1.5rem', fontWeight: 800, color: stat.color, letterSpacing: '-0.02em', textTransform: stat.small ? 'capitalize' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Ranking de servicios */}
                  <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '16px', padding: '1.75rem', marginBottom: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F1132', marginBottom: '0.3rem' }}>Servicios más contratados</h3>
                    <p style={{ fontSize: '0.78rem', color: '#9CA3AF', marginBottom: '1.5rem' }}>Combinando registros de Noah Tech y Trazzo</p>

                    {sortedServices.length === 0 ? (
                      <p style={{ color: '#6B7280', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>Aún no hay datos suficientes.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                        {sortedServices.map(([service, count], idx) => (
                          <div key={service}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                  width: '20px', height: '20px', borderRadius: '50%',
                                  background: idx === 0 ? '#FEF3C7' : '#F3F4F6',
                                  color: idx === 0 ? '#B45309' : '#9CA3AF',
                                  fontSize: '0.7rem', fontWeight: 800,
                                }}>{idx + 1}</span>
                                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F1132', textTransform: 'capitalize' }}>{service}</span>
                              </div>
                              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#6B7280' }}>{count} contratación{count !== 1 ? 'es' : ''}</span>
                            </div>
                            <div style={{ width: '100%', height: '10px', background: '#F3F4F6', borderRadius: '6px', overflow: 'hidden' }}>
                              <div style={{
                                height: '100%',
                                width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%`,
                                background: palette[idx % palette.length],
                                borderRadius: '6px',
                                transition: 'width 0.4s ease',
                              }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Comparativa por módulo */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    {/* Noah Tech breakdown */}
                    <div style={{ background: '#FFFFFF', border: '1px solid rgba(59,111,255,0.15)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(59,111,255,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B6FFF' }} />
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F1132' }}>Noah Tech</h4>
                        <span style={{ fontSize: '0.78rem', color: '#9CA3AF', marginLeft: 'auto' }}>{noahStats.length} registros</span>
                      </div>
                      {Object.keys(noahServiceCounts).length === 0 ? (
                        <p style={{ color: '#9CA3AF', fontSize: '0.82rem' }}>Sin registros aún.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {Object.entries(noahServiceCounts).sort((a, b) => b[1] - a[1]).map(([service, count]) => (
                            <div key={service} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.82rem', color: '#374151', textTransform: 'capitalize' }}>{service}</span>
                              <span style={{
                                fontSize: '0.75rem', fontWeight: 700, color: '#3B6FFF',
                                background: '#EEF2FF', padding: '0.15rem 0.55rem', borderRadius: '20px',
                              }}>{count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Trazzo breakdown */}
                    <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,184,150,0.15)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,184,150,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00B896' }} />
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F1132' }}>Trazzo</h4>
                        <span style={{ fontSize: '0.78rem', color: '#9CA3AF', marginLeft: 'auto' }}>{trazzoStats.length} registros</span>
                      </div>
                      {Object.keys(trazzoServiceCounts).length === 0 ? (
                        <p style={{ color: '#9CA3AF', fontSize: '0.82rem' }}>Sin registros aún.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {Object.entries(trazzoServiceCounts).sort((a, b) => b[1] - a[1]).map(([service, count]) => (
                            <div key={service} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.82rem', color: '#374151', textTransform: 'capitalize' }}>{service}</span>
                              <span style={{
                                fontSize: '0.75rem', fontWeight: 700, color: '#00B896',
                                background: '#ECFDF8', padding: '0.15rem 0.55rem', borderRadius: '20px',
                              }}>{count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* \u2500\u2500 USUARIOS MODULE \u2500\u2500 */}
        {activeModule === 'users' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '11px', background: 'rgba(168,85,247,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                  </svg>
                </div>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F1132' }}>Agregar Usuarios</h2>
                  <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>Gesti\u00f3n de accesos al panel</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button onClick={fetchUsers} style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.55rem 1rem', background: '#FDF4FF',
                  border: '1px solid rgba(168,85,247,0.2)', borderRadius: '8px',
                  color: '#A855F7', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>
                  </svg>
                  Actualizar
                </button>
                <button onClick={openCreateForm} style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.55rem 1.1rem', background: 'linear-gradient(135deg, #A855F7, #9333EA)',
                  border: 'none', borderRadius: '8px',
                  color: 'white', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 3px 12px rgba(168,85,247,0.3)',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Nuevo usuario
                </button>
              </div>
            </div>

            {usersError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#DC2626', fontSize: '0.85rem' }}>
                \u26a0\ufe0f {usersError}
              </div>
            )}

            {/* ── Formulario crear/editar ── */}
            {showUserForm && (
              <div style={{
                background: '#FFFFFF', border: '1.5px solid rgba(168,85,247,0.25)',
                borderRadius: '16px', padding: '1.75rem', marginBottom: '1.25rem',
                boxShadow: '0 4px 20px rgba(168,85,247,0.1)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F1132' }}>
                    {editingUser ? 'Editar usuario' : 'Nuevo usuario'}
                  </h3>
                  <button onClick={resetForm} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '0.25rem' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSaveUser}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#6B7280', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Nombre completo</label>
                      <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Juan P\u00e9rez"
                        style={{ width: '100%', padding: '0.65rem 0.9rem', background: '#F8F9FC', border: '1.5px solid #E5E7EB', borderRadius: '9px', color: '#0F1132', fontSize: '0.9rem', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#6B7280', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Correo electr\u00f3nico</label>
                      <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="correo@ejemplo.com"
                        style={{ width: '100%', padding: '0.65rem 0.9rem', background: '#F8F9FC', border: '1.5px solid #E5E7EB', borderRadius: '9px', color: '#0F1132', fontSize: '0.9rem', outline: 'none' }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#6B7280', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tel\u00e9fono</label>
                      <input type="tel" value={formTelefono} onChange={e => setFormTelefono(e.target.value.replace(/\D/g, ''))} placeholder="987654321"
                        style={{ width: '100%', padding: '0.65rem 0.9rem', background: '#F8F9FC', border: '1.5px solid #E5E7EB', borderRadius: '9px', color: '#0F1132', fontSize: '0.9rem', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#6B7280', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>DNI</label>
                      <input type="text" value={formDni} onChange={e => setFormDni(e.target.value.replace(/\D/g, ''))} placeholder="12345678"
                        style={{ width: '100%', padding: '0.65rem 0.9rem', background: '#F8F9FC', border: '1.5px solid #E5E7EB', borderRadius: '9px', color: '#0F1132', fontSize: '0.9rem', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#6B7280', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Contrase\u00f1a</label>
                      <input type="text" value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder="••••••••"
                        style={{ width: '100%', padding: '0.65rem 0.9rem', background: '#F8F9FC', border: '1.5px solid #E5E7EB', borderRadius: '9px', color: '#0F1132', fontSize: '0.9rem', outline: 'none' }} />
                    </div>
                  </div>

                  {formError && (
                    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '0.6rem 0.85rem', marginBottom: '1rem', color: '#DC2626', fontSize: '0.82rem' }}>
                      {formError}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <button type="submit" disabled={formSaving} style={{
                      padding: '0.65rem 1.4rem', background: formSaving ? '#D8B4FE' : 'linear-gradient(135deg, #A855F7, #9333EA)',
                      border: 'none', borderRadius: '9px', color: 'white', fontWeight: 700, fontSize: '0.85rem',
                      cursor: formSaving ? 'not-allowed' : 'pointer', boxShadow: formSaving ? 'none' : '0 3px 12px rgba(168,85,247,0.3)',
                    }}>
                      {formSaving ? 'Guardando...' : editingUser ? 'Guardar cambios' : 'Crear usuario'}
                    </button>
                    <button type="button" onClick={resetForm} style={{
                      padding: '0.65rem 1.4rem', background: '#F3F4F6', border: 'none',
                      borderRadius: '9px', color: '#374151', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                    }}>
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {usersLoading && (
              <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '3rem', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ width: '28px', height: '28px', border: '2.5px solid #A855F7', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.75rem' }} />
                <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Cargando usuarios...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {!usersLoading && userRows.length === 0 && (
              <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '16px', padding: '3rem', textAlign: 'center' }}>
                <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>No hay usuarios registrados.</p>
              </div>
            )}

            {!usersLoading && userRows.length > 0 && (
              <div style={{ background: '#FFFFFF', border: '1px solid rgba(168,85,247,0.15)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 16px rgba(168,85,247,0.07)' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ background: '#FAF5FF', borderBottom: '1px solid #F3E8FF' }}>
                        {['ID', 'Nombre', 'Correo', 'Tel\u00e9fono', 'DNI', 'Estado', 'Acciones'].map(col => (
                          <th key={col} style={{
                            padding: '0.85rem 1rem', textAlign: 'left',
                            fontSize: '0.7rem', fontWeight: 700, color: '#9333EA',
                            textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap',
                          }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {userRows.map((u, i) => (
                        <tr key={u.id} style={{ borderBottom: i < userRows.length - 1 ? '1px solid #F3F4F6' : 'none', transition: 'background 0.15s', opacity: u.activo ? 1 : 0.55 }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FAF5FF'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                        >
                          <td style={{ padding: '1rem', color: '#9CA3AF', fontFamily: 'monospace', fontSize: '0.8rem' }}>#{u.id}</td>
                          <td style={{ padding: '1rem', fontWeight: 600, color: '#0F1132', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>{u.name.toLowerCase()}</td>
                          <td style={{ padding: '1rem', color: '#A855F7' }}>
                            <a href={`mailto:${u.email}`} style={{ color: '#A855F7', textDecoration: 'none' }}>{u.email}</a>
                          </td>
                          <td style={{ padding: '1rem', color: '#374151', fontFamily: 'monospace' }}>{u.telefono}</td>
                          <td style={{ padding: '1rem', color: '#374151', fontFamily: 'monospace' }}>{u.dni}</td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                              padding: '0.3rem 0.7rem',
                              background: u.activo ? '#ECFDF8' : '#FEF2F2',
                              color: u.activo ? '#00B896' : '#DC2626',
                              borderRadius: '20px', fontSize: '0.74rem', fontWeight: 700,
                            }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: u.activo ? '#00B896' : '#DC2626' }} />
                              {u.activo ? 'Activo' : 'Bloqueado'}
                            </span>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            {userConfirmDelete === u.id ? (
                              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.78rem', color: '#6B7280', marginRight: '0.2rem' }}>¿Eliminar?</span>
                                <button onClick={() => handleDeleteUser(u.id)} disabled={userDeletingId === u.id} style={{
                                  padding: '0.35rem 0.7rem', background: '#DC2626', border: 'none',
                                  borderRadius: '6px', color: 'white', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                                }}>
                                  {userDeletingId === u.id ? '...' : 'S\u00ed'}
                                </button>
                                <button onClick={() => setUserConfirmDelete(null)} style={{
                                  padding: '0.35rem 0.7rem', background: '#F3F4F6', border: 'none',
                                  borderRadius: '6px', color: '#374151', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                                }}>No</button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                {/* Editar */}
                                <button onClick={() => openEditForm(u)} title="Editar" style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  width: '32px', height: '32px',
                                  background: '#EEF2FF', border: '1px solid rgba(59,111,255,0.2)',
                                  borderRadius: '8px', color: '#3B6FFF', cursor: 'pointer', transition: 'all 0.15s',
                                }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#3B6FFF'; (e.currentTarget as HTMLElement).style.color = 'white' }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#EEF2FF'; (e.currentTarget as HTMLElement).style.color = '#3B6FFF' }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                  </svg>
                                </button>

                                {/* Bloquear/Desbloquear */}
                                <button onClick={() => handleToggleActive(u)} disabled={userTogglingId === u.id} title={u.activo ? 'Bloquear' : 'Desbloquear'} style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  width: '32px', height: '32px',
                                  background: u.activo ? '#FFF7ED' : '#ECFDF8',
                                  border: u.activo ? '1px solid rgba(251,146,60,0.25)' : '1px solid rgba(0,184,150,0.25)',
                                  borderRadius: '8px', color: u.activo ? '#F97316' : '#00B896',
                                  cursor: userTogglingId === u.id ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
                                }}
                                  onMouseEnter={e => { if (userTogglingId !== u.id) { (e.currentTarget as HTMLElement).style.background = u.activo ? '#F97316' : '#00B896'; (e.currentTarget as HTMLElement).style.color = 'white' } }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = u.activo ? '#FFF7ED' : '#ECFDF8'; (e.currentTarget as HTMLElement).style.color = u.activo ? '#F97316' : '#00B896' }}
                                >
                                  {u.activo ? (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                                    </svg>
                                  ) : (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 019.9-1"/>
                                    </svg>
                                  )}
                                </button>

                                {/* Eliminar */}
                                <button onClick={() => setUserConfirmDelete(u.id)} title="Eliminar" style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  width: '32px', height: '32px',
                                  background: '#FEF2F2', border: '1px solid #FECACA',
                                  borderRadius: '8px', color: '#DC2626', cursor: 'pointer', transition: 'all 0.15s',
                                }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#DC2626'; (e.currentTarget as HTMLElement).style.color = 'white' }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#FEF2F2'; (e.currentTarget as HTMLElement).style.color = '#DC2626' }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                                  </svg>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: '0.85rem 1rem', background: '#FAF5FF', borderTop: '1px solid #F3E8FF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: '#6B7280', fontWeight: 500 }}>
                    {userRows.length} usuario{userRows.length !== 1 ? 's' : ''} en total
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>Tabla: user</span>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
