import React from 'react'
import { prisma } from '../../../prisma/client'
import EditableTable from './editable-table'

export default async function ProvincesPage() {
  const provinces = await prisma.province.findMany({
    orderBy: { id: 'asc' },
    select: {
      id: true,
      nameTh: true,
      nameEn: true,
    },
  })

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-200 text-emerald-950">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 pb-10 pt-6 lg:gap-8 lg:pt-10">
        <header className="flex flex-col gap-2 border-b border-emerald-200 pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Admin
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-emerald-950 sm:text-3xl">
            Provinces
          </h1>
          <p className="text-sm text-emerald-900/80">
            Inline edit with Server Actions + Optimistic UI
          </p>
        </header>

        <EditableTable initialProvinces={provinces} />
      </div>
    </main>
  )
}
