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
      </main>
    </div>
  )
}
