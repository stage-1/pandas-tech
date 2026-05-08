import postgres from 'postgres'

const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD'] as const
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing env: ${key}`)
}

export const sql = postgres({
  host:            process.env.DB_HOST,
  port:            Number(process.env.DB_PORT ?? 6543),
  database:        process.env.DB_NAME ?? 'postgres',
  username:        process.env.DB_USER,
  password:        process.env.DB_PASSWORD,
  max:             5,
  idle_timeout:    20,
  connect_timeout: 10,
  prepare:         false,
})
