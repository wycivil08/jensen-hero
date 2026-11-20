/* The encounter owns damage and victory. This screen owns the player's checkpoint and invitation. */
(() => {
  "use strict";
  const byId = id => document.getElementById(id);
  const panel = byId("journeyPanel"), action = byId("journeyAction"), other = byId("journeyOther");
  const share = byId("journeyShare"), notice = byId("journeyNotice");
  const chapterCards = {
    diner: ["Act I / Portland", "The last table", "Before the chips, Jensen worked the floor at a diner. Tonight, in our story, a crowd has blocked the aisle. Get your coworker through.", "Click a guest to approach and punch. Click the floor to move. The tray is yours if you want it.", "Clear the aisle"],
    arcade: ["Act II / The arcade", "Power on", "Years later, in 1993, three founders sketched their plans in a diner booth. Step into their imagined arcade with twin GPU gauntlets. The screens are dark.", "Pick a target. Your new gauntlets attack faster and can hit nearby rivals in the same swing.", "Enter the arcade"],
    cuda: ["Act II / 2006", "Parallel lines", "NVIDIA unveils CUDA. In the arcade, your next punch can jump from one rival to another. The champion guards the last dark cabinet.", "Strike a tight group to chain the hit. Move across the champion’s beam, then close in.", "Light the cabinets"],
    seats: ["Act III / The boardroom", "The Ten Seats", "Jensen holds out his hand. This time, the hammer answers. Take the wafer shield into a fictional boardroom and choose who falls first.", "Click a rival to pursue. Click the floor to dodge. Press 1 for Shield Rush or 2 for Thunder Slam.", "Enter the boardroom"]
  };
  const victories = {
    diner: ["The aisle is clear", "Your coworker carries the order through. Years later, another table will change Jensen’s life.", "Twin GPU gauntlets unlocked", "Go to the arcade"],
    arcade: ["A new circuit", "One cabinet flickers. The rest stay dark. Now try running them in parallel.", "CUDA chain unlocked", "Discover CUDA"],
    cuda: ["Lights on", "The champion falls and the cabinets glow. A shield and a thunder hammer await you in the boardroom.", "Wafer shield + thunder hammer unlocked", "Approach the ten seats"]
  };
  const weapons = ["charge shield","sidearm","mortar","tower shield","long rifle","healing beacon","rush shield","scattergun","ring emitter","hooked disc"];
  const shield = "M8 3L16 1L24 3V13L16 21L8 13Z";
  const barrel = "M3 8H25V12H12L10 18H6L7 12H3Z";
  const silhouettes = [shield,barrel,"M3 17L21 4L27 10L8 21ZM12 17L23 21H11Z",shield,
    "M1 11H19V8H29V11H31V13H14L12 17H9L10 13H7L2 16Z",
    "M14 1H18V6H23V10H18V15H14V10H9V6H14ZM8 21L15 15H17L24 21Z",shield,barrel,
    "M2 6L8 3H24L30 6L24 10H18V14L26 17L21 20H11L6 17L14 14V10H8Z",
    "M26 2Q9 0 5 11Q1 21 15 22Q25 22 29 11L22 16Q14 21 11 14Q10 8 21 6L18 10Z"];
  let mode, chapter, profile, store, restart, invitation;
  function gameURL(nextMode) {
    const url = new URL(location.href);
    url.search = ""; url.hash = ""; url.searchParams.set("mode", nextMode);
    if (nextMode === "challenge") url.searchParams.set("v", "1");
    return url.href;
  }
  function link(text, dest) {
    other.textContent = text; other.href = dest; other.hidden = false;
  }
  function screen(art, place, title, story, controls = "") {
    panel.dataset.art = art; panel.hidden = false;
    byId("journeyPlace").textContent = place; byId("journeyTitle").textContent = title;
    byId("journeyStory").textContent = story; byId("journeyControls").textContent = controls;
    byId("journeyScore").hidden = true; byId("journeyManual").hidden = true;
    other.hidden = share.hidden = true; notice.textContent = "";
    action.hidden = false; action.disabled = true; action.onclick = null;
  }
  function button(label, go) {
    action.textContent = label; action.disabled = false; action.onclick = go;
    if (document.hasFocus()) action.focus({preventScroll:true});
  }
  function play(fn, event) {
    panel.hidden = true;
    fn(event);
    byId("view").focus({preventScroll:true});
  }
  function offerShare(text, label) {
    const publicCombat = document.documentElement.dataset.publicCombat;
    const destination = location.protocol === "file:" && publicCombat
      ? new URL("?mode=challenge&v=1",publicCombat).href : gameURL("challenge");
    invitation = [text, destination].filter(Boolean).join("\n");
    share.textContent = label; share.hidden = false;
  }
  share.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(invitation);
      notice.textContent = "Copied. Your friend can enter the same fight.";
    } catch {
      byId("journeyManual").hidden = false;
      const field = byId("journeyText"); field.value = invitation; field.focus(); field.select();
    }
  });
  function scoreCard(result, won) {
    const {seatsDown,hp} = result;
    const first = seatsDown[0];
    const seatName = n => window.R24Data.finale.seats["seat_"+String(n).padStart(2,"0")].label;
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
    const firstText = first ? "First down: "+seatName(first)+" ("+weapons[first-1]+"). " : "";
    const detail = won ? hp.toLocaleString("en-US",{maximumFractionDigits:2})+" HP left." : (10-seatsDown.length)+" still standing.";
    const icon = byId("journeyWeapon");
    icon.style.display = first ? "" : "none";
    if (first) icon.firstElementChild.setAttribute("d",silhouettes[first-1]);
    byId("journeyRecord").textContent = tally+" · "+detail+" "+firstText;
    byId("journeyScore").hidden = false;
    offerShare("Jensen Hero · The Ten Seats v1\n"+tally+". "+detail+" "+firstText+"Who would you go after first?","Copy challenge");
  }
  function ending(score) {
    screen("ending","Epilogue / Back at the diner","The last booth","Jensen sets the wafer shield beside his old serving tray. Tomorrow, someone else will need this table.");
    button("Fight the ten again",()=>location.assign(gameURL("challenge")));
    scoreCard(score,true);
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
    if (mode === "challenge") {
      const versions = new URL(location.href).searchParams.getAll("v");
      if (versions.length!==1 || versions[0]!=="1") {
        byId("boot").hidden = true;
        screen("ending","Friend challenge","Different edition","This invitation needs a different set of rules. You can play the current ten-seat fight.");
        button("Play current challenge",()=>location.assign(gameURL("challenge"))); return null;
      }
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
        if (chapter==="ending") { byId("boot").hidden=true; ending(R7Store.journeyScore(profile)); return null; }
      } catch (e) { saveError(e); return null; }
    }
    const [place,title,story,controls] = chapterCards[chapter];
    const touch = matchMedia("(pointer: coarse)").matches;
    const input = touch ? "Turn sideways for more room. Tap a rival to pursue or the floor to move."+
      (chapter==="seats" ? " Tap the skill buttons for Shield Rush and Thunder Slam." : "") : controls;
    screen(chapter,mode==="challenge" ? "Friend challenge / Edition 1" : place,title,mode==="challenge" ? "One hero. Ten seats. The same shield and hammer as your friend. Who will you take down first?" : story,input);
    action.textContent = "Preparing arena…";
    if (mode==="challenge") {
      offerShare("", "Copy invitation"); link("Play the story",gameURL("story"));
    } else if (chapter==="diner") link("Friend challenge",gameURL("challenge"));
    return chapter;
  }
  function ready(startFight, retryFight) {
    restart = retryFight;
    button(chapterCards[chapter][4],event=>play(startFight,event));
  }
  async function finish(result) {
    const {won} = result;
    if (mode==="story" && won) {
      const score = {hp:result.hp,seatsDown:result.seatsDown};
      try {
        const next = R7Store.journeyAdvance(profile,chapter,score);
        if (next!==profile) profile = await store.save(next);
      } catch (e) { saveError(e,()=>finish(result)); return; }
      if (chapter==="seats") { ending(R7Store.journeyScore(profile)); return; }
      const [title,story,reward,next] = victories[chapter];
      screen("field","Checkpoint saved / "+reward,title,story);
      button(next,()=>location.reload());
      return;
    }
    const isSeats = chapter==="seats";
    screen("field",mode==="challenge" ? "Friend challenge / Edition 1" : chapterCards[chapter][0],
      won ? "All ten defeated" : "Down, not out",
      won ? "The room falls quiet. The next move belongs to your friend." :
        isSeats ? "Ten seats, ten openings. Try a different first target." : "Your gear is safe. Take another run at this room.");
    button("Fight again",event=>play(restart,event));
    if (isSeats) scoreCard(result,won);
    if (mode==="challenge") link("Play the story",gameURL("story"));
  }
  window.JensenJourney = Object.freeze({open,ready,finish});
})();
