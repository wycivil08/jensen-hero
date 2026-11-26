/* The encounter owns damage and victory. This screen owns the player's checkpoint and invitation. */
(() => {
  "use strict";
  const byId = id => document.getElementById(id);
  const panel = byId("journeyPanel"), action = byId("journeyAction"), other = byId("journeyOther");
  const share = byId("journeyShare"), notice = byId("journeyNotice");
  const chapterCards = {
    diner: ["Act I / Portland", "The last table", "Before the chips, Jensen worked the floor at a diner. Tonight, in our story, a crowd has blocked the aisle. Get your coworker through.", "Click a guest to approach and punch. Click the floor to move. The tray is yours if you want it.", "Clear the aisle"],
    arcade: ["Act II / The arcade", "Power on", "In 1993, Jensen, Chris Malachowsky and Curtis Priem founded NVIDIA. By its 1999 GPU milestone, this imagined arcade is ready for your twin gauntlets.", "Pick a target. Your new gauntlets attack faster and can hit nearby rivals in the same swing.", "Enter the arcade"],
    cuda: ["Act II / 2006", "Parallel lines", "In 2006, NVIDIA unveiled CUDA. Here the cabinets are wired together, but a punch only powers one. Can you light the bank before the champion closes in?", "Hit a ringed rival, then switch to another nearby. Watch what happens to the cabinets.", "Light the cabinets"],
    seats: ["Act III / The boardroom", "The Ten Seats", "November 12, 2026. NVIDIA announces Jensen’s resignation. In the dark glass of a boardroom, ten imagined rivals stand up.", "Click a rival to pursue. Click the floor to dodge. Press 1 for Shield Rush or 2 for Thunder Slam.", "Enter the boardroom"]
  };
  const victories = {
    diner: ["The aisle is clear", "Your coworker carries the order through. Years later, another table will change Jensen’s life.", "Twin GPU gauntlets + Gauntlet Cyclone unlocked", "Go to the arcade"],
    arcade: ["A new circuit", "The cabinet takes power. The others are still dark. Follow the wiring into the next room.", "The circuit room is open", "Discover CUDA"],
    cuda: ["Lights on", "Your strike powered three targets at once. With the arcade lit, take the shield and thunder hammer into the boardroom.", "Wafer shield + thunder hammer unlocked", "Approach the ten seats"]
  };
  const weapons = ["charge shield","sidearm","mortar","tower shield","long rifle","healing beacon","rush shield","scattergun","ring emitter","hooked disc"];
  const scoutTips = [
    "Step out of the charge lane. Strike while the shield is down.",
    "Move across the gun barrel’s line as the shot leaves.",
    "Leave the marked mortar circle before it lands.",
    "Circle behind the tower shield or strike when it opens to bash.",
    "Sidestep the locked rifle shot. Close in during the reload.",
    "Aim a heavy hammer swing at the beacon while it channels a heal.",
    "Keep the rush shield in front of you. Move aside when it closes in.",
    "Watch all three firing lanes. Move through a gap.",
    "Stand in the ring’s quiet center or move beyond its outer edge.",
    "Dodge the disc on its way out, then change lanes before it comes back."
  ];
  const shield = "M8 3L16 1L24 3V13L16 21L8 13Z";
  const barrel = "M3 8H25V12H12L10 18H6L7 12H3Z";
  const silhouettes = [shield,barrel,"M3 17L21 4L27 10L8 21ZM12 17L23 21H11Z",shield,
    "M1 11H19V8H29V11H31V13H14L12 17H9L10 13H7L2 16Z",
    "M14 1H18V6H23V10H18V15H14V10H9V6H14ZM8 21L15 15H17L24 21Z",shield,barrel,
    "M2 6L8 3H24L30 6L24 10H18V14L26 17L21 20H11L6 17L14 14V10H8Z",
    "M26 2Q9 0 5 11Q1 21 15 22Q25 22 29 11L22 16Q14 21 11 14Q10 8 21 6L18 10Z"];
  let mode, chapter, profile, store, restart, invitation, relayFirst = null, edition = 3;
  let signature = "hammer", latestMove = null, settling = false, seatsSettled = false;
  const transferKey = p => "jensen_reflection_once:"+p.careerId+":"+p.revision;
  function reflectionURL() { const url = new URL(gameURL("story")); url.searchParams.set("encounter","reflection"); return url.href; }
  function enterReflection() {
    if (!profile || R7Store.journeyChapter(profile)!=="ending") return;
    try {
      sessionStorage.removeItem(transferKey(profile));
      if (latestMove) sessionStorage.setItem(transferKey(profile),latestMove);
    } catch { /* The neutral demo is honest when session storage is unavailable. */ }
    latestMove=null;
    location.assign(reflectionURL());
  }
  function takeSignature() {
    try { const key=transferKey(profile),move=sessionStorage.getItem(key); sessionStorage.removeItem(key); return ["leap","cyclone"].includes(move)?move:"hammer"; }
    catch { return "hammer"; }
  }
  const seatName = n => window.R24Data.finale.seats["seat_"+String(n).padStart(2,"0")].label;
  const opening = n => seatName(n)+" · "+weapons[n-1];
  function challengeURL(first, version = edition === 3 ? 3 : first ? 2 : 1) {
    const url = new URL(gameURL("challenge"));
    url.searchParams.set("v",String(version));
    if (first) url.searchParams.set("first",String(first));
    return url.href;
  }
  function weapon(icon, first) {
    icon.style.display = first ? "" : "none";
    if (first) icon.firstElementChild.setAttribute("d",silhouettes[first-1]);
  }
  const scoutSelect = byId("journeyScoutSeat");
  function showScoutTip() {
    const n = Number(scoutSelect.value);
    if (!Number.isInteger(n) || n < 1 || n > weapons.length) return;
    weapon(byId("journeyScoutWeapon"),n);
    byId("journeyScoutTip").textContent = (n===relayFirst ? "Your friend opened here. " : "")+scoutTips[n-1];
  }
  scoutSelect.addEventListener("change",showScoutTip);
  function showRelayNapkin() {
    const options = weapons.map((_,i)=>{
      const option = document.createElement("option");
      option.value = String(i+1);
      option.textContent = String(i+1).padStart(2,"0")+"  "+opening(i+1);
      return option;
    });
    scoutSelect.replaceChildren(...options);
    scoutSelect.value = String(relayFirst===5 ? 3 : 5);
    showScoutTip();
    byId("journeyScout").hidden = false;
  }
  function gameURL(nextMode) {
    const url = new URL(location.href);
    url.search = ""; url.hash = ""; url.searchParams.set("mode", nextMode);
    if (nextMode === "challenge") url.searchParams.set("v", "3");
    return url.href;
  }
  function link(text, dest) {
    other.textContent = text; other.href = dest; other.hidden = false; other.onclick = null;
  }
  function screen(art, place, title, story, controls = "") {
    panel.dataset.art = art; panel.hidden = false;
    byId("journeyPlace").textContent = place; byId("journeyTitle").textContent = title;
    byId("journeyStory").textContent = story; byId("journeyControls").textContent = controls;
    byId("journeyNewsSource").hidden = true;
    byId("journeyScout").hidden = true;
    byId("journeyScore").hidden = true; byId("journeyManual").hidden = true;
    byId("journeyReport").hidden = true; byId("reportPreview").open = false;
    byId("journeyTab").open = !["return","coffee","reflection"].includes(art);
    other.hidden = share.hidden = true; invitation = ""; notice.textContent = "";
    byId("journeyRelay").hidden = true; byId("journeyPair").hidden = true;
    byId("journeyImport").hidden = location.protocol !== "file:";
    action.hidden = false; action.disabled = true; action.onclick = null;
  }
  function button(label, go) {
    action.textContent = label; action.disabled = false; action.onclick = go;
    if (document.hasFocus() && document.activeElement!==scoutSelect) action.focus({preventScroll:true});
  }
  function play(fn, event) {
    panel.hidden = true;
    if (relayFirst) {
      byId("journeyRelay").textContent = "Your goal: first defeat someone other than "+opening(relayFirst)+", then clear all ten.";
      byId("journeyRelay").hidden = false;
    }
    fn(event);
    byId("view").focus({preventScroll:true});
  }
  function firstDown(first) {
    if (!relayFirst) return;
    byId("journeyRelay").textContent = first === relayFirst
      ? "Same opening · solo clear still available. Retry for a different first defeat to complete the relay."
      : "Different opening achieved · now clear all ten to complete the relay.";
  }
  function offerShare(text, label, first) {
    const destination = location.protocol === "file:"
      ? ("JH"+(edition === 3 ? 3 : first ? 2 : 1)+(first ? ":"+first : ""))+"\nOpen your offline story file, then load this Challenge code."
      : challengeURL(first);
    invitation = [text, destination].filter(Boolean).join("\n");
    share.textContent = label; share.hidden = false;
  }
  byId("journeyImport").addEventListener("submit", event => {
    event.preventDefault();
    const code = byId("journeyCode").value.trim();
    const match = /^(?:JH(1|3)|JH(2|3):([1-9]|10))$/.exec(code);
    if (!match) {
      notice.textContent = "Unknown challenge code. Try JH3, or a relay such as JH3:5."; return;
    }
    location.assign(challengeURL(Number(match[3]) || null, Number(match[1] || match[2])));
  });
  share.addEventListener("click", async () => {
    const message = invitation;
    if (!message || share.hidden || panel.hidden) return;
    try {
      await navigator.clipboard.writeText(message);
      if (invitation !== message || panel.hidden) return;
      notice.textContent = location.protocol === "file:" ? "Copied an offline challenge code. Your friend needs their own copy of the story file." : "Copied. Your friend can enter the same fight.";
    } catch {
      if (invitation !== message || panel.hidden) return;
      byId("journeyManual").hidden = false;
      const field = byId("journeyText"); field.value = message; field.focus(); field.select();
    }
  });
  function fullClear({hp,seatsDown}) {
    return Number.isFinite(hp) && hp>0 && hp<=3800 && seatsDown.length===10 &&
      new Set(seatsDown).size===10 && seatsDown.every(n=>Number.isInteger(n)&&n>=1&&n<=10);
  }
  function scoreCard(result, won, paired = false) {
    const {seatsDown,hp} = result;
    const first = seatsDown[0];
    const list = byId("journeySeats");
    list.replaceChildren();
    for (let i=1; i<=10; i++) {
      const item = document.createElement("li"), down = seatsDown.includes(i);
      item.classList.toggle("down",down); item.classList.toggle("first",i===first);
      item.textContent = down ? "×" : String(i).padStart(2,"0");
      item.setAttribute("aria-label",seatName(i)+(down ? " defeated" : " standing"));
      item.title = seatName(i); list.append(item);
    }
    const tally = seatsDown.length+" / 10 seats";
    const firstText = first && !relayFirst ? "First down: "+seatName(first)+" ("+weapons[first-1]+"). " : "";
    const detail = won ? hp.toLocaleString("en-US",{maximumFractionDigits:2})+" HP left." : (10-seatsDown.length)+" still standing.";
    const icon = byId("journeyWeapon");
    weapon(icon,relayFirst ? null : first);
    byId("journeyRecord").textContent = [tally+" · "+detail,firstText.trim()].filter(Boolean).join(" ");
    byId("journeyScore").hidden = false;
    if (relayFirst) {
      byId("journeyPair").hidden = false;
      byId("journeyPair").dataset.lit = String(paired);
      weapon(byId("journeySenderWeapon"),relayFirst);
      byId("journeySender").textContent = "Invited opening: "+opening(relayFirst);
      weapon(byId("journeyOwnWeapon"),first);
      byId("journeyOwn").textContent = first ? "Your opening: "+opening(first) : "Your opening: none yet";
    }
    if (won && edition===3) {
      const last = seatsDown[seatsDown.length-1];
      const vitality = hp.toLocaleString("en-US",{maximumFractionDigits:2});
      const firstName = seatName(first), lastName = seatName(last);
      const dare = "Can you take "+lastName+" first?";
      const message = [
        "Jensen Hero · Back at the booth",
        "I left you a seat.",
        "I cleared all ten with "+vitality+" HP. "+firstName+" fell first. "+lastName+" was the last one standing.",
        dare+" Clear all ten with any opener except "+firstName+" to light our booth."
      ].join("\n");
      offerShare(message,"Copy battle report",first);
      byId("reportFirst").textContent = firstName;
      byId("reportLast").textContent = lastName;
      byId("reportHP").textContent = vitality+" / "+window.R24Data.finale.hp.toLocaleString("en-US");
      byId("reportDare").textContent = dare;
      byId("reportMessage").textContent = invitation;
      byId("journeyScore").hidden = true;
      byId("journeyReport").hidden = false;
    } else if (won) {
      offerShare("Jensen Hero · The Ten Seats v2\nI cleared all ten; first down: "+opening(first)+". Defeat a different seat first, then clear all ten.","Copy relay",first);
    }
  }
  function showNewsSource() {
    byId("journeyNewsSource").hidden=false;
  }
  function ending(score, news = false) {
    const complete=Boolean(profile?.journey.reflection);
    screen(news ? "return" : complete ? "coffee" : "ending",news ? "November 23, 2026 / NVIDIA announcement" : "Epilogue / Back at the diner",
      news ? "The board’s decision" : complete ? "I left you a seat." : "The last booth",
      news ? "On November 23, NVIDIA announced its board had reinstated Jensen as president, CEO and director. The vote took place November 22. Your ten-seat result is saved." :
      complete ? "Your coworker sets down a coffee. Across the booth, an empty seat waits." : "Jensen sets the wafer shield beside his old serving tray. The window holds one last opponent. Your battle report is saved; face the reflection now or return later.");
    button(complete ? "Face the reflection again" : "Face the reflection",enterReflection);
    scoreCard(score,true);
    if (news) {
      showNewsSource();
      link("Return to the booth · fight later",gameURL("story"));
      other.onclick=event=>{event.preventDefault();ending(score);};
    } else link("Try a different opening",challengeURL(score.seatsDown[0]));
  }
  function reflectionIntro() {
    const practice=mode==="reflection";
    const remembered=signature!=="hammer";
    screen("reflection",practice ? "The Reflection / Practice · Leap demonstration" : "Epilogue / The diner window","One last reflection",
      practice ? "At the diner window, a shadow lifts your hammer. Watch its first leap." :
      remembered ? "In the glass, the reflection rehearses your last "+(signature==="leap" ? "Thunder Leap" : "Cyclone Guard")+" from the Ten Seats. Watch its first, harmless rehearsal." :
      "The reflection rehearses a hammer demonstration. Watch its first, harmless swing.",
      "Leave the locked attack. Strike after its final flash. Two counters will settle the glass.");
    link(practice ? "Play the story" : "Return to the saved booth",gameURL("story"));
    if (!practice) scoreCard(R7Store.journeyScore(profile),true);
  }
  function saveError(error, retry) {
    byId("boot").hidden = true;
    screen("diner","Career save","Checkpoint paused",error instanceof Error ? error.message : String(error));
    button(retry ? "Retry save" : "Reload checkpoint",retry || (()=>location.reload()));
    if (retry) link("Reload saved checkpoint",gameURL("story"));
    else link("Play friend challenge",gameURL("challenge"));
  }
  async function open(requestedMode) {
    mode = requestedMode; document.body.classList.add("journey"); document.title = "Jensen Hero · From Tray to Thunder";
    const params = new URL(location.href).searchParams;
    if (mode === "reflection" || params.getAll("mode").includes("reflection")) {
      const cleanOffline=location.protocol==="file:" && !params.size && document.documentElement.dataset.mode==="reflection";
      if (!cleanOffline && (params.getAll("mode").length!==1 || params.get("mode")!=="reflection" || [...params.keys()].some(key=>key!=="mode"))) {
        byId("boot").hidden=true;
        screen("reflection","The Reflection / Practice","Invalid practice link","Open a fresh standalone practice duel.");
        button("Open practice",()=>location.assign(gameURL("reflection"))); return null;
      }
      mode="reflection";
      chapter="reflection"; signature="leap"; document.body.classList.add("survivor"); reflectionIntro(); action.textContent="Preparing arena…"; return chapter;
    }
    if (mode === "challenge" || params.getAll("mode").includes("challenge")) {
      const version = params.get("v");
      const first = params.getAll("first");
      const valid = params.getAll("mode").length===1 && params.get("mode")==="challenge" &&
        params.getAll("v").length===1 && ["1","2","3"].includes(version) &&
        [...params.keys()].every(key=>["mode","v","first"].includes(key)) &&
        (first.length === 0 ? version !== "2" : version !== "1" && first.length === 1 && /^(?:[1-9]|10)$/.test(first[0]));
      if (!valid) {
        byId("boot").hidden = true;
        screen("ending","Friend challenge","Invalid invitation","This challenge code is malformed or uses unsupported rules. No relay has been loaded. You can play the current ten-seat fight.");
        button("Play current challenge",()=>location.assign(gameURL("challenge"))); return null;
      }
      edition = Number(version);
      relayFirst = first.length ? Number(first[0]) : null;
      chapter = "seats";
    } else {
      try {
        store = R7Store.connect(localStorage,work=>{
          if (!navigator.locks) throw Error("Saving needs a secure browser context. Open this game in Chrome, or use its HTTPS address.");
          return navigator.locks.request(R7Store.KEY,work);
        });
        profile = store.read();
        if (!profile) profile = await store.save(R7Store.create(crypto.randomUUID()));
        chapter = R7Store.journeyChapter(profile);
        if (chapter==="ending") {
          edition=profile.journey.edition || 2;
          if (params.getAll("mode").length===1 && params.get("mode")==="story" && params.getAll("encounter").length===1 && params.get("encounter")==="reflection") {
            chapter="reflection"; signature=takeSignature(); document.body.classList.add("survivor"); reflectionIntro(); action.textContent="Preparing arena…"; return chapter;
          }
          byId("boot").hidden=true; ending(R7Store.journeyScore(profile)); return null;
        }
      } catch (e) { saveError(e); return null; }
    }
    document.body.classList.toggle("survivor",edition===3);
    const [place,title,story,controls] = chapterCards[chapter];
    const touch = matchMedia("(pointer: coarse)").matches;
    const move = touch ? "Tap the floor or drag to steer." : "Move with WASD, arrows, or click the floor.";
    const selectRival = touch ? "tap" : "click";
    const survivorHints = {
      diner:"Your fists will find nearby rivals. Keep the aisle moving.",
      arcade:"Use 1 for Gauntlet Cyclone. Keep moving through the pack while your gauntlets strike.",
      cuda:"To light the cabinets, "+selectRival+" a ringed rival. After the first hit, "+selectRival+" another ringed rival nearby.",
      seats:touch ? "Tap a rival to focus it. Tap 1 just before a frontal strike to parry and spin. Tap 2 to leap and call lightning." : "Click a rival to focus it. Press 1 just before a frontal strike to parry and spin. Aim and press 2 to leap and call lightning."
    };
    if(edition===3)byId("hint").textContent=touch?"Drag to steer · tap a rival to focus":"WASD or arrows to steer · click a rival to focus";
    const input = edition === 3 ? move+" "+survivorHints[chapter] : touch ? "Turn sideways for more room. Tap a rival to pursue or the floor to move."+
      (chapter==="seats" ? " Tap the skill buttons for Shield Rush and Thunder Slam." : "") : controls;
    if (mode==="challenge" && edition===3 && relayFirst) {
      screen("relay","Friend’s opening · Seat "+String(relayFirst).padStart(2,"0"),seatName(relayFirst)+" fell first.",
        "Defeat a different rival first, then clear all ten to light your mark beside your friend’s.",input);
      showRelayNapkin();
    } else {
      screen(chapter==="seats"&&mode==="story"?"arrival":chapter,mode==="challenge" ? "Friend challenge / Edition "+edition : place,title,mode==="challenge" ? (relayFirst ? "The invitation opens with "+opening(relayFirst)+". Defeat a different seat first, then clear all ten. The same opening can still earn a solo clear." : "One hero. Ten seats. The same shield and hammer as your friend. Who will you take down first?") : story,input);
    }
    action.textContent = "Preparing arena…";
    if (mode==="challenge") {
      offerShare(relayFirst ? "Defeat a different seat first than "+opening(relayFirst)+", then clear all ten." : "", "Copy invitation",relayFirst);
      link("Play the story",gameURL("story"));
    } else if (chapter==="diner") link("Friend challenge",gameURL("challenge"));
    return chapter;
  }
  function ready(startFight, retryFight) {
    restart = retryFight;
    button(chapter==="reflection" ? "Face the reflection" : chapterCards[chapter][4],event=>play(startFight,event));
  }
  async function finish(result) {
    const {won} = result;
    if (settling || seatsSettled && chapter==="seats") return;
    if (chapter==="reflection") {
      if (won && result.reflection?.counters!==2) {
        screen("reflection","The Reflection","Duel not verified","Two earned counters are required to complete this duel.");
        button("Try the reflection again",event=>play(restart,event));
        link(mode==="reflection" ? "Play the story" : "Return to the saved booth",gameURL("story"));
        if(mode==="story")scoreCard(R7Store.journeyScore(profile),true);
        return;
      }
      if (won && mode==="story") {
        settling=true;
        try {
          const next=R7Store.reflectionComplete(profile,{counters:2});
          if (next!==profile) profile=await store.save(next);
        } catch (e) { saveError(e,()=>finish(result)); return; }
        finally { settling=false; }
        ending(R7Store.journeyScore(profile));
        location.replace(gameURL("story")); return;
      }
      screen(won ? "coffee" : "reflection",mode==="reflection" ? "The Reflection / Practice" : "Epilogue / The diner window",
        won ? "I left you a seat." : "Down, not out",
        won ? "The reflection settles into the glass. Your coworker brings coffee. Across from you, an empty seat waits." : "The reflection is still waiting. Leave the locked attack, then strike after its final flash. Your saved Ten Seats result is safe.");
      button(won ? "Practice again" : "Retry the reflection",event=>play(restart,event));
      link(mode==="reflection" ? "Play the story" : "Return to the saved booth",gameURL("story"));
      if(mode==="story")scoreCard(R7Store.journeyScore(profile),true);
      return;
    }
    if (mode==="story" && won) {
      const score = {hp:result.hp,seatsDown:result.seatsDown};
      settling=true;
      try {
        const next = R7Store.journeyAdvance(profile,chapter,score,edition);
        if (next!==profile) profile = await store.save(next);
      } catch (e) { saveError(e,()=>finish(result)); return; }
      finally { settling=false; }
      if (chapter==="seats") { seatsSettled=true; latestMove=edition===3&&["leap","cyclone"].includes(result.lastMove)?result.lastMove:null; ending(R7Store.journeyScore(profile),true); return; }
      const [title,story,reward,next] = victories[chapter];
      screen("field","Checkpoint saved / "+reward,title,story);
      button(next,()=>location.reload());
      return;
    }
    const isSeats = chapter==="seats";
    const cleared = isSeats && won && fullClear(result);
    const paired = Boolean(relayFirst && cleared && result.seatsDown[0] !== relayFirst);
    let title = cleared ? "All ten defeated" : "Down, not out";
    let story = isSeats ? "Ten seats, ten openings. Try a different first target." : "Your gear is safe. Take another run at this room.";
    if (cleared) story = "The room falls quiet. The next move belongs to your friend.";
    if (relayFirst) {
      title = paired ? "Relay complete" : cleared ? "Solo clear · relay incomplete" : "Relay incomplete · fight lost";
      story = paired ? "You cleared all ten with a different opening. Your two weapons light the booth together." :
        "To complete this relay, defeat someone other than "+opening(relayFirst)+" first, then clear all ten.";
    }
    screen(paired ? "ending" : "field", mode==="challenge" ? "Friend challenge / Edition "+edition : chapterCards[chapter][0],title,story);
    button("Fight again",event=>play(restart,event));
    if (isSeats) scoreCard(result,cleared,paired);
    if (mode==="challenge") link("Play the story",gameURL("story"));
  }
  window.JensenJourney = Object.freeze({open,ready,finish,firstDown,reflectionMove:()=>signature,survivorEdition:()=>chapter==="reflection" || edition===3 && (mode==="story" || chapter==="seats")});
})();
