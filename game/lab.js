/* Existing Trial/labBar presentation, adapted to ephemeral Jensen configuration only. */
const JensenLab=(()=>{
  let api=null,open=true,section='hero',enemyStage=null;
  const node=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
  function message(text,error=false){$('r14Status').textContent=text;$('r14Status').classList.toggle('error',error);}
  function result(value){if(value?.ok===false)message(value.error,true);else message('已应用 · 仅当前调试');refresh();}
  function refresh(){
    if(!api)return;const cfg=api.config();
    if(enemyStage!==cfg.stage){
      enemyStage=cfg.stage;const select=$('r14Enemy');select.replaceChildren();
      const ordered=[...JensenCombatData.typeIds].sort((a,b)=>(cfg.types[b].stage===cfg.stage)-(cfg.types[a].stage===cfg.stage)||cfg.types[a].stage-cfg.types[b].stage);
      for(const id of ordered){const type=cfg.types[id],option=node('option',(type.stage===cfg.stage?'本关 · ':'')+'G'+type.stage+' · '+type.label+' · '+id);option.value=id;select.appendChild(option);}
      select.value=ordered.find(id=>cfg.types[id].stage===cfg.stage&&!cfg.types[id].boss)||ordered[0];
    }
$('r14Stage').value=String(cfg.stage);$('r14Immortal').checked=api.inspect().immortal;$('r14Tray').checked=api.inspect().tray;$('r14TrayLabel').hidden=cfg.stage!==1;$('r14AI').setAttribute('aria-pressed',String(api.inspect().staticAI));$('r14AI').textContent=api.inspect().staticAI?'恢复AI':'停止AI';
    const holder=$('r14Fields');holder.replaceChildren();section=$('r14Section').value||'hero';$('r14ExistingLabel').hidden=section!=='enemy';if(section==='enemy')section='enemy:'+$('r14Enemy').value;
    for(const field of JensenCombatData.fields(cfg,section)){
      const label=node('label',field.label+' ('+field.unit+') '),input=node('input');input.type='number';input.value=String(field.value);input.disabled=!!field.readOnly;input.dataset.path=JSON.stringify(field.path);input.min=String(field.min??'');input.max=String(field.max??'');input.step=field.integer?'1':'any';label.appendChild(input);holder.appendChild(label);
    }
  }
  function apply(){const patch={};for(const input of $('r14Fields').querySelectorAll('input')){if(input.disabled)continue;const path=JSON.parse(input.dataset.path);let at=patch;for(const key of path.slice(0,-1))at=at[key]||=(Object.create(null));at[path.at(-1)]=input.value.trim()===''?NaN:Number(input.value);}result(api.patch(section,patch,$('r14Existing').checked));}
  function toggle(){if(!api)return;open=!open;show('labBar',open);$('trialPanelToggle').setAttribute('aria-expanded',String(open));$('trialPanelToggle').textContent=open?'收起调试':'战斗调试';}
  function sync(){
    if(!api)return;const s=api.inspect(),cfg=api.config(),inactive=s.paused||s.portrait||s.phase!=='combat';
    $('labBar').inert=inactive;$('trialPanelToggle').inert=inactive;
    $('r14Live').textContent='G'+s.stage+' · HP '+Math.ceil(s.hp)+' / '+s.maxHp+' · 敌人 '+s.count+(s.immortal?' · 不死':' · 可死亡');
    const names={gpu_gauntlet:'GPU拳套',wafer_shield:'晶圆盾',thor_hammer:'雷神锤'},entry=cfg.entry;
    $('r15Summary').textContent='右手 '+(names[entry.equipment.right]||'空手')+' · 左手 '+(names[entry.equipment.left]||'空手')+(s.tray?' · 临时托盘':'')+'\n普攻 '+cfg.auto.damage+' / '+cfg.auto.cycle+'s · 暴击 '+(cfg.auto.critChance*100)+'% ×'+cfg.auto.critMultiplier+'\n1 '+(entry.slot_1?(cfg.auto.damage*cfg.breakthrough.damageMultiplier)+' / '+cfg.breakthrough.cooldown+'s':'未解锁')+' · 2 '+(entry.slot_2?(cfg.auto.damage*cfg.clear_space.damageMultiplier)+' / '+cfg.clear_space.cooldown+'s':'未解锁')+'\nCUDA '+(entry.buffs.includes('cuda_link')?(cfg.auto.damage*cfg.cuda.damageMultiplier)+' / '+cfg.cuda.interval+'s':'未解锁')+' · 稳态防御 '+(entry.buffs.includes('steady_guard')?'开启':'未解锁');
    const describe=hit=>hit?'t'+hit.at.toFixed(2)+'s · 基础 '+hit.baseDamage+' × '+hit.critMultiplier+(hit.critMultiplier>1?' 暴击':'')+' · 减伤后 '+Number(hit.mitigatedDamage.toFixed(2))+' (×'+hit.mitigation+') · 实扣 '+Number(hit.hpLoss.toFixed(2)):'尚未命中';
    $('r15Damage').textContent='最近直接：'+describe(s.latestDirect)+'\n最近CUDA：'+describe(s.latestCuda);
  }
  function mount(host){
    api=host;document.body.classList.add('jensenLab');
    $('labBar').innerHTML='<strong>Jensen · 战斗调试</strong><label>入场状态<select id="r14Stage"></select></label><button id="r15Full" type="button">终态满配（G8）</button><label id="r14TrayLabel"><input id="r14Tray" type="checkbox">G1 临时托盘</label><label>对手<select id="r14Enemy"></select></label><label>数量<input id="r14Count" type="number" min="0" max="30" value="1"></label><div><button id="r14Spawn" type="button">召唤</button><button id="r14Clear" type="button">清空</button><button id="r14Reset" type="button">重置入场</button></div><label><input id="r14Immortal" type="checkbox" checked>不死：HP可降到0</label><button id="r14AI" type="button" aria-pressed="false">停止AI</button><span id="r14Live"></span><p id="r15Summary"></p><p id="r15Damage" role="status"></p><details><summary>有效战斗参数 · 本地起测值</summary><label>配置<select id="r14Section"><option value="hero">主角</option><option value="auto">普通攻击</option><option value="breakthrough">1 突围</option><option value="clear_space">2 清场</option><option value="cuda">CUDA</option><option value="steady_guard">稳态防御</option><option value="limits">全局节奏与容量</option><option value="enemy">选中对手</option></select></label><label id="r14ExistingLabel"><input id="r14Existing" type="checkbox">应用现有同型（下次动作；HP/尺寸即时）</label><div id="r14Fields"></div><button id="r14Apply" type="button">应用本组数值</button><p>已释放危险与已受理动作保留原快照。节奏应用于下一次召唤/等待，不改正在倒计时。重置恢复该入场默认值。G3–G8数值为可调起测假设。</p></details><details><summary>比较与显示</summary><button id="r14Shake" type="button">切换震屏</button><button id="r14Sound" type="button">切换声音</button><p>原战士对照保留在上方调试入口；正常游戏只推进已实现故事。</p></details><p id="r14Status" role="status"></p>';
    const comparison=Array.from($('labBar').querySelectorAll('details')).at(-1)||$('labBar');
    for(const p of comparison.querySelectorAll('p'))p.textContent='原战士页保留历史规则；Jensen调试不会写入职业进度。';
    for(const [label,href]of [['Fable 四技能质感参考','../warrior/four.html'],['Fable 六技能质感参考','../warrior/six.html'],['原调试入口（含模式切换）','../combat/']]){const link=node('a',label);link.href=href;link.target='_blank';link.rel='noopener';comparison.appendChild(link);}
    for(const stage of JensenCombatData.stageIds){const entry=JensenCombatData.growthDefaults(stage).entry,names={gpu_gauntlet:'GPU',wafer_shield:'盾',thor_hammer:'雷神锤'},gear='右'+(names[entry.equipment.right]||'空手')+'·左'+(names[entry.equipment.left]||'空手'),skills=[entry.slot_1?'1':'',entry.slot_2?'2':'',entry.buffs.includes('cuda_link')?'CUDA':'',entry.buffs.includes('steady_guard')?'稳守':''].filter(Boolean).join('/');const option=node('option','G'+stage+' · '+gear+(skills?' · '+skills:''));option.value=String(stage);$('r14Stage').appendChild(option);}
    $('r14Section').value='hero';
    const on=(id,type,fn)=>$(id).addEventListener(type,fn);
    on('r15Full','click',()=>result(api.reset(8)));on('r14Stage','change',()=>result(api.reset(Number($('r14Stage').value))));on('r14Reset','click',()=>result(api.reset(api.config().stage)));on('r14Spawn','click',()=>result(api.spawn($('r14Enemy').value,Number($('r14Count').value))));on('r14Clear','click',()=>{api.clear();message('场地已清空；不会推进或保存');});
    on('r14Immortal','change',()=>api.immortal($('r14Immortal').checked));on('r14Tray','change',()=>result(api.tray($('r14Tray').checked)));on('r14AI','click',()=>{const value=!api.inspect().staticAI;api.staticAI(value);$('r14AI').setAttribute('aria-pressed',String(value));$('r14AI').textContent=value?'恢复AI':'停止AI';});
    on('r14Section','change',refresh);on('r14Enemy','change',refresh);on('r14Apply','click',apply);on('r14Shake','click',()=>{G.opt.shake=!G.opt.shake;});on('r14Sound','click',toggleMute);
    $('labBar').addEventListener('pointerdown',()=>api.cancelInput());$('labBar').addEventListener('focusin',()=>api.cancelInput());
    show('trialPanelToggle',true);show('labBar',true);$('trialPanelToggle').setAttribute('aria-expanded','true');$('trialPanelToggle').textContent='收起调试';refresh();sync();
  }
  return Object.freeze({mount,toggle,sync,refresh,notice:(text,error=true)=>message(text,error)});
})();
