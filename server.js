const http = require('http').createServer()
const io = require('socket.io')(http)

http.listen(3000, () => {
    console.log('server')
})

let readyCount = 0
let player1    

io.on('connection', (socket) => {
    let room

    socket.on('ready', (playerName) => {
        room = 'room' + Math.floor(readyCount / 2)
        socket.join(room)

        console.log('player ', socket.id)

        readyCount++

        if(readyCount % 2 !== 0) {
            player1 = playerName
        }else if(readyCount % 2 === 0) {
            io.in(room).emit('startGame', socket.id, player1, playerName)
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