class DiagonalCollisionInfo {
  constructor() {
    this.collisionPoints = [];
    this.leftSideOfPlayerCollided = false;
    this.rightSideOfPlayerCollided = false;
    this.topSideOfPlayerCollided = false;
    this.bottomSideOfPlayerCollided = false;
  }
}

class Line {
  constructor(x1, y1, x2, y2) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    
    this.isHorizontal = y1 === y2;
    this.isVertical = x1 === x2;
    this.isDiagonal = !this.isHorizontal && !this.isVertical;

    this.ensurePointsAreInOrder();

    this.midPoint = createVector((x1 + x2) / 2, (y1 + y2) / 2);

    this.diagonalCollisionInfo = new DiagonalCollisionInfo();
  }

  ensurePointsAreInOrder() {
    if (this.isHorizontal || this.isVertical) {
      if (this.x1 > this.x2 || this.y1 > this.y2) {
        [this.x1, this.x2] = [this.x2, this.x1];
        [this.y1, this.y2] = [this.y2, this.y1];
      }
    }
  }
}
