'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 診断ページを住宅予算診断ページへリダイレクト
export default function DiagnosisRedirectPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/housing-budget')
  }, [router])
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-xl">リダイレクト中...</p>
    </div>
  )
} 