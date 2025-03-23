(function() {
  "use strict";

  // DOM 요소
  const startScreen = document.getElementById("startScreen");
  const startButton = document.getElementById("startButton");
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  const gameOverText = document.getElementById("gameOverText");
  const scoreText = document.getElementById("scoreText");

  // 화면 크기
  let SCREEN_WIDTH = window.innerWidth;
  let SCREEN_HEIGHT = window.innerHeight;
  canvas.width = SCREEN_WIDTH;
  canvas.height = SCREEN_HEIGHT;

  // 바닥
  const FLOOR_HEIGHT = 80;
  let FLOOR_TOP = SCREEN_HEIGHT - FLOOR_HEIGHT;

  // 게임 상태
  let isGameRunning = false;  // START 후에 true
  let gameOver = false;

  // 주인공: 산타
  const santaImg = new Image();
  santaImg.src = "santa.png";  // 주인공 이미지

  let santaWidth = 64;
  let santaHeight = 64;
  let santaX = 50;
  let santaY = FLOOR_TOP - santaHeight;

  // 점프 관련
  let isJumping = false;
  let jumpPower = 15;
  let gravity = 0.8;
  let velocityY = 0;

  // 오디오 (mp3)
  const jumpSound = new Audio("jump.mp3");       
  const surpriseSound = new Audio("surprise.mp3"); 

  // 점수
  let score = 0;

  // 악당(괴물) 2종: fire.png, wing.png
  const fireImg = new Image();
  fireImg.src = "fire.png";
  const wingImg = new Image();
  wingImg.src = "wing.png";
  const monsterImages = [fireImg, wingImg];

  let monsters = [];
  let monsterWidth = 32;
  let monsterHeight = 32;
  let monsterSpeed = 6;
  // 스폰 관련
  let spawnTimer = 0;
  let nextSpawnInterval = 90;  
  const minSpawnInterval = 60;
  const maxSpawnInterval = 120;

  // 구름(장식)
  let clouds = [];
  let cloudTimer = 0;
  let cloudSpawnInterval = 120;

  // ==================
  // 게임 루프
  // ==================
  function gameLoop() {
    if (!isGameRunning) return; 

    if (!gameOver) {
      update();
      draw();
      requestAnimationFrame(gameLoop);
    } else {
      gameOverText.style.display = "block";
    }
  }

  // ==================
  // 업데이트 로직
  // ==================
  function update() {
    // 점프 처리
    if (isJumping) {
      santaY += velocityY;
      velocityY += gravity;
      if (santaY >= FLOOR_TOP - santaHeight) {
        santaY = FLOOR_TOP - santaHeight;
        isJumping = false;
      }
    }

    // 괴물 스폰 (랜덤 간격)
    spawnTimer++;
    if (spawnTimer >= nextSpawnInterval) {
      spawnTimer = 0;
      nextSpawnInterval = getRandomInt(minSpawnInterval, maxSpawnInterval);

      let randIndex = getRandomInt(0, monsterImages.length - 1);
      monsters.push({
        x: SCREEN_WIDTH,
        y: FLOOR_TOP - monsterHeight,
        width: monsterWidth,
        height: monsterHeight,
        image: monsterImages[randIndex],
        scored: false
      });
    }

    // 괴물 이동/충돌/점수
    monsters.forEach(mon => {
      mon.x -= monsterSpeed;

      // 충돌
      if (checkCollision(
        santaX, santaY, santaWidth, santaHeight,
        mon.x, mon.y, mon.width, mon.height
      )) {
        gameOver = true;
      }

      // 캐릭터 뒤로 지나갔으면 점수
      if (!mon.scored && mon.x + mon.width < santaX) {
        mon.scored = true;
        score++;
        updateScore();
      }
    });
    // 화면 밖 제거
    monsters = monsters.filter(m => m.x > -m.width);

    // 구름 스폰
    cloudTimer++;
    if (cloudTimer >= cloudSpawnInterval) {
      cloudTimer = 0;
      let cloudY = 20 + Math.random() * (SCREEN_HEIGHT / 3);
      let cloudSize = 20 + Math.random() * 30;
      let cloudSpeed = 1 + Math.random() * 1.5;
      clouds.push({
        x: SCREEN_WIDTH,
        y: cloudY,
        size: cloudSize,
        speed: cloudSpeed
      });
    }
    // 구름 이동
    clouds.forEach(c => c.x -= c.speed);
    clouds = clouds.filter(c => c.x > -200);
  }

  // ==================
  // 그리기
  // ==================
  function draw() {
    ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // 바닥(갈색)
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(0, FLOOR_TOP, SCREEN_WIDTH, FLOOR_HEIGHT);

    // 구름
    clouds.forEach(drawCloud);

    // 산타
    ctx.drawImage(santaImg, santaX, santaY, santaWidth, santaHeight);

    // 괴물
    monsters.forEach(mon => {
      ctx.drawImage(mon.image, mon.x, mon.y, mon.width, mon.height);
    });
  }

  // ==================
  // 구름 그리기
  // ==================
  function drawCloud(cloudObj) {
    ctx.fillStyle = "#FFFFFF";
    let cx = cloudObj.x;
    let cy = cloudObj.y;
    let size = cloudObj.size;

    ctx.beginPath();
    ctx.arc(cx, cy, size, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx - size * 0.6, cy + size * 0.4, size * 0.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx + size * 0.6, cy + size * 0.4, size * 0.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy - size * 0.4, size * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  // ==================
  // 점수 갱신
  // ==================
  function updateScore() {
    scoreText.textContent = "점수: " + score;
    // 10점 달성 시 surpriseSound
    if (score === 10) {
      surpriseSound.currentTime = 0;
      surpriseSound.play();
    }
  }

  // ==================
  // 충돌 판정(사각)
  // ==================
  function checkCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
    return (
      x1 < x2 + w2 &&
      x1 + w1 > x2 &&
      y1 < y2 + h2 &&
      y1 + h1 > y2
    );
  }

  // ==================
  // 랜덤 정수
  // ==================
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // ==================
  // 점프
  // ==================
  function doJump() {
    if (!isJumping) {
      isJumping = true;
      velocityY = -jumpPower;

      jumpSound.currentTime = 0;
      jumpSound.play();
    }
  }

  // ==================
  // 이벤트
  // ==================
  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && isGameRunning && !gameOver) {
      doJump();
    }
  });

  document.addEventListener("mousedown", () => {
    if (isGameRunning && !gameOver) {
      doJump();
    }
  });

  document.addEventListener("touchstart", () => {
    if (isGameRunning && !gameOver) {
      doJump();
    }
  });

  // 화면 리사이즈
  window.addEventListener("resize", onResize);
  function onResize() {
    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;
    canvas.width = SCREEN_WIDTH;
    canvas.height = SCREEN_HEIGHT;

    FLOOR_TOP = SCREEN_HEIGHT - FLOOR_HEIGHT;
    if (!isJumping) {
      santaY = FLOOR_TOP - santaHeight;
    }
  }

  // START 버튼
  startButton.addEventListener("click", () => {
    startScreen.style.display = "none";
    isGameRunning = true;
    gameLoop();
  });
})();
