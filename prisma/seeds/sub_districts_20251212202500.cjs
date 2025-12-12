require('dotenv/config')

const { PrismaClient } = require('@prisma/client')
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3')

const url = process.env.DATABASE_URL || 'file:./dev.db'
const adapter = new PrismaBetterSqlite3({ url })
const prisma = new PrismaClient({ adapter })

async function main() {
  const DISTRICT_ID = 6509
  const ALLOWED_SUB_DISTRICT_IDS = [
    650901, // ชมพู
    650902, // บ้านมุง
    650903, // ไทรย้อย
    650904, // วังโพรง
    650905, // บ้านน้อยซุ้มขี้เหล็ก
    650906, // เนินมะปราง
    650907, // วังยาง
  ]

  const data = require('../../memory/phitsanulok_subdistrict.json')
  const district = (data.districts || []).find((d) => d.id === DISTRICT_ID)
  if (!district) {
    throw new Error(`District ${DISTRICT_ID} not found in memory/phitsanulok_subdistrict.json`)
  }

  const subs = district.sub_districts || []
  const allowedSubs = ALLOWED_SUB_DISTRICT_IDS.map((id) => {
    const s = subs.find((x) => x.id === id)
    if (!s) throw new Error(`SubDistrict ${id} not found in district ${DISTRICT_ID} dataset`)
    return s
  })

  for (const s of allowedSubs) {
    await prisma.subDistrict.upsert({
      where: { id: s.id },
      update: {
        nameTh: s.name_th,
        nameEn: s.name_en,
        zipCode: s.zip_code,
        lat: s.lat === null ? null : s.lat,
        long: s.long === null ? null : s.long,
        districtId: DISTRICT_ID,
      },
      create: {
        id: s.id,
        nameTh: s.name_th,
        nameEn: s.name_en,
        zipCode: s.zip_code,
        lat: s.lat === null ? null : s.lat,
        long: s.long === null ? null : s.long,
        districtId: DISTRICT_ID,
      },
    })
  }

  const del = await prisma.subDistrict.deleteMany({
    where: {
      districtId: DISTRICT_ID,
      id: { notIn: ALLOWED_SUB_DISTRICT_IDS },
    },
  })

  const remaining = await prisma.subDistrict.findMany({
    where: { districtId: DISTRICT_ID },
    orderBy: { id: 'asc' },
    select: { id: true, nameTh: true, nameEn: true },
  })

  console.log({ deleted: del.count, remaining })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
