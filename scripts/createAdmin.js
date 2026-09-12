import dotenv from 'dotenv'
dotenv.config()

import bcrypt from 'bcrypt'
import { db } from "#/config/db.js";
import { users } from "#/schema/index.js"

const args = process.argv.slice(2)

const username = args[0]
const password = args[1]

if (!username || !password) {
    console.log(
      'Usage: npm run newadmin <username> <password>'
    )

    process.exit(1)
}

const createAdmin = async () => {
    try {
        const hashedPassword = await bcrypt.hash(password, 10)

        const [user] = await db.insert(users).values({
          username: username,
          password: hashedPassword,
          role: 'admin',
        }).returning()

        console.log('Admin created successfully')

        process.exit(0)
    } catch (error) {
        console.log(error)

        process.exit(1)
    }
}

createAdmin()
