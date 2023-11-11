import { WebSocketServer } from 'ws'
import { IPty, spawn } from 'node-pty'
import { ipcMain } from 'electron'

const server = new WebSocketServer({ port: 3333 })

class ThrottledWriter {
  bufferedChunks: Buffer[] = []
  bufferedLength = 0
  timeout: NodeJS.Timeout | null = null

  constructor(
    private options: { send: (data: Buffer) => void; flushTimeout: number; flushMaxSize: number }
  ) {}

  writeAndFlush(data: string | Buffer) {
    this.bufferedChunks.push(Buffer.from(data))
    this.bufferedLength += data.length

    this.flush()
  }

  writeThrottled(data: string | Buffer) {
    this.bufferedChunks.push(Buffer.from(data))
    this.bufferedLength += data.length

    if (this.bufferedLength > this.options.flushMaxSize) {
      this.flush()
    } else {
      this.scheduleFlush()
    }
  }

  scheduleFlush() {
    if (this.timeout == null) {
      setTimeout(() => this.flush(), this.options.flushTimeout)
    }
  }

  flush() {
    if (this.timeout != null) {
      clearTimeout(this.timeout)
      this.timeout = null
    }

    const data = Buffer.concat(this.bufferedChunks)
    this.bufferedChunks.length = 0
    this.bufferedLength = 0

    if (data.length > 0) {
      this.options.send(data)
    }
  }
}

const terminals = new Map<string, IPty>()

ipcMain.handle('resizeTerminal', (_, id: string, options: { cols: number; rows: number }) => {
  const terminal = terminals.get(id)

  if (terminal) {
    terminal.resize(options.cols, options.rows)
  }
})

server.on('connection', (conn, req) => {
  const shellId = req.url?.slice(1).trim()

  console.log(shellId, req.url)
  if (!shellId) {
    conn.close()
    return
  }

  const shell = spawn('zsh', [], { name: 'xterm-color', rows: 24, cols: 80 })

  terminals.set(shellId, shell)

  const writer = new ThrottledWriter({
    send: (data) => conn.send(data),
    flushMaxSize: 262144,
    flushTimeout: 3
  })

  let userInputed = false

  shell.onData((data) => {
    if (userInputed) {
      userInputed = false
      writer.writeAndFlush(data)
    } else {
      writer.writeThrottled(data)
    }
  })

  shell.onExit(() => {
    conn.close()
  })

  conn.on('message', (data) => {
    // userInputed = true
    shell.write(data.toString('utf-8'))
  })

  conn.on('close', () => {
    shell.kill()
  })
})
