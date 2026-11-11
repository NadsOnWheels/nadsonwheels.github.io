
/* NAD'S ADVENTURES IN SUPER MARIO LAND
   THE QUEST FOR 5:30
   Original retro platformer and Hall of Fame.
*/
(() => {
  function init() {
    const card = document.querySelector('#takehome .card');
    if (!card || document.getElementById('nadsArcade')) return;

    // Preserve the original Take Me Home introduction.
    card.querySelector('.result')?.remove();

    const style = document.createElement('style');
    style.textContent = `
      #nadsArcade{margin-top:22px;padding:15px 10px;background:#17243b;
        color:white;border:3px solid #eac35e;border-radius:12px;
        font-family:monospace;text-align:center;overflow:hidden}
      #nadsArcade h2{color:#ffda70;margin:8px 0;font-size:21px}
      #nadsArcade p{line-height:1.5}
      #nadsArcade canvas{display:block;width:100%;max-width:640px;
        margin:12px auto;border:3px solid white;
        image-rendering:pixelated;touch-action:none}
      #nadsArcade button{border:2px solid white;border-radius:7px;
        padding:12px 15px;background:#efbd52;color:#16233c;
        font:bold 14px monospace;cursor:pointer;touch-action:none}
      #nadsArcade .controls{display:flex;gap:10px;justify-content:center;
        flex-wrap:wrap;margin:12px 0}
      #nadsArcade .controls button{min-width:70px;min-height:56px;
        user-select:none;-webkit-user-select:none}
      #nadsArcade .small{font-size:12px;color:#d8e5f1}
      #nadsArcade .message{min-height:55px;color:#ffdf84;
        font-weight:bold}
      #nadsArcade .hall{background:#243955;border:2px solid #eac35e;
        border-radius:9px;padding:12px;margin-top:18px}
      #nadsArcade .hall h3{color:#ffdb73}
      #nadsArcade .stats{display:grid;grid-template-columns:repeat(3,1fr);
        gap:7px;margin:12px 0}
      #nadsArcade .stat{background:#17283e;padding:9px 3px;border-radius:6px}
      #nadsArcade .stat strong{display:block;color:#ffdb73;font-size:17px}
      #nadsArcade .stat span{font-size:10px}
      #nadsArcade table{width:100%;border-collapse:collapse;font-size:12px}
      #nadsArcade td{padding:7px 3px;border-bottom:1px solid #465775}
    `;
    document.head.appendChild(style);

    const root = document.createElement('section');
    root.id = 'nadsArcade';
    root.innerHTML = `
<h2>🍄 NAD'S ADVENTURES IN<br>SUPER MARIO LAND</h2>
<p>★ THE QUEST FOR 5:30 ★</p>
<p class="small">Eight colleagues. One epic adventure to hometime!</p>
      <p id="nadsHud">WORLD 1-1 · SCORE 0 · LIVES 3</p>
      <canvas id="nadsCanvas" width="480" height="256"></canvas>
      <p id="nadsMessage" class="message">Press START to begin!</p>
      <button id="nadsStart">▶ START GAME</button>
      <div class="controls">
        <button id="nadsLeft">◀</button>
        <button id="nadsJump">⬆ JUMP</button>
        <button id="nadsRight">▶</button>
      </div>
      <p class="small">PC: ← → to move, Space or ↑ to jump.<br>
      Mobile: hold arrows and tap JUMP.<br>
      Collect coins, hit mystery blocks, reach the green pipe!</p>
      <section class="hall">
        <h3>🏆 NAD'S HALL OF FAME 🏆</h3>
        <div class="stats">
          <div class="stat"><strong id="nadsBest">0</strong>
            <span>PERSONAL BEST</span></div>
          <div class="stat"><strong id="nadsWorld">1-1</strong>
            <span>BEST WORLD</span></div>
          <div class="stat"><strong id="nadsPlayed">0</strong>
            <span>GAMES PLAYED</span></div>
        </div>
        <p id="nadsWins" class="small"></p>
        <h3>TOP FIVE RUNS</h3>
        <table><tbody id="nadsScores"></tbody></table>
        <p class="small">Records are saved on this device.</p>
      </section>
    `;
    card.appendChild(root);

    const $ = id => document.getElementById(id);
    const canvas = $('nadsCanvas');
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const W = 480, H = 256, GROUND = 216, WORLD = 1900;
    const SAVE = 'nadsWorldHallV1';

    const stages = [
      {
        sky:'#82d4fa',ground:'#a36c39',
        intro:"Temporary setback. Lost keys. Wrong hook. No one is blaming anyone...",
        friend:"Missing Keys found. Wrong hook. No one is blaming anyone...",
        block:"You have just remembered that you have a property viewing in 10 minutes. The correct keys are on the hook! Jubilation bonus!"
      },
      {
        sky:'#98a3ce',ground:'#576273',
        intro:"Welcome to Property Management. The repairs are multiplying.",
        friend:"Leak resolved! Ryan jubilant! 4 more waiting in his unread emails...!",
        block:"Zoe receives deposit release confirmation from difficult landlord. Confused but happy."
      },
      {
        sky:'#f5ba81',ground:'#966347',
        intro:"Lewis and Nads have entered a competition. Nobody remembers what started it.",
        friend:"Lewis saves the day. Everyone quietly downplays it.",
        block:"Property Let. Both Lewis and Layton think they deserve the credit. Things are volatile. You make it worse. Because funny!"
      },
      {
        sky:'#7780a9',ground:'#485066',
        intro:"New office protocol dropped. You have yet to confirm you have read it. Meeting with Kim appears in diary. !!",
        friend:"Kim has approved your annual leave. You have achieved the impossible: a day without emails.",
        block:"LEGENDARY LOOT! Ali has approved a pay rise!"
      }
    ];

    // Your personalised mystery-block collection.
    const quotes = [
      "Stress Eruption: Jade has reached critical capacity. All allies retreat three spaces.",
      "Missing Keys found. Wrong hook. No one is blaming anyone...",
      "Leak resolved! Ryan jubilant! 4 more waiting in his unread emails...!",
      "Progress delay while you de-escalate Jade with dinosaur toy.",
      "New office protocol dropped. You have yet to confirm you have read it. Meeting with Kim appears in diary. !!",
      "Lewis saves the day. Everyone quietly downplays it.",
      "Ryan is on annual leave. You are covering Maintenance. Frustration penalty.",
      "LEGENDARY ITEM FOUND – Landlord has provided multiple sets of the correct keys!",
      "Low energy day. Play Mario v Land Estates Game. Jade clearly put a lot of time into it. You should buy her a doughnut!",
      "Property Let. Both Lewis and Layton think they deserve the credit. Things are volatile. You make it worse. Because funny!",
      "The phone rings. Everyone recognises the number. Nobody answers...",
      "Landlord has bought pastries! Cinnamon! Joy bonus followed by guilt penalty!",
      "Lewis is on annual leave. Misery penalty!",
      "Zoe receives deposit release confirmation from difficult landlord. Confused but happy.",
      "You are sent to the post office to send a letter. You return 3 days later wearing Mouse Ears and drinking from a Euro Disney re-useable soda cup.",
      "You have just remembered that you have a property viewing in 10 minutes. The correct keys are on the hook! Jubilation bonus!",
      "Phone call with absolute doughnut. Frustration penalty!",
      "New process. Everyone has a completely different understanding on how to implement. Competence penalty. Hilarity bonus.",
      "🗣️ Unfiltered Wisdom: Jade says something nobody anticipated. Everyone freezes for five seconds.",
      "🔥 Berserker Fury Meltdown: The office printer jams. Jade's power level increases by 300%.",
      "🍄 SPECIAL POWER-UP: Jade is having a good day. All office productivity increases by 200%.",
      "🗣️ Jade has said the quiet part out loud. The office requires a moment to recover.",
      "🏆 Lewis: You're wrong. Nads: Your evidence is wrong. ACHIEVEMENT UNLOCKED: UNDEFEATED IN COMBAT!",
      "🌶️ Lewis and Nads have discovered another spicy dip. The competition has escalated beyond reasonable limits.",
      "🏡 Layton has completed a viewing. Inadvertently let the wrong yet still available property. Chaotic fortune bonus!",
      "🔧 Ryan has defeated the Boiler Breakdown Beast. Another 17 repair requests have spawned.",
      "⚖️ Zoe has completed three inventories, two checkouts and a court appearance. It's only Tuesday.",
      "📁 Zoe has defeated the paperwork monster. A second folder has appeared.",
      "🏖️ Kim has approved your annual leave. You have achieved the impossible: a day without emails.",
      "☕ Ali has activated the Coffee & Creatine Protocol. Office energy restored to 100%.",
      "💰 LEGENDARY LOOT! Ali has approved a pay rise!",
      "📞 The phone rang twice. Everyone looked at you.",
      "🖨️ Legendary item discovered: a printer that works on the first attempt.",
      "🏡 A tenant has submitted every document correctly. MYTHICAL EVENT!",
      "📁 Your inbox is empty. This is clearly a dream.",
      "💎 Legendary item found: a stapler that actually staples."
    ];

    const records = {
      best:0,bestWorld:1,played:0,wins:0,runs:[]
    };
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE));
      if(saved && typeof saved === 'object') {
        Object.assign(records,saved);
      }
      if(!Array.isArray(records.runs)) records.runs=[];
      records.best=Math.max(
        Number(records.best)||0,
        Number(localStorage.getItem('nadsWorldBest'))||0
      );
    } catch(e) {}

    function save() {
      try {
        localStorage.setItem(SAVE,JSON.stringify(records));
        localStorage.setItem('nadsWorldBest',String(records.best));
      } catch(e) {}
    }

    function hall() {
      $('nadsBest').textContent=records.best.toLocaleString();
      $('nadsWorld').textContent='1-'+records.bestWorld;
      $('nadsPlayed').textContent=records.played;
      $('nadsWins').textContent=
        'Adventures completed: '+records.wins;
      const tbody=$('nadsScores');
      tbody.replaceChildren();
      if(!records.runs.length) {
        const tr=document.createElement('tr');
        const td=document.createElement('td');
        td.textContent='No finished runs yet. Glory awaits!';
        tr.appendChild(td);
        tbody.appendChild(tr);
      }
      records.runs.forEach((r,i)=>{
        const tr=document.createElement('tr');
        const td=document.createElement('td');
        td.colSpan=3;
        td.textContent=
          ['🥇','🥈','🥉','4.','5.'][i]+' '+
          r.score.toLocaleString()+' · WORLD 1-'+r.world+
          ' · '+r.date;
        tr.appendChild(td);
        tbody.appendChild(tr);
      });
    }

    const keys={left:false,right:false,jump:false};
    let stage=0,score=0,lives=3,running=false,won=false;
    let player,platforms,blocks,coins,enemies,camera=0;
    let raf=0,last=0,acc=0,messageUntil=0,invincible=0;
    let friendSeen=false,recorded=false,startingBest=0;

    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    const overlap=(a,b)=>
      a.x<b.x+b.w && a.x+a.w>b.x &&
      a.y<b.y+b.h && a.y+a.h>b.y;

    function message(s,seconds=4) {
      $('nadsMessage').textContent=s;
      messageUntil=performance.now()+seconds*1000;
    }

    function hud() {
      $('nadsHud').textContent=
        `WORLD 1-${stage+1} · SCORE ${score} · LIVES ${lives} · BEST ${records.best}`;
    }

    function gain(n) {
      score+=n;
      if(score>records.best) {
        records.best=score;
        save();
        hall();
      }
      hud();
    }

    function recordRun(victory=false) {
      if(recorded)return;
      recorded=true;
      records.best=Math.max(records.best,score);
      records.bestWorld=Math.max(records.bestWorld,stage+1);
      if(victory)records.wins++;
      records.runs.push({
        score,world:stage+1,
        date:new Date().toLocaleDateString('en-GB'),
        victory
      });
      records.runs.sort((a,b)=>b.score-a.score);
      records.runs=records.runs.slice(0,5);
      save();hall();hud();
    }

    function setupStage() {
      player={
        x:48,y:GROUND-25,w:18,h:25,
        vx:0,vy:0,onGround:true
      };
      camera=0;invincible=0;friendSeen=false;
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
        coins.push({
          x,y:x%3===0?132:185,w:14,h:16,taken:false
        });
      }
      enemies=[370,710,1020,1330,1620].map((x,i)=>({
        x,y:GROUND-22,w:22,h:22,
        vx:i%2?-0.55:0.55,alive:true
      }));
      hud();
      message(stages[stage].intro,5);
    }

    function start() {
      if(running)recordRun();
      cancelAnimationFrame(raf);
      stage=0;score=0;lives=3;won=false;
      running=true;recorded=false;
      startingBest=records.best;
      acc=0;
      keys.left=keys.right=keys.jump=false;
      records.played++;
      save();hall();
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
        recordRun();
        message(
          score>startingBest
            ?'🏆 NEW HIGH SCORE! Lewis has requested a recount.'
            :'GAME OVER! The Monday Morning Inbox wins.',
          99
        );
        $('nadsStart').textContent='↻ TRY AGAIN';
        return;
      }
      player.x=Math.max(48,Math.floor(player.x/400)*400-100);
      player.y=GROUND-25;
      player.vy=0;
      invincible=95;
      message('Unexpected office emergency! One life deducted.',3);
    }

    function nextStage() {
      gain(500);
      if(stage===3) {
        running=false;won=true;
        recordRun(true);
        message(
          score>startingBest
            ?"🏆 NEW HIGH SCORE! 5:30! Kim approves your escape."
            :"🏆 5:30! Kim approves your escape.",
          99
        );
        $('nadsStart').textContent='▶ PLAY AGAIN';
        return;
      }
      stage++;
      records.bestWorld=Math.max(records.bestWorld,stage+1);
      save();hall();
      setupStage();
    }

    function hitBlock(b) {
      if(b.used)return;
      b.used=true;
      gain(100);
      // One in forty chance, separate from ordinary quotes.
      if(Math.floor(Math.random()*40)===0) {
        message(
          '🎮 GTA 6 Launch day. The office is empty. No progress will be made today.',
          6
        );
      } else if(Math.random()<0.3) {
        message(stages[stage].block,6);
      } else {
        message(quotes[Math.floor(Math.random()*quotes.length)],6);
      }
    }

    function update() {
      if(!running)return;
      if(invincible>0)invincible--;

      player.vx=(keys.right?2.7:0)-(keys.left?2.7:0);
      if(keys.jump && player.onGround) {
        player.vy=-9.4;
        player.onGround=false;
      }

      const oldY=player.y;
      player.x=clamp(player.x+player.vx,0,WORLD-player.w);
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
        if(e.x<20 || e.x>WORLD-60)e.vx*=-1;
        if(overlap(player,e)) {
          if(player.vy>0 && oldY+player.h<=e.y+10) {
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
        message(stages[stage].friend,6);
        gain(150);
      }

      if(player.x>WORLD-75) {
        nextStage();
      }

      camera=clamp(player.x-160,0,WORLD-W);
    }

    function rect(x,y,w,h,color) {
      ctx.fillStyle=color;
      ctx.fillRect(Math.round(x),Math.round(y),w,h);
    }

    function draw() {
      const s=stages[stage];
      rect(0,0,W,H,s.sky);

      for(let x=0;x<WORLD;x+=170) {
        const px=x-camera*0.45;
        if(px<-100 || px>W+100)continue;
        rect(px,168,70,48,
          stage===1?'#7b849d':'#93b8a0');
        rect(px+15,180,14,17,'#f7e5aa');
        rect(px+40,180,14,17,'#f7e5aa');
      }

      rect(0,GROUND,W,H-GROUND,s.ground);
      rect(0,GROUND,W,7,
        stage===1?'#b3a9a3':'#5eae55');

      for(let x=0;x<WORLD;x+=32) {
        const px=x-camera;
        if(px>-32 && px<W)rect(px,GROUND+19,14,4,'#79503c');
      }

      for(const p of platforms) {
        rect(p.x-camera,p.y,p.w,p.h,'#b36e43');
        rect(p.x-camera,p.y,p.w,5,'#e7b667');
      }

      for(const b of blocks) {
        const x=b.x-camera;
        rect(x,b.y,28,28,
          b.used?'#937d70':'#e4a42d');
        rect(x+3,b.y+3,22,22,
          b.used?'#a79b8e':'#ffcb54');
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
        rect(x,e.y,22,22,
          stage===2?'#b53d53':'#925a43');
        rect(x+4,e.y+6,5,5,'#fff');
        rect(x+13,e.y+6,5,5,'#fff');
        rect(x+6,e.y+8,2,3,'#17243b');
        rect(x+15,e.y+8,2,3,'#17243b');
      }

      // Exit pipe.
      const pipeX=WORLD-65-camera;
      rect(pipeX,GROUND-62,50,62,'#198d4e');
      rect(pipeX-5,GROUND-69,60,13,'#39c26a');

      // Original retro player character.
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
        ctx.fillText("5:30. FREEDOM!",112,143);
      }
    }

    function loop(now) {
      const elapsed=Math.min(80,now-last);
      last=now;
      acc+=elapsed;
      let steps=0;

      while(acc>=16.67 && steps<5 && running) {
        update();
        acc-=16.67;
        steps++;
      }

      if(messageUntil<now && running) {
        $('nadsMessage').textContent=stages[stage].intro;
        messageUntil=Infinity;
      }

      draw();
      if(running)raf=requestAnimationFrame(loop);
    }

    function bindHold(id,key) {
      const el=$(id);
      const down=e=>{
        e.preventDefault();
        keys[key]=true;
        try{el.setPointerCapture(e.pointerId);}catch(err){}
      };
      const up=e=>{
        e.preventDefault();
        keys[key]=false;
      };
      el.addEventListener('pointerdown',down);
      el.addEventListener('pointerup',up);
      el.addEventListener('pointercancel',up);
      el.addEventListener('lostpointercapture',
        ()=>{keys[key]=false;});
    }

    bindHold('nadsLeft','left');
    bindHold('nadsRight','right');
    bindHold('nadsJump','jump');

    const keymap={
      ArrowLeft:'left',KeyA:'left',
      ArrowRight:'right',KeyD:'right',
      ArrowUp:'jump',Space:'jump',KeyW:'jump'
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
      if(keymap[e.code])keys[keymap[e.code]]=false;
    });

    window.addEventListener('blur',()=>{
      keys.left=keys.right=keys.jump=false;
    });

    $('nadsStart').addEventListener('click',start);

    hall();
    setupStage();
    draw();
  }

  if(document.readyState==='loading') {
    document.addEventListener('DOMContentLoaded',init);
  } else {
    init();
  }
})();
