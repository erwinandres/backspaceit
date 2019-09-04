(function() {
  'use strict';

  function timeStamp () {
    return window.performance && window.performance.now ?
      window.performance.now() :
      Date.now();
  }

  function Game(canvas) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.canvasRect = this.canvas.getBoundingClientRect();

    this.tileSize = 48;
    this.rows = 8;
    this.cols = 8;

    this.lastTime;
    this.aId;

    this.cursorAt = [0, 0];
  }

  Game.prototype = {
    getTileCoordsFromPoint: function(x, y) {
      return [~~(x / this.tileSize), ~~(y / this.tileSize)];
    },

    update: function(dt) {},

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

          this.ctx.lineWidth = lineWidth;
          this.ctx.strokeStyle = color;
          this.ctx.strokeRect(
            i * this.tileSize + offset,
            j * this.tileSize + offset,
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

    listen: function() {
      this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
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
  });
})();
