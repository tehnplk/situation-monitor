require('dotenv/config')

const { PrismaClient } = require('@prisma/client')
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3')

const url = process.env.DATABASE_URL || 'file:./dev.db'
const adapter = new PrismaBetterSqlite3({ url })
const prisma = new PrismaClient({ adapter })

async function main() {
  const data = require('../../memory/phitsanulok_subdistrict.json')
  const province = data.province
  const districts = data.districts || []

  for (const d of districts) {
    await prisma.district.upsert({
      where: { id: d.id },
      update: {
        nameTh: d.name_th,
        nameEn: d.name_en,
        provinceId: province.id,
      },
      create: {
        id: d.id,
        nameTh: d.name_th,
        nameEn: d.name_en,
        provinceId: province.id,
      },
    })
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
