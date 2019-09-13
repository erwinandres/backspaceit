(function() {
  'use strict';

  function timeStamp () {
    return window.performance && window.performance.now ?
      window.performance.now() :
      Date.now();
  }

  function randomChar(charlist) {
    return charlist.charAt(Math.floor(Math.random() * charlist.length));
  }

  function randomString(length, charList) {
    let string = '';

    for ( var i = 0; i < length; i++ ) {
      string += randomChar(charList);
    }

    return string;
  }

  const resourceCache = {};
  const loading = [];
  const readyCallbacks = [];

  // Load an image url or an array of image urls
  function rLoad(urlOrArr) {
      if(urlOrArr instanceof Array) {
          urlOrArr.forEach(function(url) {
              _rLoad(url);
          });
      }
      else {
          _rLoad(urlOrArr);
      }
  }

  function _rLoad(url) {
      if(resourceCache[url]) {
          return resourceCache[url];
      }
      else {
          const img = new Image();
          img.onload = function() {
              resourceCache[url] = img;
              
              if(rIsReady()) {
                  readyCallbacks.forEach(function(func) { func(); });
              }
          };
          resourceCache[url] = false;
          img.src = url;
      }
  }

  function rGet(url) {
      return resourceCache[url];
  }

  function rIsReady() {
      let ready = true;
      for(var k in resourceCache) {
          if(resourceCache.hasOwnProperty(k) &&
             !resourceCache[k]) {
              ready = false;
          }
      }
      return ready;
  }

  function rOnReady(func) {
      readyCallbacks.push(func);
  }

  const Resources = { 
      load: rLoad,
      get: rGet,
      onReady: rOnReady,
      isReady: rIsReady
  };

  function Sprite(url, pos, size, speed, frames, dir, once) {
      this.pos = pos;
      this.size = size;
      this.speed = typeof speed === 'number' ? speed : 0;
      this.frames = frames;
      this._index = 0;
      this.url = url;
      this.dir = dir || 'horizontal';
      this.once = once;
  };

  Sprite.prototype = {
      update: function(dt) {
          this._index += this.speed*dt;
      },

      render: function(ctx) {
          var frame;

          if(this.speed > 0) {
              var max = this.frames.length;
              var idx = Math.floor(this._index);
              frame = this.frames[idx % max];

              if(this.once && idx >= max) {
                  this.done = true;
                  return;
              }
          }
          else {
              frame = 0;
          }


          var x = this.pos[0];
          var y = this.pos[1];

          if(this.dir == 'vertical') {
              y += frame * this.size[1];
          }
          else {
              x += frame * this.size[0];
          }

          ctx.drawImage(Resources.get(this.url),
                        x, y,
                        this.size[0], this.size[1],
                        0, 0,
                        this.size[0], this.size[1]);
      }
  };

  const Keyboard = {};

  Keyboard.LEFT = 37;
  Keyboard.RIGHT = 39;
  Keyboard.UP = 38;
  Keyboard.DOWN = 40;
  Keyboard.BACKSPACE = 8;
  Keyboard.ESC = 27;

  Keyboard._keys = {};

  Keyboard.listenForEvents = function (keys) {
      window.addEventListener('keydown', this._onKeyDown.bind(this));
      window.addEventListener('keyup', this._onKeyUp.bind(this));

      keys.forEach(function (key) {
          this._keys[key] = false;
      }.bind(this));
  }

  Keyboard._onKeyDown = function (event) {
      var keyCode = event.keyCode;

      if (keyCode in this._keys) {
          event.preventDefault();
          this._keys[keyCode] = true;
      }
  };

  Keyboard._onKeyUp = function (event) {
      var keyCode = event.keyCode;
      if (keyCode in this._keys) {
          event.preventDefault();
          this._keys[keyCode] = false;
      }
  };

  Keyboard.isDown = function (keyCode) {
      if (!keyCode in this._keys) {
          throw new Error('Keycode ' + keyCode + ' is not being listened to');
      }
      return this._keys[keyCode];
  };

  function renderEntity(ctx, entity, sizeAdjustmentRatio, sprite) {
    sizeAdjustmentRatio = sizeAdjustmentRatio || 1;
    sprite = sprite || entity.sprite;

    const scale = entity.scale || 1;

    ctx.setTransform(scale / sizeAdjustmentRatio, 0, 0, scale / sizeAdjustmentRatio, entity.x / sizeAdjustmentRatio, entity.y / sizeAdjustmentRatio);
    sprite.render(ctx);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  function Button(sprites, x, y, w, h, initialState) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;

    this.state = initialState;
    this.sprites = sprites;
  }

  Button.prototype = {
    hover: function(point) {
      return point[0] > this.x &&
        point[0] < this.x + this.w &&
        point[1] > this.y &&
        point[1] < this.y + this.h;
    },

    render: function(ctx) {
      renderEntity(ctx, this, 1, this.sprites[this.state]);
    }
  }

  function Game(config) {
    this.canvas = config.canvas;
    this.scoreEl = config.scoreEl;
    this.levelEl = config.levelEl;
    this.bestScoreEl = config.bestScoreEl;
    this.luckyStringEl = config.luckyStringEl;
    this.backspaceButtonEl = config.backspaceButtonEl;
    this.escButtonEl = config.escButtonEl;

    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.canvasRect = this.canvas.getBoundingClientRect();

    this.db = 'erwBckspcKyDb';
    this.tileSize = 48;
    this.rows = 8;
    this.cols = 8;
    this.charList = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    this.specialChars = '*+-/?';
    this.board = new Array(this.rows * this.cols);

    this.lastAdd = 0; // last chacter added (in s ago)
    this.speed = .8; //s
    this.level = 1;
    this.toNextLevel = 10;
    this.score = 0;
    this.scorePerTile = 1;
    this.bestScore = 0;
    this.specialcharSpawnRate = 1/(this.rows * this.cols);
    this.luckyString = null;
    this.luckyStringFound = 0;
    this.luckyStringBaseLength = 3;

    this.lastTime;
    this.aId;

    this.cursorAt = [0, 0];
    this.backspacePressed = false;
    this.pauseButtonPressed = false;
    this.scene = 'load';

    this.startButton = new Button(
      [
        new Sprite('img/button-sprite.png', [0, 0], [64, 32]),
        new Sprite('img/button-sprite.png', [64, 0], [64, 32])
      ],
      (this.width/2) - 32, (this.height/2) - 16,
      64, 32,
      0
    );

    this.escButton = new Button(
      [
        new Sprite('img/button-sprite.png', [0, 96], [32, 32]),
        new Sprite('img/button-sprite.png', [32, 96], [32, 32])
      ],
      (this.width/2) - 48, (this.height/2) - 16,
      32, 32,
      0
    );

    this.exitButton = new Button(
      [
        new Sprite('img/button-sprite.png', [0, 32], [64, 32]),
        new Sprite('img/button-sprite.png', [64, 32], [64, 32])
      ],
      (this.width/2) + 16, (this.height/2) - 16,
      64, 32,
      0
    );

    this.shareButton = new Button(
      [
        new Sprite('img/button-sprite.png', [0, 64], [64, 32]),
        new Sprite('img/button-sprite.png', [64, 64], [64, 32])
      ],
      (this.width/2) - 64, (this.height/2) - 16,
      64, 32,
      0
    );
  }

  Game.prototype = {
    fillRandomTile: function() {
      const emptyTiles = [];

      for (let i = this.board.length - 1; i >= 0; i--) {
        if (!this.board[i]) emptyTiles.push(i);
      }

      if (emptyTiles.length === 0) return;

      const randomEmptyTile = Math.floor(Math.random() * emptyTiles.length);
      let chars = Math.random() < this.specialcharSpawnRate ? this.specialChars : this.charList;

      this.board[emptyTiles[randomEmptyTile]] = randomChar(chars);
    },

    countEmptyTiles: function() {
      let count = 0;

      for (let i = this.board.length - 1; i >= 0; i--) {
        !this.board[i] && count++;
      }

      return count;
    },

    getTileIndex: function(col, row) {
      return row * this.cols + col;
    },

    getTileValue: function(col, row) {
      return this.board[this.getTileIndex(col, row)];
    },

    getTileCoordsFromPoint: function(x, y) {
      return [~~(x / this.tileSize), ~~(y / this.tileSize)];
    },

    getTileCoordsByIndex: function(index) {
      return [index % this.cols, Math.floor(index/this.rows)];
    },

    clearRow: function(row) {
      for (let i = 0; i < this.cols; i++) {
        if (this.board[this.getTileIndex(i, row)]) {
          this.score += this.scorePerTile;
          this.board[this.getTileIndex(i, row)] = null;
        }
      }
    },

    clearCol: function(col) {
      for (let i = 0; i < this.cols; i++) {
        if (this.board[this.getTileIndex(col, i)]) {
          this.score += this.scorePerTile;
          this.board[this.getTileIndex(col, i)] = null;
        }
      }
    },

    clearSlash: function(center) {
      const a = Math.max(0, center[0] + center[1] - (this.cols - 1));
      const b = Math.min(center[0] + center[1], this.rows - 1);
      const start = [a, b];
      const end = [b, a];

      while (start[0] <= end[0] && start[1] >= end[1]) {
        const index = this.getTileIndex(start[0], start[1]);

        if (this.board[index]) {
          this.board[index] = null;
          this.score += this.scorePerTile;
        }

        start[0] += 1;
        start[1] -= 1;
      }
    },

    clearBackSlash: function(center) {
      const sCol = Math.max(0, center[0] - center[1]);
      const sRow = Math.max(0, center[1] - center[0]);
      const dCol = (this.cols - 1) - sRow;
      const dRow = (this.rows - 1) - sCol;
      const start = [sCol, sRow];
      const end = [dCol, dRow];

      while (start[0] <= end[0] && start[1] <= end[1]) {
        const index = this.getTileIndex(start[0], start[1]);

        if (this.board[index]) {
          this.board[index] = null;
          this.score += this.scorePerTile;
        }

        start[0] += 1;
        start[1] += 1;
      }
    },

    applySpecialEffect: function(char) {
      if (char === '?') {
        // pick random special char except the last one ('?').
        char = this.specialChars[Math.floor(Math.random() * this.specialChars.length - 1)];
      }

      switch (char) {
        case '-':
          this.clearRow(this.cursorAt[1]);
          break;
        case '+':
          this.clearRow(this.cursorAt[1]);
          this.clearCol(this.cursorAt[0]);
          break;
        case '/':
          this.clearSlash(this.cursorAt);
          break;
        case '\\':
          this.clearBackSlash(this.cursorAt);
          break;
        case '*':
          this.clearRow(this.cursorAt[1]);
          this.clearCol(this.cursorAt[0]);
          this.clearSlash(this.cursorAt);
          this.clearBackSlash(this.cursorAt);
          break;
        default:
          this.board[tile] = null;
          break;
      }

    },

    backspace: function() {
      const tile = this.getTileIndex(this.cursorAt[0], this.cursorAt[1]); 

      if (this.board[tile]) {
        this.applySpecialEffect(this.board[tile]);
        this.displayUpdatedValue(this.score += this.scorePerTile, this.scoreEl);

        this.toNextLevel--;

        if (this.toNextLevel <= 0) {
          this.displayUpdatedValue(this.level++, this.levelEl);
          this.toNextLevel = 10;
        }
      }
    },

    displayUpdatedValue: function(value, el) {
      el.innerHTML = value;
    },

    update: function(dt) {
      switch (this.scene) {
        case 'load':
          if (this.loaded) this.scene = 'menu';
          break;
        case 'menu':
        case 'gameover':
          break;
        case 'playing':
          if (this.countEmptyTiles() === 0) {
            this.scene = 'gameover';
            if (this.score > this.bestScore) {
              this.displayUpdatedValue(this.bestScore = this.score, this.bestScoreEl);
              localStorage.setItem(this.db, this.bestScore);
            }
            return;
          }

          if (Keyboard.isDown(Keyboard.ESC)) {
            if (!this.pauseButtonPressed) {
              this.scene = 'pause';
            }

            this.pauseButtonPressed = true;
            return;
          } else {
            this.pauseButtonPressed = false;
          }

          this.lastAdd += dt;

          if (this.lastAdd >= (this.speed - (this.level * 0.05))) {
            this.fillRandomTile();

            this.lastAdd = 0;
          }

          const luckyStringStartIndex = this.board.findIndex(char => char === this.luckyString[0]);

          if (luckyStringStartIndex >= 0) {
            let luckyStringFind = 1;

            for (let i = this.luckyString.length - 1; i >= 0; i--) {
              if (i !== luckyStringFind) continue;
              if (this.luckyString[i] === this.board[luckyStringStartIndex + i]) luckyStringFind++;
            }

            if (luckyStringFind === this.luckyString.length) {
              // delete lucky string characters
              for (let i = luckyString.length - 1; i >= 0; i--) {
                this.board[luckyStringStartIndex + i] = null;
              }

              this.luckyStringFound++;
              this.displayUpdatedValue(this.score += 35 * (this.luckyStringFound + 1), this.scoreEl);
              this.displayUpdatedValue(
                this.luckyString = randomString(
                  this.luckyStringBaseLength + this.luckyStringFound,
                  this.charList
                ),
                this.luckyStringEl
              );

              // TODO: animation
            }
          }

          if (Keyboard.isDown(Keyboard.BACKSPACE)) {
            if (!this.backspacePressed) {
              this.backspace();
            }
            this.backspacePressed = true;
          } else {
            this.backspacePressed = false;
          }

          break;
        case 'pause':
          if (Keyboard.isDown(Keyboard.ESC)) {
            if (!this.pauseButtonPressed) {
              this.scene = 'playing';
            }
            this.pauseButtonPressed = true;
            return;
          } else {
            this.pauseButtonPressed = false;
          }

          break;
      }
    },

    render: function() {
      this.ctx.clearRect(0, 0, this.width, this.height);

      for (let i = 0; i < this.rows; i++) {
        for (let j = 0; j < this.cols; j++) {
          let offset = 0;
          let lineWidth = 1;
          let color = '#000';

          if (i === this.cursorAt[0] && j === this.cursorAt[1]) {
            offset = 1; 
            lineWidth = 4;
            color = '#f00';
          }

          const tile = this.getTileValue(i ,j);
          const x = i * this.tileSize;
          const y = j * this.tileSize;

          if (tile) {
            const fontSize = 18;
            this.ctx.fillStyle = '#000';
            this.ctx.font = fontSize + 'px Arial';
            this.ctx.fillText(tile, x + (this.tileSize/2) - (fontSize/2), y + (this.tileSize/2) + (fontSize/2));
          }
          
          this.ctx.lineWidth = lineWidth;
          this.ctx.strokeStyle = color;
          this.ctx.strokeRect(
            x + offset,
            y + offset,
            this.tileSize - lineWidth,
            this.tileSize - lineWidth
          );
        }
      }

      if (this.scene !== 'playing') {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = '#000';
        this.ctx.font = '24px Arial';

        let text = false;

        switch (this.scene) {
          case 'loading':
            text = 'Loading...';
            break;
          case 'menu':
            this.startButton.render(this.ctx);
            break;
          case 'gameover':
            text = 'Game Over';
            this.shareButton.render(this.ctx);
            this.exitButton.render(this.ctx);

            break;
          case 'pause':
            text = 'Paused';
            this.escButton.render(this.ctx);
            this.exitButton.render(this.ctx);
            break;
        }

        text && this.ctx.fillText(text, 10, 30);
      }
    },

    onMouseDown: function(e) {
      const touch = e.changedTouches && e.changedTouche[0];
      const x = touch ? touch.clientX : e.clientX;
      const y = touch ? touch.clientY : e.clientY;

      const touchX = x - this.canvasRect.left;
      const touchY = y - this.canvasRect.top;

      switch (this.scene) {
        case 'menu':
          if (this.startButton.hover([touchX, touchY])) {
            this.startButton.state = 1;
          }
          break;
        case 'pause':
          if (this.escButton.hover([touchX, touchY])) {
            this.escButton.state = 1;
          } else if (this.exitButton.hover([touchX, touchY])) {
            this.exitButton.state = 1;
          }

          break;
        case 'gameover':
          if (this.shareButton.hover([touchX, touchY])) {
            this.shareButton.state = 1;
          } else if (this.exitButton.hover([touchX, touchY])) {
            this.exitButton.state = 1;
          }

          break;
        case 'playing':
          this.cursorAt = this.getTileCoordsFromPoint(touchX, touchY);
          break;
      }
    },

    onMouseUp: function(e) {
      const touch = e.changedTouches && e.changedTouche[0];
      const x = touch ? touch.clientX : e.clientX;
      const y = touch ? touch.clientY : e.clientY;

      const touchX = x - this.canvasRect.left;
      const touchY = y - this.canvasRect.top;

      this.startButton.state = 0;
      this.escButton.state = 0;
      this.exitButton.state = 0;
      this.shareButton.state = 0;
      switch (this.scene) {
        case 'menu':
          if (this.startButton.hover([touchX, touchY])) {
            this.luckyStringFound = 0;
            this.displayUpdatedValue(this.level = 1, this.levelEl);
            this.displayUpdatedValue(this.score = 0, this.scoreEl);

            for (let i = this.board.length - 1; i >= 0; i--) {
              this.board[i] = Math.random() > 0.15 ? null : randomChar(this.charList);
            }

            this.displayUpdatedValue(
              this.luckyString = randomString(this.luckyStringBaseLength, this.charList),
              this.luckyStringEl
            );

            this.scene = 'playing';
          }

          break;
        case 'playing':
          break;
        case 'pause':
          if (this.escButton.hover([touchX, touchY])) {
            this.scene = 'playing';
          } else if (this.exitButton.hover([touchX, touchY])) {
            this.scene = 'menu';
          }
          break;
        case 'gameover':
          if (this.exitButton.hover([touchX, touchY])) {
            this.scene = 'menu';
          } else if (this.shareButton.hover([touchX, touchY])) {
            // Share
            window.open('https://twitter.com/share?text=I scored ' + this.score + ' points on Backspace.&hashtags=backspaceGame,js13kGames&url=' + location.href);
          }
          break;
      }
    },

    onResize: function(e) {
      this.canvasRect = this.canvas.getBoundingClientRect();
    },

    onVisibilityChange: function(e) {
        if (this.scene !== 'playing') return;
        if (document.hidden || document.webkitHidden || e.type == 'blur' ||
            document.visibilityState !== 'visible') {
            this.scene = 'pause';
        }
    },

    handleEvent: function(e) {
      switch (e.type) {
        case 'mousedown':
          this.onMouseDown(e);
          break;
        case 'mouseup':
          this.onMouseUp(e);
          break;
        case 'resize':
          this.onResize(e);
          break;
        case 'visibilitychange':
        case 'blur':
        case 'focus':
          this.onVisibilityChange(e);
          break;
      }
    },

    listen: function() {
      Keyboard.listenForEvents(
              [Keyboard.LEFT, Keyboard.RIGHT, Keyboard.UP, Keyboard.DOWN, Keyboard.BACKSPACE, Keyboard.ESC]);

      this.escButtonEl.addEventListener('click', function() {
        if (this.scene === 'playing') {
          this.scene = 'pause';
        } else if (this.scene === 'pause') {
          this.scene = 'playing';
        }
      }.bind(this));

      this.backspaceButtonEl.addEventListener('click', function() {
        if (this.scene === 'playing') {
          this.backspace();
        }
      }.bind(this));

      this.canvas.addEventListener('mousedown', this);
      this.canvas.addEventListener('mouseup', this);

      document.addEventListener('visibilitychange', this);
      window.addEventListener('blur', this);
      window.addEventListener('focus', this);

      window.addEventListener('resize', this);
    },

    load: function(assets) {
      Resources.load(assets);
      Resources.onReady(function() {
          this.loaded = true;
      }.bind(this));
    },

    loop: function() {
      const now = timeStamp();
      let dt = now - this.lastTime;

      if (dt > 999) {
        dt = 1 / 60;
      } else {
        dt /= 1000;
      }

      this.lastTime = now;

      this.update(dt);
      this.render();

      this.aId = window.requestAnimationFrame(this.loop.bind(this));
    },

    init: function() {
      this.displayUpdatedValue(
        this.bestScore = localStorage.getItem(this.db) || 0,
        this.bestScoreEl
      );
      this.lastTime = timeStamp();
      this.listen();
      this.loop();
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    const game = new Game({
      canvas: document.getElementById('canvas'),
      levelEl: document.getElementById('display-level'),
      luckyStringEl: document.getElementById('display-luckystring'),
      scoreEl: document.getElementById('display-score'),
      bestScoreEl: document.getElementById('display-bestscore'),
      backspaceButtonEl: document.getElementById('backspace-button'),
      escButtonEl: document.getElementById('esc-button')
    });
    game.load([
      'img/button-sprite.png'
    ]);
    game.init();
    window.game = game;
  });
})();
