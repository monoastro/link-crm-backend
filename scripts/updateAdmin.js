import dotenv from 'dotenv'
dotenv.config()

import bcrypt from 'bcrypt'
import { db } from "../config/db.js";
import { users } from "../db/schema/users.js"
import { eq } from 'drizzle-orm'

const args = process.argv.slice(2)

const email = args[0]
const password = args[1]

if (!email || !password) {
    console.log(
        'Usage: npm run passwd email password'
    )

    process.exit(1)
}

const updateAdmin = async () => {
    try {
        const hashedPassword = await bcrypt.hash(password, 10)

        await db.update(users).set({
          password: hashedPassword,
        }).where(eq(users.email, email))

        console.log('Password Changed successfully')

        process.exit(0)
    } catch (error) {
        console.log(error)

        process.exit(1)
    }
}

updateAdmin()
