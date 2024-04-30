var svg = document.querySelector("svg");

var myArrows = document.querySelector(".arrows");
var score = 0;
var targetCenter = { x: 900, y: 250 }; //target center;
const arrowPool = [];
const MAX_ARROWS = 60;  
var rotationCenter = {
  //bow rotation center
  x: 100,
  y: 250,
};
aimTarget({
  x: 320,
  y: 300,
});

function checkWinCondition() {
  console.log("checkWinCondition called, current score: " + score);
  if (score >= 15) {
    console.log("Win condition met");
    document.getElementById("winModal").style.display = "flex";
  } else {
    console.log("Win condition not met");
  }
}
function animateElement(selector, duration, properties) {
  TweenMax.to(selector, duration, properties);
}
document.addEventListener("DOMContentLoaded", function () {
  resetGame();
});
function initializeArrowPool(arrowSelector, container) {
  for (let i = 0; i < MAX_ARROWS; i++) {
    const arrow = document.createElementNS("http://www.w3.org/2000/svg", "use");
    arrow.setAttributeNS("http://www.w3.org/1999/xlink", "href", arrowSelector);
    arrow.style.display = 'none'; 
    container.appendChild(arrow);
    arrowPool.push(arrow);
  }
}

function getArrowFromPool() {
  const arrow = arrowPool.find(arrow => arrow.style.display === 'none');
  if (arrow) {
    arrow.style.display = 'block';  
    return arrow;
  }
  return null;  
}
window.addEventListener("mousedown", firstClick);
function firstClick(e) {
  TweenMax.to(".arrow-angle use", 0.7, {
    opacity: 1,
    x: -1,
  });
  setupEventListeners();
  aimTarget(e);
}
function playSound(filename) {
  var audio = new Audio(filename);
  audio.play();
}
function aimTarget(e) {
  const mousePosition = calculateMousePosition(e);
  const { adjustedBowAngle, pullDistance } = calculateBowAdjustments(mousePosition);
  const animationConfigs = prepareAnimationConfigs(adjustedBowAngle, pullDistance);
  processAnimations(animationConfigs);
  animateBowString(adjustedBowAngle, pullDistance);
}

var matrixCache = null;
function calculateMousePosition(e) {
  var svgpt = svg.createSVGPoint();
    if (!matrixCache) {
        matrixCache = svg.getScreenCTM().inverse();
    }
    svgpt.x = e.clientX;
    svgpt.y = e.clientY;
    var coords = svgpt.matrixTransform(matrixCache);
    coords.x = Math.min(coords.x, rotationCenter.x - 6.85);
    coords.y = Math.max(coords.y, rotationCenter.y + 6.85);
    return coords;
}

//For this part about the framework of the aiming and loose code, I have reference to the code on the Internet: https://github.com/kunjgit/GameZone/blob/d465444c8cd080ad85cca46abf302410dd428c81/Games/Bulls_eye/app.js#L69. I mainly refer to his mathematical processing methods, and the choice of some parameter
function calculateBowAdjustments(mousePosition) {
  const deltaX = mousePosition.x - rotationCenter.x;
  const deltaY = mousePosition.y - rotationCenter.y;
  const mouseAngle = Math.atan2(deltaY, deltaX);
  const adjustedBowAngle = mouseAngle - Math.PI;
  const pullDistance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), 50);
  return { adjustedBowAngle, pullDistance };
}

function prepareAnimationConfigs(adjustedBowAngle, pullDistance) {
  const bowScaleNum = Math.min(Math.max(pullDistance / 40, 0.8), 2.5);
  return [
    { selector: "#bow", duration: 0.5, props: { scaleX: bowScaleNum, rotation: adjustedBowAngle + "rad", transformOrigin: "right center" }},
    { selector: ".arrow-angle", duration: 0.5, props: { rotation: adjustedBowAngle + "rad", svgOrigin: "140 250" }},
    { selector: ".arrow-angle use", duration: 0.5, props: { x: -pullDistance }},
    { selector: "#bow polyline", duration: 0.5, props: { attr: { points: `88,200 ${Math.min(rotationCenter.x - (1 / bowScaleNum) * pullDistance, 88)},250 88,300` }}}
  ];
}

function processAnimations(configs) {
  configs.forEach(config => {
    animateElement(config.selector, config.duration, config.props);
  });
}

function animateBowString(adjustedBowAngle, pullDistance) {
  const bowRadius = pullDistance * 9;
  const bowOffset = { x: Math.cos(adjustedBowAngle) * bowRadius, y: Math.sin(adjustedBowAngle) * bowRadius };
  const arcTotalWidth = bowOffset.x * 3;
  const arcDefinition = `M140,250c${bowOffset.x},${bowOffset.y},${arcTotalWidth - bowOffset.x},${bowOffset.y + 50},${arcTotalWidth},50`;

  animateElement("#arc", 0.3, { attr: { d: arcDefinition }, autoAlpha: pullDistance / 60 });
}

//For uper part about the framework of the aiming and loose code, I have reference to the code on the Internet: https://github.com/kunjgit/GameZone/blob/d465444c8cd080ad85cca46abf302410dd428c81/Games/Bulls_eye/app.js#L69. I mainly refer to his mathematical processing methods, and the choice of some parameter
function moveObstacle() {
  TweenMax.to("#obstacle", 0.5, {
    y: "+=200", 
    repeat: -1,
    yoyo: true,
    ease: Linear.easeNone,
  });
}
function shoot() {
  window.removeEventListener("mousemove", aimTarget);
  window.removeEventListener("mouseup", shoot);
  resetBowAnimation();
  var newArrow = duplicateArrow("#arrow", myArrows);
  animateArrow(newArrow, "#arc");
  hidearrow(".arrow-angle use");
  playSound("shoot.wav");
}

function resetBowAnimation() {
  const bowAnimationConfig = {
    scaleX: 1,
    transformOrigin: "right center",
    ease: Elastic.easeOut,
  };
  TweenMax.to("#bow", 0.4, bowAnimationConfig);
  TweenMax.to("#bow polyline", 0.4, {
    attr: { points: "88,200 88,250 88,300" },
    ease: Elastic.easeOut,
  });
}


function returnArrowToPool(arrow) {
  arrow.style.display = 'none';  
}
function duplicateArrow() {
  return getArrowFromPool(); 
}
function animateArrow(arrow, pathSelector) {
  //path from svg
  var path = MorphSVGPlugin.pathDataToBezier(pathSelector);
  TweenMax.to([arrow], 0.7, {
    bezier: { type: "cubic", values: path, autoRotate: ["x", "y", "rotation"] },
    onUpdate: panHit,
    onUpdateParams: ["{self}"],
    ease: Linear.easeNone,
  });
  TweenMax.to(pathSelector, 0.3, { opacity: 0 });
}

function hidearrow(selector) {
  TweenMax.set(selector, { opacity: 0 });
}
function panHit(tween) {
  var arrow = tween.target[0];
  var tranS = arrow._gsTransform;
  var radians = (tranS.rotation * Math.PI) / 180;
  var arrowTipX = tranS.x + Math.cos(radians) * 60;
  var arrowTipY = tranS.y + Math.sin(radians) * 60; 
  var obstacle = document.getElementById("obstacle");
  var bboxObs = obstacle.getBBox();
  var ox = bboxObs.x + (obstacle._gsTransform ? obstacle._gsTransform.x : 0);
  var oy = bboxObs.y + (obstacle._gsTransform ? obstacle._gsTransform.y : 0);
  var ow = bboxObs.width;
  var oh = bboxObs.height;


  var target = document.getElementById("target");
  var bboxTarget = target.getBBox();
  var tx = bboxTarget.x + (target._gsTransform ? target._gsTransform.x : 0);
  var ty = bboxTarget.y + (target._gsTransform ? target._gsTransform.y : 0);
  var tw = bboxTarget.width;
  var th = bboxTarget.height;

  if (
    arrowTipX > ox &&
    arrowTipX < ox + ow &&
    arrowTipY > oy &&
    arrowTipY < oy + oh
  ) {
    tween.kill();
    myArrows.removeChild(arrow);
    showResult("miss");
    return;
  }

  if (
    arrowTipX > tx &&
    arrowTipX < tx + tw &&
    arrowTipY > ty &&
    arrowTipY < ty + th
  ) {
    
    if (arrowTipY > ty + 0.35 * th && arrowTipY < ty + 0.65 * th) {
     
      showResult("central");
    } else {
      showResult("hit");
    }
    tween.kill();
    myArrows.removeChild(arrow);
    return;
  }
}

function setupEventListeners() {
  window.addEventListener("mousemove", aimTarget);
  window.addEventListener("mouseup", shoot);
}

function updateScore(points) {
  score += points;
  var scoreElement = document.getElementById("score");
  scoreElement.textContent = "Score: " + score;
  scoreElement.classList.add("change");

  setTimeout(() => {
    scoreElement.classList.remove("change");
  }, 200);

  checkWinCondition();
}

function showResult(resultInput, help) {
  var scoreValue = 0;
  if (resultInput === "miss") {
    playSound("hit.wav");
    updateScore(0);
  } else if (resultInput === "hit" || resultInput === "central") {
    scoreValue = resultInput === "hit" ? 1 : 3;
    updateScore(scoreValue);
    displayScoreAnimation(scoreValue); 
    if (resultInput == "hit") {
      playSound("hit.wav"); 
    } else {
      playSound("centerhit.wav"); 
    }
  }
}

// Function to display score animation
function displayScoreAnimation(scoreValue) {
  var scoreText = document.getElementById("scoreText");
  scoreText.textContent = "+" + scoreValue;
  scoreText.style.opacity = "1";

  TweenMax.to(scoreText, 0.5, {
    delay: 1,
    opacity: 0,
    onComplete: function () {
      scoreText.style.opacity = "0";
    },
  });
}



function resetGame() {
  score = 0;
  document.getElementById("score").textContent = "Score: " + score;
  document.getElementById("winModal").style.display = "none";
}

function moveTarget() {
  +1;
  TweenMax.to("#target", 0.4, {
    y: "-=100",
    repeat: -1,
    yoyo: true,
    ease: Linear.easeNone,
  });
}

document.addEventListener("DOMContentLoaded", function () {
  resetGame();
  moveTarget();
  moveObstacle();
});
initializeArrowPool("#arrow", myArrows);