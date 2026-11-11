
/* NADS WORLD: THE QUEST FOR FIVE O'CLOCK
   Retro platform adventure + persistent Hall of Fame.
   Original artwork and gameplay code.
*/
(() => {
  function init() {
    const card = document.querySelector('#takehome .card');
    if (!card || document.getElementById('nadsArcade')) return;

    // Keep the original Home introduction intact.
    card.querySelector('.result')?.remove();

    const style = document.createElement('style');
    style.textContent = `
      #nadsArcade {
        margin-top:22px;padding:14px 10px;background:#15243b;
        color:white;border:3px solid #eac35e;border-radius:12px;
        text-align:center;font-family:monospace;overflow:hidden
      }
      #nadsArcade h2 {color:#ffdb73;margin:8px 0}
      #nadsArcade p {line-height:1.45}
      #nadsArcade canvas {
        display:block;width:100%;max-width:640px;margin:12px auto;
        border:3px solid white;image-rendering:pixelated;
        background:#7ccdf5;touch-action:none
      }
      #nadsArcade button {
        border:2px solid white;border-radius:7px;padding:11px 15px;
        background:#efbd52;color:#16233c;font:bold 14px monospace;
        cursor:pointer;touch-action:none
      }
      #nadsArcade .controls {
        display:flex;gap:10px;justify-content:center;
        flex-wrap:wrap;margin:12px 0
      }
      #nadsArcade .controls button {
        min-width:66px;min-height:55px;
        user-select:none;-webkit-user-select:none
      }
      #nadsArcade .small {font-size:12px;color:#d8e5f1}
      #nadsArcade .message {
        min-height:44px;color:#ffdf84;font-weight:bold
      }
      #nadsArcade .hall {
        background:#243955;border:2px solid #eac35e;
        border-radius:9px;padding:12px;margin-top:18px
      }
      #nadsArcade .hall h3 {color:#ffdb73;margin:5px}
      #nadsArcade .stats {
        display:grid;grid-template-columns:repeat(3,1fr);
        gap:7px;margin:12px 0
      }
      #nadsArcade .stat {
        background:#17283e;padding:9px 3px;border-radius:6px
      }
      #nadsArcade .stat strong {
        display:block;color:#ffdb73;font-size:17px
      }
      #nadsArcade .stat span {font-size:10px}
      #nadsArcade .scores {
        width:100%;border-collapse:collapse;font-size:12px
      }
      #nadsArcade .scores td {
        padding:7px 3px;border-bottom:1px solid #465775
      }
      #nadsArcade .scores td:first-child {text-align:left}
      #nadsArcade .scores td:last-child {text-align:right}
    `;
    document.head.appendChild(style);

    const root = document.createElement('section');
    root.id = 'nadsArcade';
    root.innerHTML = `
      <h2>🍄 NADS WORLD</h2>
      <p>THE QUEST FOR FIVE O'CLOCK</p>
      <p class="small">Eight colleagues. Four worlds. One escape.</p>
      <p id="nadsHud">WORLD 1-1 · SCORE 0 · LIVES 3</p>
      <canvas id="nadsCanvas" width="480" height="256"
        aria-label="Retro side-scrolling platform game"></canvas>
      <p id="nadsMessage" class="message">Press START to begin!</p>
      <button id="nadsStart">▶ START GAME</button>
      <div class="controls">
        <button id="nadsLeft">◀</button>
        <button id="nadsJump">⬆ JUMP</button>
        <button id="nadsRight">▶</button>
      </div>
      <p class="small">
        PC: ← → to move, Space or ↑ to jump.<br>
        Mobile: hold the arrow buttons and tap JUMP.<br>
        Collect coins, hit mystery blocks and reach the green pipe!
      </p>
      <section class="hall">
        <h3>🏆 NADS' HALL OF FAME 🏆</h3>
        <div class="stats">
          <div class="stat"><strong id="nadsBest">0</strong>
            <span>PERSONAL BEST</span></div>
          <div class="stat"><strong id="nadsWorld">1-1</strong>
            <span>BEST WORLD</span></div>
          <div class="stat"><strong id="nadsPlayed">0</strong>
            <span>GAMES PLAYED</span></div>
        </div>
        <p id="nadsWins" class="small">Adventures completed: 0</p>
        <h3>TOP FIVE RUNS</h3>
        <table class="scores"><tbody id="nadsScores"></tbody></table>
        <p class="small">Scores are saved on this device.</p>
      </section>
    `;
    card.appendChild(root);

    const $ = id => document.getElementById(id);
    const canvas = $('nadsCanvas');
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const W = 480;
    const H = 256;
    const GROUND = 216;
    const WORLD = 1900;
    const SAVE_KEY = 'nadsWorldHallV1';
    const OLD_BEST_KEY = 'nadsWorldBest';

    const stages = [
      {
        name:'THE MORNING COMMUTE',
        sky:'#82d4fa',ground:'#a36c39',
        intro:"WORLD 1-1: Temporary setback. Lost keys. Wrong hook. No one's blaming anyone...",
        friendText:"🗝️ The keys have been located. Their whereabouts during the incident remain classified.",
        block:"🏡 Layton has secured another letting. The keys have been returned to an undisclosed location."
      },
      {
        name:'THE OFFICE GAUNTLET',
        sky:'#98a3ce',ground:'#576273',
        intro:"WORLD 1-2: Welcome to Property Management. The repairs are multiplying.",
        friendText:"🔧 Ryan has fixed the boiler. ⚖️ Zoe has conquered the paperwork. Neither has had lunch.",
        block:"🍄 SPECIAL POWER-UP: Jade is having a good day. All office productivity increases by 200%."
      },
      {
        name:'THE GREAT RIVALRY',
        sky:'#f5ba81',ground:'#966347',
        intro:"WORLD 1-3: Lewis has challenged Nads. The subject is irrelevant. Winning is everything.",
        friendText:"🌶️ Lewis has challenged Nads to a spicy-dip duel. Neither will concede defeat. Both are sweating.",
        block:"🏆 Lewis has produced photographic evidence. Nads has questioned the authenticity of photography."
      },
      {
        name:'PERMISSION TO ESCAPE',
        sky:'#7780a9',ground:'#485066',
        intro:"WORLD 1-4: Five o'clock approaches. Kim requires authorisation. Ali holds the ultimate power.",
        friendText:"📜 Kim has approved your escape. ☕ Ali has activated the Coffee & Creatine Protocol.",
        block:"💰 LEGENDARY LOOT! Ali has approved a pay rise!"
      }
    ];

    const jokes = [
      "🌋 Stress Eruption: Jade has reached critical capacity. All enemies retreat three spaces.",
      "🗣️ Unfiltered Wisdom: Jade says something nobody anticipated. Everyone freezes for five seconds.",
      "🔥 Emergency Meltdown: The office printer jams. Jade's power level increases by 300%.",
      "🍄 SPECIAL POWER-UP: Jade is having a good day. All office productivity increases by 200%.",
      "🍄 Nads has calmed Jade down. Office stability restored. Nobody knows how he does it.",
      "🗣️ Jade has said the quiet part out loud. The office requires a moment to recover.",
      "🧠 Lewis remembers the answer to a question nobody remembers asking.",
      "🏆 Lewis: You're wrong. Nads: Your evidence is wrong. ACHIEVEMENT UNLOCKED: UNDEFEATED IN ARGUMENT.",
      "🌶️ Lewis and Nads have discovered another spicy dip. The competition has escalated beyond reasonable limits.",
      "🗝️ Layton has found the missing keys. No further questions will be entertained.",
      "🏡 Layton has completed another viewing. The keys have survived the experience.",
      "🔧 Ryan has defeated the Boiler Breakdown Beast. Another 17 repair requests have spawned.",
      "⚖️ Zoe has completed three inventories, two checkouts and a court appearance. It's only Tuesday.",
      "📁 Zoe has defeated the paperwork monster. A second folder has appeared.",
      "📜 New legislation has dropped. Kim has already read it.",
      "🏖️ Kim has approved your annual leave. You have achieved the impossible: a day without emails.",
      "☕ Ali has activated the Coffee & Creatine Protocol. Office energy restored to 100%.",
      "💰 LEGENDARY LOOT! Ali has approved a pay rise!",
      "📞 The phone rang twice. Everyone looked at you.",
      "🖨️ Legendary item discovered: a printer that works on the first attempt.",
      "🏡 A tenant has submitted every document correctly. MYTHICAL EVENT!",
      "📁 Your inbox is empty. This is clearly a dream.",
      "💎 Legendary item found: a stapler that actually staples.",
      "🎮 Congratulations. You have successfully avoided working."
    ];

    // Persistent personal records.
    let records = {
      best:0,
      bestWorld:1,
      played:0,
      wins:0,
      runs:[]
    };

    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (saved && typeof saved === 'object') {
        records = {...records,...saved};
        if (!Array.isArray(records.runs)) records.runs = [];
      }
      const previousBest =
        Number(localStorage.getItem(OLD_BEST_KEY)) || 0;
      records.best = Math.max(records.best,previousBest);
    } catch(e) {}

    function saveRecords() {
      try {
        localStorage.setItem(SAVE_KEY,JSON.stringify(records));
        localStorage.setItem(OLD_BEST_KEY,String(records.best));
      } catch(e) {}
    }

    function renderHall() {
      $('nadsBest').textContent = records.best.toLocaleString();
      $('nadsWorld').textContent = '1-' + records.bestWorld;
      $('nadsPlayed').textContent = records.played;
      $('nadsWins').textContent =
        'Adventures completed: ' + records.wins;

      const body = $('nadsScores');
      body.replaceChildren();

      if (!records.runs.length) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 3;
        cell.textContent = 'No finished runs yet. Glory awaits!';
        row.appendChild(cell);
        body.appendChild(row);
        return;
      }

      records.runs.forEach((run,i) => {
        const row = document.createElement('tr');
        const a = document.createElement('td');
        const b = document.createElement('td');
        const c = document.createElement('td');
        a.textContent = ['🥇','🥈','🥉','4.','5.'][i];
        b.textContent = Number(run.score).toLocaleString() +
          ' · World 1-' + run.world;
        c.textContent = run.date;
        row.append(a,b,c);
        body.appendChild(row);
      });
    }

    const keys = {left:false,right:false,jump:false};

    let stage=0,score=0,lives=3,running=false,won=false;
    let player,blocks,coins,enemies,platforms,camera=0;
    let raf=0,last=0,messageUntil=0,invincible=0;
    let friendSeen=false,runRecorded=false;
    let startingBest=records.best;

    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    const overlap=(a,b)=>
      a.x<b.x+b.w && a.x+a.w>b.x &&
      a.y<b.y+b.h && a.y+a.h>b.y;

    function message(text,seconds=3) {
      $('nadsMessage').textContent=text;
      messageUntil=performance.now()+seconds*1000;
    }

    function hud() {
      $('nadsHud').textContent =
        `WORLD 1-${stage+1} · SCORE ${score} · LIVES ${lives} · BEST ${records.best}`;
    }

    function gain(points) {
      score+=points;

      if(score>records.best) {
        records.best=score;
        saveRecords();
        renderHall();
      }
      hud();
    }

    function recordRun(victory=false) {
      if(runRecorded)return;
      runRecorded=true;

      records.best=Math.max(records.best,score);
      records.bestWorld=Math.max(records.bestWorld,stage+1);
      if(victory)records.wins++;

      records.runs.push({
        score:score,
        world:stage+1,
        date:new Date().toLocaleDateString('en-GB'),
        victory:victory
      });

      records.runs.sort((a,b)=>b.score-a.score);
      records.runs=records.runs.slice(0,5);

      saveRecords();
      renderHall();
      hud();

      if(score>startingBest) {
        message(
          '🏆 NEW HIGH SCORE! '+score.toLocaleString()+
          ' POINTS! Lewis has requested a recount.',
          7
        );
      }
    }

    function setupStage() {
      player={
        x:48,y:GROUND-25,w:18,h:25,
        vx:0,vy:0,onGround:false
      };
      camera=0;
      invincible=0;
      friendSeen=false;

      platforms=[
        {x:260,y:168,w:100,h:12},
        {x:560,y:155,w:120,h:12},
        {x:910,y:174,w:110,h:12},
        {x:1240,y:157,w:120,h:12},
        {x:1520,y:171,w:110,h:12}
      ];

      blocks=[210,480,790,1100,1410,1690].map((x,i)=>({
        x:x,y:i%2?117:128,w:28,h:28,used:false
      }));

      coins=[];
      for(let x=135;x<1800;x+=83) {
        coins.push({
          x:x,y:x%3===0?132:185,
          w:14,h:16,taken:false
        });
      }

      enemies=[370,710,1020,1330,1620].map((x,i)=>({
        x:x,y:GROUND-22,w:22,h:22,
        vx:i%2?-0.55:0.55,alive:true
      }));

      hud();
      message(stages[stage].intro,5);
    }

    function startGame() {
      if(running)recordRun(false);
      cancelAnimationFrame(raf);

      stage=0;
      score=0;
      lives=3;
      won=false;
      running=true;
      runRecorded=false;
      startingBest=records.best;
      loop.acc=0;

      records.played++;
      saveRecords();
      renderHall();

      keys.left=false;
      keys.right=false;
      keys.jump=false;

      $('nadsStart').textContent='↻ RESTART GAME';
      setupStage();

      last=performance.now();
      raf=requestAnimationFrame(loop);
    }

    function loseLife() {
      if(invincible>0)return;

      lives--;
      hud();

      if(lives<=0) {
        running=false;
        recordRun(false);

        if(score<=startingBest) {
          message(
            'GAME OVER! The Monday Morning Inbox wins. Try again!',
            99
          );
        }

        $('nadsStart').textContent='↻ TRY AGAIN';
        return;
      }

      player.x=Math.max(
        48,Math.floor(player.x/400)*400-100
      );
      player.y=GROUND-25;
      player.vy=0;
      invincible=95;

      message(
        '📞 Unexpected office emergency! One life deducted.',
        3
      );
    }

    function nextStage() {
      gain(500);

      if(stage===3) {
        running=false;
        won=true;
        recordRun(true);

        if(score<=startingBest) {
          message(
            "🏆 FIVE O'CLOCK! Kim approves your escape. Ali awards coffee and a pay rise. LEGENDARY!",
            99
          );
        }

        $('nadsStart').textContent='▶ PLAY AGAIN';
        return;
      }

      stage++;
      records.bestWorld=Math.max(records.bestWorld,stage+1);
      saveRecords();
      renderHall();
      setupStage();
    }

    function hitBlock(block) {
      if(block.used)return;

      block.used=true;
      gain(100);

      // Exactly 1 in 40 mystery blocks.
      if(Math.floor(Math.random()*40)===0) {
        message(
          '🎮 GTA 6 LAUNCH DAY - No one is in work.',
          5
        );
      } else if(Math.random()<0.5) {
        message(stages[stage].block,5);
      } else {
        message(
          jokes[Math.floor(Math.random()*jokes.length)],
          5
        );
      }
    }

    function update() {
      if(!running)return;

      if(invincible>0)invincible--;

      player.vx=
        (keys.right?2.7:0)-(keys.left?2.7:0);

      if(keys.jump && player.onGround) {
        player.vy=-9.4;
        player.onGround=false;
      }

      const oldY=player.y;

      player.x=clamp(
        player.x+player.vx,0,WORLD-player.w
      );

      player.vy=Math.min(10,player.vy+0.48);
      player.y+=player.vy;
      player.onGround=false;

      if(player.y+player.h>=GROUND) {
        player.y=GROUND-player.h;
        player.vy=0;
        player.onGround=true;
      }

      for(const p of platforms) {
        if(
          player.x+player.w>p.x &&
          player.x<p.x+p.w &&
          oldY+player.h<=p.y+4 &&
          player.y+player.h>=p.y &&
          player.vy>=0
        ) {
          player.y=p.y-player.h;
          player.vy=0;
          player.onGround=true;
        }
      }

      for(const b of blocks) {
        if(!overlap(player,b))continue;

        if(player.vy<0 && oldY>=b.y+b.h-5) {
          player.y=b.y+b.h;
          player.vy=0;
          hitBlock(b);
        } else if(
          player.vy>=0 &&
          oldY+player.h<=b.y+5
        ) {
          player.y=b.y-player.h;
          player.vy=0;
          player.onGround=true;
        } else if(player.vx>0) {
          player.x=b.x-player.w;
        } else if(player.vx<0) {
          player.x=b.x+b.w;
        }
      }

      for(const c of coins) {
        if(!c.taken && overlap(player,c)) {
          c.taken=true;
          gain(10);
        }
      }

      for(const e of enemies) {
        if(!e.alive)continue;

        e.x+=e.vx;

        if(e.x<20 || e.x>WORLD-60) {
          e.vx*=-1;
        }

        if(overlap(player,e)) {
          if(
            player.vy>0 &&
            oldY+player.h<=e.y+10
          ) {
            e.alive=false;
            player.vy=-6;
            gain(100);
          } else {
            loseLife();
          }
        }
      }

      if(!running)return;

      if(!friendSeen && player.x>WORLD-350) {
        friendSeen=true;
        message(stages[stage].friendText,5);
        gain(150);
      }

      if(player.x>WORLD-75) {
        nextStage();
      }

      camera=clamp(
        player.x-160,0,WORLD-W
      );
    }

    function rect(x,y,w,h,color) {
      ctx.fillStyle=color;
      ctx.fillRect(
        Math.round(x),Math.round(y),w,h
      );
    }

    function draw() {
      const s=stages[stage];

      rect(0,0,W,H,s.sky);

      // Parallax pixel scenery.
      for(let x=0;x<WORLD;x+=170) {
        const px=x-camera*0.45;

        if(px<-100 || px>W+100)continue;

        rect(
          px,168,70,48,
          stage===1?'#7b849d':'#93b8a0'
        );
        rect(px+15,180,14,17,'#f7e5aa');
        rect(px+40,180,14,17,'#f7e5aa');
      }

      rect(0,GROUND,W,H-GROUND,s.ground);
      rect(
        0,GROUND,W,7,
        stage===1?'#b3a9a3':'#5eae55'
      );

      for(let x=0;x<WORLD;x+=32) {
        const px=x-camera;
        if(px>-32 && px<W) {
          rect(px,GROUND+19,14,4,'#79503c');
        }
      }

      for(const p of platforms) {
        rect(p.x-camera,p.y,p.w,p.h,'#b36e43');
        rect(p.x-camera,p.y,p.w,5,'#e7b667');
      }

      for(const b of blocks) {
        const x=b.x-camera;

        rect(
          x,b.y,28,28,
          b.used?'#937d70':'#e4a42d'
        );
        rect(
          x+3,b.y+3,22,22,
          b.used?'#a79b8e':'#ffcb54'
        );

        if(!b.used) {
          ctx.fillStyle='#68421e';
          ctx.font='bold 20px monospace';
          ctx.fillText('?',x+8,b.y+21);
        }
      }

      for(const c of coins) {
        if(c.taken)continue;

        const x=c.x-camera;
        rect(x+2,c.y,10,16,'#ffd442');
        rect(x+6,c.y+4,3,8,'#bd7a14');
      }

      for(const e of enemies) {
        if(!e.alive)continue;

        const x=e.x-camera;

        rect(
          x,e.y,22,22,
          stage===2?'#b53d53':'#925a43'
        );
        rect(x+4,e.y+6,5,5,'#fff');
        rect(x+13,e.y+6,5,5,'#fff');
        rect(x+6,e.y+8,2,3,'#17243b');
        rect(x+15,e.y+8,2,3,'#17243b');
      }

      // Green exit pipe.
      const pipeX=WORLD-65-camera;
      rect(pipeX,GROUND-62,50,62,'#198d4e');
      rect(pipeX-5,GROUND-69,60,13,'#39c26a');

      // Original pixel-art player.
      const px=player.x-camera;

      if(invincible%8<4) {
        rect(px+2,player.y,15,6,'#ba3447');
        rect(px+5,player.y+6,11,8,'#f2c394');
        rect(px+2,player.y+14,16,8,'#2853a4');
        rect(px+2,player.y+22,6,3,'#18263e');
        rect(px+12,player.y+22,6,3,'#18263e');
      }

      ctx.fillStyle='#18253c';
      ctx.font='bold 12px monospace';
      ctx.fillText('WORLD 1-'+(stage+1),12,18);

      if(won) {
        rect(38,75,405,95,'#17243b');
        ctx.fillStyle='#ffdf74';
        ctx.font='bold 22px monospace';
        ctx.fillText('QUEST COMPLETE!',110,113);
        ctx.font='14px monospace';
        ctx.fillText(
          "FIVE O'CLOCK. FREEDOM!",
          112,143
        );
      }
    }

    function loop(now) {
      const elapsed=Math.min(80,now-last);
      last=now;

      loop.acc=(loop.acc||0)+elapsed;

      let steps=0;

      while(
        loop.acc>=16.67 &&
        steps<5 &&
        running
      ) {
        update();
        loop.acc-=16.67;
        steps++;
      }

      if(messageUntil<now && running) {
        $('nadsMessage').textContent=
          stages[stage].intro;
        messageUntil=Infinity;
      }

      draw();

      if(running) {
        raf=requestAnimationFrame(loop);
      }
    }

    function bindHold(id,key) {
      const el=$(id);

      const down=e=>{
        e.preventDefault();
        keys[key]=true;
        try {
          el.setPointerCapture(e.pointerId);
        } catch(err) {}
      };

      const up=e=>{
        e.preventDefault();
        keys[key]=false;
      };

      el.addEventListener('pointerdown',down);
      el.addEventListener('pointerup',up);
      el.addEventListener('pointercancel',up);
      el.addEventListener(
        'lostpointercapture',
        ()=>{keys[key]=false;}
      );
    }

    bindHold('nadsLeft','left');
    bindHold('nadsRight','right');
    bindHold('nadsJump','jump');

    const keymap={
      ArrowLeft:'left',
      KeyA:'left',
      ArrowRight:'right',
      KeyD:'right',
      ArrowUp:'jump',
      Space:'jump',
      KeyW:'jump'
    };

    document.addEventListener('keydown',e=>{
      if(
        !running ||
        !keymap[e.code] ||
        /INPUT|TEXTAREA|SELECT/.test(
          document.activeElement?.tagName||''
        )
      )return;

      e.preventDefault();
      keys[keymap[e.code]]=true;
    });

    document.addEventListener('keyup',e=>{
      if(keymap[e.code]) {
        keys[keymap[e.code]]=false;
      }
    });

    window.addEventListener('blur',()=>{
      keys.left=false;
      keys.right=false;
      keys.jump=false;
    });

    $('nadsStart').addEventListener(
      'click',startGame
    );

    renderHall();
    setupStage();
    draw();
  }

  if(document.readyState==='loading') {
    document.addEventListener(
      'DOMContentLoaded',init
    );
  } else {
    init();
  }
})();
