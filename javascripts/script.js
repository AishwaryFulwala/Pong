// Canvas Related 
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');

const player = prompt("What is your name?");
let player1, player2;

const socket = io('http://localhost:3000', { transports : ['websocket'] })
let isReferee = false
let paddleIndex = 0;

let width = 700;
let height = 900;

// Paddle
let paddleHeight = 10;
let paddleWidth = 90;
let paddleDiff = 25;
let paddleX = [ 100, 100 ];
let trajectoryX = [ 0, 0 ];
let playerMoved = false;

// Ball
let ballX = 250;
let ballY = 450;
let ballRadius = 7;
let ballDirection = 1;

// Speed
let speedY = 2;
let speedX = 0;

// Score for Both Players
let score = [ 0, 0 ];

// Create Canvas Element
function createCanvas() {
  canvas.id = 'canvas';
  canvas.width = width;
  canvas.height = height;
  document.body.appendChild(canvas);
  renderCanvas();
}

//Wait for Opponents
function renderIntro() {
  // Canvas Background
  context.fillStyle = '#081E29';
  context.fillRect(0, 0, width, height);

  // Intro Text
  context.fillStyle = '#FFFFFF';
  context.font = "32px Courier New";
  context.fillText("Waiting for opponent...", 20, (canvas.height / 2));
}

// Render Everything on Canvas
function renderCanvas() {
  // Canvas Background
  context.fillStyle = '#081E29';
  context.fillRect(0, 0, width, height);

  // Paddle Color
  context.fillStyle = '#588888';

  // Bottom Paddle
  context.fillRect(paddleX[0], height - 20, paddleWidth, paddleHeight);

  // Top Paddle
  context.fillRect(paddleX[1], 10, paddleWidth, paddleHeight);

  // Dashed Center Line
  context.beginPath();
  context.setLineDash([4]);
  context.moveTo(0, 450);
  context.lineTo(700, 450);
  context.strokeStyle = 'grey';
  context.stroke();

  // Ball
  context.beginPath();
  context.arc(ballX, ballY, ballRadius, 2 * Math.PI, false);
  context.fillStyle = '#dda97a';
  context.fill();

  // Score
  context.font = "30px Courier New";
  context.fillStyle = '#FFFFFF';
  context.fillText(score[0], 20, (canvas.height / 2) + 75);
  context.fillText(score[1], 20, (canvas.height / 2) - 30);

  // Name
  context.font = "20px Courier New";
  context.fillText(player1, 20, (canvas.height / 2) + 40);
  context.fillText(player2, 20, (canvas.height / 2) - 65);
}

// Reset Ball to Center
function ballReset() {
  ballX = width / 2;
  ballY = height / 2;
  speedY = 3;
  socket.emit('ballMove', {
    ballX,
    ballY,
    score
  })
}

// Adjust Ball Movement
function ballMove() {
  // Vertical Speed
  ballY += speedY * ballDirection;
  // Horizontal Speed
  if (playerMoved) {
    ballX += speedX;
  }
  socket.emit('ballMove', {
    ballX,
    ballY,
    score
  })
}

// Determine What Ball Bounces Off, Score Points, Reset Ball
function ballBoundaries() {
  // Bounce off Left Wall
  if (ballX < 0 && speedX < 0) {
    speedX = -speedX;
  }
  // Bounce off Right Wall
  if (ballX > width && speedX > 0) {
    speedX = -speedX;
  }
  // Bounce off player paddle (bottom)
  if (ballY > height - paddleDiff) {
    if (ballX >= paddleX[0] && ballX <= paddleX[0] + paddleWidth) {
      // Add Speed on Hit
      if (playerMoved) {
        speedY += 1;
        // Max Speed
        if (speedY > 5) {
          speedY = 5;
        }
      }
      ballDirection = -ballDirection;
      trajectoryX[0] = ballX - (paddleX[0] + paddleDiff);
      speedX = trajectoryX[0] * 0.3;
    } else {
      // Reset Ball, add to Computer Score
      ballReset();
      score[1]++;
    }
  }
  // Bounce off computer paddle (top)
  if (ballY < paddleDiff) {
    if (ballX >= paddleX[1] && ballX <= paddleX[1] + paddleWidth) {
      // Add Speed on Hit
      if (playerMoved) {
        speedY += 1;
        // Max Speed
        if (speedY > 5) {
          speedY = 5;
        }
      }
      ballDirection = -ballDirection;
      trajectoryX[1] = ballX - (paddleX[1] + paddleDiff);
      speedX = trajectoryX[1] * 0.3;
    } else {
      ballReset();
      score[0]++;
    }
  }
}

// Called Every Frame
function animate() {
  if(isReferee) {
    ballMove();
    ballBoundaries();
  }

  renderCanvas();
  window.requestAnimationFrame(animate);
}

// Start Game, Reset Everything
function loadGame() {
  createCanvas();
  renderIntro();
  socket.emit('ready', player)
}

function startGame() {
  paddleIndex = isReferee ? 0 : 1;
  window.requestAnimationFrame(animate);
  canvas.addEventListener('mousemove', (e) => {
    playerMoved = true;
    paddleX[paddleIndex] = e.offsetX;
    if (paddleX[paddleIndex] < 0) {
      paddleX[paddleIndex] = 0;
    }
    if (paddleX[paddleIndex] > (width - paddleWidth)) {
      paddleX[paddleIndex] = width - paddleWidth;
    }

    socket.emit('paddleMove', {
      xPosition: paddleX[paddleIndex] 
    })

    // Hide Cursor
    canvas.style.cursor = 'none';
  });
}

// On Load
loadGame();

socket.on('connect', () => {
  console.log('Connect ', socket.id)
})

socket.on('startGame', (refereeId, play1, play2) => {
  console.log('Referee ', refereeId, play1, play2)
  
  isReferee = socket.id === refereeId
  player1 = play1
  player2 = play2

  startGame()
})

socket.on('paddleMove', (paddleData) => {
  const opponentPaddleIndex = 1 - paddleIndex
  paddleX[opponentPaddleIndex] = paddleData.xPosition
})

socket.on('ballMove', (ballData) => {
  ({ ballX, ballY, score } = ballData)
})