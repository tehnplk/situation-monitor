require('dotenv/config')

const { PrismaClient } = require('@prisma/client')
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3')

const url = process.env.DATABASE_URL || 'file:./dev.db'
const adapter = new PrismaBetterSqlite3({ url })
const prisma = new PrismaClient({ adapter })

async function main() {
  const data = require('../../memory/phitsanulok_subdistrict.json')
  const districts = data.districts || []

  for (const d of districts) {
    const subs = d.sub_districts || []
    for (const s of subs) {
      if (d.id === 6509 && s.id === 650908) continue
      await prisma.subDistrict.upsert({
        where: { id: s.id },
        update: {
          nameTh: s.name_th,
          nameEn: s.name_en,
          zipCode: s.zip_code,
          lat: s.lat === null ? null : s.lat,
          long: s.long === null ? null : s.long,
          districtId: d.id,
        },
        create: {
          id: s.id,
          nameTh: s.name_th,
          nameEn: s.name_en,
          zipCode: s.zip_code,
          lat: s.lat === null ? null : s.lat,
          long: s.long === null ? null : s.long,
          districtId: d.id,
        },
      })
    }
  }
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
