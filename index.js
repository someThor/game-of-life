class GameOfLife {
  _colorGrid = "rgba(16, 32, 16, 1)";
  _colorDot = "rgba(0, 255, 0, 0.5)";
  _sizeGrid = 1;
  _canvasBuffer = [];
  _stallMin = 25;
  _stallCount = 0;

  generation = 0;
  generationMax = 0;
  tick = 150;
  randomness = 20;
  sizeDot = 16;
  randomSpots = true;
  hideGrid = false;
  blurEffect = true;
  blurAmount = 25;
  reset = false;
  runState = false;

  constructor() {
    const container = document.getElementById("canvas-col");
    this._width = container.clientWidth;
    this._height = container.clientHeight;
    this._canvas = document.getElementById("canvas-main");
    this._init(true);
    this._draw();
    this._setRunState(true);
  }

  _getRandomBool() {
    return Math.random() * 100 < this.randomness;
  }

  _init(useRnd) {
    if (this._canvas.getContext) {
      this._ctx = this._canvas.getContext("2d");
      this._canvas.width = this._width;
      this._canvas.height = this._height;
      this.xCount = Math.floor(this._width / this.sizeDot);
      this.yCount = Math.floor(this._height / this.sizeDot);
      this.grid = [];
      this.gridMap = undefined;
      for (let y = 0; y < this.yCount; y++) {
        for (let x = 0; x < this.xCount; x++) {
          this.grid[y] = !this.grid[y] ? [] : this.grid[y];
          this.grid[y][x] = useRnd ? this._getRandomBool() : false;
        }
      }
    }
    this.reset = false;
  }

  _drawBorder(x, y, w, h) {
    if (!this.hideGrid) {
      this._ctx.fillStyle = this._colorGrid;
      this._ctx.fillRect(x, y, w, h);
    }
  }

  _draw() {
    if (this.blurEffect) {
      let blur = this.blurAmount / 100;
      this._ctx.fillStyle = "rgba(0, 0, 0, " + (1 - blur) + ")";
      this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
    } else {
      this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    }

    let y, x, tmpY, tmpX;

    for (y = 0; y < this.yCount; y++) {
      tmpY = y * this._sizeGrid + y * this.sizeDot - this._sizeGrid;
      this._drawBorder(0, tmpY, this._width, this._sizeGrid);

      for (x = 0; x < this.xCount; x++) {
        tmpX = x * this._sizeGrid + x * this.sizeDot - this._sizeGrid;
        this._drawBorder(tmpX, tmpY, this._sizeGrid, this.sizeDot);

        if (this.grid[y][x]) {
          this._ctx.fillStyle = this._colorDot;
          this._ctx.fillRect(
            tmpX + this._sizeGrid,
            tmpY + this._sizeGrid,
            this.sizeDot - this._sizeGrid,
            this.sizeDot - this._sizeGrid
          );
        }
      }

      this._drawBorder(tmpX + this.sizeDot, tmpY, this._sizeGrid, this.sizeDot);
    }
    this._drawBorder(0, tmpY + this.sizeDot, this._width, this._sizeGrid);
    document.getElementById("generation-value").innerHTML = this.generation;
    document.getElementById("generation-max-value").innerHTML = this.generationMax;
  }

  _getNeighborCount(realX, realY) {
    let count = 0;
    for (let y = realY - 1; y <= realY + 1; y++) {
      for (let x = realX - 1; x <= realX + 1; x++) {
        let checkY = y < 0 ? this.yCount - y - 2 : y < this.yCount ? y : y - this.yCount;
        let checkX = x < 0 ? this.xCount - x - 2 : x < this.xCount ? x : x - this.xCount;
        if (
          this.grid[checkY] &&
          this.grid[checkY][checkX] &&
          !(realX == checkX && realY == checkY)
        ) {
          count++;
        }
      }
    }
    return count;
  }

  _processPoint(y, x) {
    const n = this._getNeighborCount(x, y);
    if (this.grid[y][x] == true && n == 2) {
      return true;
    } else if (n == 3) {
      return true;
    } else {
      return;
    }
  }

  // Detect if pattern is stalled, and update max generation
  _updateStallCount() {
    if (this._canvasBuffer.length > 3) {
      if (
        this._canvasBuffer[0] == this._canvasBuffer[2] ||
        this._canvasBuffer[0] == this._canvasBuffer[3] ||
        this._canvasBuffer[0] == this._canvasBuffer[4]
      ) {
        this._stallCount++;
        this.generation = 0;
      } else {
        this.generation++;
        if (this.generation > this.generationMax) {
          this.generationMax = this.generation;
        }
      }
      this._stallCount = this.generation > 10 ? 0 : this._stallCount;
      this._canvasBuffer.shift();
    }
    this._canvasBuffer.push(JSON.stringify(this.grid));
    return this._stallCount > this._stallMin;
  }

  _updateGrid() {
    let patternStalled = this._updateStallCount();
    let tmp = [];
    function setPoint(y, x, val) {
      tmp[y] = !tmp[y] ? (tmp[y] = [(x = val)]) : tmp[y];
      tmp[y][x] = val;
    }
    for (let y = 0; y < this.yCount; y++) {
      for (let x = 0; x < this.xCount; x++) {
        setPoint(y, x, this._processPoint(y, x));
        if (patternStalled && this.randomSpots && Math.random() * 250 < Math.random()) {
          setPoint(y, x, true);
        }
      }
    }
    this.grid = [...tmp];
    this._draw();
  }

  _setRunState(value) {
    this.runState = value;
    document.getElementById("state-text-running").hidden = !value;
    document.getElementById("state-text-stopped").hidden = value;
    if (this.runState) {
      let self = this;
      clearInterval(this.updateInterval);
      this.updateInterval = setInterval(function () {
        self.update();
      }, this.tick);
    } else {
      this.update();
      clearInterval(this.updateInterval);
    }
  }

  // Public
  update() {
    if (this.reset) {
      this._init(true);
    }

    if (this.runState) {
      this._updateGrid();
    } else {
      this._draw();
    }
  }

  setTick(val) {
    this.tick = val;
    this._setRunState(true);
  }

  toggleReset() {
    this.reset = true;
  }

  toggleStart() {
    this._setRunState(!this.runState);
  }

  updateTick(value) {
    this.tick = value ? value : this.tick;
    this._setRunState(true);
    return this.tick + "ms";
  }

  updateRandomness(value) {
    this.randomness = value ? value : this.randomness;
    this.toggleReset();
    return this.randomness;
  }

  updateSizeDot(value) {
    const sizeDots = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512];
    this.sizeDot = value ? sizeDots[value] : this.sizeDot;
    this.toggleReset();
    return this.sizeDot;
  }

  updateBlur(value) {
    this.blurAmount = value ? value : this.blurAmount;
    return this.blurAmount;
  }
}

const game = new GameOfLife();

// Listeners
document.getElementById("slider-tick-value").innerHTML = game.updateTick();
document.getElementById("slider-tick").oninput = (e) => {
  document.getElementById("slider-tick-value").innerHTML = game.updateTick(e.target.value);
};
document.getElementById("slider-randomness-value").innerHTML = game.updateRandomness();
document.getElementById("slider-randomness").oninput = (e) => {
  document.getElementById("slider-randomness-value").innerHTML = game.updateRandomness(
    e.target.value
  );
};
document.getElementById("slider-dot-size-value").innerHTML = game.updateSizeDot();
document.getElementById("slider-dot-size").oninput = (e) => {
  document.getElementById("slider-dot-size-value").innerHTML = game.updateSizeDot(e.target.value);
};
document.getElementById("checkbox-show-grid").checked = !game.hideGrid;
document.getElementById("checkbox-show-grid").onchange = (e) => {
  game.hideGrid = !e.target.checked;
};
document.getElementById("checkbox-generate-random").checked = game.randomSpots;
document.getElementById("checkbox-generate-random").onchange = (e) => {
  game.randomSpots = e.target.checked;
};
document.getElementById("checkbox-blur-effect").checked = game.blurEffect;
document.getElementById("checkbox-blur-effect").onchange = (e) => {
  game.blurEffect = e.target.checked;
};

document.getElementById("slider-blur-value").innerHTML = game.updateBlur();
document.getElementById("slider-blur").oninput = (e) => {
  document.getElementById("slider-blur-value").innerHTML = game.updateBlur(e.target.value);
};

window.addEventListener(
  "keyup",
  function (e) {
    if (e.key == " ") {
      game.toggleReset();
    }
  },
  false
);
