'use client'

import React, { useOptimistic, useTransition } from 'react'
import { updateProvinceCell } from './actions'

type ProvinceRow = {
  id: number
  nameTh: string
  nameEn: string
}

type Props = {
  initialProvinces: ProvinceRow[]
}

export default function EditableTable({ initialProvinces }: Props) {
  const [provinces, setOptimisticProvinces] = useOptimistic(
    initialProvinces,
    (state: ProvinceRow[], updated: Partial<ProvinceRow> & { id: number }) => {
      return state.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
    },
  )

  const [isPending, startTransition] = useTransition()

  const handleUpdate = (
    id: number,
    field: 'nameTh' | 'nameEn',
    newValue: string,
  ) => {
    const current = provinces.find((p) => p.id === id)
    if (!current || current[field] === newValue) return

    const optimisticData = { id, [field]: newValue } as Partial<ProvinceRow> & {
      id: number
    }

    startTransition(async () => {
      setOptimisticProvinces(optimisticData)
      const result = await updateProvinceCell(id, field, newValue)
      if (!result.success) {
        alert(`Save failed: ${result.error}`)
      }
    })
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-emerald-200 bg-white/95">
      <div className="flex items-center justify-between border-b border-emerald-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-emerald-950">Provinces</h2>
        <span className="text-xs text-emerald-800">
          {isPending ? 'Saving...' : 'Synced'}
        </span>
      </div>
      <table className="min-w-full divide-y divide-emerald-100 text-sm">
        <thead className="bg-emerald-100">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-emerald-900">ID</th>
            <th className="px-4 py-3 text-left font-medium text-emerald-900">Name (TH)</th>
            <th className="px-4 py-3 text-left font-medium text-emerald-900">Name (EN)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-emerald-100 bg-white">
          {provinces.map((p) => (
            <tr key={p.id} className="hover:bg-emerald-50">
              <td className="px-4 py-3 text-emerald-950">{p.id}</td>
              <td className="px-4 py-3">
                <input
                  defaultValue={p.nameTh}
                  onBlur={(e) => handleUpdate(p.id, 'nameTh', e.target.value)}
                  className="w-full rounded-md bg-transparent px-2 py-1 outline-none focus:ring-2 focus:ring-emerald-300"
                />
              </td>
              <td className="px-4 py-3">
                <input
                  defaultValue={p.nameEn}
                  onBlur={(e) => handleUpdate(p.id, 'nameEn', e.target.value)}
                  className="w-full rounded-md bg-transparent px-2 py-1 outline-none focus:ring-2 focus:ring-emerald-300"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
