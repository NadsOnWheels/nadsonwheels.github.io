
/* NADS' SECRET ARCADE
   Land Estates Edition - GTA 6 Easter Egg */

(() => {
  function init() {
    const card = document.querySelector('#takehome .card');
    if (!card || document.getElementById('nadsArcade')) return;

    // Keep every word of the existing Take Me Home introduction.
    // Remove the old entertainment, jokes and proverbs display.
    card.querySelector('.result')?.remove();
    card.querySelectorAll('.note').forEach(el => {
      if (el.textContent.includes('favourite clips')) el.remove();
    });
    ['nadsJokeSection', 'nadsProverbSection',
     'nadsJokeBox', 'nadsProverbBox'].forEach(id => {
      document.getElementById(id)?.remove();
    });

    // Remove other old entertainment elements, if present.
    card.querySelectorAll('*').forEach(el => {
      if (
        el.id === 'nadsArcade' ||
        el.closest('#nadsArcade')
      ) return;
      if (
        el.querySelector('#nadsNewJoke') ||
        el.querySelector('#nadsNewProverb')
      ) el.remove();
    });

    const style = document.createElement('style');
    style.textContent = `
      #nadsArcade {
        margin-top:20px;padding:16px 12px;
        background:#15253c;border:3px solid #e9ba51;
        border-radius:12px;color:white;text-align:center;
        font-family:monospace
      }
      #nadsArcade h2,#nadsArcade h3 {color:#ffdb79}
      #nadsArcade p {line-height:1.55}
      #nadsArcade button {
        background:#efbf54;color:#18243b;
        border:2px solid white;border-radius:7px;
        padding:12px;margin:5px;
        font:bold 14px monospace;cursor:pointer
      }
      #nadsArcade button:disabled {opacity:.45}
      #nadsArcade .arcMenu {
        display:grid;gap:6px;margin:15px 0
      }
      #nadsArcade .arcHidden {display:none!important}
      #nadsArcade .arcPanel {
        border:2px dashed #819bb7;
        padding:12px 7px;border-radius:9px;margin-top:15px
      }
      #nadsArcade .arcSmall {
        font-size:12px;color:#d3dfed
      }
      #nadsArcade canvas {
        display:block;width:100%;max-width:360px;
        margin:12px auto;border:3px solid white;
        background:#8ed4f3;image-rendering:pixelated;
        touch-action:manipulation
      }
      #nadsArcade #arcBlock {
        font-size:45px;width:90px;height:90px;
        background:#d9982c
      }
      #nadsArcade #arcSurprise {min-height:85px}
    `;
    document.head.appendChild(style);

    const arcade = document.createElement('section');
    arcade.id = 'nadsArcade';
    arcade.innerHTML = `
      <h2>🍄 NADS' SECRET ARCADE</h2>
      <p>PLAYER ONE · LAND ESTATES EDITION</p>
      <p class="arcSmall">
        Princesses are optional. Coins are not.
      </p>

      <div id="arcMenu" class="arcMenu">
        <button id="arcRent">🪙 THE RENT RUN</button>
        <button id="arcMystery">❓ MYSTERY BLOCK</button>
        <button id="arcOffice" disabled>
          🔒 ESCAPE FROM LAND ESTATES
        </button>
        <button id="arcWarp">🟩 SECRET WARP PIPE</button>
        <p id="arcUnlock" class="arcSmall">
          Collect 100 points to unlock the office dungeon.
        </p>
      </div>

      <div id="arcGame" class="arcPanel arcHidden">
        <h3 id="arcLevel"></h3>
        <p id="arcScore"></p>
        <canvas id="arcCanvas"
          width="320" height="200"></canvas>
        <p id="arcGameMessage" class="arcSmall"></p>
        <button id="arcStart">▶ START</button>
        <button id="arcJump">⬆ JUMP</button>
        <button class="arcBack">↩ ARCADE MENU</button>
      </div>

      <div id="arcMysteryPanel"
        class="arcPanel arcHidden">
        <h3>❓ THE MYSTERY BLOCK</h3>
        <button id="arcBlock">?</button>
        <p id="arcSurprise">Go on. Hit it.</p>
        <button class="arcBack">↩ ARCADE MENU</button>
      </div>

      <div id="arcWarpPanel"
        class="arcPanel arcHidden">
        <h3>🟩 SECRET WARP PIPE</h3>
        <p>Congratulations! You've escaped Land Estates.</p>
        <p>Your whereabouts are now Kim's problem.</p>
        <button id="arcTravel">
          🍄 WARP TO ADVENTURE
        </button>
        <button class="arcBack">↩ ARCADE MENU</button>
      </div>
    `;
    card.appendChild(arcade);

    const $ = id => document.getElementById(id);

    // All eight Land Estates characters.
    const surprises = [
      "☕ Ali has activated the Coffee & Creatine Protocol. Office energy restored to 100%.",
      "💰 LEGENDARY LOOT! Ali has approved a pay rise!",
      "⭐ Kim has approved your annual leave. +500 XP!",
      "📜 New legislation has dropped. Kim has already read it.",
      "🌶️ Lewis has challenged Nads to a spicy-dip duel. Neither will concede defeat.",
      "🧠 Lewis remembers the answer to a question nobody remembers asking.",
      "🏆 Lewis: You're wrong. Nads: Your evidence is wrong. ACHIEVEMENT: UNDEFEATED IN ARGUMENT.",
      "🔧 Ryan has defeated the Boiler Breakdown Beast. Another 17 repair requests have spawned.",
      "⚖️ Zoe has completed three inventories, two checkouts and a court appearance. It's only Tuesday.",
      "🗝️ The keys are missing. Layton checks his pockets. Quest completed.",
      "🏡 Layton has completed another viewing. Another successful property quest!",
      "🎮 Lewis has challenged your answer. Nads activates DENY EVERYTHING mode.",
      "🍄 Nads has calmed Jade down. Office stability restored.",
      "🌋 Stress Eruption: Jade has reached critical capacity. All enemies retreat three spaces.",
      "🗣️ Unfiltered Wisdom: Jade says something nobody anticipated. Everyone freezes for five seconds.",
      "🔥 Emergency Meltdown: The office printer jams. Jade's power level increases by 300%.",
      "🍄 SPECIAL POWER-UP: Jade is having a good day. All office productivity increases by 200%.",
      "📞 The phone rang twice. Everyone looked at you.",
      "🖨️ Legendary item discovered: a printer that works on the first attempt.",
      "📁 Your inbox is empty. This is clearly a dream.",
      "🏡 A tenant has submitted every document correctly. MYTHICAL EVENT!",
      "👑 Achievement unlocked: King of the Tea Round.",
      "💎 Legendary item found: a stapler that actually staples.",
      "🏰 The princess is in another postcode.",
      "🎮 Congratulations. You have successfully avoided working."
    ];

    const gtaEasterEgg =
      "🎮 GTA 6 LAUNCH DAY - No one is in work.";

    let lastSurprise = -1;

    $('arcMystery').onclick =
      () => showPanel('arcMysteryPanel');

    $('arcWarp').onclick =
      () => showPanel('arcWarpPanel');

    $('arcBlock').onclick = () => {
      // Rare GTA 6 Easter egg: approximately 1 in 40 taps.
      if (Math.random() < 1 / 40) {
        $('arcSurprise').textContent = gtaEasterEgg;
        return;
      }

      let i = Math.floor(Math.random() * surprises.length);
      if (i === lastSurprise) {
        i = (i + 1) % surprises.length;
      }
      lastSurprise = i;
      $('arcSurprise').textContent = surprises[i];
    };

    $('arcTravel').onclick = () => {
      if (typeof window.show === 'function') {
        window.show('adventure');
      } else {
        location.hash = '#adventure';
      }
    };

    const panels = [
      'arcMenu', 'arcGame',
      'arcMysteryPanel', 'arcWarpPanel'
    ];

    let running = false;
    let animation = null;
    let level = 1;
    let score = 0;
    let best = 0;
    let unlocked = false;
    let frame = 0;
    let items = [];

    try {
      best =
        Number(localStorage.getItem('nadsArcadeBest')) || 0;
      unlocked =
        localStorage.getItem('nadsOfficeUnlocked') === 'yes';
    } catch(e) {}

    function showPanel(id) {
      running = false;
      cancelAnimationFrame(animation);
      panels.forEach(name => {
        $(name).classList.toggle('arcHidden', name !== id);
      });
    }

    arcade.querySelectorAll('.arcBack').forEach(button => {
      button.onclick = () => showPanel('arcMenu');
    });

    function refreshUnlock() {
      $('arcOffice').disabled = !unlocked;
      $('arcOffice').textContent = unlocked
        ? '🏰 ESCAPE FROM LAND ESTATES'
        : '🔒 ESCAPE FROM LAND ESTATES';
      $('arcUnlock').textContent = unlocked
        ? '⭐ BONUS LEVEL UNLOCKED!'
        : 'Collect 100 points to unlock the office dungeon.';
    }

    function unlockOffice() {
      if (unlocked) return;
      unlocked = true;
      try {
        localStorage.setItem('nadsOfficeUnlocked', 'yes');
      } catch(e) {}
      refreshUnlock();
      $('arcGameMessage').textContent =
        '⭐ OFFICE DUNGEON UNLOCKED! Kim awaits.';
    }

    const canvas = $('arcCanvas');
    const ctx = canvas.getContext('2d');
    const ground = 165;
    const player = {
      x:45, y:143, w:18, h:22, vy:0
    };

    function updateScore() {
      $('arcScore').textContent =
        'SCORE ' + String(score).padStart(3,'0') +
        ' · BEST ' + String(best).padStart(3,'0');
    }

    function jump() {
      if (running && player.y >= ground-player.h-1) {
        player.vy = -10;
      }
    }

    $('arcJump').onclick = jump;
    canvas.addEventListener('pointerdown', jump);

    document.addEventListener('keydown', e => {
      if (
        e.code === 'Space' &&
        running &&
        !['INPUT','TEXTAREA','BUTTON'].includes(
          document.activeElement.tagName
        )
      ) {
        e.preventDefault();
        jump();
      }
    });

    function draw() {
      ctx.fillStyle = level === 1
        ? '#8ed4f3' : '#414a67';
      ctx.fillRect(0,0,320,200);

      if (level === 1) {
        // Dartford skyline
        ctx.fillStyle = '#a1bdc3';
        for (let x=0;x<320;x+=55) {
          ctx.fillRect(x,90,40,75);
        }
        ctx.fillStyle = '#fff';
        for (let i=0;i<3;i++) {
          const x =
            ((i*135-frame*.2)%400+400)%400;
          ctx.fillRect(x-35,25+i*15,38,10);
        }
      } else {
        // The office dungeon
        ctx.fillStyle = '#67738d';
        for (let x=0;x<320;x+=48) {
          ctx.fillRect(x,35,38,130);
          ctx.fillStyle = '#f4d480';
          for (let y=45;y<140;y+=23) {
            ctx.fillRect(x+9,y,19,11);
          }
          ctx.fillStyle = '#67738d';
        }
      }

      ctx.fillStyle = level === 1
        ? '#55a44d' : '#87919a';
      ctx.fillRect(0,ground,320,9);

      ctx.fillStyle = level === 1
        ? '#9d6b3b' : '#303849';
      ctx.fillRect(0,ground+9,320,26);

      // Nads: original pixel adventurer
      ctx.fillStyle = '#bd3448';
      ctx.fillRect(player.x+2,player.y,15,6);
      ctx.fillStyle = '#f3c49a';
      ctx.fillRect(player.x+5,player.y+6,11,7);
      ctx.fillStyle = '#2855a1';
      ctx.fillRect(player.x+2,player.y+13,16,9);
      ctx.fillStyle = '#17233a';
      ctx.fillRect(player.x+2,player.y+20,6,3);
      ctx.fillRect(player.x+12,player.y+20,6,3);

      items.forEach(item => {
        if (item.type === 'coin') {
          ctx.fillStyle = '#ffd43b';
          ctx.fillRect(item.x+3,item.y,12,16);
          ctx.fillStyle = '#956311';
          ctx.fillRect(item.x+8,item.y+4,3,8);
        } else {
          ctx.fillStyle = level === 1
            ? '#ad633b' : '#cf4756';
          ctx.fillRect(item.x,item.y,22,22);
          ctx.fillStyle = '#fff';
          ctx.fillRect(item.x+4,item.y+5,5,5);
          ctx.fillRect(item.x+13,item.y+5,5,5);
        }
      });
    }

    function collision(a,b) {
      return (
        a.x < b.x+b.w &&
        a.x+a.w > b.x &&
        a.y < b.y+b.h &&
        a.y+a.h > b.y
      );
    }

    function finish() {
      running = false;
      cancelAnimationFrame(animation);
      $('arcStart').textContent = '↻ TRY AGAIN';
      $('arcGameMessage').textContent = level === 1
        ? 'The paperwork wins this round! Score: '+score
        : 'Kim has requested further authorisation. Score: '+score;
      draw();
    }

    function tick() {
      if (!running) return;

      frame++;
      player.vy += .55;
      player.y += player.vy;

      if (player.y >= ground-player.h) {
        player.y = ground-player.h;
        player.vy = 0;
      }

      if (frame % 62 === 0) {
        const coin = Math.random() < .75;
        items.push({
          type:coin?'coin':'obstacle',
          x:325,
          y:coin?ground-43:ground-22,
          w:coin?18:22,
          h:coin?16:22
        });
      }

      const speed = 3+Math.min(score/100,2);
      items.forEach(item => item.x -= speed);

      for (const item of items) {
        if (!collision(player,item)) continue;

        if (item.type === 'obstacle') {
          finish();
          return;
        }

        item.x = -100;
        score += 10;

        if (score > best) {
          best = score;
          try {
            localStorage.setItem(
              'nadsArcadeBest',String(best)
            );
          } catch(e) {}
        }

        if (score >= 100 && level === 1) {
          unlockOffice();
        }

        updateScore();
      }

      items = items.filter(item => item.x > -30);
      draw();
      animation = requestAnimationFrame(tick);
    }

    function openGame(which) {
      level = which;
      $('arcLevel').textContent = level === 1
        ? '🪙 WORLD 1-1: THE RENT RUN'
        : '🏰 WORLD 2-1: ESCAPE FROM LAND ESTATES';

      $('arcGameMessage').textContent = level === 1
        ? 'Collect golden keys. Dodge the paperwork!'
        : 'Escape the office. Kim guards the final exit!';

      $('arcStart').textContent = '▶ START';
      showPanel('arcGame');

      score = 0;
      frame = 0;
      items = [];
      player.y = ground-player.h;
      player.vy = 0;

      updateScore();
      draw();
    }

    $('arcRent').onclick = () => openGame(1);

    $('arcOffice').onclick = () => {
      if (unlocked) openGame(2);
    };

    $('arcStart').onclick = () => {
      cancelAnimationFrame(animation);

      running = true;
      score = 0;
      frame = 0;
      items = [];
      player.y = ground-player.h;
      player.vy = 0;

      $('arcStart').textContent = '↻ RESTART';
      $('arcGameMessage').textContent = level === 1
        ? 'Collect those keys, Nads!'
        : 'Escape the Monday Morning Inbox!';

      updateScore();
      tick();
    };

    refreshUnlock();
    updateScore();
    draw();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded',init);
  } else {
    init();
  }
})();
