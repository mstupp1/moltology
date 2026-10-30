import net from 'node:net'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)

async function portAvailable(port) {
  const server = net.createServer()
  return new Promise((resolve, reject) => {
    server.once('error', (error) => {
      if (error.code === 'EADDRINUSE') resolve(false)
      else reject(error)
    })
    server.listen(port, () => server.close(() => resolve(true)))
  })
}

// Decide the port before Nitro starts its worker and inherits the auth origin.
export async function devArguments(args, env = {}, available = portAvailable) {
  const result = [...args]
  const portIndex = args.findIndex((arg) => arg === '--port' || arg.startsWith('--port='))
  const explicit = portIndex >= 0 || Boolean(env.PORT)
  const raw = portIndex >= 0
    ? (args[portIndex].includes('=') ? args[portIndex].split('=')[1] : args[portIndex + 1])
    : env.PORT || '3000'
  let port = Number(raw)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Use a development port between 1 and 65535.')
  }
  if (!explicit) {
    while (!(await available(port))) {
      if (++port > 3099) throw new Error('No free development port in 3000–3099. Set --port explicitly.')
    }
  }
  if (portIndex < 0) result.push('--port', String(port))
  if (!args.some((arg) => arg === '--configLoader' || arg.startsWith('--configLoader='))) {
    result.push('--configLoader', 'runner')
  }
  return { args: result, port }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const launch = await devArguments(process.argv.slice(2), process.env)
    console.log(`[dev] Starting at http://localhost:${launch.port}`)
    const vite = path.join(path.dirname(require.resolve('vite/package.json')), 'bin/vite.js')
    const child = spawn(process.execPath, [vite, 'dev', ...launch.args], {
      stdio: 'inherit', env: { ...process.env, PORT: String(launch.port) },
    })
    for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal))
    child.once('error', (error) => { console.error(`[dev] ${error.message}`); process.exitCode = 1 })
    child.once('exit', (code, signal) => { process.exitCode = code ?? (signal === 'SIGINT' ? 130 : 1) })
  } catch (error) {
    console.error(`[dev] ${error.message}`)
    process.exitCode = 1
  }
}
