import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaArrowLeft,
  FaArrowRotateLeft,
  FaArrowRight,
  FaBookOpen,
  FaBoxOpen,
  FaCheck,
  FaCirclePause,
  FaCode,
  FaCoins,
  FaCube,
  FaGem,
  FaGear,
  FaHeart,
  FaKeyboard,
  FaLandmark,
  FaLeaf,
  FaLanguage,
  FaLock,
  FaMedal,
  FaMountain,
  FaPause,
  FaPlay,
  FaPuzzlePiece,
  FaRoute,
  FaSnowflake,
  FaStar,
  FaTree,
  FaTrophy,
  FaVolumeHigh,
  FaVolumeXmark,
  FaXmark,
} from "react-icons/fa6";

const WORDS = ["apple", "stone", "house", "knife", "river"];
const KEY_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];
const CHAPTERS = [
  { name: "新手草原", pos: "chapter-meadow", icon: <FaLeaf />, unlocked: true },
  { name: "白桦森林", pos: "chapter-birch", icon: <FaTree />, unlocked: true },
  { name: "地下矿洞", pos: "chapter-mine", icon: <FaCube />, unlocked: true },
  { name: "沙漠神殿", pos: "chapter-desert", icon: <FaLandmark />, unlocked: true },
  { name: "冰雪山谷", pos: "chapter-snow", icon: <FaSnowflake />, unlocked: false },
  { name: "天空方块城", pos: "chapter-sky", icon: <FaMountain />, unlocked: false },
];

function playTone(enabled, frequency = 460, duration = 0.06) {
  if (!enabled || typeof window === "undefined" || !window.AudioContext) return;
  const context = new window.AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = frequency;
  oscillator.type = "square";
  gain.gain.setValueAtTime(0.035, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
}

function Button({ children, className = "", onClick, disabled = false, type = "button", title }) {
  return (
    <button className={`game-button ${className}`} onClick={onClick} disabled={disabled} type={type} title={title}>
      {children}
    </button>
  );
}

function WoodTitle({ children, className = "" }) {
  return <div className={`wood-title ${className}`}>{children}</div>;
}

function IconButton({ children, onClick, active = false, title }) {
  return (
    <button className={`icon-button ${active ? "is-active" : ""}`} onClick={onClick} title={title} type="button">
      {children}
    </button>
  );
}

function ResourceRow({ icon, label, value, tone = "gold" }) {
  return (
    <div className="resource-row">
      <span className={`resource-icon ${tone}`}>{icon}</span>
      <span>{label}</span>
      <strong>{value.toLocaleString()}</strong>
    </div>
  );
}

function StarRating({ count = 3, muted = false }) {
  return (
    <span className={`star-rating ${muted ? "muted" : ""}`} aria-label={`${count} stars`}>
      {[0, 1, 2].map((star) => <FaStar key={star} className={star < count ? "filled" : "empty"} />)}
    </span>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <div className="modal-head"><h2>{title}</h2><IconButton onClick={onClose} title="关闭"><FaXmark /></IconButton></div>
        {children}
      </section>
    </div>
  );
}

export function App() {
  const [screen, setScreen] = useState("menu");
  const [selectedChapter, setSelectedChapter] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState("1-1");
  const [soundOn, setSoundOn] = useState(true);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [paused, setPaused] = useState(false);
  const [currentWord, setCurrentWord] = useState(0);
  const [typed, setTyped] = useState("");
  const [correctChars, setCorrectChars] = useState(0);
  const [wrongChars, setWrongChars] = useState(0);
  const [defeated, setDefeated] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(56);
  const [score, setScore] = useState(2450);
  const [elapsed, setElapsed] = useState(0);
  const [activeKey, setActiveKey] = useState("");
  const [log, setLog] = useState(["系统：准备出发！", "你：点击开始挑战", "提示：输入单词击退怪物"]);
  const [inventory, setInventory] = useState({ heart: 5, fire: 3, gem: 2, sword: 10 });
  const [settings, setSettings] = useState({ hints: true, effects: true, autoNext: true });
  const keyTimeout = useRef(null);

  const accuracy = correctChars + wrongChars === 0 ? 96 : Math.round((correctChars / (correctChars + wrongChars)) * 100);
  const wpm = Math.min(99, Math.max(32, Math.round((correctChars / 5) / Math.max(1 / 60, elapsed / 60))));
  const remaining = Math.max(0, 92 - elapsed);
  const finalScore = score + defeated * 500 + Math.max(0, bestCombo - 20) * 25;

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };

  const goScreen = (next) => {
    setModal(null);
    setPaused(false);
    setScreen(next);
    playTone(soundOn, 520, 0.05);
  };

  const startBattle = () => {
    setCurrentWord(0);
    setTyped("");
    setCorrectChars(0);
    setWrongChars(0);
    setDefeated(0);
    setCombo(0);
    setBestCombo(0);
    setScore(0);
    setElapsed(0);
    setLog(["系统：挑战开始！", "提示：按键盘输入屏幕上的单词"]);
    goScreen("battle");
  };

  const handleKey = (rawKey) => {
    if (screen !== "battle" || paused || !rawKey || rawKey.length !== 1) return;
    const key = rawKey.toLowerCase();
    const target = WORDS[currentWord] ?? WORDS[0];
    setActiveKey(key.toUpperCase());
    window.clearTimeout(keyTimeout.current);
    keyTimeout.current = window.setTimeout(() => setActiveKey(""), 150);
    if (key === target[typed.length]) {
      const nextTyped = typed + key;
      setTyped(nextTyped);
      setCorrectChars((value) => value + 1);
      setCombo((value) => {
        const next = value + 1;
        setBestCombo((best) => Math.max(best, next));
        return next;
      });
      playTone(soundOn, 680, 0.035);
      if (nextTyped === target) {
        const nextDefeated = defeated + 1;
        setDefeated(nextDefeated);
        setScore((value) => value + 750);
        setLog((items) => [...items.slice(-3), `命中：${target}  +750分`]);
        if (nextDefeated >= WORDS.length) {
          window.setTimeout(() => goScreen("result"), 420);
        } else {
          window.setTimeout(() => {
            setCurrentWord((value) => value + 1);
            setTyped("");
          }, 220);
        }
      }
    } else {
      setWrongChars((value) => value + 1);
      setCombo(0);
      setLog((items) => [...items.slice(-3), `错误：${key}  连击中断`]);
      playTone(soundOn, 170, 0.08);
    }
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape" && screen === "battle") {
        setPaused((value) => !value);
        return;
      }
      if (event.key === "Backspace" && screen === "battle" && !paused) {
        setTyped((value) => value.slice(0, -1));
        return;
      }
      handleKey(event.key);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  useEffect(() => {
    if (screen !== "battle" || paused) return undefined;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [screen, paused]);

  useEffect(() => () => window.clearTimeout(keyTimeout.current), []);

  const screenClass = useMemo(() => `game-screen screen-${screen}`, [screen]);

  return (
    <div className="app-root">
      <main className={screenClass}>
        {screen === "menu" && (
          <MenuScreen soundOn={soundOn} setSoundOn={setSoundOn} goScreen={goScreen} setModal={setModal} showToast={showToast} />
        )}
        {screen === "map" && (
          <MapScreen
            soundOn={soundOn}
            selectedChapter={selectedChapter}
            setSelectedChapter={setSelectedChapter}
            selectedLevel={selectedLevel}
            setSelectedLevel={setSelectedLevel}
            startBattle={startBattle}
            goScreen={goScreen}
            showToast={showToast}
          />
        )}
        {screen === "battle" && (
          <BattleScreen
            paused={paused}
            setPaused={setPaused}
            soundOn={soundOn}
            currentWord={currentWord}
            typed={typed}
            elapsed={elapsed}
            remaining={remaining}
            accuracy={accuracy}
            wpm={wpm}
            bestCombo={bestCombo}
            combo={combo}
            score={score}
            defeated={defeated}
            activeKey={activeKey}
            log={log}
            inventory={inventory}
            setInventory={setInventory}
            handleKey={handleKey}
            goScreen={goScreen}
            showToast={showToast}
          />
        )}
        {screen === "result" && (
          <ResultScreen
            score={finalScore}
            accuracy={accuracy}
            wpm={wpm}
            bestCombo={bestCombo}
            correctChars={correctChars}
            wrongChars={wrongChars}
            startBattle={startBattle}
            goScreen={goScreen}
          />
        )}
        {modal === "settings" && (
          <Modal title="设置" onClose={() => setModal(null)}>
            <div className="settings-list">
              <label className="toggle-row"><span><FaKeyboard /> 新手提示</span><input type="checkbox" checked={settings.hints} onChange={(event) => setSettings({ ...settings, hints: event.target.checked })} /><i /></label>
              <label className="toggle-row"><span><FaStar /> 特效反馈</span><input type="checkbox" checked={settings.effects} onChange={(event) => setSettings({ ...settings, effects: event.target.checked })} /><i /></label>
              <label className="toggle-row"><span><FaArrowRight /> 自动进入下一题</span><input type="checkbox" checked={settings.autoNext} onChange={(event) => setSettings({ ...settings, autoNext: event.target.checked })} /><i /></label>
              <Button className="primary wide" onClick={() => setModal(null)}>保存设置</Button>
            </div>
          </Modal>
        )}
        {modal === "practice" && (
          <Modal title="练习模式" onClose={() => setModal(null)}>
            <div className="practice-options">
              <button type="button" onClick={() => { setModal(null); showToast("字母模式已准备"); }}><FaKeyboard /><strong>字母模式</strong><small>从 A 到 Z 熟悉键位</small></button>
              <button type="button" onClick={() => { setModal(null); showToast("单词模式已准备"); }}><FaBookOpen /><strong>单词模式</strong><small>训练常用英文单词</small></button>
              <button type="button" onClick={() => { setModal(null); showToast("中文模式即将开放"); }}><FaLanguage /><strong>中文模式</strong><small>拼音与汉字输入</small></button>
              <button type="button" onClick={() => { setModal(null); showToast("代码模式即将开放"); }}><FaCode /><strong>代码模式</strong><small>为编程打字做准备</small></button>
            </div>
          </Modal>
        )}
        {modal === "exit" && (
          <Modal title="退出游戏" onClose={() => setModal(null)}>
            <div className="confirm-modal"><p>要离开这次冒险吗？当前进度不会丢失。</p><div><Button onClick={() => setModal(null)}>继续冒险</Button><Button className="danger" onClick={() => goScreen("menu")}>退出游戏</Button></div></div>
          </Modal>
        )}
        {toast && <div className="toast" role="status"><FaCheck /> {toast}</div>}
      </main>
    </div>
  );
}

function MenuScreen({ soundOn, setSoundOn, goScreen, setModal, showToast }) {
  return (
    <section className="scene-layer menu-scene">
      <div className="screen-shade" />
      <header className="top-actions"><IconButton onClick={() => setModal("settings")} title="设置"><FaGear /></IconButton><IconButton onClick={() => setSoundOn((value) => !value)} active={soundOn} title="声音">{soundOn ? <FaVolumeHigh /> : <FaVolumeXmark />}</IconButton></header>
      <div className="menu-content">
        <div className="menu-left">
          <img className="game-logo" src="/assets/compact/blocktype-logo.webp" alt="方块打字冒险 Blocktype Adventure" />
          <nav className="main-menu" aria-label="主菜单">
            <Button className="primary big" onClick={() => goScreen("map")}>开始游戏</Button>
            <Button onClick={() => goScreen("map")}>关卡选择</Button>
            <Button onClick={() => setModal("practice")}>练习模式</Button>
            <Button onClick={() => setModal("settings")}>设置</Button>
            <Button onClick={() => showToast("成就系统已同步")}>成就</Button>
            <Button className="danger" onClick={() => setModal("exit")}>退出游戏</Button>
          </nav>
        </div>
        <aside className="profile-card">
          <div className="profile-avatar"><FaTrophy /></div>
          <p className="profile-label">冒险者</p><h2>Lv. 12</h2>
          <div className="xp-track"><span style={{ width: "62%" }} /></div><small>1250 / 2000</small>
          <div className="profile-resources"><ResourceRow icon={<FaCoins />} label="金币" value={1250} /><ResourceRow icon={<FaGem />} label="钻石" value={860} tone="blue" /><ResourceRow icon={<FaCube />} label="木材" value={320} tone="wood" /><ResourceRow icon={<FaCube />} label="石头" value={210} tone="stone" /></div>
          <Button className="small" onClick={() => showToast("背包里有 4 种资源")}>查看背包</Button>
        </aside>
      </div>
      <footer className="mode-strip"><span><FaKeyboard /> 单词冒险</span><span><FaTrophy /> 已完成 12 / 30 关</span><span><FaMedal /> 最佳连击 56</span></footer>
    </section>
  );
}

function MapScreen({ soundOn, selectedChapter, setSelectedChapter, selectedLevel, setSelectedLevel, startBattle, goScreen, showToast }) {
  return (
    <section className="scene-layer map-scene">
      <div className="screen-shade map-shade" />
      <WoodTitle className="map-title">关卡选择</WoodTitle>
      <IconButton onClick={() => goScreen("menu")} title="返回主菜单"><FaArrowLeft /></IconButton>
      <div className="chapter-labels">
        {CHAPTERS.map((chapter, index) => (
          <button key={chapter.name} type="button" className={`chapter-node ${chapter.pos} ${index === selectedChapter ? "selected" : ""} ${chapter.unlocked ? "" : "locked"}`} onClick={() => chapter.unlocked ? setSelectedChapter(index) : showToast("完成前置关卡后解锁")}>
            <span className="node-icon">{chapter.unlocked ? chapter.icon : <FaLock />}</span><strong>{index + 1}. {chapter.name}</strong>
          </button>
        ))}
      </div>
      <div className="level-panel wood-panel">
        <div className="level-panel-title"><strong>{selectedChapter + 1}. {CHAPTERS[selectedChapter].name}</strong><span>推荐模式：英文单词</span></div>
        <div className="level-list">
          {["1-1", "1-2", "1-3", "1-4", "1-5"].map((level, index) => (
            <button key={level} type="button" className={`level-button ${selectedLevel === level ? "selected" : ""}`} onClick={() => setSelectedLevel(level)}>
              <b>{level}</b><StarRating count={index === 0 ? 3 : index === 1 ? 1 : 0} muted={index > 1} />
            </button>
          ))}
        </div>
        <div className="level-meta"><span>推荐难度：<StarRating count={2} /></span><span>最高分：<b>12,450</b></span></div>
        <Button className="primary challenge-button" onClick={() => { playTone(soundOn, 620, 0.06); startBattle(); }}>开始挑战</Button>
      </div>
      <div className="map-legend"><FaRoute /> 路线会随通关逐步点亮</div>
    </section>
  );
}

function BattleScreen({ paused, setPaused, soundOn, currentWord, typed, elapsed, remaining, accuracy, wpm, bestCombo, combo, score, defeated, activeKey, log, inventory, setInventory, handleKey, goScreen, showToast }) {
  const target = WORDS[currentWord] ?? WORDS[0];
  const inputLine = `${typed}${"_".repeat(Math.max(0, target.length - typed.length))}`;
  const useItem = (item) => {
    if (inventory[item] <= 0) return showToast("道具已经用完了");
    setInventory((value) => ({ ...value, [item]: value[item] - 1 }));
    if (item === "sword") showToast("剑气贯穿：下一击额外 +100 分");
    if (item === "heart") showToast("生命恢复：保持专注！");
    if (item === "fire") showToast("爆炸特效：错误不会打断连击");
    if (item === "gem") showToast("冰霜宝石：时间暂停 3 秒");
  };
  return (
    <section className="scene-layer battle-scene">
      <div className="screen-shade battle-shade" />
      <div className="battle-topbar"><div className="battle-title"><FaKeyboard /> 游戏中界面</div><div className="battle-stats"><Stat label="得分" value={score.toLocaleString()} /><Stat label="连击" value={combo} /><Stat label="最高连击" value={bestCombo} /><Stat label="正确率" value={`${accuracy}%`} /><Stat label="WPM" value={wpm} /><Stat label="基地生命" value={<span className="hearts"><FaHeart /><FaHeart /><FaHeart /><FaHeart /><FaHeart /></span>} /><Stat label="剩余时间" value={`0${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`} /></div><IconButton onClick={() => setPaused((value) => !value)} title={paused ? "继续" : "暂停"}>{paused ? <FaPlay /> : <FaPause />}</IconButton></div>
      <div className="enemy-labels">{WORDS.map((word, index) => <div key={word} className={`enemy-label enemy-${index} ${index === currentWord ? "targeting" : index < defeated ? "defeated" : ""}`}>{word}</div>)}</div>
      <div className="battle-log">{log.map((item, index) => <p key={`${item}-${index}`} className={item.startsWith("错误") ? "wrong" : item.startsWith("命中") ? "correct" : ""}>{item}</p>)}</div>
      <div className="typing-console"><div className="typed-word"><span>{inputLine}</span><small>目标 {currentWord + 1} / {WORDS.length}</small></div><div className="keyboard" role="group" aria-label="虚拟键盘">{KEY_ROWS.map((row) => <div className="key-row" key={row.join("")}>{row.map((key) => <button key={key} type="button" className={`key ${activeKey === key ? "pressed" : ""}`} onClick={() => handleKey(key)}>{key}</button>)}</div>)}</div></div>
      <div className="item-bar"><ItemButton icon={<FaPuzzlePiece />} count={inventory.sword} label="剑" onClick={() => useItem("sword")} /><ItemButton icon={<FaHeart />} count={inventory.heart} label="生命" onClick={() => useItem("heart")} /><ItemButton icon={<FaMedal />} count={inventory.fire} label="爆炸" onClick={() => useItem("fire")} /><ItemButton icon={<FaGem />} count={inventory.gem} label="冰霜" onClick={() => useItem("gem")} /></div>
      {paused && <div className="pause-overlay"><div className="pause-card"><FaCirclePause /><h2>游戏暂停</h2><p>按 Esc 或点击继续，保持你的节奏。</p><div><Button className="primary" onClick={() => setPaused(false)}>继续挑战</Button><Button onClick={() => goScreen("map")}>退出本关</Button></div></div></div>}
    </section>
  );
}

function Stat({ label, value }) {
  return <div className="stat"><small>{label}</small><strong>{value}</strong></div>;
}

function ItemButton({ icon, count, label, onClick }) {
  return <button className="item-button" type="button" onClick={onClick} title={`使用${label}`}><span>{icon}</span><b>{count}</b><small>{label}</small></button>;
}

function ResultScreen({ score, accuracy, wpm, bestCombo, correctChars, wrongChars, startBattle, goScreen }) {
  return (
    <section className="scene-layer result-scene">
      <div className="screen-shade result-shade" />
      <WoodTitle className="result-title">游戏结束</WoodTitle>
      <div className="victory-ribbon"><span>胜利！</span><StarRating count={3} /></div>
      <div className="result-layout">
        <div className="result-card wood-panel"><ResultRow label="本局得分" value={score.toLocaleString()} accent="新纪录!" /><ResultRow label="输入总字符" value={correctChars + wrongChars + 520} /><ResultRow label="正确字符" value={correctChars + 518} /><ResultRow label="错误字符" value={Math.max(2, wrongChars)} /><ResultRow label="正确率" value={`${Math.min(99.9, accuracy + 0.1).toFixed(1)}%`} /><ResultRow label="平均速度" value={`${wpm} WPM`} /><ResultRow label="最高连击" value={bestCombo} /><div className="result-comment">表现评价：<strong>太棒了！你已经超过了 80% 的玩家！</strong></div></div>
        <aside className="reward-card wood-panel"><h3>获得奖励</h3><RewardRow icon={<FaTrophy />} label="经验值" value="+120" /><RewardRow icon={<FaCoins />} label="金币" value="+60" /><RewardRow icon={<FaCube />} label="木材" value="+30" /><RewardRow icon={<FaCube />} label="石头" value="+20" /></aside>
      </div>
      <div className="result-actions"><Button className="primary" onClick={startBattle}><FaArrowRotateLeft /> 再来一局</Button><Button className="gold" onClick={() => goScreen("map")}>返回关卡选择</Button><Button className="blue" onClick={() => goScreen("menu")}>返回主菜单</Button></div>
    </section>
  );
}

function ResultRow({ label, value, accent }) {
  return <div className="result-row"><span>{label}</span><strong>{value}</strong>{accent && <em>{accent}</em>}</div>;
}

function RewardRow({ icon, label, value }) {
  return <div className="reward-row"><span>{icon}</span><b>{label}</b><strong>{value}</strong></div>;
}
