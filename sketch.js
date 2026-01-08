let cellSize = 50;
let gridSize = 5;
let drawnNumbers = [];
let num;
let numbutton;
let resetButton;
let autoButton;
let gameFinished = false;
let freeButton;
let card = [];
let isfreeset = false;
let cardSlider;
let numSlider;
let gridSlider;
let auto = false;

let stats = {
  drawcount:0,
  reachwhichnum:null,
  howmanybingo:[],
  allopen:null,
}

let historyData = {
  reachTimes: [],      // リーチ発生時刻
  bingo1Times: [],     // 初ビンゴ発生時刻
  bingo2Times: [],     // 2回目ビンゴ発生時刻
  allopenTimes: []     // 全マス開く時刻
}

function setup() {
  createCanvas(1000,1000);
  
  gridSlider = createSlider(3,7,5,2);
  gridSlider.position(380,150);
  gridSlider.size(150);
  
  cardSlider = createSlider(0,100,50,5);
  cardSlider.position(380,10);//sliderの幅の設定
  
 
  numSlider = createSlider(0,150,75,5);
  numSlider.position(380,30);
  numSlider.size(150);
  
  cardGenerate();
  
  numButton = createButton("数字を振る");
  numButton.position(300,370);
  numButton.mousePressed(drawnNumber);
  
  resetButton = createButton("リセット君");
  resetButton.position(200,370);
  resetButton.mousePressed(resetBingo);
  
  freeButton = createButton("真ん中をfreeにする");
  freeButton.position(50,370);
  freeButton.mousePressed(freeset);
  
  autoButton = createButton("自動実行");
  autoButton.position(400, 370);
  autoButton.mousePressed(() => {
    auto = !auto;
    autoButton.html(auto ? "停止" : "自動実行");
  });
  
  
}

function draw() {
  background(220);
  
  if (auto) {
    drawnNumber();
    if (gameFinished) {
      resetBingo();
    }
  }//簡単な自動実行
  
  let newgridSize = gridSlider.value();
  if(newgridSize !== gridSize){
    gridSize = newgridSize;
    resetBingo();
  }
  
  push();
  drawCard();
  pop();
  
  fill(0);
  textSize(12);
  textAlign(LEFT,TOP);
  text(`グリッドサイズ: ${gridSize}*${gridSize}`,380,170);
  text(`カードの数値の幅:１～ ${cardSlider.value()}`, 380, 60);
  text(`抽選最大値:１～ ${numSlider.value()}`, 380, 75);
  
  textSize(30);
  
  if(num !==null){
    text(num,370,340);
  }
  
  textSize(10);
  textAlign(LEFT,TOP);
  let x=20;
  let y=400;
  for(let i=0;i < drawnNumbers.length;i++){
    text(drawnNumbers[i],x,y);
    x +=20; 
   
    if ((i + 1) % 20 === 0) {
      x = 20;
      y += 30;
    }
  }
  
  let count = checkBingo();
  if (count > 0) {
    textSize(20);
    fill(255, 0, 0);
    textAlign(CENTER, CENTER);
    text(`ビンゴ！ (${count}ライン)`, 680,65);
  }
  
  drawStatsTable();
  drawstatetable();  // ← 先に描画!
  
  // ヒストグラムを表示
  if(historyData.reachTimes.length > 0) {
    drawHistogram();
  }
  
  // 最後にゲーム終了メッセージ ← returnを削除!
  if(gameFinished){
    textSize(20);
    fill(0);
    textAlign(CENTER,CENTER);
    text("ゲーム終わり！",680,30); 
  }
}

function cardGenerate(){
  let maxCardnums = cardSlider.value();
  let nums = shuffle(Array.from({length: maxCardnums},(_, i)=> i+1));//次は75をxにして幅を決められるようにする
  card = nums.slice(0,gridSize*gridSize);
  
  let centerIndex = Math.floor((gridSize*gridSize)/2);//mat.floorで整数値に
  if(isfreeset){
     card[centerIndex] = "free";//freeが押されてたら⇒isfreesetは押されている状態を保存
  }
}

function drawCard(){
  textAlign(CENTER,CENTER);
  textSize(20);
  
  for(let i=0; i<gridSize; i++){
    for(let j=0; j<gridSize; j++){
      let index=i*gridSize+j;
      let x = j*cellSize;
      let y = i*cellSize;
      stroke(0);
      fill(240);
      rect(x,y,cellSize,cellSize);
      
      let num= card[index];
      if(num==="free"|| drawnNumbers.includes(num)){
        fill(255,100,100);
      }else{
        fill(0);
      }
      text(num, x+cellSize/2,y+cellSize/2);
      
    }
  }
  
  fill(0);//全部赤文字になるの解消
  
}


function drawnNumber(){
  let maxNums = numSlider.value();
  let allNums = Array.from({length:maxNums},(_, i) => i + 1);//ここも変数にしたいな
  let remain = allNums.filter(n => !drawnNumbers.includes(n));//まだ抽選してない数字のあぶり出しfilter=取り出し　nがdrawnumに含まれてないものを取り出した
  if(remain.length>0){
    num = random(remain);
    drawnNumbers.push(num);
    
    stats.drawcount++;// stats.drawcount = statsdrawcount+1
    updatestats();
  }else{
    num = null;
    finishgame();
  }
  
  freeButton.hide();//どうする？
}

function resetBingo(){
  drawnNumbers = [];
  allNums = [];
  remain = [];
  num = null;
  gameFinished = false;
  cardGenerate();
  drawCard();
  drawnNumber();
  
  stats = {
    drawcount: 0,
    reachwhichnum: null,
    howmanybingo: [],
    allopen: null,
  };
  
  freeButton.show();
}

function freeset(){
  // 押すたびに true  false 切り替え
  isfreeset = !isfreeset;
  
  let centerIndex = Math.floor((gridSize*gridSize)/2);

  if (isfreeset) {
    // freeをONにした場合
    card[centerIndex] = "free";
    freeButton.html("free解除する"); // ボタン名を変更
  } else {
    // freeをOFFにした場合
    let nums = shuffle(Array.from({length: 75}, (_, i) => i + 1));
    // card[12] に新しい数字を入れる（同じカードのまま）
    let newNum;
    do {
      newNum = random(nums);
    } while (card.includes(newNum)); // 重複しないように
    card[centerIndex] = newNum;

    freeButton.html("真ん中をfreeにする"); // ボタン戻す
  }
}

function checkreach(){
  let reachcount = 0; 
  
  for(let i=0; i<gridSize; i++){
    let yoko = [];
    
    for(let j=0; j<gridSize; j++){
      yoko.push(card[i*gridSize + j]);//card[]?
    }
    
    let unopen = yoko.filter(n => n !=="free"&&!drawnNumbers.includes(n));
    
    if(unopen.length === 1){
      reachcount++;
    }
  }
  
    for(let j=0; j<gridSize; j++){
    let tate = [];
    
    for(let i=0; i<gridSize; i++){
      tate.push(card[i*gridSize + j]);//card[]?
    }
    
    let unopen = tate.filter(n => n !=="free"&&!drawnNumbers.includes(n));
    
    if(unopen.length === 1){
      reachcount++;
    }
  }
  
  let diagnal = [];
  for(let i=0; i<gridSize; i++){
    diagnal.push(card[i*gridSize + i]);
  }
  let unopen1 = diagnal.filter(n => n !=="free"&&!drawnNumbers.includes(n));
  if(unopen1.length ===1){
    reachcount++;
  }
  
  let diagnalnal = [];
  for(let i=0; i<gridSize; i++){
    diagnal.push(card[i*gridSize + (gridSize-i-1)]);
  }
  let unopen2 = diagnal.filter(n => n!=="free"&&!drawnNumbers.includes(n));
  if(unopen2.length ===1){
    reachcount++;
  }
  
  return reachcount;
}

function checkBingo(){
  let bingoCount = 0;
  
  //横ライン
  for(let i=0; i<gridSize; i++){
    let yoko = [];
    for(let j=0; j<gridSize; j++){
      yoko.push(card[i*gridSize + j]);
    }
    if(yoko.every(n => drawnNumbers.includes(n)|| n==="free")){
      bingoCount++;
    }
  }
  for(let j=0; j<gridSize; j++){
    let tate = [];
    for(let i=0; i<gridSize; i++){
      tate.push(card[i*gridSize + j]);
    }
    if(tate.every(n => drawnNumbers.includes(n)|| n==="free")){
      bingoCount++;
    }
  }
  
  let diagnal = [];
  for(let i=0; i<gridSize; i++){
    diagnal.push(card[i*gridSize+i]);
  }
  if(diagnal.every(n=>drawnNumbers.includes(n)||n==="free")){
    bingoCount++;
  }
  let diagnalnal = [];
  for(let i=0; i<gridSize; i++){
  diagnalnal.push(card[i*gridSize+ (gridSize - 1-i)]);
  }
  if(diagnalnal.every(n=>drawnNumbers.includes(n)||n==="free")){
    bingoCount++;
  }
  return bingoCount;//関数を止めるここで,ビンゴの数を最終出す
}

//立直での数字の保存、30秒で一回引く自動バージョン、グラフを加える
function drawStatsTable(){
  
}
function checkallopen(){
  return card.every(n=>n==='free'|| drawnNumbers.includes(n));
}

function updatestats(){
  let t = stats.drawcount*30;
  if(stats.reachwhichnum === null&&checkreach()){
    stats.reachwhichnum = stats.drawcount;//初めてのリーチ、条件、補助関数学び
    time = t;
  }
  
  let nowbingo = checkBingo();
  if(nowbingo > stats.howmanybingo.length){
    stats.howmanybingo.push(stats.drawcount);//checkbingoのreturnもらう⇒配列の最後に組み込む
  }
  
  if(stats.allopen === null&&checkallopen()){
    stats.allopen = stats.drawcount;
  }
}



function finishgame(){
 gameFinished = true;

   // データを保存
  if(stats.reachwhichnum !== null) {
    historyData.reachTimes.push(stats.reachwhichnum * 30);
  }
  
  if(stats.howmanybingo.length > 0) {
    historyData.bingo1Times.push(stats.howmanybingo[0] * 30);
  }
  
  if(stats.howmanybingo.length > 1) {
    historyData.bingo2Times.push(stats.howmanybingo[1] * 30);
  }
  
  if(stats.allopen !== null) {
    historyData.allopenTimes.push(stats.allopen * 30);
  }

}

function drawstatetable(){
  fill(0);
  textSize(14);
  textAlign(LEFT,TOP);
  text("統計情報！",550,80);
  
  fill(245);
  stroke(0);
  rect(540,100,250,300,10);//(x,y,w,h,丸美)
  
  fill(0);
  noStroke();
  textSize(12);
  let startX = 560;  // 左端
  let labelX = 560;  // ラベル列
  let valueX = 700;  // 値の列
  let y = 120;       // 開始位置
  let lineH = 25;    // 行間
  
    // 時間変換の関数
  function formatTime(drawCount) {
    if (drawCount === null || drawCount === 0) return "";
    let minutes = Math.floor(drawCount * 30 / 60);
    let seconds = (drawCount * 30) % 60;
    return minutes + "分" + seconds + "秒";
  }
  
   text("【設定】", labelX, y);
  y += lineH;

  text("FREE有無：", labelX, y);
  text(isfreeset ? "あり" : "なし", valueX, y);
  y += lineH;

  text("グリッド：", labelX, y);
  text(gridSize + "×" + gridSize, valueX, y);
  y += lineH;

  text("カードの数値の幅：", labelX, y);
  text("1～"+cardSlider.value(), valueX, y);
  y += lineH;

  text("抽選の最大値：", labelX, y);
  text("1～"+numSlider.value(), valueX, y);
  y += lineH * 1.5;
  
    // 1行ずつ整列表示
  text("抽選回数", labelX, y);
  text(stats.drawcount + "回 (" + formatTime(stats.drawcount) + ")", valueX, y);
  y += lineH;

  text("初リーチ", labelX, y);
  text(formatTime(stats.reachwhichnum), valueX, y);
  y += lineH;

// ビンゴ回数を表示
  text("ビンゴ回数", labelX, y);
  text(stats.howmanybingo.length + "回", valueX, y);
  y += lineH;

// ビンゴが1回以上あれば
  if (stats.howmanybingo.length > 0) {
  
  // 最後の値を取得
  let lastBingo = stats.howmanybingo[stats.howmanybingo.length - 1];
  
  // 表示
  text("  最新", labelX, y);
  text(formatTime(lastBingo), valueX, y);
  y += lineH;
}

  text("全マス空くのに"+ formatTime(stats.allopen)+"　かかりました", labelX, y);
  //text(stats.allopen ?? "", valueX, y);
  y += lineH;
}

function formatTimeLabel(sec) {
  let m = Math.floor(sec / 60);
  let s = sec % 60;
  return m + "分" + s + "秒";
}

function drawHistogram() {
  // グラフの位置とサイズ
  let graphX =  90;
  let graphY = 600;
  let graphW = 700;
  let graphH = 250;
  
  // 背景の枠
  fill(245);
  stroke(0);
  rect(graphX, graphY, graphW, graphH);
  
  // タイトル
  fill(0);
  noStroke();
  textSize(16);
  textAlign(LEFT, TOP);
  text("統計情報分布図", graphX + 10, graphY - 50);
  
  // データから最大値を取得
  let allTimes = [...historyData.reachTimes, ...historyData.bingo1Times, 
                  ...historyData.bingo2Times, ...historyData.allopenTimes];
  if(allTimes.length === 0) return;
  
  let maxDataTime = Math.max(...allTimes);
  let maxTime = Math.ceil(maxDataTime / 60) * 60 + 60;
  
  // 各イベントのデータと色
  let events = [
    {data: historyData.reachTimes, color: [255, 200, 0], label: "🟡リーチ", yPos: 1},
    {data: historyData.bingo1Times, color: [255, 0, 0], label: "🔴初ビンゴ", yPos: 2},
    {data: historyData.bingo2Times, color: [0, 0, 255], label: "🔵2回目ビンゴ", yPos: 3},
    {data: historyData.allopenTimes, color: [0, 200, 0], label: "🟢全マス開く", yPos: 4}
  ];
  
  // Y軸のラベル（イベント名）
  fill(0);
  noStroke();
  textSize(12);
  textAlign(RIGHT, CENTER);
  for(let i = 0; i < events.length; i++) {
    let y = graphY + graphH - (i + 1) * (graphH / 5);
    text(events[i].label, graphX - 10, y);
  }
  
  // 各イベントの点を描画
  for(let event of events) {
    fill(event.color[0], event.color[1], event.color[2]);
    noStroke();
    
    let y = graphY + graphH - event.yPos * (graphH / 5);
    
    for(let time of event.data) {
      let x = graphX + (time / maxTime) * graphW;
      circle(x, y, 10); // 直径10の円
    }
  }
  
  // X軸のラベル
  fill(0);
  textSize(12);
  textAlign(CENTER, TOP);
  for(let i = 0; i <= 10; i++) {
    let x = graphX + (i / 10) * graphW;
    let time = (i / 10) * maxTime;
    text(formatTimeLabel(Math.round(time)), x, graphY + graphH + 5);

  }
  
  // X軸の線
  stroke(0);
  line(graphX, graphY + graphH, graphX + graphW, graphY + graphH);
  // 縦グリッド線（x軸と対応）
stroke(200); // 薄いグレー
for(let i = 0; i <= 10; i++) {
  let x = graphX + (i / 10) * graphW;
  line(x, graphY, x, graphY + graphH);
}
  
    // ===== 上側X軸（抽選回数） =====
  fill(0);
  noStroke();
  textSize(12);
  textAlign(CENTER, BOTTOM);

  for(let i = 0; i <= 10; i++) {
    let x = graphX + (i / 10) * graphW;

    // 対応する秒数 → 回数（30秒 = 1回）
    let timeSec = (i / 10) * maxTime;
    let drawCount = Math.round(timeSec / 30);

    text(drawCount + "回", x, graphY - 5);
  }

  // 上側X軸の線
  stroke(0);
  line(graphX, graphY, graphX + graphW, graphY);


}
