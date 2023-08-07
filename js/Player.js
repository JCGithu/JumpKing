let minJumpSpeed = 5
let maxJumpSpeed = 22
let maxJumpTimer = 30
let jumpSpeedHorizontal = 8
let terminalVelocity = 20
let gravity = 0.6;

let runSpeed = 4;
let maxBlizzardForce = 0.3;
let blizzardMaxSpeedHoldTime = 150
let blizzardAccelerationMagnitude = 0.003;
let blizzardImageSpeedMultiplier = 50;

let iceFrictionAcceleration = 0.2;
let playerIceRunAcceleration = 0.2;

function isBetween(a, b1, b2) {
  return (b1 <= a && a <= b2) || (b2 <= a && a <= b1)
}

class AIAction {
  constructor(isJump, holdTime, xDirection) {
    this.isJump = isJump;
    this.holdTime = holdTime;//number between 0 and 1
    this.xDirection = xDirection;
  }
}

class PlayerState {
  constructor() {
    this.currentPos = createVector(width / 2, height - 200); // this is the top left corner of the hitbox
    this.currentSpeed = createVector(0, 0);
    this.isOnGround = false;
    this.blizzardForce = 0;
    this.blizzardForceAccelerationDirection = 1;
    this.maxBlizzardForceTimer = 0;
    this.snowImagePosition = 0;
    this.bestHeightReached = 0;
    this.bestLevelReached = 0;
    this.reachedHeightAtStepNo = 0;
    this.bestLevelReachedOnActionNo = 0;
    this.currentLevelNo = 0;
    this.jumpStartingHeight = 0;
    this.facingRight = true;
    this.isWaitingToStartAction = false;
    this.actionStarted = false;
  }
}

class Player {
  constructor(isChat) {
    this.width = 50;
    this.height = 65;

    this.showingSnow = false;

    this.chatPlayer = isChat;
    let poses = isChat ? 'posesOriginal' : 'poses'
    //Images
    this.idleImage = loadImage(`images/${poses}/idle.png`);
    this.squatImage = loadImage(`images/${poses}/squat.png`);
    this.jumpImage = loadImage(`images/${poses}/jump.png`);
    this.oofImage = loadImage(`images/${poses}/oof.png`);
    this.run1Image = loadImage(`images/${poses}/run1.png`);
    this.run2Image = loadImage(`images/${poses}/run2.png`);
    this.run3Image = loadImage(`images/${poses}/run3.png`);
    this.fallenImage = loadImage(`images/${poses}/fallen.png`);
    this.fallImage = loadImage(`images/${poses}/fall.png`);



    this.runCycle = [];

    for (let i = 0; i < 13; i++) {
      this.runCycle.push(this.run1Image);
    }
    
    for (let i = 0; i < 6; i++) {
      this.runCycle.push(this.run2Image);
    }
    
    for (let i = 0; i < 14; i++) {
      this.runCycle.push(this.run3Image);
    }
    
    this.maxCollisionChecks = 20;
    this.currentNumberOfCollisionChecks = 0;
    this.chatPlayer = false;
    this.ResetPlayer();
    this.snowImagePosition = width;
  }

  ResetPlayer() {
    this.currentPos = createVector(width / 4, height - 200);
    this.currentSpeed = createVector(0, 0);
    this.isOnGround = false;
    this.jumpHeld = false;
    this.jumpTimer = 0;
    this.leftHeld = false;
    this.rightHeld = false;
    this.facingRight = true;
    this.hasBumped = false;
    this.isRunning = false;
    this.isSlidding = false;
    this.currentRunIndex = 1;
    this.bestHeightReached = 0;
    this.bestLevelReached = 0;
    this.sliddingRight = false;
    this.currentLevelNo = 0;
    this.jumpStartingHeight = 0;
    this.hasFallen = false;
    this.blizzardForce = 0;
    this.blizzardForceAccelerationDirection = 1;
    this.maxBlizzardForceTimer = 0;
    this.snowImagePosition = 0;
    this.hasFinishedInstructions = false;
  }

  Update() {
    if (this.playersDead) return;
    let currentLines = this.chatPlayer ? chatLevels[this.currentLevelNo].lines : levels[this.currentLevelNo].lines;
    this.UpdatePlayerSlide(currentLines);
    this.ApplyGravity()
    this.ApplyBlizzardForce();
    this.UpdatePlayerRun(currentLines);
    this.UpdateAIAction();
    this.currentPos.add(this.currentSpeed);
    this.previousSpeed = this.currentSpeed.copy();

    this.currentNumberOfCollisionChecks = 0;
    this.CheckCollisions(currentLines)
    this.UpdateJumpTimer()
    this.CheckForLevelChange();
  }

  saveState() {
    this.stateSave = {
      currentSpeed : this.currentSpeed,
      isOnGround : this.isOnGround,  
      blizzardForce : this.blizzardForce,
      blizzardForceAccelerationDirection : this.blizzardForceAccelerationDirection,
      maxBlizzardForceTimer : this.maxBlizzardForceTimer,
      snowImagePosition : this.snowImagePosition,
      bestHeightReached : this.bestHeightReached,
      bestLevelReached : this.bestLevelReached,
      currentLevelNo : this.currentLevelNo,
      jumpStartingHeight : this.jumpStartingHeight,
      facingRight : this.facingRight,
    }
    this.stateLocation = {
      x : this.currentPos.x,
      y: this.currentPos.y
    }
  }

  loadState() {
    this.currentPos.x = this.stateLocation.x;
    this.currentPos.y = this.stateLocation.y;
    Object.keys(this.stateSave).forEach(key => {
      this[key] = this.stateSave[key];
    })
  }

  ApplyGravity() {
    if (this.isOnGround) return;
    let gravityFactor = this.isSlidding ? 0.5 : 1;
    this.currentSpeed.y = min(this.currentSpeed.y + gravity * gravityFactor, terminalVelocity);
    if (this.isSlidding) {
      let xGravityFactor = this.sliddingRight ? 0.5 : -0.5;
      this.currentSpeed.x = constrain(this.currentSpeed.x + gravity * xGravityFactor, -terminalVelocity * 0.5, terminalVelocity * 0.5);
    }
  }


  ApplyBlizzardForce() {
    if (abs(this.blizzardForce) >= maxBlizzardForce) {
      this.maxBlizzardForceTimer += 1;
      if (this.maxBlizzardForceTimer > blizzardMaxSpeedHoldTime) {
        this.blizzardForceAccelerationDirection *= -1;
        this.maxBlizzardForceTimer = 0;
      }
    }
    this.blizzardForce += this.blizzardForceAccelerationDirection * blizzardAccelerationMagnitude;
    if (abs(this.blizzardForce) > maxBlizzardForce) this.blizzardForce = maxBlizzardForce * this.blizzardForceAccelerationDirection;
    this.snowImagePosition += this.blizzardForce * blizzardImageSpeedMultiplier;
    if (!this.isOnGround && levels[this.currentLevelNo].isBlizzardLevel) this.currentSpeed.x += this.blizzardForce;
  }

  CheckCollisions(currentLines) {
    let collidedLines = [];
    for (let i = 0; i < currentLines.length; i++) {
      if (this.IsCollidingWithLine(currentLines[i])) collidedLines.push(currentLines[i]);
    }
    let chosenLine = this.GetPriorityCollision(collidedLines);
    if (chosenLine == null) return;
    let potentialLanding = false;

    if (chosenLine.isHorizontal) {
      if (this.IsMovingDown()) {
        // so the player has potentially landed
        //correct the position first then player has landed
        this.currentPos.y = chosenLine.y1 - this.height;
        if (collidedLines.length > 1) {
          potentialLanding = true;
          if (levels[this.currentLevelNo].isIceLevel) {
            this.currentSpeed.y = 0;
            if (this.IsMovingRight()) {
              this.currentSpeed.x -= iceFrictionAcceleration;
            } else {
              this.currentSpeed.x += iceFrictionAcceleration;
            }
          } else {
            this.currentSpeed = createVector(0, 0);
          }
        } else {
          this.playerLanded();
        }
      } else {
        this.currentSpeed.y = 0 - this.currentSpeed.y / 2;
        this.currentPos.y = chosenLine.y1;
        bumpSound.play();
      }
    } else if (chosenLine.isVertical) {
        if (this.IsMovingRight()) {
            this.currentPos.x = chosenLine.x1 - this.width;
        } else if (this.IsMovingLeft()) {
            this.currentPos.x = chosenLine.x1;
        } else {
          // this means we've hit a wall but we arent moving left or right
          // meaning we prioritised the floor first which stopped our velocity
          // so we need a variable to store the speed we had before any transions were made
          if (this.previousSpeed.x > 0) {
            this.currentPos.x = chosenLine.x1 - this.width;
          } else {
            this.currentPos.x = chosenLine.x1;
          }
        }
        this.currentSpeed.x = 0 - this.currentSpeed.x / 2;
        if (!this.isOnGround) {
          this.hasBumped = true;
          bumpSound.play();
        }
    } else {
      this.isSlidding = true;
      this.hasBumped = true;

      let left = chosenLine.diagonalCollisionInfo.leftSideOfPlayerCollided;
      let right = chosenLine.diagonalCollisionInfo.rightSideOfPlayerCollided;
      let top = chosenLine.diagonalCollisionInfo.topSideOfPlayerCollided;
      let bottom = chosenLine.diagonalCollisionInfo.bottomSideOfPlayerCollided;

      if (chosenLine.diagonalCollisionInfo.collisionPoints.length === 2) {
        let midpoint = chosenLine.diagonalCollisionInfo.collisionPoints[0].copy();
        midpoint.add(chosenLine.diagonalCollisionInfo.collisionPoints[1].copy());
        midpoint.mult(0.5);

        let playerCornerPos = null;

        if (top && left) {
          playerCornerPos = this.currentPos.copy();
        }
        if (top && right) {
          playerCornerPos = this.currentPos.copy();
          playerCornerPos.x += this.width;
        }
        if (bottom && left) {
          playerCornerPos = this.currentPos.copy();
          playerCornerPos.y += this.height;
          this.sliddingRight = true;
        }
        if (bottom && right) {
          playerCornerPos = this.currentPos.copy();
          playerCornerPos.y += this.height;
          playerCornerPos.x += this.width;
          this.sliddingRight = false;
        }
        let correctionX = 0;
        let correctionY = 0;

        if (playerCornerPos === null) {
          playerCornerPos = this.currentPos.copy();
          if (this.IsMovingDown()) playerCornerPos.y += this.height;
          if (this.IsMovingRight()) playerCornerPos.x += this.width;
        }
        correctionX = midpoint.x - playerCornerPos.x;
        correctionY = midpoint.y - playerCornerPos.y;

        this.currentPos.x += correctionX;
        this.currentPos.y += correctionY;

        //get the current speed based on the dot product of the current veloctiy with the line
        let lineVector = createVector(chosenLine.x2 - chosenLine.x1, chosenLine.y2 - chosenLine.y1)
        lineVector.normalize();
        let speedMagnitude = p5.Vector.dot(this.currentSpeed, lineVector);
        this.currentSpeed = p5.Vector.mult(lineVector, speedMagnitude);

        if (top) {
          this.currentSpeed = createVector(0, 0)
          this.isSlidding = false;
        }


      } else {
        if (top) {// bounce off the point as if it were horizontal
          let closestPointY = max(chosenLine.y1, chosenLine.y2)
          this.currentPos.y = closestPointY + 1;
          this.currentSpeed.y = 0 - this.currentSpeed.y / 2;
        }
        if (bottom) {//treat like floor
          let closestPointY = min(chosenLine.y1, chosenLine.y2)
          this.currentSpeed = createVector(0, 0)
          this.currentPos.y = closestPointY - this.height - 1;
        }
        if (left) {// treat like a left wall
          this.currentPos.x = max(chosenLine.x1, chosenLine.x2) + 1;
          if (this.IsMovingLeft()) this.currentSpeed.x = 0 - this.currentSpeed.x / 2;
        }
        if (right) {// treat like a right wall
          this.currentPos.x = min(chosenLine.x1, chosenLine.x2) - this.width - 1;
          if (this.IsMovingRight()) this.currentSpeed.x = 0 - this.currentSpeed.x / 2;
        }
        if (left || right && !this.isOnGround) this.hasBumped = true;
      }
    }
    if (collidedLines.length > 1) {
      this.currentNumberOfCollisionChecks += 1;
      if (this.currentNumberOfCollisionChecks > this.maxCollisionChecks) {
        this.hasFinishedInstructions = true;
        this.playersDead = true;
      } else {
        this.CheckCollisions(currentLines);
      }

      //ok so this is gonna need some splaining.
      // so if we've "landed" but it wasnt the last correction then we need to check again if the dude has landed
      // just incase the corrections have moved him off the surface
      if (potentialLanding && this.IsPlayerOnGround(currentLines)) this.playerLanded();
    }

  }

  Show() {
    if (this.playersDead) return;
    push();
    translate(this.currentPos.x, this.currentPos.y);
    let imageToUse = this.GetImageToUseBasedOnState();
      
    if (!this.facingRight) {
      push();
      scale(-1, 1);
      if (this.hasBumped) {
        image(imageToUse, -70, -30);
      } else if (imageToUse == jumpImage || imageToUse == fallImage) {
        image(imageToUse, -70, -28);
      } else {
        image(imageToUse, -70, -35);
      }
      pop();
    } else {
      if (this.hasBumped) {
        image(imageToUse, -20, -30);
      } else if (imageToUse == jumpImage || imageToUse == fallImage) {
        image(imageToUse, -20, -28);
      } else {
        image(imageToUse, -20, -35);
      }
    }
    pop();

    //show snow
    if (levels[this.currentLevelNo].isBlizzardLevel && !this.chatPlayer) {
      let snowDrawPosition = this.snowImagePosition;
      while (snowDrawPosition <= (width / 2)) snowDrawPosition += (width / 2);
      snowDrawPosition = snowDrawPosition % (width/2);
      playerBuffer.image(snowImage, snowDrawPosition, 0);
      playerBuffer.image(snowImage, snowDrawPosition - (width/2), 0);
      image(playerBuffer, 0 ,0);
    }
    if (levels[this.currentLevelNo].isBlizzardLevel && this.chatPlayer) {
      let snowDrawPosition = this.snowImagePosition;
      while (snowDrawPosition <= (width / 2)) snowDrawPosition += (width / 2);
      snowDrawPosition = snowDrawPosition % (width/2);
      chatBuffer.image(snowImage, snowDrawPosition, 0);
      chatBuffer.image(snowImage, snowDrawPosition - (width / 2), 0);
      image(chatBuffer, width/2 ,0);
    }
    chatBuffer.clear();
    playerBuffer.clear();
  }

  Jump() {
    if (!this.isOnGround) return;
    let verticalJumpSpeed = map(this.jumpTimer, 0, maxJumpTimer, minJumpSpeed, maxJumpSpeed)
    if (this.leftHeld) {
      this.currentSpeed = createVector(-jumpSpeedHorizontal, -verticalJumpSpeed)
      this.facingRight = false;
    } else if (this.rightHeld) {
      this.currentSpeed = createVector(jumpSpeedHorizontal, -verticalJumpSpeed)
      this.facingRight = true;
    } else {
      this.currentSpeed = createVector(0, -verticalJumpSpeed)
    }
    this.hasFallen = false;
    this.isOnGround = false
    this.jumpTimer = 0
    this.jumpStartingHeight = (height - this.currentPos.y) + height * this.currentLevelNo;
    jumpSound.play();
  }

  // to determine if we are colliding with any walls or shit we need to do some collision detection
  // this is done by taking the collision of the 4 lines that make up the hitbox

  IsCollidingWithLine(l) {
    if (l.isHorizontal) {
      var isRectWithinLineX = (l.x1 < this.currentPos.x && this.currentPos.x < l.x2) || (l.x1 < this.currentPos.x + this.width && this.currentPos.x + this.width < l.x2) || (this.currentPos.x < l.x1 && l.x1 < this.currentPos.x + this.width) || (this.currentPos.x < l.x2 && l.x2 < this.currentPos.x + this.width);
      var isRectWithinLineY = this.currentPos.y < l.y1 && l.y1 < this.currentPos.y + this.height;
      return isRectWithinLineX && isRectWithinLineY;
    } else if (l.isVertical) {
      isRectWithinLineY = (l.y1 < this.currentPos.y && this.currentPos.y < l.y2) || (l.y1 < this.currentPos.y + this.height && this.currentPos.y + this.height < l.y2) || (this.currentPos.y < l.y1 && l.y1 < this.currentPos.y + this.height) || (this.currentPos.y < l.y2 && l.y2 < this.currentPos.y + this.height);
      isRectWithinLineX = this.currentPos.x < l.x1 && l.x1 < this.currentPos.x + this.width;
      return isRectWithinLineX && isRectWithinLineY;
    } else {
      let tl = this.currentPos.copy();
      let tr = tl.copy();
      tr.x += this.width;
      let bl = tl.copy();
      bl.y += this.height - 1;
      let br = bl.copy();
      br.x += this.width;

      let leftCollision = AreLinesColliding(tl.x, tl.y, bl.x, bl.y, l.x1, l.y1, l.x2, l.y2);
      let rightCollision = AreLinesColliding(tr.x, tr.y, br.x, br.y, l.x1, l.y1, l.x2, l.y2);
      let topCollision = AreLinesColliding(tl.x, tl.y, tr.x, tr.y, l.x1, l.y1, l.x2, l.y2);
      let bottomCollision = AreLinesColliding(bl.x, bl.y, br.x, br.y, l.x1, l.y1, l.x2, l.y2);

      if (leftCollision[0] || rightCollision[0] || topCollision[0] || bottomCollision[0]) {
        let collisionInfo = new DiagonalCollisionInfo();
        collisionInfo.leftSideOfPlayerCollided = leftCollision[0]
        collisionInfo.rightSideOfPlayerCollided = rightCollision[0];
        collisionInfo.topSideOfPlayerCollided = topCollision[0];
        collisionInfo.bottomSideOfPlayerCollided = bottomCollision[0];

        if (leftCollision[0]) collisionInfo.collisionPoints.push(createVector(leftCollision[1], leftCollision[2]))
        if (rightCollision[0]) collisionInfo.collisionPoints.push(createVector(rightCollision[1], rightCollision[2]))
        if (topCollision[0]) collisionInfo.collisionPoints.push(createVector(topCollision[1], topCollision[2]))
        if (bottomCollision[0]) collisionInfo.collisionPoints.push(createVector(bottomCollision[1], bottomCollision[2]))

        l.diagonalCollisionInfo = collisionInfo;
        return true;
      } else {
        return false;
      }
    }
  }

  UpdateJumpTimer() {
    if (this.isOnGround && this.jumpHeld && this.jumpTimer < maxJumpTimer) this.jumpTimer += 1;
  }


  IsMovingUp() {
    return this.currentSpeed.y < 0;
  }

  IsMovingDown() {
    return this.currentSpeed.y > 0;
  }

  IsMovingLeft() {
    return this.currentSpeed.x < 0;
  }

  IsMovingRight() {
    return this.currentSpeed.x > 0;
  }

  GetImageToUseBasedOnState() {
    if (this.jumpHeld && this.isOnGround) return this.squatImage;
    if (this.hasFallen) return this.fallenImage;
    if (this.hasBumped) return this.oofImage;
    if (this.currentSpeed.y < 0) return this.jumpImage;
    if (this.isRunning) {
      this.currentRunIndex += 1;
      if (this.currentRunIndex >= this.runCycle.length) this.currentRunIndex = 0;
      return (this.runCycle[this.currentRunIndex])
    }
    if (this.isOnGround) return this.idleImage;
    return this.fallImage;
  }

  UpdatePlayerSlide(currentLines) {
    if (this.isSlidding && !this.IsPlayerOnDiagonal(currentLines)) this.isSlidding = false;
  }

  UpdatePlayerRun(currentLines) {
    this.isRunning = false;
    let runAllowed = (!levels[this.currentLevelNo].isBlizzardLevel || this.currentLevelNo === 31 || this.currentLevelNo == 25);
    if (this.isOnGround) {
      if (!this.IsPlayerOnGround(currentLines)) {
        this.isOnGround = false;
        return;
      }
      if (!this.jumpHeld) {
        if (this.rightHeld && runAllowed) {
          this.hasFallen = false;
          this.isRunning = true;
          this.facingRight = true;
          if (!levels[this.currentLevelNo].isIceLevel) {
            this.currentSpeed = createVector(runSpeed, 0);
          } else {
            this.currentSpeed.x += playerIceRunAcceleration;
            this.currentSpeed.x = min(runSpeed, this.currentSpeed.x);
          }
        } else if (this.leftHeld && runAllowed) {
          this.hasFallen = false;
          this.isRunning = true;
          this.facingRight = false;
          if (!levels[this.currentLevelNo].isIceLevel) {
            this.currentSpeed = createVector(-runSpeed, 0);
          } else {
            this.currentSpeed.x -= playerIceRunAcceleration;
            this.currentSpeed.x = max(0 - runSpeed, this.currentSpeed.x);
          }
        } else {
          if (!levels[this.currentLevelNo].isIceLevel) {
            this.currentSpeed = createVector(0, 0);
          } else {
            this.currentSpeed.y = 0;
            if (this.IsMovingRight()) {
                this.currentSpeed.x -= iceFrictionAcceleration;
            } else {
                this.currentSpeed.x += iceFrictionAcceleration;
            }
            if (abs(this.currentSpeed.x) <= iceFrictionAcceleration) {
                this.currentSpeed.x = 0;
            }
          }
        }
      } else {
        if (!levels[this.currentLevelNo].isIceLevel) {
          this.currentSpeed = createVector(0, 0);
        } else {
          this.currentSpeed.y = 0;
          if (this.IsMovingRight()) {
            this.currentSpeed.x -= iceFrictionAcceleration;
          } else {
            this.currentSpeed.x += iceFrictionAcceleration;
          }
          if (abs(this.currentSpeed.x) <= iceFrictionAcceleration) {
            this.currentSpeed.x = 0;
          }
        }
      }
    }
  }

  IsPlayerOnGround(currentLines) {
    this.currentPos.y += 1;
    for (let i = 0; i < currentLines.length; i++) {
      if (currentLines[i].isHorizontal && this.IsCollidingWithLine(currentLines[i])) {
        this.currentPos.y -= 1;
        return true;
      }
    }
    this.currentPos.y -= 1;
    return false;
  }

  IsPlayerOnDiagonal(currentLines) {
    this.currentPos.y += 5;
    for (let i = 0; i < currentLines.length; i++) {
      if (currentLines[i].isDiagonal && this.IsCollidingWithLine(currentLines[i])) {
        this.currentPos.y -= 5;
        return true;
      }
    }
    this.currentPos.y -= 5;
    return false;
  }

  GetPriorityCollision(collidedLines) {
    if (collidedLines.length === 2) {
      let vert = null;
      let horiz = null;
      let diag = null;
  
      for (const line of collidedLines) {
        if (line.isVertical) vert = line;
        if (line.isHorizontal) horiz = line;
        if (line.isDiagonal) diag = line;
      }
  
      if (vert && horiz && this.IsMovingUp() && vert.midPoint.y > horiz.midPoint.y) return vert;
      if (horiz && diag && diag.midPoint.y > horiz.midPoint.y) return horiz;
    }

    // check the inverse of the velocity to see if the corrections fit in the range
    let maxAllowedXCorrection = 0 - this.currentSpeed.x;
    let maxAllowedYCorrection = 0 - this.currentSpeed.y;


    //if multiple collisions detected use the one that requires the least correction

    let minCorrection = 10000;

    let chosenLine = null;
    if (collidedLines.length === 0) return null;

    chosenLine = collidedLines[0];
    if (collidedLines.length < 1) return chosenLine;
    for (let l of collidedLines) {
      let directedCorrection = createVector(0, 0)
      let correction = 10000;
      if (l.isHorizontal) {
        if (this.IsMovingDown()) {
          directedCorrection.y = l.y1 - (this.currentPos.y + this.height)
          correction = abs(directedCorrection)
          correction = abs(this.currentPos.y - (l.y1 - this.height))
        } else {
          // if moving up then we've hit a roof and we bounce off
          directedCorrection.y = l.y1 - this.currentPos.y;
          correction = abs(this.currentPos.y - l.y1);
        }
      } else if (l.isVertical) {
        if (this.IsMovingRight()) {
          directedCorrection.x = l.x1 - (this.currentPos.x + this.width);
          correction = abs(this.currentPos.x - (l.x1 - this.width));
        } else {
          directedCorrection.x = l.x1 - this.currentPos.x;
          correction = abs(this.currentPos.x - l.x1);
        }
      } else {
        //this bitch diagonal
        // so we're moving the point to the diagonal linees
        // if we get the midpoint of the 2 intersection points then we gucci
        // if there is only 1 intersection point then just treat it as a wall/ roof
        if (l.diagonalCollisionInfo.collisionPoints.length === 2) {
          let midpoint = l.diagonalCollisionInfo.collisionPoints[0].copy();
          midpoint.add(l.diagonalCollisionInfo.collisionPoints[1].copy());
          midpoint.mult(0.5);

          let left = l.diagonalCollisionInfo.leftSideOfPlayerCollided;
          let right = l.diagonalCollisionInfo.rightSideOfPlayerCollided;
          let top = l.diagonalCollisionInfo.topSideOfPlayerCollided;
          let bottom = l.diagonalCollisionInfo.bottomSideOfPlayerCollided;

          let playerCornerPos = null;
          if (top && left) {
            playerCornerPos = this.currentPos.copy();
          }
          if (top && right) {
            playerCornerPos = this.currentPos.copy();
            playerCornerPos.x += this.width;
          }
          if (bottom && left) {
            playerCornerPos = this.currentPos.copy();
            playerCornerPos.y += this.height;
          }
          if (bottom && right) {
            playerCornerPos = this.currentPos.copy();
            playerCornerPos.y += this.height;
            playerCornerPos.x += this.width;
          }

          if (playerCornerPos === null) {
            playerCornerPos = this.currentPos.copy();
            if (this.IsMovingDown()) playerCornerPos.y += this.height;
            if (this.IsMovingRight()) playerCornerPos.x += this.width;
          }
          directedCorrection.x = midpoint.x - playerCornerPos.x;
          directedCorrection.y = midpoint.y - playerCornerPos.y;
          correction = dist(playerCornerPos.x, playerCornerPos.y, midpoint.x, midpoint.y)
        } else {
          let left = l.diagonalCollisionInfo.leftSideOfPlayerCollided;
          let right = l.diagonalCollisionInfo.rightSideOfPlayerCollided;
          let top = l.diagonalCollisionInfo.topSideOfPlayerCollided;
          let bottom = l.diagonalCollisionInfo.bottomSideOfPlayerCollided;

          let playerCornerPos = null;
          if (top) {// bounce off the point as if it were horizontal
            let closestPointY = max(l.y1, l.y2)
            directedCorrection.y = closestPointY - (this.currentPos.y)
            correction = abs(this.currentPos.y - closestPointY);
          }
          if (bottom) {//treat like floor
            let closestPointY = min(l.y1, l.y2)
            directedCorrection.y = closestPointY - (this.currentPos.y + this.height)
            correction = abs((this.currentPos.y + this.height) - closestPointY);
          }
          if (left) {// treat like a left wall
            let closestPointX = max(l.x1, l.x2)
            directedCorrection.x = closestPointX - this.currentPos.x;
            correction = abs(this.currentPos.x - closestPointX);
          }
          if (right) {// treat like a left wall
            let closestPointX = min(l.x1, l.x2)
            directedCorrection.x = closestPointX - (this.currentPos.x + this.width);
            correction = abs((this.currentPos.x + this.width) - closestPointX);
          }
        }
      }
      if (isBetween(directedCorrection.x, 0, maxAllowedXCorrection) &&
          isBetween(directedCorrection.y, 0, maxAllowedYCorrection)) {
          // correction = abs(directedCorrection)
          if (correction < minCorrection) {
            minCorrection = correction;
            chosenLine = l;
          }
      }
    }
    return chosenLine;
  }

  CheckForLevelChange() {
    if (this.currentPos.y < -this.height) {
      //we are at the top of the screen
      this.currentLevelNo += 1;
      this.currentPos.y += height;
    } else if (this.currentPos.y > height - this.height) {
      if (this.currentLevelNo === 0) {
        this.currentLevelNo = 1; //lol fixed
        this.playersDead = true;
        this.hasFinishedInstructions = true;
      }
      this.currentLevelNo -= 1;
      this.currentPos.y -= height;
      if (!this.hasFinishedInstructions && this.currentLevelNo < this.bestLevelReached - 1) {
        this.fellToPreviousLevel = true;
      }
    }
  }

  sendCommand(message){

    if (!this.isOnGround) return;

    let split = message.split(' ');
    if (split.length > 2 || message.length > 6) return;

    let jump = true;
    let direction = 1;
    let hold = 1;
    //UNDO
    if(split[0]=== "undo"){
      this.loadState();
    }
    //DIRECTION
    if (split[0][0] === 'w' || split[0][0] === 'W') jump = false;
    if (split[0] === "r" || split[0] === "R" || split[0] === 'wr' || split[0] === 'WR'){
      direction = 1;
    } else if (split[0] === 'l' || split[0] === 'L' || split[0] === 'wl' || split[0] === 'WL') {
      direction = -1;
    } else if (split[0] === 'u' || split[0] === 'U') {
      direction = 0;
    } else {
      return;
    }
    hold = parseInt(split[1]) / 100;
    if (!split[1]) hold = 1;

    let action = new AIAction(jump, hold, direction);
    
    if (this.isWaitingToStartAction && this.isOnGround) this.isWaitingToStartAction = false;
      //if the action hasnt started yet then start it
      //also if the ai is not on the ground and the action has already started then end the action
    if (this.isOnGround && !this.actionStarted) {
      this.currentAction = action;
      this.StartCurrentAction();
      this.actionStarted = true;
    } else if (this.actionStarted) {
      //if the action has been held for long enough then we end the current action
      this.aiActionTimer += 1;
      if (this.aiActionTimer >= this.aiActionMaxTime) {
        this.EndCurrentAction()
        this.actionStarted = false;
      }
    }
  }

  UpdateAIAction() {
    if (this.actionStarted){
      this.aiActionTimer += 1;
      if (this.aiActionTimer >= this.aiActionMaxTime) {
        this.EndCurrentAction()
        this.actionStarted = false;
      }
    }
  }

  StartCurrentAction() {
    this.aiActionMaxTime = floor(this.currentAction.holdTime * 30);
    this.aiActionTimer = 0;
    if (this.currentAction.isJump) {
      this.jumpHeld = true;
    }
    if (this.currentAction.xDirection === -1) {
      this.leftHeld = true;
      this.rightHeld = false;
    } else if (this.currentAction.xDirection === 1) {
      this.leftHeld = false;
      this.rightHeld = true;
    }
  }
  EndCurrentAction() {
    if (this.currentAction.isJump) {
      this.jumpHeld = false;
      this.Jump();
    }
    this.leftHeld = false;
    this.rightHeld = false;
    this.isWaitingToStartAction = false;
  }

  GetGlobalHeight() {
    return (height - this.currentPos.y) + height * this.currentLevelNo
  }

  playerLanded() {
    this.isOnGround = true
    // If we're on an ice level then we slide instead
    this.currentSpeed = createVector(0, 0);
    if (levels[this.currentLevelNo].isIceLevel) {
      this.currentSpeed.y = 0;
      if (this.IsMovingRight()) {
        this.currentSpeed.x -= iceFrictionAcceleration;
      } else {
        this.currentSpeed.x += iceFrictionAcceleration;
      }
    }

    this.isSlidding = false;
    this.hasBumped = false;
    if (this.jumpStartingHeight - height / 2 > (height - this.currentPos.y) + height * this.currentLevelNo) this.hasFallen = true;
    if (this.GetGlobalHeight() > this.bestHeightReached) {
      this.bestHeightReached = this.GetGlobalHeight();
      this.saveState();
      if (this.bestLevelReached < this.currentLevelNo) {
        this.bestLevelReached = this.currentLevelNo;
      }

    }
    this.hasFallen ? fallSound.play() : landSound.play();
  }
}

function AreLinesColliding(x1, y1, x2, y2, x3, y3, x4, y4) {
  let uA = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
  let uB = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
  if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
    let intersectionX = x1 + (uA * (x2 - x1));
    let intersectionY = y1 + (uA * (y2 - y1));
    return [true, intersectionX, intersectionY];
  }
  return [false, 0, 0]
}