
/* NADS WORLD: THE QUEST FOR FIVE O'CLOCK
   Original retro platform game for Land Estates. */
(() => {
  function init() {
    const card = document.querySelector('#takehome .card');
    if (!card || document.getElementById('nadsArcade')) return;
    // Preserve the existing Take Me Home introduction word for word.
    card.querySelector('.result')?.remove();
    card.querySelectorAll('.note').forEach(p => {
      if (p.textContent.includes('favourite clips')) p.remove();
    });
    const css = document.createElement('style');
    css.textContent = `
      #nadsArcade{margin-top:22px;padding:14px 10px;background:#15243b;
        color:#fff;border:3px solid #eac35e;border-radius:12px;text-align:center;
        font-family:monospace;max-width:100%;overflow:hidden}
      #nadsArcade h2{color:#ffdb73;margin:8px 0}
      #nadsArcade p{line-height:1.45}
      #nadsArcade canvas{display:block;width:100%;max-width:640px;
        margin:12px auto;border:3px solid #fff;image-rendering:pixelated;
        background:#7ccdf5;touch-action:none}
      #nadsArcade button{border:2px solid #fff;border-radius:7px;
        padding:11px 15px;background:#efbd52;color:#16233c;
        font:bold 14px monospace;cursor:pointer;touch-action:none}
      #nadsArcade .controls{display:flex;gap:10px;justify-content:center;
        align-items:center;flex-wrap:wrap;margin:12px 0}
      #nadsArcade .controls button{min-width:66px;min-height:55px;
        user-select:none;-webkit-user-select:none}
      #nadsArcade .small{font-size:12px;color:#d8e5f1}
      #nadsArcade .message{min-height:44px;color:#ffdf84;font-weight:bold}
      #nadsArcade .hidden{display:none!important}
    `;
    document.head.appendChild(css);
    const root = document.createElement('section');
    root.id = 'nadsArcade';
    root.innerHTML = `
      <h2>🍄 NADS WORLD</h2>
      <p>THE QUEST FOR FIVE O'CLOCK</p>
      <p class="small">A little Land Estates adventure. Everyone's involved.</p>
      <p id="nadsHud">WORLD 1-1 · SCORE 000 · LIVES 3</p>
      <canvas id="nadsCanvas" width="480" height="256" aria-label="Side-scrolling platform game"></canvas>
      <p id="nadsMessage" class="message">Press START to begin.</p>
      <button id="nadsStart">▶ START GAME</button>
      <div class="controls">
        <button id="nadsLeft" aria-label="Move left">◀</button>
        <button id="nadsJump" aria-label="Jump">⬆ JUMP</button>
        <button id="nadsRight" aria-label="Move right">▶</button>
      </div>
      <p class="small">PC: ← → to move, Space or ↑ to jump.<br>
      Mobile: hold ◀ or ▶, tap JUMP. Reach the green pipe!</p>
    `;
    card.appendChild(root);
    const $ = id => document.getElementById(id);
    const canvas = $('nadsCanvas'), ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const W = 480, H = 256, GROUND = 216, WORLD = 1900;
    const stages = [
      {name:'THE MORNING COMMUTE',sky:'#82d4fa',ground:'#a36c39',
       intro:'WORLD 1-1: Get to Land Estates. Layton has the keys. Again.',
       friend:'Layton',friendText:'🗝️ Layton checks his pockets. Missing keys recovered!',
       block:'🏡 Layton has completed another viewing. +100 XP!'},
      {name:'THE OFFICE GAUNTLET',sky:'#98a3ce',ground:'#576273',
       intro:'WORLD 1-2: Ryan fixes repairs. Zoe defeats the paperwork!',
       friend:'Ryan & Zoe',friendText:'🔧 Ryan fixes the boiler! ⚖️ Zoe clears the inventory monsters!',
       block:'🍄 SPECIAL POWER-UP: Jade is having a good day. All office productivity increases by 200%.'},
      {name:'THE GREAT RIVALRY',sky:'#f5ba81',ground:'#966347',
       intro:'WORLD 1-3: Lewis challenges Nads. Nobody will admit defeat.',
       friend:'Lewis',friendText:'🌶️ Lewis challenges Nads to a spicy-dip duel. Neither concedes!',
       block:'🏆 Lewis: You’re wrong. Nads: Your evidence is wrong. UNDEFEATED IN ARGUMENT!'},
      {name:'PERMISSION TO ESCAPE',sky:'#7780a9',ground:'#485066',
       intro:'WORLD 1-4: Kim holds the exit permit. Ali controls the bonuses.',
       friend:'Kim & Ali',friendText:'📜 Kim approves the exit. ☕ Ali activates Coffee & Creatine!',
       block:'💰 LEGENDARY LOOT! Ali has approved a pay rise!'}
    ];
    const extra = [
      '🌋 Stress Eruption: Jade has reached critical capacity. All enemies retreat three spaces.',
      '🗣️ Unfiltered Wisdom: Jade says something nobody anticipated. Everyone freezes for five seconds.',
      '🔥 Emergency Meltdown: The office printer jams. Jade’s power level increases by 300%.',
      '🍄 Nads has calmed Jade down. Office stability restored.',
      '🎮 GTA 6 LAUNCH DAY - No one is in work.',
      '🧠 Lewis remembers the answer to a question nobody remembers asking.',
      '📜 New legislation has dropped. Kim has already read it.',
      '⚖️ Zoe has completed three inventories, two checkouts and a court appearance. It’s only Tuesday.',
      '🔧 Ryan has defeated the Boiler Breakdown Beast. Another 17 repairs have spawned.',
      '☕ Ali has activated the Coffee & Creatine Protocol. Office energy restored to 100%.'
    ];
    const keys = {left:false,right:false,jump:false};
    let stage = 0, score = 0, lives = 3, running = false, won = false;
    let player, blocks, coins, enemies, platforms, camera = 0;
    let raf = 0, last = 0, messageUntil = 0, invincible = 0, friendSeen = false;
    const bestKey = 'nadsWorldBest';
    let best = 0;
    try {best = Number(localStorage.getItem(bestKey)) || 0;} catch(e) {}
    const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
    const overlap = (a,b) => a.x < b.x+b.w && a.x+a.w > b.x &&
      a.y < b.y+b.h && a.y+a.h > b.y;
    function message(s,seconds=3) {
      $('nadsMessage').textContent = s;
      messageUntil = performance.now() + seconds*1000;
    }
    function hud() {
      $('nadsHud').textContent = `WORLD 1-${stage+1} · SCORE ${score} · LIVES ${lives} · BEST ${best}`;
    }
    function gain(n) {
      score += n;
      if(score>best) {
        best=score;
        try {localStorage.setItem(bestKey,String(best));} catch(e) {}
      }
      hud();
    }
    function setupStage() {
      player={x:48,y:GROUND-25,w:18,h:25,vx:0,vy:0,onGround:false};
      camera=0; invincible=0; friendSeen=false;
      platforms=[
        {x:260,y:168,w:100,h:12},
        {x:560,y:155,w:120,h:12},
        {x:910,y:174,w:110,h:12},
        {x:1240,y:157,w:120,h:12},
        {x:1520,y:171,w:110,h:12}
      ];
      blocks=[210,480,790,1100,1410,1690].map((x,i)=>({
        x,y:i%2?117:128,w:28,h:28,used:false
      }));
      coins=[];
      for(let x=135;x<1800;x+=83) {
        coins.push({x,y:x%3===0?132:185,w:14,h:16,taken:false});
      }
      enemies=[370,710,1020,1330,1620].map((x,i)=>({
        x,y:GROUND-22,w:22,h:22,vx:i%2?-0.55:0.55,alive:true
      }));
      hud();message(stages[stage].intro,5);
    }
    function resetGame() {
      cancelAnimationFrame(raf);
      stage=0;score=0;lives=3;won=false;running=true;
      keys.left=keys.right=keys.jump=false;
      $('nadsStart').textContent='↻ RESTART GAME';
      setupStage();last=performance.now();raf=requestAnimationFrame(loop);
    }
    function loseLife() {
      if(invincible>0)return;
      lives--;hud();
      if(lives<=0) {
        running=false;
        message('GAME OVER! The Monday Morning Inbox wins. Press RESTART.',99);
        $('nadsStart').textContent='↻ TRY AGAIN';
        return;
      }
      player.x=Math.max(48,Math.floor(player.x/400)*400-100);
      player.y=GROUND-25;player.vy=0;
      invincible=95;
      message('📞 An unexpected office emergency! Try again.',3);
    }
    function nextStage() {
      gain(500);
      if(stage===3) {
        running=false;won=true;
        message('🏆 FIVE O’CLOCK! Kim approves your escape. Ali awards a coffee and a pay rise. LEGENDARY!',99);
        $('nadsStart').textContent='▶ PLAY AGAIN';
        return;
      }
      stage++;setupStage();
    }
    function hitBlock(b) {
      if(b.used)return;
      b.used=true;
      gain(100);
      if(Math.random()<0.025) message('🎮 GTA 6 LAUNCH DAY - No one is in work.',5);
      else if(Math.random()<0.55) message(stages[stage].block,5);
      else message(extra[Math.floor(Math.random()*extra.length)],5);
    }
    function update() {
      if(!running)return;
      if(invincible>0)invincible--;
      player.vx=(keys.right?2.7:0)-(keys.left?2.7:0);
      if(keys.jump&&player.onGround){player.vy=-9.4;player.onGround=false;}
      const oldY=player.y;
      player.x=clamp(player.x+player.vx,0,WORLD-player.w);
      player.vy=Math.min(10,player.vy+0.48);
      player.y+=player.vy;
      player.onGround=false;
      if(player.y+player.h>=GROUND){
        player.y=GROUND-player.h;player.vy=0;player.onGround=true;
      }
      for(const p of platforms){
        if(player.x+player.w>p.x&&player.x<p.x+p.w &&
           oldY+player.h<=p.y+4 && player.y+player.h>=p.y && player.vy>=0){
          player.y=p.y-player.h;player.vy=0;player.onGround=true;
        }
      }
      for(const b of blocks){
        if(!overlap(player,b))continue;
        if(player.vy<0&&oldY>=b.y+b.h-5){
          player.y=b.y+b.h;player.vy=0;hitBlock(b);
        } else if(player.vy>=0&&oldY+player.h<=b.y+5){
          player.y=b.y-player.h;player.vy=0;player.onGround=true;
        } else if(player.vx>0)player.x=b.x-player.w;
        else if(player.vx<0)player.x=b.x+b.w;
      }
      for(const c of coins){
        if(!c.taken&&overlap(player,c)){c.taken=true;gain(10);}
      }
      for(const e of enemies){
        if(!e.alive)continue;
        e.x+=e.vx;
        if(e.x<20||e.x>WORLD-60)e.vx*=-1;
        if(overlap(player,e)){
          if(player.vy>0&&oldY+player.h<=e.y+10){
            e.alive=false;player.vy=-6;gain(100);
          }else loseLife();
        }
      }
      if(!friendSeen&&player.x>WORLD-350){
        friendSeen=true;message(stages[stage].friendText,5);gain(150);
      }
      // Enter the green pipe by walking into it.
      if(player.x>WORLD-75)nextStage();
      camera=clamp(player.x-160,0,WORLD-W);
    }
    function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
    function draw() {
      const s=stages[stage];
      rect(0,0,W,H,s.sky);
      // Original retro scenery, rather than Nintendo artwork.
      for(let x=0;x<WORLD;x+=170){
        const px=x-camera*0.45;
        if(px<-100||px>W+100)continue;
        rect(px,168,70,48,stage===1?'#7b849d':'#93b8a0');
        rect(px+15,180,14,17,'#f7e5aa');
        rect(px+40,180,14,17,'#f7e5aa');
      }
      rect(0,GROUND,W,H-GROUND,s.ground);
      rect(0,GROUND,W,7,stage===1?'#b3a9a3':'#5eae55');
      for(let x=0;x<WORLD;x+=32){
        const px=x-camera;
        if(px>-32&&px<W)rect(px,GROUND+19,14,4,'#79503c');
      }
      for(const p of platforms){
        rect(p.x-camera,p.y,p.w,p.h,'#b36e43');
        rect(p.x-camera,p.y,p.w,5,'#e7b667');
      }
      for(const b of blocks){
        const x=b.x-camera;
        rect(x,b.y,28,28,b.used?'#937d70':'#e4a42d');
        rect(x+3,b.y+3,22,22,b.used?'#a79b8e':'#ffcb54');
        if(!b.used){ctx.fillStyle='#68421e';ctx.font='bold 20px monospace';ctx.fillText('?',x+8,b.y+21);}
      }
      for(const c of coins){
        if(c.taken)continue;
        const x=c.x-camera;
        rect(x+2,c.y,10,16,'#ffd442');rect(x+6,c.y+4,3,8,'#bd7a14');
      }
      for(const e of enemies){
        if(!e.alive)continue;
        const x=e.x-camera;
        rect(x,e.y,22,22,stage===2?'#b53d53':'#925a43');
        rect(x+4,e.y+6,5,5,'#fff');rect(x+13,e.y+6,5,5,'#fff');
        rect(x+6,e.y+8,2,3,'#17243b');rect(x+15,e.y+8,2,3,'#17243b');
      }
      // Exit pipe and original pixel Nads.
      const pipeX=WORLD-65-camera;
      rect(pipeX,GROUND-62,50,62,'#198d4e');
      rect(pipeX-5,GROUND-69,60,13,'#39c26a');
      const px=player.x-camera;
      if(invincible%8<4){
        rect(px+2,player.y,15,6,'#ba3447');
        rect(px+5,player.y+6,11,8,'#f2c394');
        rect(px+2,player.y+14,16,8,'#2853a4');
        rect(px+2,player.y+22,6,3,'#18263e');
        rect(px+12,player.y+22,6,3,'#18263e');
      }
      ctx.fillStyle='#18253c';ctx.font='bold 12px monospace';
      ctx.fillText('WORLD 1-'+(stage+1),12,18);
      if(won){
        rect(38,75,405,95,'#17243b');
        ctx.fillStyle='#ffdf74';ctx.font='bold 22px monospace';
        ctx.fillText('QUEST COMPLETE!',110,113);
        ctx.font='14px monospace';ctx.fillText('FIVE O’CLOCK. FREEDOM!',112,143);
      }
    }
    function loop(now){
      // Fixed timestep keeps movement usable on fast and slow screens.
      const elapsed=Math.min(80,now-last);last=now;
      loop.acc=(loop.acc||0)+elapsed;
      let steps=0;
      while(loop.acc>=16.67&&steps<5&&running){update();loop.acc-=16.67;steps++;}
      if(messageUntil<now&&running){$('nadsMessage').textContent=stages[stage].intro;messageUntil=Infinity;}
      draw();
      if(running)raf=requestAnimationFrame(loop);
    }
    function bindHold(id,key){
      const el=$(id);
      const down=e=>{e.preventDefault();keys[key]=true;try{el.setPointerCapture(e.pointerId);}catch(err){}};
      const up=e=>{e.preventDefault();keys[key]=false;};
      el.addEventListener('pointerdown',down);
      el.addEventListener('pointerup',up);
      el.addEventListener('pointercancel',up);
      el.addEventListener('lostpointercapture',()=>{keys[key]=false;});
    }
    bindHold('nadsLeft','left');bindHold('nadsRight','right');bindHold('nadsJump','jump');
    const keymap={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'jump',Space:'jump',KeyW:'jump'};
    document.addEventListener('keydown',e=>{
      if(!running||!keymap[e.code]||/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||''))return;
      e.preventDefault();keys[keymap[e.code]]=true;
    });
    document.addEventListener('keyup',e=>{
      if(keymap[e.code])keys[keymap[e.code]]=false;
    });
    window.addEventListener('blur',()=>{keys.left=keys.right=keys.jump=false;});
    $('nadsStart').addEventListener('click',resetGame);
    setupStage();draw();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
