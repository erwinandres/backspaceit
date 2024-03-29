// ZzFXmicro - Zuper Zmall Zound Zynth - MIT License - Copyright 2019 Frank Force
zzfx_v=.5;zzfx_x=new AudioContext;zzfx=(e,f,a,b=1,d=.1,g=0,h=0,k=0,l=0)=>{let S=44100,P=Math.PI;a*=2*P/S;a*=1+f*(2*Math.random()-1);g*=1E3*P/(S**2);b=0<b?S*(10<b?10:b)|0:1;d*=b|0;k*=2*P/S;l*=P;f=[];for(var m=0,n=0,c=0;c<b;++c)f[c]=e*zzfx_v*Math.cos(m*a*Math.cos(n*k+l))*(c<d?c/d:1-(c-d)/(b-d)),m+=1+h*(2*Math.random()-1),n+=1+h*(2*Math.random()-1),a+=g;e=zzfx_x.createBuffer(1,b,S);a=zzfx_x.createBufferSource();e.getChannelData(0).set(f);a.buffer=e;a.connect(zzfx_x.destination);a.start();return a}

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

  function renderEntity(ctx, entity, sizeAdjustmentRatio, sprite) {
    sizeAdjustmentRatio = sizeAdjustmentRatio || 1;
    sprite = sprite || entity.sprite;

    const scale = entity.scale || 1;

    ctx.setTransform(scale / sizeAdjustmentRatio, 0, 0, scale / sizeAdjustmentRatio, entity.x / sizeAdjustmentRatio, entity.y / sizeAdjustmentRatio);
    sprite.render(ctx, [entity.w, entity.h]);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
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

      render: function(ctx, dSize) {
          var frame;
          dSize = dSize || this.size;

          if(this.speed > 0) {
              var max = this.frames.length;
              var idx = Math.floor(this._index);
              frame = this.frames[idx % max];

              if(this.once && idx >= max) {
                  this.done = true;
                  return;
              }
          } else {
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
                        dSize[0], dSize[1]);
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

    sound: function() {
      zzfx(.5,.1,1549,.1,0,0,1.2,48.9,.17); // ZzFX 77467
    },

    setState: function(newState) {
      if (newState === 1) {
        zzfx(.5,.1,1549,.1,0,0,1.2,48.9,.17); // ZzFX 77467
      }

      this.state = newState;
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
    this.specialChars = '*+-/\\?';
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

    this.font = {
      w: 16,
      h: 16,
      sprites: [],
      spritesSpecial: []
    }

    this.startButton = new Button(
      [
        new Sprite('button-sprite.png', [0, 0], [64, 32]),
        new Sprite('button-sprite.png', [64, 0], [64, 32])
      ],
      (this.width/2) - 48, (this.height/2) - 24,
      96, 48,
      0
    );

    this.escButton = new Button(
      [
        new Sprite('button-sprite.png', [0, 96], [32, 32]),
        new Sprite('button-sprite.png', [32, 96], [32, 32])
      ],
      (this.width/2) - 64, (this.height/2) - 24,
      48, 48,
      0
    );

    this.exitButton = new Button(
      [
        new Sprite('button-sprite.png', [0, 32], [64, 32]),
        new Sprite('button-sprite.png', [64, 32], [64, 32])
      ],
      (this.width/2) + 16, (this.height/2) - 24,
      96, 48,
      0
    );

    this.shareButton = new Button(
      [
        new Sprite('button-sprite.png', [0, 64], [64, 32]),
        new Sprite('button-sprite.png', [64, 64], [64, 32])
      ],
      (this.width/2) - 112, (this.height/2) - 24,
      96, 48,
      0
    );

    this.gameOverText = {
      w: 192,
      h: 48
    }
    this.gameOverText.x = (this.width/2) - (this.gameOverText.w/2);
    this.gameOverText.y = 96;
    this.gameOverText.sprite = new Sprite('text.png', [0, 0], [192, 48]);

    this.pauseText = {
      w: 192,
      h: 48
    }
    this.pauseText.x = (this.width/2) - (this.pauseText.w/2);
    this.pauseText.y = 96;
    this.pauseText.sprite = new Sprite('text.png', [0, 48], [192, 48]);
  }

  Game.prototype = {
    loadFontSprite: function() {
      for (let i = 0; i < this.charList.length; i++) {
        this.font.sprites.push(new Sprite('font.png', [i * 16, 0], [16, 16]));
      }

      for (let i = 0; i < this.specialChars.length; i++) {
        this.font.spritesSpecial.push(new Sprite('font.png', [i * 16, 16], [16, 16]));
      }
    },

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

    applySpecialEffect: function(tile) {
      let char = this.board[tile];

      if (char === '?') {
        // pick random special char except the last one ('?').
        char = this.specialChars[Math.floor(Math.random() * (this.specialChars.length - 1))];
      }

      switch (char) {
        case '-':
          this.clearRow(this.cursorAt[1]);
          zzfx(1,.1,615,.2,.39,1.7,2.9,0,.07); // ZzFX 49164
          break;
        case '+':
          this.clearRow(this.cursorAt[1]);
          this.clearCol(this.cursorAt[0]);
          zzfx(1,.1,674,.2,.19,2.7,1,4.1,.71); // ZzFX 52990
          break;
        case '/':
          this.clearSlash(this.cursorAt);
          zzfx(1,.1,1302,.3,.13,.1,4.1,23.6,.45); // ZzFX 23327
          break;
        case '\\':
          this.clearBackSlash(this.cursorAt);
          zzfx(1,.1,958,.3,.63,9.2,2.7,70.2,.15); // ZzFX 24852
          break;
        case '*':
          this.clearRow(this.cursorAt[1]);
          this.clearCol(this.cursorAt[0]);
          this.clearSlash(this.cursorAt);
          this.clearBackSlash(this.cursorAt);
          zzfx(1,.1,9,.8,.17,6.3,.9,8.3,.2); // ZzFX 6501
          break;
        default:
          this.board[tile] = null;
          break;
      }
    },

    backspace: function() {
      const tile = this.getTileIndex(this.cursorAt[0], this.cursorAt[1]); 

      if (this.board[tile]) {
        this.applySpecialEffect(tile);
        this.displayUpdatedValue(this.score += this.scorePerTile, this.scoreEl);

        this.toNextLevel--;

        if (this.toNextLevel <= 0) {
          this.displayUpdatedValue(this.level++, this.levelEl);
          this.toNextLevel = 10;
        }

        zzfx(1,.1,1363,.3,0,.1,3.2,0,.85); // ZzFX 39192
      }
    },

    searchLuckyString: function() {
      let indexFound = [];
      let currentLSIndex = 0;

      for (let i = 0; i < this.board.length; i++) {
        const tile = this.board[i];

        if (tile === this.luckyString[currentLSIndex]) {
          indexFound.push(i);
          currentLSIndex ++;
        } else {
          currentLSIndex = 0;
          indexFound = [];
        }

        if (indexFound.length === this.luckyString.length) {
          for (let j = 0; j < indexFound.length; j++) {
            this.board[indexFound[j]] = null;
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

          zzfx(1,.1,29,.9,.29,.3,0,13,.69); // ZzFX 9289
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

            zzfx(1,.1,153,1.7,.13,.2,.7,4.2,.06); // ZzFX 13305
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
            this.searchLuckyString();

            this.lastAdd = 0;

            zzfx(.8,.1,190,.05,.06,1.8,.5,0,.31); // ZzFX 62656
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
            const charEntity = {
              x: x + (this.tileSize/2) - (this.font.w/2),
              y: y + (this.tileSize/2) - (this.font.h/2),
              w: this.font.w,
              h: this.font.h
            }

            charEntity.sprite = this.specialChars.indexOf(tile) > -1 ?
              this.font.spritesSpecial[this.specialChars.indexOf(tile)] :
              this.font.sprites[this.charList.indexOf(tile)];

            renderEntity(this.ctx, charEntity);
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
            this.shareButton.render(this.ctx);
            this.exitButton.render(this.ctx);

            renderEntity(this.ctx, this.gameOverText);

            break;
          case 'pause':
            this.escButton.render(this.ctx);
            this.exitButton.render(this.ctx);

            renderEntity(this.ctx, this.pauseText);

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
            this.startButton.setState(1);
          }
          break;
        case 'pause':
          if (this.escButton.hover([touchX, touchY])) {
            this.escButton.setState(1);
          } else if (this.exitButton.hover([touchX, touchY])) {
            this.exitButton.setState(1);
          }

          break;
        case 'gameover':
          if (this.shareButton.hover([touchX, touchY])) {
            this.shareButton.setState(1);
          } else if (this.exitButton.hover([touchX, touchY])) {
            this.exitButton.setState(1);
          }

          break;
        case 'playing':
          this.cursorAt = this.getTileCoordsFromPoint(touchX, touchY);
          zzfx(1.5,.05,1500,.02,.01,2.1,0,0,.31); // ZzFX 51217
          break;
      }
    },

    onMouseUp: function(e) {
      const touch = e.changedTouches && e.changedTouche[0];
      const x = touch ? touch.clientX : e.clientX;
      const y = touch ? touch.clientY : e.clientY;

      const touchX = x - this.canvasRect.left;
      const touchY = y - this.canvasRect.top;

      this.startButton.setState(0);
      this.escButton.setState(0);
      this.exitButton.setState(0);
      this.shareButton.setState(0);

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
            window.open(
              'https://twitter.com/intent/tweet?text=I reached level ' +
              this.level +
              ' and scored ' +
              this.score +
              ' points on "Backspace It".&hashtags=backspaceItGame,js13kGames&url=' +
              location.href
            );
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
      this.loadFontSprite();
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
      'button-sprite.png',
      'font.png',
      'text.png'
    ]);
    game.init();
  });
})();
