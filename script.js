const canvas = document.getElementById('tetris');
// Get the main game canvas element
const context = canvas.getContext('2d');
// Get the 2D drawing context for the main canvas
const nextCanvas = document.getElementById('next-piece');
// Get the next piece preview canvas element
const nextContext = nextCanvas.getContext('2d');
// Get the 2D drawing context for the next piece canvas
const grid = 30; // Size of each grid cell
const colors = [
    '#ec8a94', '#FFDE95', '#FAAB78', '#E8C872', '#9ac7e9', '#cf88cf',
    '#AC87C5', '#8a94ec', '#AAE3E2', '#E0AED0', '#8294C4', '#92C7CF',
    '#EAC7C7', '#95BDFF', '#E8A0BF', '#D37676'
]; // Array of colors for the different shapes

const shapes = [
    [[1, 1, 1, 1]], // I
    [[1, 1], [1, 1]], // O
    [[0, 1, 0], [1, 1, 1]], // T
    [[1, 0, 0], [1, 1, 1]], // L
    [[0, 0, 1], [1, 1, 1]], // J
    [[0, 1, 1], [1, 1, 0]], // S
    [[1, 1, 0], [0, 1, 1]], // Z
    [[1]], // Single block
    [[0, 1], [1, 1], [0, 1]], // Plus shape
    [[1, 1], [0, 1], [0, 1]], // Mirrored L
    [[0, 1], [0, 1], [1, 1]], // Mirrored J
    [[1, 1], [1, 0], [1, 0]], // Mirrored S
    [[1, 1], [0, 1], [0, 1]], // Mirrored T
    [[1, 1, 1], [0, 1, 0], [0, 1, 0]], // Long T
    [[0, 1, 0], [1, 1, 1], [0, 1, 0]], // Cross
    [[1, 0, 0], [1, 1, 0], [1, 0, 0]]  // Hook
]; // Array of shapes
 
const rows = 20; // Number of rows in the game board
const cols = 10; // Number of columns in the game board

let board = Array.from({ length: rows }, () => Array(cols).fill(0));
// Create an empty game board
let piece = createPiece(); // Create the initial piece
let nextPiece = createPiece(); // Create the next piece
let score = 0; // Initialize score
let dropStart = Date.now(); // Initialize drop start time
let gameOver = false; // Initialize game over flag
let isPaused = false; // Initialize paused state

function createPiece() {
    const typeId = Math.floor(Math.random() * shapes.length);
    // Randomly select a shape
    const shape = shapes[typeId]; // Get the shap
    return {
        shape,
        color: colors[typeId], // Set the color
        x: Math.floor(cols / 2) - Math.floor(shape[0].length / 2), 
        // Center the piece horizontally
        y: 0 // Start at the top
    };
}

function drawPiece(piece, ctx = context) {
    ctx.fillStyle = piece.color; // Set the fill color
    piece.shape.forEach((row, dy) => {
        row.forEach((value, dx) => {
            if (value) {
                ctx.fillRect((piece.x + dx) * grid, 
                (piece.y + dy) * grid, grid, grid);
                // Draw the filled cell
                ctx.strokeRect((piece.x + dx) * grid, 
                (piece.y + dy) * grid, grid, grid);
                // Draw the cell border
            }
        });
    });
}

function drawBoard() {
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                context.fillStyle = colors[value - 1];
                // Set the fill color
                context.fillRect(x * grid, y * grid, grid, grid);
                // Draw the filled cell
                context.strokeRect(x * grid, y * grid, grid, grid);
                // Draw the cell border
            } else {
                context.clearRect(x * grid, y * grid, grid, grid);
                // Clear the cell
            }
        });
    });
}

function drawNextPiece(piece) {
    nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    // Clear the preview canvas
    const size = Math.max(piece.shape.length, piece.shape[0].length);
    // Get the size of the piece
    const offsetX = Math.floor((nextCanvas.width - piece.shape[0].length * grid) / 2);
    // Center the piece horizontally
    const offsetY = Math.floor((nextCanvas.height - piece.shape.length * grid) / 2);
    // Center the piece vertically
    piece.shape.forEach((row, dy) => {
        row.forEach((value, dx) => {
            if (value) {
                nextContext.fillStyle = piece.color; // Set the fill color
                nextContext.fillRect(offsetX + dx * grid, offsetY + dy * grid, grid, grid);
                nextContext.strokeRect(offsetX + dx * grid, offsetY + dy * grid, grid, grid);
            }
        });
    });
}

function isValidMove(piece, offsetX, offsetY) {
    const { shape, x, y } = piece;
    for (let dy = 0; dy < shape.length; dy++) {
        for (let dx = 0; dx < shape[dy].length; dx++) {
            if (shape[dy][dx]) {
                const newX = x + dx + offsetX; // Calculate new x position
                const newY = y + dy + offsetY; // Calculate new y position
                if (newX < 0 || newX >= cols || newY >= rows || 
                    (board[newY] && board[newY][newX])) {
                    return false; // Check for collisions and out of bounds
                }
            }
        }
    }
    return true; // Move is valid
}

function placePiece(piece) {
    piece.shape.forEach((row, dy) => {
        row.forEach((value, dx) => {
            if (value) {
                board[piece.y + dy][piece.x + dx] = colors.indexOf(piece.color) + 1;
                // Place the piece on the board
            }
        });
    });
}

function removeLines() {
    let lines = 0;
    for (let y = board.length - 1; y >= 0; y--) {
        if (board[y].every(cell => cell !== 0)) {
            board.splice(y, 1); // Remove the complete line
            board.unshift(Array(cols).fill(0));
            // Add a new empty line at the top
            lines++;
            y++; // Check the same row again after shifting down
        }
    }
    return lines; // Return the number of lines removed
}

function drop() {
    if (isPaused) return; // Do nothing if the game is paused

    const now = Date.now();
    const delta = now - dropStart; // Time since last drop
    if (delta > 1000) {
        if (!isValidMove(piece, 0, 1)) {
            placePiece(piece); // Place the piece if it can't move down
            const linesCleared = removeLines(); // Remove complete lines
            score += linesCleared * 10; // Update score
            updateHighScore(score); // Update high score
            document.getElementById('score').textContent = `Score: ${score}`;
            piece = nextPiece; // Get the next piece
            nextPiece = createPiece(); // Create a new next piece
            drawNextPiece(nextPiece); // Draw the next piece
            if (!isValidMove(piece, 0, 0)) {
                gameOver = true; // Game over if the new piece can't be placed
                alert('Game Over');
                return;
            }
        } else {
            piece.y++; // Move the piece down
        }
        dropStart = now; // Reset drop start time
        drawBoard(); // Redraw the board
        drawPiece(piece); // Redraw the current piece
    }
    if (!gameOver) {
        requestAnimationFrame(drop); // Continue the game loop
    }
}

function updateHighScore(score) {
    const highScore = localStorage.getItem('highScore') || 0;
    // Get high score from localStorage
    if (score > highScore) {
        localStorage.setItem('highScore', score); 
        // Update high score if current score is higher
    }
    document.getElementById('high-score').textContent = 
    `High Score: ${localStorage.getItem('highScore')}`;
    // Update high score display
}

document.getElementById('start-button').addEventListener('click', () => {
    piece = createPiece(); // Create a new piece
    nextPiece = createPiece(); // Create a new next piece
    drawNextPiece(nextPiece); // Draw the next piece
    score = 0; // Reset score
    gameOver = false; // Reset game over flag
    isPaused = false; // Reset paused state
    board = Array.from({ length: rows }, () => Array(cols).fill(0));
     // Reset the board
    dropStart = Date.now(); // Reset drop start time
    document.getElementById('score').textContent = `Score: ${score}`;
     // Update score display
    drop(); // Start the game loop
});

document.getElementById('reset-button').addEventListener('click', () => {
    piece = createPiece(); // Create a new piece
    nextPiece = createPiece(); // Create a new next piece
    drawNextPiece(nextPiece); // Draw the next piece
    score = 0; // Reset score
    gameOver = false; // Reset game over flag
    isPaused = false; // Reset paused state
    board = Array.from({ length: rows }, () => Array(cols).fill(0));
    // Reset the board
    dropStart = Date.now();  // Reset drop start time
    drawBoard(); // Redraw the board
    drawPiece(piece); // Redraw the current piece
    document.getElementById('score').textContent = `Score: ${score}`;
    // Update score display
});

document.getElementById('pause-button').addEventListener('click', () => {
    isPaused = !isPaused; // Toggle paused state
    if (!isPaused) {
        drop(); // Resume the game loop if unpaused
    }
});

document.addEventListener('keydown', event => {
    if (gameOver) return; // Do nothing if the game is over
    if (event.key === 'p') {
        isPaused = !isPaused;  // Toggle paused state on 'p' key press
        if (!isPaused) {
            drop(); // Resume the game loop if unpaused
        }
    }
    if (isPaused) return; ; // Do nothing if the game is paused

    if (event.key === 'ArrowLeft' && isValidMove(piece, -1, 0)) {
        piece.x--;  // Move piece left
    } else if (event.key === 'ArrowRight' && isValidMove(piece, 1, 0)) {
        piece.x++;  // Move piece right
    } else if (event.key === 'ArrowDown' && isValidMove(piece, 0, 1)) {
        piece.y++;  // Move piece down
    } else if (event.key === 'ArrowUp') {
        const rotated = {
            shape: piece.shape[0].map((_, i) => 
                piece.shape.map(row => row[i]).reverse()),
            // Rotate the piece 90 degrees
            color: piece.color,
            x: piece.x,
            y: piece.y
        };
        if (isValidMove(rotated, 0, 0)) {
            piece.shape = rotated.shape; // Apply rotation if valid
        }
    }
    drawBoard(); // Redraw the board
    drawPiece(piece); // Redraw the current piece
});

window.addEventListener('load', () => {
    updateHighScore(0); // Initialize high score display on page load
});
