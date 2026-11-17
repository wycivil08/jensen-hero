# Current requirements — JEN-CONTRACT-021

Portable edition of the coordinator-owned contract. Requirement IDs and current requirement text are preserved; old implementation-status tables and dead archive links are omitted. Source contract SHA256: `13f4242264a39f2d8fa793787bd99988f4ea1ced01bc5b35f89939c9e1419aac`.

The latest explicit user decision overrides proposals; unmentioned requirements persist. Only the coordinator updates this file. Bind its current hash and relevant/protected IDs in agent handoffs. A design or passing test is not full gameplay acceptance. See STATUS.md for implemented scope. New game copy and external handoffs are English; older Chinese interface remains an acknowledged migration gap.

| ID | Requirement |
|---|---|
| JEN-001 | 真人与公司故事转为可理解的Survivor升级打怪；主要战斗对手应是人/阵营，允许少量压力/情绪敌人；不硬把事件拆成不知所云的关卡 |
| JEN-002 | 第一关餐厅：闹事顾客为敌，领班/同事为援手；空手起步、可拾托盘增强，不能把托盘变成不提示的硬门槛；随后转入创始故事，区分少年打工和后来的创立 |
| JEN-003 | 同时有可玩原型与精细垂直切片；重要角色阶段、敌/Boss、小怪、技能、场景、过场插画、HUD/反馈都须进入设计覆盖，HTML可直接查阅 |
| JEN-004 | 跨局保存永久成长；失败保留已获进度，不重复发奖励，不增加未经要求的强制刷取门槛 |
| JEN-005 | 主动技能最多两槽，快捷键1和2；其他成长可由装备、被动、buff承担；普通攻击不算新增技能槽 |
| JEN-006 | 终态必须按角色自身左右：右手英伟达盾、左手雷神锤；双GPU拳套为中期方向，造型与技能共同设计，并有真实故事锚点 |
| JEN-007 | 每过一关有可感知提升；装备、技能/被动与真实基础数值共同形成成长，不能只解锁按钮而伤害长期不变 |
| JEN-008 | 目标约十分钟完成全流程；剧情也是可欣赏的内容，保持约40%剧情内容、60%战斗的方向；可跳剧情，不硬卡阅读时间 |
| JEN-009 | 终态应有几千至上万的真实伤害及暴击表现，技能与连锁随成长；不要用扩大飘字假装成长 |
| JEN-010 | CUDA作为体现并行计算的被动，可一次链接多个敌人 |
| JEN-011 | 桌面点地移动、点敌接近并普攻，技能1/2；保持原有移动/动画流畅性，不把默认操控改回WASD |
| JEN-012 | 移动浏览器自动识别，默认虚拟摇杆，无需选择输入模式；左手移动、独立右手普攻和两槽 |
| JEN-013 | 用户最新要求核查并建议Brawl Stars式触控：浮动落点、无方向自动选敌、拖动显示攻击范围/轨迹、松手出招；手动瞄准不被辅助覆盖、真实接触才扣血 |
| JEN-014 | 玩家UI less is more；能自动完成的机械选择自动完成；剧情轻点画面推进，不依赖找到小按钮；调试UI可折叠保留更多选项 |
| JEN-015 | 主要平台为横屏桌面浏览器，鼠标操作优先，适配16:9、21:9等；手机是辅助调试/兼容入口，不能推断为主要玩家；手机竖屏友好提示，按既有规则暂停；横屏锁定仅在浏览器能力和用户手势允许时尝试 |
| JEN-016 | 基于已有战斗调试场景迭代，保留原战士对照，与完整原型共享战斗实现；一个场地可选成长状态/满配、所有对手可召唤，当前关怪优先 |
| JEN-017 | 调试数值可实际生效；默认扣到HP0仍不死，可切换死亡；高级选项折叠，展示有效数值；调试不污染career/奖励 |
| JEN-018 | 对照Fable原四技能及六技能战士共同延续的视角、角色体积、暗黑手绘风格、流畅移动、转向、次级摆动和完整打击反馈；85/90是目标而非Agent自报分数 |
| JEN-019 | 真实浏览器反复试玩，Terra作为主要操作角色；重要设计有独立可玩性反对意见；已复现问题进入后续回归标准 |
| JEN-020 | 对外入口尽可能简单，使用同一公开根入口，至多一段公开路径；根与兼容深链接须对应同一构建 |
| JEN-021 | 持续检查是否需要清理/有界重构，避免架构和文件数量膨胀；保护历史证据与用户改动 |
| JEN-022 | 分工有独立owner与复核；未来订阅/可用后0→1由Fable承担，目前不启动该通道；历史原Astra Pro任务保留来源。完成后展示、必要时原通道返工，再本地1→N；Terra负责实际浏览器 |
| JEN-023 | 主编排统一共享工作树暂存/提交与最终验收，开发者交付差异；按可独立验证功能提交，按风险决定复核力度 |
| JEN-025 | 制作“引擎B”第二套最小战斗样例；主编排选择适合桌面网页的底层引擎；先有足够判断画面/可玩性的核心切片，不确定时不搬全部八关；0→1由Astra Pro完成并允许返工 |
| JEN-026 | 用户不接受Phaser B当前画风；先研究一到两种3D最小战斗方案，再由原Astra Pro开发可玩3D样例，移植必要设计并包含角色建模、动画、物理及合适的现有引擎模块 |
| JEN-027 | S36已允许按revision5这张3D目标开始最小战斗实现，先规划后原Astra Pro开发；并行研究成熟风格、保持逐物配对，以一个最新优先的HTML串联局部对照及历史。3D保留用户暂认可的简化cozy基调并强化彪悍感；2D向原Fable战士暗黑手绘质感靠近。每张3D均有严格逐物对应的2D：对象/角色、场景物件、站位、装备、动作和预警相互对应，仅绘制材质/笔触/明暗可异；HTML完整横屏、少文字、公网展示 |
| JEN-024 | 终章社交分享卡：第几个打爆、聚气累计、可分享X等作为未来方向；不能擅自用第八关装备奖励替换 |
| JEN-028 | 在既有可实现3D基调中去乐高化，2–3种建模方案；所有角色/重要Boss/小怪精细化、Jensen与Lisa Su可辨；西装白领董事会反派；Brawl Stars式俯视可读性、粗体描边弹数、紧凑地图和击退/眩晕爽感 |
| JEN-029 | 主角各阶段普攻与两主动/被动明确区分；G7/G8雷神锤普攻前方扇形多目标，非仅单体；参考三类近战体验，强化可见蓄势、命中、击退/打断。八关Boss有可读招式/反制窗口/目标优先级，十席包含可识别的后排群疗和危险远程 |
| JEN-030 | 战斗切片须为单一实际游戏视口、可复现镜头/空间尺度/角色资产与动作状态/环境与碰撞/HUD/真实战斗效果；人物板、拼格、策略路线、解释箭头与人为站位只能作为辅助设计材料，不能代替战斗切片 |
| JEN-031 | 全部技能展示、重要Boss/小怪、每关关键战斗与成长必须为可在实际游戏出现的完整视口；撤下不合格旧公开图；2D/3D对应继续有效 |
| JEN-032 | 雷锤每击/被动强闪电与扇面清群，盾有至少20%以上高概率格挡的坦克感、可设计回血；两主动不变 |
| JEN-033 | 每关有足够小怪供新装备/能力发挥；前快后多波，终章开局十席；展示每关提升与数值 |
| JEN-034 | 重要关卡/技能优先；八关八状态、七次成长全部覆盖；可合并图片但内容不省略 |
| JEN-035 | 与Claude的任务、交接、返工要求和评审输出统一英文；游戏玩家可见文案、HUD、剧情和技能文案以英文落地；用户与主编排可用中文 |
| JEN-036 | 优化上述垂直切片后供用户审批，最小战斗场景严格对齐；先主角辨识、雷电表现、终章信息层级 |
| JEN-037 | 完成R27实玩反馈修复：数字须能对应受击/受疗者，危险能追溯施法者，拥挤时保留主角/选中目标；手绘与3D有可辨差异；低血量以最小干扰反馈；核查多目标技能、治疗者和命中截图 |
| JEN-038 | 极简可复现GitHub工程：art / combat / player game 三主模块＋原战士参考；历史设计可访问，完整部署与协作说明 |

R29 destination decision: use the existing public repository, rename it to a suitable Jensen name, retain its real Git ancestry. Do not create a third repository or delete the private repository when a rename is possible. Historical art is separately labelled; current gameplay is not replaced by old concepts.
