import 'dotenv/config'
import DbConfig from '../Configs/DbConfig.js'
import Role from '../Models/RoleModel.js'

const roles = [
  { RoleCode: 'owner', Name: 'owner', Description: 'System owner with full permissions', IsActive: true },
  { RoleCode: 'admin', Name: 'admin', Description: 'Administrator role with full permissions', IsActive: true },
  { RoleCode: 'manager', Name: 'manager', Description: 'Manager role', IsActive: true },
  { RoleCode: 'teamlead', Name: 'team lead', Description: 'Team lead role', IsActive: true },
  { RoleCode: 'moderator', Name: 'moderator', Description: 'Moderator role', IsActive: true },
  { RoleCode: 'employee', Name: 'employee', Description: 'Regular employee', IsActive: true },
]

async function seedRoles() {
  try {
    await DbConfig()
    for (const r of roles) {
      const existing = await Role.findOne({ Name: r.Name })
      if (existing) {
        console.log(`Role exists: ${r.Name} (${existing._id})`)
        continue
      }
      const roleDoc = new Role(r)
      // save with validation disabled to avoid validator.isAlpha issues for names like "team lead"
      await roleDoc.save({ validateBeforeSave: false })
      console.log(`Inserted role: ${r.Name} (${roleDoc._id})`)
    }
    console.log('Seeding completed')
  } catch (err) {
    console.error('Seeding error:', err)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

seedRoles()
