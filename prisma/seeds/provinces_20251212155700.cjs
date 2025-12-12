require('dotenv/config')

const { PrismaClient } = require('@prisma/client')
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3')

const url = process.env.DATABASE_URL || 'file:./dev.db'
const adapter = new PrismaBetterSqlite3({ url })
const prisma = new PrismaClient({ adapter })

async function main() {
  const data = require('../../memory/phitsanulok_subdistrict.json')
  const province = data.province

  await prisma.province.upsert({
    where: { id: province.id },
    update: {
      nameTh: province.name_th,
      nameEn: province.name_en,
    },
    create: {
      id: province.id,
      nameTh: province.name_th,
      nameEn: province.name_en,
    },
  })
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
