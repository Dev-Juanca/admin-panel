'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: dbError } = await supabase
        .from('user')
        .select('id, name, email, telefono, dni, password, activo')
        .ilike('email', email.trim())

      if (dbError) {
        setError(`Error de base de datos: ${dbError.message}`)
        setLoading(false)
        return
      }

      if (!data || data.length === 0) {
        setError('Correo o contraseña incorrectos.')
        setLoading(false)
        return
      }

      const user = data[0]
      if (user.password !== password) {
        setError('Correo o contraseña incorrectos.')
        setLoading(false)
        return
      }

      if (user.activo === false) {
        setError('Tu cuenta ha sido bloqueada. Contacta al administrador.')
        setLoading(false)
        return
      }

      const { password: _pwd, ...safeUser } = user
      sessionStorage.setItem('admin_user', JSON.stringify(safeUser))

      // Registrar log de inicio de sesión
      const { createClient } = await import('@supabase/supabase-js')
      const sb = createClient('https://hrlxefaateuseotgnogw.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybHhlZmFhdGV1c2VvdGdub2d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMzgxMzIsImV4cCI6MjA5NjkxNDEzMn0.d-mPJM9UZAnuaXmLt10G353j5mH8Q6-7-YHfOKy4zXM')
      await sb.from('logs').insert({
        tipo: 'accion',
        accion: 'Inicio de sesión',
        descripcion: `El usuario "${safeUser.name}" inició sesión correctamente`,
        admin_nombre: safeUser.name,
        modulo: 'login',
        resultado: 'éxito'
      })

      router.push('/dashboard')
    } catch (err) {
      console.error(err)
      setError('Error inesperado. Revisa la consola.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-main)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem',
      backgroundImage: 'radial-gradient(circle at 60% 20%, rgba(59,111,255,0.08) 0%, transparent 55%), radial-gradient(circle at 10% 80%, rgba(0,184,150,0.07) 0%, transparent 45%)',
    }}>

      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '0.4rem' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '11px',
              background: 'linear-gradient(135deg, #3B6FFF, #00B896)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(59,111,255,0.3)',
            }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 3L9 9M9 9L15 3M9 9L3 15M9 9L15 15" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#0F1132' }}>
              NOAH TECH
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Panel de Administración
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid rgba(0,0,0,0.07)',
          borderRadius: '22px',
          padding: '2.25rem',
          boxShadow: '0 8px 40px rgba(0,0,0,0.09)',
        }}>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.3rem', color: '#0F1132', letterSpacing: '-0.02em' }}>
            Iniciar sesión
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
            Ingresa tus credenciales de acceso
          </p>

          <form onSubmit={handleLogin} noValidate>
            {/* Email */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                required
                autoComplete="email"
                style={{
                  width: '100%', padding: '0.75rem 1rem',
                  background: '#F8F9FC',
                  border: '1.5px solid #E5E7EB',
                  borderRadius: '10px',
                  color: '#0F1132',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#3B6FFF'
                  e.target.style.boxShadow = '0 0 0 3px rgba(59,111,255,0.12)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#E5E7EB'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                style={{
                  width: '100%', padding: '0.75rem 1rem',
                  background: '#F8F9FC',
                  border: '1.5px solid #E5E7EB',
                  borderRadius: '10px',
                  color: '#0F1132',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#3B6FFF'
                  e.target.style.boxShadow = '0 0 0 3px rgba(59,111,255,0.12)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#E5E7EB'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '8px',
                padding: '0.65rem 0.9rem',
                marginBottom: '1.25rem',
                color: '#DC2626',
                fontSize: '0.85rem',
                display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="#DC2626" strokeWidth="1.5"/>
                  <path d="M7 4v3.5M7 9.5v.5" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '0.875rem',
                background: loading ? '#93AEFF' : 'linear-gradient(135deg, #3B6FFF, #2952CC)',
                border: 'none', borderRadius: '10px',
                color: 'white', fontWeight: 700, fontSize: '0.95rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 4px 18px rgba(59,111,255,0.35)',
                letterSpacing: '0.01em',
              }}
            >
              {loading ? 'Verificando...' : 'Ingresar al panel'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '0.78rem', marginTop: '1.5rem' }}>
          NOAH TECH · TRAZZO © 2026
        </p>
      </div>
    </div>
  )
}

