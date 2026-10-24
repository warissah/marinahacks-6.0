
const { Server } = require('socket.io')

const io = new Server(3001, {
  cors: {
    origin: '*',
  },
})

const hosts = new Map()

io.on('connection', (socket) => {
  // -----------------------------------------
  // LAPTOP CREATES A ROOM
  // -----------------------------------------

  socket.on('host', (room, reply) => {
    room = String(room).toUpperCase()

    const existing = hosts.get(room)

    if (
      existing &&
      existing !== socket.id &&
      io.sockets.sockets.has(existing)
    ) {
      reply?.({ ok: false })
      return
    }

    hosts.set(room, socket.id)

    socket.join(room)
    socket.data.room = room
    socket.data.role = 'host'

    reply?.({ ok: true })

    console.log('Host ready:', room)
  })

  // -----------------------------------------
  // PHONE JOINS THE ROOM
  // -----------------------------------------

  socket.on('join', (room, reply) => {
    room = String(room).toUpperCase()

    const hostId = hosts.get(room)

    if (
      !hostId ||
      !io.sockets.sockets.has(hostId)
    ) {
      reply?.({ ok: false })
      return
    }

    socket.join(room)

    socket.data.room = room
    socket.data.role = 'controller'

    reply?.({ ok: true })

    io.to(hostId).emit('phone-connected')

    console.log('Phone joined:', room)
  })

  // -----------------------------------------
  // PHONE INPUT -> LAPTOP
  // -----------------------------------------

  socket.on('input', (data) => {
    if (socket.data.role !== 'controller') return

    const hostId = hosts.get(socket.data.room)

    if (hostId) {
      io.to(hostId).emit('input', data)
    }
  })

  // -----------------------------------------
  // PHONE BUTTONS -> LAPTOP
  // -----------------------------------------

  socket.on('btn', (data) => {
    if (socket.data.role !== 'controller') return

    const hostId = hosts.get(socket.data.room)

    if (hostId) {
      io.to(hostId).emit('btn', data)
    }
  })

  // -----------------------------------------
  // LAPTOP -> PHONE
  // -----------------------------------------

  socket.on('lock', (value) => {
    if (socket.data.role !== 'host') return

    socket.to(socket.data.room).emit('lock', value)
  })

  socket.on('mode', (mode) => {
    if (socket.data.role !== 'host') return

    socket.to(socket.data.room).emit('mode', mode)
  })

  // -----------------------------------------
  // LATENCY TEST
  // -----------------------------------------

  socket.on('ping', (time) => {
    if (socket.data.role !== 'host') return

    socket.to(socket.data.room).emit('ping', time)
  })

  socket.on('pong', (time) => {
    if (socket.data.role !== 'controller') return

    const hostId = hosts.get(socket.data.room)

    if (hostId) {
      io.to(hostId).emit('pong', time)
    }
  })

  // -----------------------------------------
  // DISCONNECTIONS
  // -----------------------------------------

  socket.on('disconnect', () => {
    const { room, role } = socket.data

    if (
      role === 'host' &&
      hosts.get(room) === socket.id
    ) {
      hosts.delete(room)

      socket.to(room).emit('host-disconnected')

      console.log('Host disconnected:', room)
    }

    if (role === 'controller') {
      const hostId = hosts.get(room)

      if (hostId) {
        io.to(hostId).emit('peer-left')
      }

      console.log('Phone disconnected:', room)
    }
  })
})

console.log('PHANTOM relay running on port 3001')
