let width = 2400;
let height = 900;
let canvas,player,chatPlayer, backgroundImage;
let lines = [];
let levelImages = [];

let idleImage, squatImage,jumpImage, oofImage,run1Image, run2Image, run3Image, fallenImage, fallImage, fallSound, jumpSound, bumpSound, landSound, snowImage;
let chatBuffer, playerBuffer;
let playerPlaced = false;
let levelDrawn = false;
let testingSinglePlayer = true;


let startingPlayerActions = 5;
let increaseActionsByAmount = 5;
let increaseActionsEveryXGenerations = 10;
let evolationSpeed = 1;

let selectedUserPopUp = document.getElementById('currentUser');
const urlParams = new URLSearchParams(window.location.search);
//TMI.js
let channels = ['colloquialowl'];
if (urlParams.get('channel')) channels = [urlParams.get('channel')];
const client = new tmi.Client({
  channels: channels
});

//TMI.js TRIGGER
client.on("connected", () => {
  let channelName = channels.toString().replace('#','')
  console.log(`Connected to ${channelName} from Twitch! ✅`)
  document.getElementById('channel').innerText = channelName;
});
client.connect();



let nameMap = new Map();
function getRandomKeyFromMap(map) {
  const keysArray = Array.from(map.keys());
  const randomIndex = Math.floor(Math.random() * keysArray.length);
  return keysArray[randomIndex];
}

let selectedUser = '...';
selectedUserPopUp.innerText = selectedUser;

let removeTime = (1000 * 60) * 5;
let newChampionTime = 1000 * 60 / 2;

function findChampion(){
  if (!nameMap.size) return;
  console.log('Searching for a mighty warrior');
  selectedUser = getRandomKeyFromMap(nameMap);
  selectedUserPopUp.style.setProperty('--shadow', nameMap.get(selectedUser).colour);
  selectedUserPopUp.style.opacity = 1;
  console.log(`${selectedUser} chosen`);
  selectedUserPopUp.innerText = selectedUser;
  selectedUserPopUp.opacity = 1;
}

setInterval(function() {
  findChampion();
  var time = Date.now();
  let namesRemoved = [];
  for (const [key, value] of nameMap.entries()) {
    if (time > value.time + removeTime) {
      nameMap.delete(key);
      namesRemoved.push(key);
    }
  }
  if (namesRemoved.length) console.log(`${namesRemoved.toString()} removed due to time`);
}, newChampionTime);

client.on('message', (channel, tags, message, self) => {
  if (tags.username === 'colloquialbot' || tags.username === 'nightbot') return;
  if (tags.username === selectedUser) {
    chatPlayer.sendCommand(message);
    return;
  }
  console.log(`${tags.username} added`);
  nameMap.set(tags.username, {time: Date.now(), colour: tags.color || 'green'});
  if(nameMap.size === 1) findChampion();
});

function preload() {
  backgroundImage = loadImage('images/levelImages/1.png');
  snowImage = loadImage('images/snow3.png');

  for (let i = 1; i <= 43; i++) {
    levelImages.push(loadImage(`images/levelImages/${i}.png`));
  }

  jumpSound = loadSound('sounds/jump.mp3');
  fallSound = loadSound('sounds/fall.mp3');
  bumpSound = loadSound('sounds/bump.mp3');
  landSound = loadSound('sounds/land.mp3');
}


function setup() {
  canvas = createCanvas(width, height);
  canvas.parent('canvas');
  player = new Player();
  chatPlayer = new Player(true);
  chatPlayer.currentPos = createVector(width * 0.75, height - 300);
  chatPlayer.chatPlayer = true;
  setupLevels();
  chatBuffer = createGraphics(width / 2, height);
  playerBuffer = createGraphics(width / 2, height);
}

let levelNumber = 0;

function draw() {
  push()
  translate(0, -0);
  image(levels[player.currentLevelNo].levelImage, 0, 0);
  image(levels[chatPlayer.currentLevelNo].levelImage, width/2, 0);
  levels[player.currentLevelNo].show();
  chatLevels[chatPlayer.currentLevelNo].showChat();
  player.Update();
  player.Show();
  chatPlayer.Update();
  chatPlayer.Show();
  //chatPlayer.currentLevelNo = 30;
  //chatPlayer.snowImagePosition = 500;

  if (frameCount % 15 === 0) previousFrameRate = floor(getFrameRate());
}

let previousFrameRate = 60;

function keyPressed() {
  switch (key) {
    case ' ':
      player.jumpHeld = true
      break;
  }

  switch (keyCode) {
    case LEFT_ARROW:
      player.leftHeld = true;
      break;
    case RIGHT_ARROW:
      player.rightHeld = true;
      break;
  }
}

function keyReleased() {
  switch (key) {
    case ' ':
      player.jumpHeld = false
      player.Jump()
      break;
    case 'N':
      player.currentLevelNo += 1;
      print(player.currentLevelNo);
      break;
  }

  switch (keyCode) {
    case LEFT_ARROW:
      player.leftHeld = false;
      break;
    case RIGHT_ARROW:
      player.rightHeld = false;
      break;
    case DOWN_ARROW:
      evolationSpeed = constrain(evolationSpeed - 1, 0, 50);
      break;
    case UP_ARROW:
      evolationSpeed = constrain(evolationSpeed + 1, 0, 50);
      break;
  }
}