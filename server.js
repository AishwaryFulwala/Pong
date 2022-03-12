const http = require('http').createServer()
const io = require('socket.io')(http)

// const io = require('socket.io')(http, {
//     cors: {
//       origin: '*',
//       methods: ['GET', 'POST']
//     }
//   });

http.listen(3000, () => {
    console.log('server')
})

let readyCount = 0

io.on('connection', (socket) => {
    let room

    console.log('socket ', socket.id)

    socket.on('ready', () => {
        room = 'room' + Math.floor(readyCount / 2)
        socket.join(room)

        console.log('player ', socket.id)

        readyCount++

        if(readyCount % 2 === 0) {
            io.in(room).emit('startGame', socket.id)
        }
    })

    socket.on('paddleMove', (paddleData) => {
        socket.to(room).emit('paddleMove', paddleData)
    })

    socket.on('ballMove', (ballData) => {
        socket.to(room).emit('ballMove', ballData)
    })

    socket.on('disconnect', (reason) => {
        console.log(`Client ${socket.id} Disconnected: ${reason}`)
        socket.leave(room)
    })
})