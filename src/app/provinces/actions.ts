'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '../../../prisma/client'

const UpdateProvinceSchema = z.object({
  provinceId: z.number().int(),
  field: z.enum(['nameTh', 'nameEn']),
  value: z.string().min(1),
})

export async function updateProvinceCell(
  provinceId: number,
  field: 'nameTh' | 'nameEn',
  value: string,
) {
  const parsed = UpdateProvinceSchema.safeParse({ provinceId, field, value })
  if (!parsed.success) {
    return { success: false as const, error: 'Invalid data' }
  }

  try {
    await prisma.province.update({
      where: { id: provinceId },
      data: { [field]: value },
    })

    revalidatePath('/provinces')

    return { success: true as const }
  } catch {
    return { success: false as const, error: 'Database error' }
  }
}
