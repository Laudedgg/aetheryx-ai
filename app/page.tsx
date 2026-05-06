'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Nav from '@/components/landing/Nav'
import Hero from '@/components/landing/Hero'
import Marquee from '@/components/landing/Marquee'
import Quote from '@/components/landing/Quote'
import CTA from '@/components/landing/CTA'
import Footer from '@/components/landing/Footer'

const ACCESS_CODE = 'AETHERYX'

export default function LandingPage() {
  return (
    <Suspense fallback={null}>
      <LandingPageInner />
    </Suspense>
  )
}

function LandingPageInner() {
  const [accessOpen, setAccessOpen] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('access') === 'required') setAccessOpen(true)
  }, [searchParams])

  const openAccess = () => setAccessOpen(true)

  return (
    <>
      <div className="atmos" />
      <div className="grain" />
      <div className="scanlines" />
      <div className="vignette" />

      <Nav onRequestAccess={openAccess} />
      <Hero onRequestAccess={openAccess} />
      <Marquee />
      <Quote />
      <CTA onRequestAccess={openAccess} />
      <Footer />

      {accessOpen && <RequestAccessModal onClose={() => setAccessOpen(false)} />}
    </>
  )
}

function RequestAccessModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = () => {
    if (submitting) return
    const entered = code.trim().toUpperCase()
    if (entered.length !== 8) {
      setError('Access code must be 8 characters.')
      return
    }
    setSubmitting(true)
    setError('')
    if (entered === ACCESS_CODE) {
      try {
        localStorage.setItem('aetheryx_access', '1')
        document.cookie = `aetheryx_access=1; path=/; max-age=2592000; SameSite=Lax`
      } catch {}
      setTimeout(() => router.push('/dashboard'), 200)
    } else {
      setTimeout(() => {
        setError('Invalid access code. Please check your invite email.')
        setSubmitting(false)
      }, 300)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-5"
      style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl p-7 sm:p-8 relative"
        style={{ background: '#0c1120', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(138,108,255,0.10)' }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/[0.06] transition-colors" aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wide mb-4" style={{ background: 'rgba(138,108,255,0.10)', color: '#B79CFF', border: '1px solid rgba(138,108,255,0.22)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#B79CFF' }} />
            Private Beta
          </div>
          <h2 className="text-[24px] sm:text-[28px] font-bold tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>Request Access</h2>
          <p className="text-[13px] mt-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Enter your 8-character access code to enter the dashboard.
          </p>
        </div>

        <div className="space-y-3">
          <label className="block text-[11px] font-semibold tracking-wide" style={{ color: 'rgba(255,255,255,0.55)' }}>ACCESS CODE</label>
          <input
            autoFocus
            value={code}
            onChange={e => {
              setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))
              if (error) setError('')
            }}
            onKeyDown={e => { if (e.key === 'Enter') submit() }}
            placeholder="XXXXXXXX"
            maxLength={8}
            className="w-full h-14 text-center text-[20px] font-mono font-semibold tracking-[0.5em] rounded-xl outline-none transition-colors"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: error ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
            }}
          />

          {error && (
            <div className="flex items-center gap-2 text-[12px]" style={{ color: '#f87171' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
              </svg>
              {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={code.length !== 8 || submitting}
            className="w-full h-12 rounded-xl text-[14px] font-semibold text-white transition-all hover:shadow-[0_0_24px_rgba(138,108,255,0.3)] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
            style={{ background: '#8A6CFF' }}
          >
            {submitting ? 'Verifying…' : 'Enter Dashboard →'}
          </button>
        </div>

        <div className="mt-6 pt-5 flex items-center justify-between text-[11px]" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}>
          <span>Don&apos;t have a code?</span>
          <a href="mailto:bas.ai.agents@gmail.com?subject=Aetheryx%20Access%20Request" className="font-semibold transition-colors" style={{ color: '#B79CFF' }}>
            Request invite →
          </a>
        </div>
      </div>
    </div>
  )
}
