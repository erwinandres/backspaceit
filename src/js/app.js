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

  function randomString(length) {
    let string = '';

    for ( var i = 0; i < length; i++ ) {
      string += randomChar(characters);
    }

    return string;
  }

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

          ctx.drawImage(resources.get(this.url),
                        x, y,
                        this.size[0], this.size[1],
                        0, 0,
                        this.size[0], this.size[1]);
      }
  };

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

  function Game(canvas) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.canvasRect = this.canvas.getBoundingClientRect();

    this.tileSize = 48;
    this.rows = 8;
    this.cols = 8;
    this.charList = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    this.board = new Array(this.rows * this.cols).fill(false);

    this.lastAdd = 0; // last chacter added (in s ago)
    this.speed = .8; //s

    this.lastTime;
    this.aId;

    this.cursorAt = [0, 0];
  }

  Game.prototype = {
    fillRandomTile: function() {
      const emptyTiles = [];

      for (let i = this.board.length - 1; i >= 0; i--) {
        if (!this.board[i]) emptyTiles.push(i);
      }

      if (emptyTiles.length === 0) return;

      const randomEmptyTile = Math.floor(Math.random() * emptyTiles.length);
      const randomCharacter = randomChar(this.charList);

      this.board[emptyTiles[randomEmptyTile]] = randomCharacter;
    },

    getTile: function(col, row) {
      return this.board[row * this.cols + col];
    },

    getTileCoordsFromPoint: function(x, y) {
      return [~~(x / this.tileSize), ~~(y / this.tileSize)];
    },

    update: function(dt) {
      this.lastAdd += dt;

      if (this.lastAdd >= this.speed) {
        this.fillRandomTile();

        this.lastAdd = 0;
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

          const tile = this.getTile(i ,j);
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
    },

    onMouseDown: function(e) {
      const touchX = e.clientX - this.canvasRect.left;
      const touchY = e.clientY - this.canvasRect.top;

      this.cursorAt = this.getTileCoordsFromPoint(touchX, touchY);
    },

    handleEvent: function(e) {
      switch (e.type) {
        case 'mousedown':
          this.onMouseDown(e);
          break;
      }
    },

    listen: function() {
      this.canvas.addEventListener('mousedown', this);
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
      this.lastTime = timeStamp();
      this.listen();
      this.loop();
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    const game = new Game(document.getElementById('canvas'));
    game.init();
    window.game = game;
  });
})();
