(() => {
  "use strict";

  const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
  const SOLFEGE = {
    C: "do",
    D: "re",
    E: "mi",
    F: "fa",
    G: "sol",
    A: "la",
    B: "si",
  };
  const SEMITONES = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
  };
  const CLEFS = {
    treble: {
      name: "高音谱",
      short: "高音",
      baseLetter: "E",
      baseOctave: 4,
      symbol: "G",
      lineMnemonic: "E G B D F",
      spaceMnemonic: "F A C E",
    },
    bass: {
      name: "低音谱",
      short: "低音",
      baseLetter: "G",
      baseOctave: 2,
      symbol: "F",
      lineMnemonic: "G B D F A",
      spaceMnemonic: "A C E G",
    },
  };
  const MODES = {
    random: {
      type: "随机抽查",
      title: "看谱面，点选音名和唱名",
      range: "五线与四间",
    },
    pattern: {
      type: "规律填空",
      title: "按顺序填出这组位置",
      range: "固定规律",
    },
    ledger: {
      type: "加线专项",
      title: "专练上下加线位置",
      range: "上下加线",
    },
    audio: {
      type: "听音绑定",
      title: "听一遍，再确认谱面位置",
      range: "视觉 + 听觉",
    },
    review: {
      type: "错题复习",
      title: "把最容易错的位置再过一遍",
      range: "10 题短练",
    },
    challenge: {
      type: "闯关挑战",
      title: "从零开始，一关一关攻克",
      range: "27 关进阶",
    },
  };
  const PATTERNS = [
    { id: "treble-lines", clef: "treble", title: "高音谱五条线", steps: [0, 2, 4, 6, 8] },
    { id: "treble-spaces", clef: "treble", title: "高音谱四个间", steps: [1, 3, 5, 7] },
    { id: "bass-lines", clef: "bass", title: "低音谱五条线", steps: [8, 6, 4, 2, 0] },
    { id: "bass-spaces", clef: "bass", title: "低音谱四个间", steps: [7, 5, 3, 1] },
    { id: "treble-ledger-above", clef: "treble", title: "高音谱上加四线", steps: [10, 12, 14, 16] },
    { id: "treble-ledger-below", clef: "treble", title: "高音谱下加四线", steps: [-2, -4, -6, -8] },
    { id: "bass-ledger-above", clef: "bass", title: "低音谱上加四线", steps: [16, 14, 12, 10] },
    { id: "bass-ledger-below", clef: "bass", title: "低音谱下加四线", steps: [-2, -4, -6, -8] },
  ];

  // ========== 闯关关卡定义 ==========
  const LEVELS = [
    // —— 第一阶段：基本认谱逻辑 ——
    { id: 1, phase: 1, title: "线音与间音", type: "line-space",
      clefs: ["treble", "bass"], steps: range(0, 8), questionCount: 10,
      answers: ["线", "间"] },

    { id: 2, phase: 1, title: "高音谱号三个 do", type: "do-position",
      clef: "treble", doSteps: [-2, 5, 12], order: "low-to-high", questionCount: 6,
      answers: ["第一个 do", "第二个 do", "第三个 do"] },

    { id: 3, phase: 1, title: "低音谱号三个 do", type: "do-position",
      clef: "bass", doSteps: [10, 3, -4], order: "high-to-low", questionCount: 6,
      answers: ["第一个 do", "第二个 do", "第三个 do"] },

    { id: 4, phase: 1, title: "高音 do–si · 隔开的音", type: "adjacent-separated",
      clef: "treble",
      pairs: [[-2,0],[0,2],[2,4],[-1,1],[1,3]],   // do-mi, mi-sol, sol-si, re-fa, fa-la
      pairIsAdjacent: false, answers: ["挨着的", "隔开的"] },

    { id: 5, phase: 1, title: "高音 do–si · 挨着的音", type: "adjacent-separated",
      clef: "treble",
      pairs: [[-2,-1],[-1,0],[0,1],[1,2],[2,3],[3,4]], // do-re, re-mi, mi-fa, fa-sol, sol-la, la-si
      pairIsAdjacent: true, answers: ["挨着的", "隔开的"] },

    { id: 6, phase: 1, title: "低音 do–re · 隔开的音", type: "adjacent-separated",
      clef: "bass",
      pairs: [[10,8],[9,7],[8,6],[7,5],[6,4]],    // do-la, si-sol, la-fa, sol-mi, fa-re
      pairIsAdjacent: false, answers: ["挨着的", "隔开的"] },

    { id: 7, phase: 1, title: "低音 do–re · 挨着的音", type: "adjacent-separated",
      clef: "bass",
      pairs: [[10,9],[9,8],[8,7],[7,6],[6,5],[5,4]], // do-si, si-la, la-sol, sol-fa, fa-mi, mi-re
      pairIsAdjacent: true, answers: ["挨着的", "隔开的"] },

    // —— 第二阶段：唱名/音名 + 两音关系（固定 do + 范围内随机音）——
    { id: 8,  phase: 2, title: "高音第一个 do · 音名与关系", type: "note-relation",
      clef: "treble", fixedDoStep: -2, steps: [-2, -1, 0, 1, 2, 3, 4], questionCount: 12,
      relations: ["line", "space", "diff"] },

    { id: 9,  phase: 2, title: "低音第一个 do · 音名与关系", type: "note-relation",
      clef: "bass", fixedDoStep: 10, steps: [10, 9, 8, 7, 6, 5, 4], questionCount: 12,
      relations: ["line", "space", "diff"] },

    { id: 10, phase: 2, title: "高音第二个 do · 音名与关系", type: "note-relation",
      clef: "treble", fixedDoStep: 5, steps: [5, 6, 7, 8, 9, 10, 11], questionCount: 12,
      relations: ["line", "space", "diff"] },

    { id: 11, phase: 2, title: "低音第二个 do · 音名与关系", type: "note-relation",
      clef: "bass", fixedDoStep: 3, steps: [3, 2, 1, 0, -1, -2, -3], questionCount: 12,
      relations: ["line", "space", "diff"] },

    { id: 12, phase: 2, title: "高音第三个 do · 音名与关系", type: "note-relation",
      clef: "treble", fixedDoStep: 12, steps: [10, 11, 12, 13, 14], questionCount: 12,
      relations: ["line", "space", "diff"] },

    { id: 13, phase: 2, title: "低音第三个 do · 音名与关系", type: "note-relation",
      clef: "bass", fixedDoStep: -4, steps: [-2, -3, -4, -5, -6], questionCount: 12,
      relations: ["line", "space", "diff"] },

    // —— 第三阶段：音阶音辨认（平均出题 + 相邻约束）——
    { id: 14, phase: 3, title: "高音第一个 do–si", type: "note-name",
      clef: "treble", steps: [-2, -1, 0, 1, 2, 3, 4], questionCount: 14 },

    { id: 15, phase: 3, title: "高音第二个 do–si", type: "note-name",
      clef: "treble", steps: [5, 6, 7, 8, 9, 10, 11], questionCount: 14 },

    { id: 16, phase: 3, title: "高音第二个 la–第三个 mi", type: "note-name",
      clef: "treble", steps: [10, 11, 12, 13, 14], questionCount: 10 },

    { id: 17, phase: 3, title: "低音第一个 do–si", type: "note-name",
      clef: "bass", steps: [10, 9, 8, 7, 6, 5, 4], questionCount: 14 },

    { id: 18, phase: 3, title: "低音第二个 do–si", type: "note-name",
      clef: "bass", steps: [3, 2, 1, 0, -1, -2, -3], questionCount: 14 },

    { id: 19, phase: 3, title: "低音第二个 mi–第三个 la", type: "note-name",
      clef: "bass", steps: [-2, -3, -4, -5, -6], questionCount: 10 },

    // —— 第四阶段：谱号辨认 ——
    { id: 20, phase: 4, title: "高音 do–sol + 低音 do–fa", type: "note-name-mixed",
      pools: [
        { clef: "treble", steps: [-2, -1, 0, 1, 2] },
        { clef: "bass",  steps: [10, 9, 8, 7, 6] },
      ], questionCount: 10 },

    { id: 21, phase: 4, title: "高音第一个 do–si + 低音第一个 do–re", type: "note-name-mixed",
      pools: [
        { clef: "treble", steps: [-2, -1, 0, 1, 2, 3, 4] },
        { clef: "bass",  steps: [10, 9, 8, 7, 6, 5, 4] },
      ], questionCount: 10 },

    { id: 22, phase: 4, title: "高音第二个 do–sol + 低音第二个 do–fa", type: "note-name-mixed",
      pools: [
        { clef: "treble", steps: [5, 6, 7, 8, 9] },
        { clef: "bass",  steps: [3, 2, 1, 0, -1] },
      ], questionCount: 10 },

    { id: 23, phase: 4, title: "高音第二个 do–si + 低音第二个 do–re", type: "note-name-mixed",
      pools: [
        { clef: "treble", steps: [5, 6, 7, 8, 9, 10, 11] },
        { clef: "bass",  steps: [3, 2, 1, 0, -1, -2, -3] },
      ], questionCount: 10 },

    { id: 24, phase: 4, title: "高音 la–mi + 低音 la–mi", type: "note-name-mixed",
      pools: [
        { clef: "treble", steps: [10, 11, 12, 13, 14] },
        { clef: "bass",  steps: [8, 7, 6, 5] },
      ], questionCount: 10 },

    { id: 25, phase: 4, title: "高音第一个 do–第三个 mi", type: "note-name",
      clef: "treble", steps: range(-2, 14), questionCount: 10 },

    { id: 26, phase: 4, title: "低音第一个 do–第三个 la", type: "note-name",
      clef: "bass", steps: range(-4, 10), questionCount: 10 },

    { id: 27, phase: 4, title: "终极考验", type: "note-name-mixed",
      pools: [
        { clef: "treble", steps: range(-2, 14) },
        { clef: "bass",  steps: range(-4, 10) },
      ], questionCount: 10 },
  ];

  const STORAGE_KEY = "staff-note-trainer-v1";
  const TODAY = new Date().toISOString().slice(0, 10);

  const els = {
    canvas: document.querySelector("#staff-canvas"),
    tabs: [...document.querySelectorAll(".tab")],
    modeSubtitle: document.querySelector("#mode-subtitle"),
    questionType: document.querySelector("#question-type"),
    questionTitle: document.querySelector("#question-title"),
    clefLabel: document.querySelector("#clef-label"),
    rangeLabel: document.querySelector("#range-label"),
    stepLabel: document.querySelector("#step-label"),
    feedback: document.querySelector("#feedback"),
    patternProgress: document.querySelector("#pattern-progress"),
    letterButtons: document.querySelector("#letter-buttons"),
    solfegeButtons: document.querySelector("#solfege-buttons"),
    playNote: document.querySelector("#play-note"),
    nextQuestion: document.querySelector("#next-question"),
    showAnswer: document.querySelector("#show-answer"),
    resetProgress: document.querySelector("#reset-progress"),
    resetPattern: document.querySelector("#reset-pattern"),
    clefSetting: document.querySelector("#clef-setting"),
    difficultySetting: document.querySelector("#difficulty-setting"),
    ledgerDirection: document.querySelector("#ledger-direction"),
    ledgerKind: document.querySelector("#ledger-kind"),
    autoplaySetting: document.querySelector("#autoplay-setting"),
    hintSetting: document.querySelector("#hint-setting"),
    weakSetting: document.querySelector("#weak-setting"),
    stats: {
      accuracy: document.querySelector("#stat-accuracy"),
      streak: document.querySelector("#stat-streak"),
      today: document.querySelector("#stat-today"),
      weak: document.querySelector("#stat-weak"),
    },
    // 闯关模式元素
    challengeBar: document.querySelector("#challenge-bar"),
    challengeLevelNum: document.querySelector("#challenge-level-num"),
    challengeLevelTitle: document.querySelector("#challenge-level-title"),
    challengeAttempts: document.querySelector("#challenge-attempts"),
    challengeProgress: document.querySelector("#challenge-progress"),
    challengeAnswers: document.querySelector("#challenge-answers"),
    relationAnswers: document.querySelector("#relation-answers"),
    levelCompleteModal: document.querySelector("#level-complete-modal"),
    modalLevelName: document.querySelector("#modal-level-name"),
    modalTime: document.querySelector("#modal-time"),
    modalAttempts: document.querySelector("#modal-attempts"),
    modalNextLevel: document.querySelector("#modal-next-level"),
    modalFinal: document.querySelector("#modal-final"),
    // DEBUG: 测试用关卡选择器，上线前删除 ↓
    debugLevelSelect: document.querySelector("#debug-level-select"),
    // DEBUG: 测试用关卡选择器，上线前删除 ↑
  };
  const ctx = els.canvas.getContext("2d");

  const state = {
    mode: "random",
    current: null,
    currentNote2: null,       // 闯关双音符模式的第二个音符
    selectedLetter: null,
    selectedSolfege: null,
    answered: false,
    patternIndex: 0,
    patternAnswers: [],
    reviewQueue: [],
    audioContext: null,
    // 闯关状态
    challenge: {
      currentLevel: 1,
      levelAttempts: 0,
      levelStartTime: null,
      levelQuestions: [],
      levelCurrentIndex: 0,
      completed: false,
    },
    challengeLetterAnswer: null,   // note-relation/note-name 类型的音名选择
    challengeSolfegeAnswer: null,  // note-relation/note-name 类型的唱名选择
    challengeRelationAnswer: null, // note-relation 类型的关系选择
    targetIsNote2: false,         // 目标音是否在第二个音符（固定 do 模式）
    settings: {
      clef: "mixed",
      difficulty: "staff",
      ledgerDirection: "mixed",
      ledgerKind: "lines",
      autoplay: false,
      hints: true,
      useWeak: true,
    },
    progress: loadProgress(),
  };

  function defaultProgress() {
    return {
      attempts: 0,
      correct: 0,
      streak: 0,
      daily: { date: TODAY, attempts: 0 },
      notes: {},
      lastMode: "random",
      challenge: {
        currentLevel: 1,
        levelAttempts: 0,
        levelStartTime: null,
        levelQuestions: [],
        levelCurrentIndex: 0,
        completed: false,
      },
    };
  }

  function loadProgress() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      const progress = { ...defaultProgress(), ...parsed };
      if (!progress.daily || progress.daily.date !== TODAY) {
        progress.daily = { date: TODAY, attempts: 0 };
      }
      progress.notes = progress.notes || {};
      progress.challenge = { ...defaultProgress().challenge, ...(progress.challenge || {}) };
      return progress;
    } catch {
      return defaultProgress();
    }
  }

  function saveProgress() {
    state.progress.lastMode = state.mode;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
  }

  function naturalNote(clef, staffStep) {
    const clefInfo = CLEFS[clef];
    const baseIndex = LETTERS.indexOf(clefInfo.baseLetter);
    const absolute = clefInfo.baseOctave * 7 + baseIndex + staffStep;
    const octave = Math.floor(absolute / 7);
    const letter = LETTERS[((absolute % 7) + 7) % 7];
    const midi = 12 * (octave + 1) + SEMITONES[letter];
    return {
      clef,
      staffStep,
      letter,
      solfege: SOLFEGE[letter],
      octave,
      midi,
      key: `${clef}:${staffStep}`,
      label: `${letter}${octave} / ${SOLFEGE[letter]}`,
    };
  }

  function notePositionName(step) {
    if (step >= 0 && step <= 8) {
      const rank = Math.floor(step / 2) + 1;
      return step % 2 === 0 ? `第 ${rank} 线` : `第 ${rank} 间`;
    }
    const direction = step > 8 ? "上加" : "下加";
    const distance = step > 8 ? step - 8 : -step;
    const count = Math.ceil(distance / 2);
    return step % 2 === 0 ? `${direction}第 ${count} 线` : `${direction}第 ${count} 间`;
  }

  function buildRange(kind = state.settings.difficulty) {
    if (kind === "staff") return range(-0, 8);
    if (kind === "ledger1") return range(-4, 12);
    return range(-8, 16);
  }

  function range(start, end) {
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }

  function clefPool() {
    if (state.settings.clef === "mixed") return ["treble", "bass"];
    return [state.settings.clef];
  }

  function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Fisher-Yates 洗牌 + 确保相邻题目不相同
  function shuffleNoAdjacent(arr, keyFn) {
    const result = shuffle(arr);
    for (let i = 1; i < result.length; i += 1) {
      if (keyFn(result[i]) === keyFn(result[i - 1])) {
        // 向后找可交换的位置：优先找与前后都不冲突的
        let best = -1;
        for (let j = i + 1; j < result.length; j += 1) {
          const prevOk = keyFn(result[j]) !== keyFn(result[i - 1]);
          const nextOk = (j + 1 >= result.length) || (keyFn(result[j]) !== keyFn(result[j + 1]));
          const hereOk = (j - 1 < 0) || (keyFn(result[i]) !== keyFn(result[j - 1]));
          if (prevOk && nextOk && hereOk) { best = j; break; }
        }
        if (best < 0) {
          // 退而求其次：只要与前一个不同即可
          for (let j = i + 1; j < result.length; j += 1) {
            if (keyFn(result[j]) !== keyFn(result[i - 1])) { best = j; break; }
          }
        }
        if (best >= 0) {
          [result[i], result[best]] = [result[best], result[i]];
        }
        // 如果实在找不到（极小概率，在题目池极小时发生），保留原位
      }
    }
    return result;
  }

  // 构建无相邻冲突的 step 序列：相邻题的 step 不能相同、也不能相差 1（音阶相邻）
  // 每个 step 平均出现 repeatCount 次，总长度 = questionCount
  function buildConstrainedStepSequence(steps, questionCount) {
    const repeatCount = Math.floor(questionCount / steps.length);
    const stepPool = [];
    steps.forEach(function (s) {
      for (let j = 0; j < repeatCount; j += 1) {
        stepPool.push(s);
      }
    });
    while (stepPool.length < questionCount) {
      stepPool.push(randomItem(steps));
    }

    const items = stepPool.map(function (s) { return { step: s }; });
    const shuffled = shuffle(items);
    for (let i = 1; i < shuffled.length; i += 1) {
      const cur = shuffled[i].step;
      const prev = shuffled[i - 1].step;
      if (cur === prev || Math.abs(cur - prev) === 1) {
        let best = -1;
        for (let j = i + 1; j < shuffled.length; j += 1) {
          const jStep = shuffled[j].step;
          const prevOk = jStep !== prev && Math.abs(jStep - prev) !== 1;
          const nextOk = (j + 1 >= shuffled.length) ||
            (jStep !== shuffled[j + 1].step && Math.abs(jStep - shuffled[j + 1].step) !== 1);
          const hereOk = (j - 1 < 0) ||
            (cur !== shuffled[j - 1].step && Math.abs(cur - shuffled[j - 1].step) !== 1);
          if (prevOk && nextOk && hereOk) { best = j; break; }
        }
        if (best < 0) {
          for (let j = i + 1; j < shuffled.length; j += 1) {
            const jStep = shuffled[j].step;
            if (jStep !== prev && Math.abs(jStep - prev) !== 1) { best = j; break; }
          }
        }
        if (best >= 0) {
          var tmp = shuffled[i];
          shuffled[i] = shuffled[best];
          shuffled[best] = tmp;
        }
      }
    }
    return shuffled.map(function (item) { return item.step; });
  }

  function weightedPick(notes) {
    const weighted = [];
    notes.forEach((note) => {
      const stats = state.progress.notes[note.key];
      const mistakes = stats ? Math.max(0, stats.attempts - stats.correct) : 0;
      const weight = 1 + (state.settings.useWeak ? Math.min(4, mistakes) : 0);
      for (let i = 0; i < weight; i += 1) weighted.push(note);
    });
    return randomItem(weighted);
  }

  function randomNoteForSettings() {
    const notes = [];
    clefPool().forEach((clef) => {
      buildRange().forEach((step) => notes.push(naturalNote(clef, step)));
    });
    return weightedPick(notes);
  }

  function ledgerNoteForSettings() {
    const direction = state.settings.ledgerDirection;
    const kind = state.settings.ledgerKind;
    let steps = [];
    if (direction === "above" || direction === "mixed") {
      steps = steps.concat(kind === "lines" ? [10, 12, 14, 16] : range(9, 16));
    }
    if (direction === "below" || direction === "mixed") {
      steps = steps.concat(kind === "lines" ? [-2, -4, -6, -8] : range(-8, -1));
    }
    const notes = [];
    clefPool().forEach((clef) => {
      steps.forEach((step) => notes.push(naturalNote(clef, step)));
    });
    return weightedPick(notes);
  }

  function reviewNotes() {
    const stored = Object.entries(state.progress.notes)
      .map(([key, stats]) => {
        const [clef, stepValue] = key.split(":");
        const step = Number(stepValue);
        const mistakes = stats.attempts - stats.correct;
        const accuracy = stats.attempts ? stats.correct / stats.attempts : 1;
        return { note: naturalNote(clef, step), mistakes, accuracy, attempts: stats.attempts };
      })
      .filter((item) => item.mistakes > 0 || item.accuracy < 0.75)
      .sort((a, b) => b.mistakes - a.mistakes || a.accuracy - b.accuracy)
      .map((item) => item.note);

    if (stored.length) return stored.slice(0, 10);

    return [
      naturalNote("treble", 0),
      naturalNote("treble", 8),
      naturalNote("treble", -2),
      naturalNote("treble", 10),
      naturalNote("bass", 0),
      naturalNote("bass", 8),
      naturalNote("bass", -2),
      naturalNote("bass", 10),
      naturalNote("treble", 5),
      naturalNote("bass", 5),
    ];
  }

  function currentPattern() {
    return PATTERNS[state.patternIndex % PATTERNS.length];
  }

  // ========== 闯关：获取当前关卡定义 ==========
  function currentLevel() {
    const idx = LEVELS.findIndex((l) => l.id === state.challenge.currentLevel);
    return idx >= 0 ? LEVELS[idx] : LEVELS[0];
  }

  // ========== 闯关：生成题目队列 ==========
  function generateChallengeQuestions(level) {
    let questions = [];
    let keyFn;
    var alreadyConstrained = false; // 内层已做无相邻+无音阶相邻排序
    switch (level.type) {
      case "line-space":
        questions = generateLineSpaceQuestions(level);
        keyFn = (q) => q.note.key;
        break;
      case "do-position":
        questions = generateDoPositionQuestions(level);
        keyFn = (q) => q.note.key;
        break;
      case "adjacent-separated":
        questions = generateAdjacentSeparatedQuestions(level);
        keyFn = (q) => q.note.key + "|" + (q.note2 ? q.note2.key : "");
        break;
      case "note-relation":
        questions = generateNoteRelationQuestions(level);
        if (level.fixedDoStep !== undefined) {
          alreadyConstrained = true;
        } else {
          keyFn = (q) => q.targetIsNote2 ? q.note2.key : q.note.key;
        }
        break;
      case "note-name":
      case "note-name-mixed":
        questions = generateNoteNameQuestions(level);
        if (level.type === "note-name" && level.questionCount % level.steps.length === 0) {
          alreadyConstrained = true;
        } else {
          keyFn = (q) => q.note.key;
        }
        break;
    }
    return alreadyConstrained ? questions : shuffleNoAdjacent(questions, keyFn);
  }

  function generateLineSpaceQuestions(level) {
    const questions = [];
    for (let i = 0; i < level.questionCount; i += 1) {
      const clef = randomItem(level.clefs);
      const step = randomItem(level.steps);
      const note = naturalNote(clef, step);
      const isLine = step % 2 === 0;
      questions.push({
        note,
        note2: null,
        correctAnswer: isLine ? "线" : "间",
        correctRelation: null,
        description: `${CLEFS[clef].name} · ${notePositionName(step)}`,
      });
    }
    return questions;
  }

  function generateDoPositionQuestions(level) {
    const questions = [];
    // 每个位置出现 2 次
    const allSteps = [];
    level.doSteps.forEach((s) => { allSteps.push(s); allSteps.push(s); });
    const shuffled = shuffle(allSteps);
    // 编号映射
    const labelMap = {};
    level.doSteps.forEach((s, i) => { labelMap[s] = level.answers[i]; });
    shuffled.forEach((step) => {
      const note = naturalNote(level.clef, step);
      questions.push({
        note,
        note2: null,
        correctAnswer: labelMap[step],
        correctRelation: null,
        description: CLEFS[level.clef].name,
      });
    });
    return questions;
  }

  function generateAdjacentSeparatedQuestions(level) {
    const questions = [];
    const shuffled = shuffle(level.pairs);
    const correctLabel = level.pairIsAdjacent ? "挨着的" : "隔开的";
    shuffled.forEach(([step1, step2]) => {
      const note1 = naturalNote(level.clef, step1);
      const note2 = naturalNote(level.clef, step2);
      questions.push({
        note: note1,
        note2: note2,
        correctAnswer: correctLabel,
        correctRelation: null,
        description: `${note1.solfege} – ${note2.solfege}`,
      });
    });
    return questions;
  }

  function generateNoteRelationQuestions(level) {
    const questions = [];
    const steps = level.steps;

    // 固定 do 模式：do 显示在第一个位置（参考音），第二个音是随机目标音
    // 每个音平均出现，相邻题目不同音且不音阶相邻
    if (level.fixedDoStep !== undefined) {
      const doStep = level.fixedDoStep;
      const doNote = naturalNote(level.clef, doStep);
      const randomPool = steps.filter(function (s) { return s !== doStep; });

      const shuffledSteps = buildConstrainedStepSequence(randomPool, level.questionCount);

      for (let i = 0; i < level.questionCount; i += 1) {
        const step2 = shuffledSteps[i];
        const note2 = naturalNote(level.clef, step2);

        let correctRelation;
        if (level.relations && level.relations.length === 3) {
          if ((doStep % 2 === 0) && (step2 % 2 === 0)) correctRelation = "line";
          else if ((doStep % 2 !== 0) && (step2 % 2 !== 0)) correctRelation = "space";
          else correctRelation = "diff";
        } else {
          const sameParity = (doStep % 2 === 0) === (step2 % 2 === 0);
          correctRelation = sameParity ? "same" : "diff";
        }

        questions.push({
          note: doNote,       // 第一个音（参考音，固定的 do）
          note2: note2,       // 第二个音（目标音，用户需辨认）
          correctAnswer: null,
          correctRelation,
          targetLetter: note2.letter,
          targetSolfege: note2.solfege,
          targetIsNote2: true,
          description: `${doNote.solfege} – ${note2.solfege}`,
        });
      }
      return questions;
    }

    for (let i = 0; i < level.questionCount; i += 1) {
      // 从范围中随机选两个不同的音（距离 1~3 个音阶位置）
      const idx1 = Math.floor(Math.random() * steps.length);
      const maxDist = Math.min(3, steps.length - 1);
      let offset = 1 + Math.floor(Math.random() * maxDist);
      if (Math.random() < 0.5) offset = -offset;
      let idx2 = idx1 + offset;
      if (idx2 < 0) idx2 = idx1 - offset;
      if (idx2 >= steps.length) idx2 = idx1 - offset;
      if (idx2 < 0 || idx2 >= steps.length || idx2 === idx1) {
        idx2 = (idx1 + 1) % steps.length;
      }
      const step1 = steps[idx1];
      const step2 = steps[idx2];
      const note1 = naturalNote(level.clef, step1);
      const note2 = naturalNote(level.clef, step2);
      // 关系判断
      let correctRelation;
      if (level.relations && level.relations.length === 3) {
        // 三选项：线音和线音 / 间音和间音 / 线音和间音
        if ((step1 % 2 === 0) && (step2 % 2 === 0)) correctRelation = "line";
        else if ((step1 % 2 !== 0) && (step2 % 2 !== 0)) correctRelation = "space";
        else correctRelation = "diff";
      } else {
        // 两选项：同为线/间 → same，不同 → diff
        const sameParity = (step1 % 2 === 0) === (step2 % 2 === 0);
        correctRelation = sameParity ? "same" : "diff";
      }
      questions.push({
        note: note1,        // 目标音（用户需辨认）
        note2: note2,       // 参考音
        correctAnswer: null,
        correctRelation,
        targetLetter: note1.letter,
        targetSolfege: note1.solfege,
        description: `${note1.solfege} – ${note2.solfege}`,
      });
    }
    return questions;
  }

  function generateNoteNameQuestions(level) {
    const questions = [];

    // 单谱号 + 题数是 step 数的整数倍 → 平均出题 + 相邻约束
    var balancedSteps = null;
    if (level.type === "note-name" && level.questionCount % level.steps.length === 0) {
      balancedSteps = buildConstrainedStepSequence(level.steps, level.questionCount);
    }

    for (let i = 0; i < level.questionCount; i += 1) {
      let clef, step;
      if (level.type === "note-name-mixed") {
        const pool = randomItem(level.pools);
        clef = pool.clef;
        step = randomItem(pool.steps);
      } else if (balancedSteps) {
        clef = level.clef;
        step = balancedSteps[i];
      } else {
        clef = level.clef;
        step = randomItem(level.steps);
      }
      const note = naturalNote(clef, step);
      questions.push({
        note,
        note2: null,
        correctAnswer: null,       // 由 note-name 判题处理
        correctRelation: null,
        targetLetter: note.letter,
        targetSolfege: note.solfege,
        description: CLEFS[clef].name,
      });
    }
    return questions;
  }

  // ========== 闯关：初始化关卡 ==========
  function initChallengeLevel(level) {
    const questions = generateChallengeQuestions(level);
    state.challenge.levelQuestions = questions;
    state.challenge.levelCurrentIndex = 0;
    state.challenge.levelAttempts = 0;
    state.challenge.levelStartTime = Date.now();
    state.challengeLetterAnswer = null;
    state.challengeSolfegeAnswer = null;
    state.challengeRelationAnswer = null;
    state.progress.challenge.currentLevel = level.id;
    state.progress.challenge.levelAttempts = 0;
    state.progress.challenge.levelStartTime = state.challenge.levelStartTime;
    state.progress.challenge.levelQuestions = questions.map(function () { return {}; }); // 浅拷贝标记
    state.progress.challenge.levelCurrentIndex = 0;
    state.progress.challenge.completed = false;
    saveProgress();

    // 更新 UI
    els.challengeLevelNum.textContent = level.id;
    els.challengeLevelTitle.textContent = level.title;
    els.challengeAttempts.textContent = "";
    // DEBUG: 同步选择器，上线前删除 ↓
    if (els.debugLevelSelect) els.debugLevelSelect.value = String(level.id);
    // DEBUG: 同步选择器，上线前删除 ↑
    renderChallengeProgress();
    renderChallengeUI(level);
  }

  // ========== 闯关：渲染进度点 ==========
  function renderChallengeProgress() {
    const level = currentLevel();
    const total = state.challenge.levelQuestions.length;
    const current = state.challenge.levelCurrentIndex;
    els.challengeProgress.innerHTML = "";
    els.challengeProgress.hidden = false;
    for (let i = 0; i < total; i += 1) {
      const dot = document.createElement("div");
      dot.className = "challenge-dot";
      if (i < current) {
        dot.classList.add("is-done");
        dot.textContent = "✓";
      } else if (i === current) {
        dot.classList.add("is-current");
        dot.textContent = String(i + 1);
      } else {
        dot.textContent = String(i + 1);
      }
      els.challengeProgress.append(dot);
    }
  }

  // ========== 闯关：根据关卡类型显示/隐藏答题 UI ==========
  function renderChallengeUI(level) {
    // 隐藏所有
    els.challengeAnswers.hidden = true;
    els.relationAnswers.hidden = true;
    els.letterButtons.parentElement.hidden = true;
    els.solfegeButtons.parentElement.hidden = true;
    els.playNote.hidden = true;
    els.showAnswer.hidden = true;
    els.nextQuestion.hidden = true;

    switch (level.type) {
      case "line-space":
      case "do-position":
      case "adjacent-separated":
        // 显示闯关专用按钮
        els.challengeAnswers.hidden = false;
        els.challengeAnswers.innerHTML = "";
        level.answers.forEach((ans) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "challenge-answer-btn";
          btn.textContent = ans;
          btn.addEventListener("click", () => answerChallengeSimple(ans));
          els.challengeAnswers.append(btn);
        });
        break;

      case "note-relation":
        // 显示音名/唱名按钮 + 动态渲染关系按钮
        els.letterButtons.parentElement.hidden = false;
        els.solfegeButtons.parentElement.hidden = false;
        els.relationAnswers.hidden = false;
        renderRelationButtons(level);
        state.challengeLetterAnswer = null;
        state.challengeSolfegeAnswer = null;
        state.challengeRelationAnswer = null;
        updateChallengeRelationSelection();
        break;

      case "note-name":
      case "note-name-mixed":
        // 显示音名/唱名按钮（选对任意一个即正确）
        els.letterButtons.parentElement.hidden = false;
        els.solfegeButtons.parentElement.hidden = false;
        els.relationAnswers.hidden = true;
        state.challengeLetterAnswer = null;
        state.challengeSolfegeAnswer = null;
        break;
    }

    // 显示关卡信息条
    els.challengeBar.hidden = false;
    els.challengeProgress.hidden = false;
    // 隐藏常规设置和播放按钮
    els.playNote.hidden = true;
    els.showAnswer.hidden = true;
  }

  function renderRelationButtons(level) {
    const grid = document.querySelector("#relation-grid");
    if (!grid) return;
    grid.innerHTML = "";
    const options = level.relations || ["same", "diff"];
    const labels = {
      line: "线音和线音",
      space: "间音和间音",
      diff: "线音和间音",
      same: "线音和线音",
    };
    options.forEach((rel) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "answer-button relation-btn";
      btn.dataset.relation = rel;
      btn.textContent = labels[rel] || rel;
      btn.addEventListener("click", () => {
        if (state.answered) return;
        state.challengeRelationAnswer = rel;
        updateChallengeRelationSelection();
        tryCheckChallengeAnswer();
      });
      grid.append(btn);
    });
  }

  function updateChallengeRelationSelection() {
    const btns = document.querySelectorAll("#relation-grid .relation-btn");
    btns.forEach((btn) => {
      btn.classList.toggle("is-selected", btn.dataset.relation === state.challengeRelationAnswer);
    });
  }

  // ========== 闯关：简单答题（line-space / do-position / adjacent-separated）==========
  function answerChallengeSimple(value) {
    if (state.answered) return;
    const q = state.challenge.levelQuestions[state.challenge.levelCurrentIndex];
    if (!q) return;
    const correct = (value === q.correctAnswer);
    state.answered = true;
    // 禁用按钮
    els.challengeAnswers.querySelectorAll("button").forEach((b) => { b.disabled = true; });
    // 高亮选中
    els.challengeAnswers.querySelectorAll("button").forEach((b) => {
      if (b.textContent === value) b.classList.add("is-selected");
    });

    if (correct) {
      recordAnswer(q.note, true);
      setFeedback("good", `对！${q.description || ""}`);
      renderChallengeDot(state.challenge.levelCurrentIndex, "is-done");
      state.challenge.levelCurrentIndex += 1;
      state.progress.challenge.levelCurrentIndex = state.challenge.levelCurrentIndex;
      saveProgress();
      if (state.challenge.levelCurrentIndex >= state.challenge.levelQuestions.length) {
        showLevelComplete();
      } else {
        // 短暂延迟后自动下一题
        setTimeout(() => advanceChallengeQuestion(), 600);
      }
    } else {
      recordAnswer(q.note, false);
      setFeedback("bad", `不对。正确答案是「${q.correctAnswer}」。${q.description || ""}`);
      renderChallengeDot(state.challenge.levelCurrentIndex, "is-wrong");
      setTimeout(() => resetCurrentLevel(), 1200);
    }
    refreshStats();
  }

  // ========== 闯关：note-relation / note-name 答题 ==========
  function tryCheckChallengeAnswer() {
    if (state.answered) return;
    const level = currentLevel();
    const q = state.challenge.levelQuestions[state.challenge.levelCurrentIndex];
    if (!q) return;

    if (level.type === "note-relation") {
      // 需要三部分都完成：音名 + 唱名 + 两音关系
      if (!state.challengeLetterAnswer || !state.challengeSolfegeAnswer || !state.challengeRelationAnswer) return;
      const letterCorrect = (state.challengeLetterAnswer === q.targetLetter);
      const solfegeCorrect = (state.challengeSolfegeAnswer === q.targetSolfege);
      const relationCorrect = (state.challengeRelationAnswer === q.correctRelation);
      const allCorrect = letterCorrect && solfegeCorrect && relationCorrect;
      const targetNote = q.targetIsNote2 ? q.note2 : q.note;
      state.answered = true;
      setButtonsDisabled(true);

      if (allCorrect) {
        recordAnswer(targetNote, true);
        setFeedback("good", `对！${targetNote.label}，关系正确。`);
        renderChallengeDot(state.challenge.levelCurrentIndex, "is-done");
        state.challenge.levelCurrentIndex += 1;
        state.progress.challenge.levelCurrentIndex = state.challenge.levelCurrentIndex;
        saveProgress();
        if (state.challenge.levelCurrentIndex >= state.challenge.levelQuestions.length) {
          showLevelComplete();
        } else {
          setTimeout(() => advanceChallengeQuestion(), 700);
        }
      } else {
        recordAnswer(targetNote, false);
        let msg = "不对。";
        if (!letterCorrect && !solfegeCorrect) msg += ` 目标音是 ${targetNote.label}。`;
        else if (!letterCorrect) msg += ` 音名是 ${q.targetLetter}。`;
        else if (!solfegeCorrect) msg += ` 唱名是 ${q.targetSolfege}。`;
        if (!relationCorrect) {
          const relMap = { line: "线音和线音", space: "间音和间音", diff: "线音和间音", same: "线音和线音" };
          const relText = relMap[q.correctRelation] || q.correctRelation;
          msg += ` 关系是「${relText}」。`;
        }
        setFeedback("bad", msg);
        renderChallengeDot(state.challenge.levelCurrentIndex, "is-wrong");
        setTimeout(() => resetCurrentLevel(), 1500);
      }
      refreshStats();
    } else if (level.type === "note-name" || level.type === "note-name-mixed") {
      // 必须音名和唱名都选对
      if (!state.challengeLetterAnswer || !state.challengeSolfegeAnswer) return;
      const letterCorrect = (state.challengeLetterAnswer === q.targetLetter);
      const solfegeCorrect = (state.challengeSolfegeAnswer === q.targetSolfege);
      const allCorrect = letterCorrect && solfegeCorrect;
      state.answered = true;
      setButtonsDisabled(true);

      if (allCorrect) {
        recordAnswer(q.note, true);
        setFeedback("good", `对！${q.note.label}。位置是 ${notePositionName(q.note.staffStep)}。`);
        renderChallengeDot(state.challenge.levelCurrentIndex, "is-done");
        state.challenge.levelCurrentIndex += 1;
        state.progress.challenge.levelCurrentIndex = state.challenge.levelCurrentIndex;
        saveProgress();
        if (state.challenge.levelCurrentIndex >= state.challenge.levelQuestions.length) {
          showLevelComplete();
        } else {
          setTimeout(() => advanceChallengeQuestion(), 600);
        }
      } else {
        recordAnswer(q.note, false);
        let msg = "不对。";
        if (!letterCorrect && !solfegeCorrect) msg += ` 正确答案是 ${q.note.label}。`;
        else if (!letterCorrect) msg += ` 音名是 ${q.targetLetter}（唱名 ${q.targetSolfege} 正确）。`;
        else if (!solfegeCorrect) msg += ` 唱名是 ${q.targetSolfege}（音名 ${q.targetLetter} 正确）。`;
        msg += ` 位置是 ${notePositionName(q.note.staffStep)}。`;
        setFeedback("bad", msg);
        renderChallengeDot(state.challenge.levelCurrentIndex, "is-wrong");
        setTimeout(() => resetCurrentLevel(), 1200);
      }
      refreshStats();
    }
  }

  function advanceChallengeQuestion() {
    const level = currentLevel();
    clearQuestionState();
    state.challengeLetterAnswer = null;
    state.challengeSolfegeAnswer = null;
    state.challengeRelationAnswer = null;
    updateChallengeRelationSelection();
    state.answered = false;
    setButtonsDisabled(false);

    const q = state.challenge.levelQuestions[state.challenge.levelCurrentIndex];
    if (!q) return;
    state.current = q.note;
    state.currentNote2 = q.note2;
    state.targetIsNote2 = q.targetIsNote2 || false;
    state.targetIsNote2 = q.targetIsNote2 || false;
    renderChallengeUI(level);
    renderChallengeProgress();
    renderQuestionMeta();
    drawStaff(state.current, state.currentNote2);
    if (level.type === "note-relation") {
      setFeedback("", "分别选择目标音的音名和唱名，再选择两音关系。");
    } else if (level.type === "note-name" || level.type === "note-name-mixed") {
      setFeedback("", "分别选择音名和唱名（两个都必须选对）。");
    }
  }

  function renderChallengeDot(index, cls) {
    const dots = els.challengeProgress.querySelectorAll(".challenge-dot");
    if (index < dots.length) {
      dots[index].classList.remove("is-current");
      dots[index].classList.add(cls);
      if (cls === "is-done") dots[index].textContent = "✓";
      if (cls === "is-wrong") dots[index].textContent = "✗";
    }
  }

  function resetCurrentLevel() {
    const level = currentLevel();
    state.challenge.levelAttempts += 1;
    state.challenge.levelCurrentIndex = 0;
    state.challengeLetterAnswer = null;
    state.challengeSolfegeAnswer = null;
    state.challengeRelationAnswer = null;
    state.answered = false;
    state.progress.challenge.levelAttempts = state.challenge.levelAttempts;
    state.progress.challenge.levelCurrentIndex = 0;
    saveProgress();
    // 重新生成题目
    state.challenge.levelQuestions = generateChallengeQuestions(level);
    state.progress.challenge.levelQuestions = state.challenge.levelQuestions.map(function () { return {}; });
    els.challengeAttempts.textContent = `重试 ${state.challenge.levelAttempts} 次`;
    renderChallengeProgress();
    renderChallengeUI(level);
    clearQuestionState();
    setButtonsDisabled(false);
    updateAnswerSelection();
    // 加载第一题
    const q = state.challenge.levelQuestions[0];
    state.current = q.note;
    state.currentNote2 = q.note2;
    state.targetIsNote2 = q.targetIsNote2 || false;
    renderQuestionMeta();
    drawStaff(state.current, state.currentNote2);
    if (level.type === "note-relation") {
      setFeedback("", "分别选择目标音的音名和唱名，再选择两音关系。");
    } else if (level.type === "note-name" || level.type === "note-name-mixed") {
      setFeedback("", "分别选择音名和唱名（两个都必须选对）。");
    } else {
      setFeedback("", "请选择答案。");
    }
    updateChallengeRelationSelection();
  }

  // ========== 闯关：过关弹窗 ==========
  function showLevelComplete() {
    const level = currentLevel();
    const elapsed = Math.round((Date.now() - state.challenge.levelStartTime) / 1000);
    const attempts = state.challenge.levelAttempts + 1;
    state.progress.challenge.completed = (level.id >= 27);
    state.progress.challenge.levelAttempts = state.challenge.levelAttempts;
    saveProgress();

    els.modalLevelName.textContent = `第 ${level.id} 关「${level.title}」`;
    els.modalTime.textContent = String(elapsed);
    els.modalAttempts.textContent = String(attempts);

    if (level.id >= 27) {
      els.modalNextLevel.hidden = true;
      els.modalFinal.hidden = false;
    } else {
      els.modalNextLevel.hidden = false;
      els.modalFinal.hidden = true;
    }
    els.levelCompleteModal.hidden = false;
  }

  function hideModal() {
    els.levelCompleteModal.hidden = true;
  }

  function goToNextLevel() {
    hideModal();
    const level = currentLevel();
    const nextId = level.id + 1;
    if (nextId > 27) return;
    state.challenge.currentLevel = nextId;
    state.progress.challenge.currentLevel = nextId;
    state.progress.challenge.levelAttempts = 0;
    state.progress.challenge.levelStartTime = null;
    state.progress.challenge.levelCurrentIndex = 0;
    saveProgress();
    const nextLevel = LEVELS.find((l) => l.id === nextId) || LEVELS[0];
    initChallengeLevel(nextLevel);
    // 加载第一题（先清理状态，再设置题目数据，避免 clearQuestionState 清掉 note2）
    clearQuestionState();
    const q = state.challenge.levelQuestions[0];
    state.current = q.note;
    state.currentNote2 = q.note2;
    state.targetIsNote2 = q.targetIsNote2 || false;
    setButtonsDisabled(false);
    renderQuestionMeta();
    drawStaff(state.current, state.currentNote2);
    updateAnswerSelection();
    const lvl = currentLevel();
    if (lvl.type === "note-relation") {
      setFeedback("", "分别选择目标音的音名和唱名，再选择两音关系。");
    } else if (lvl.type === "note-name" || lvl.type === "note-name-mixed") {
      setFeedback("", "分别选择音名和唱名（两个都必须选对）。");
    } else {
      setFeedback("", "请选择答案。");
    }
  }

  // ========== 闯关：重置到第一关 ==========
  function resetChallengeToLevel1() {
    state.challenge.currentLevel = 1;
    state.challenge.levelAttempts = 0;
    state.challenge.levelStartTime = null;
    state.challenge.levelCurrentIndex = 0;
    state.challenge.levelQuestions = [];
    state.challenge.completed = false;
    state.challengeLetterAnswer = null;
    state.challengeSolfegeAnswer = null;
    state.challengeRelationAnswer = null;
    state.progress.challenge = {
      currentLevel: 1, levelAttempts: 0, levelStartTime: null,
      levelQuestions: [], levelCurrentIndex: 0, completed: false,
    };
    saveProgress();
  }

  // DEBUG: 测试用关卡跳转，上线前删除 ↓
  function debugJumpToLevel(levelId) {
    const level = LEVELS.find((l) => l.id === levelId);
    if (!level) return;
    state.challenge.currentLevel = levelId;
    state.challenge.levelAttempts = 0;
    state.challenge.levelStartTime = null;
    state.challenge.levelCurrentIndex = 0;
    state.challenge.levelQuestions = [];
    state.progress.challenge.currentLevel = levelId;
    state.progress.challenge.levelAttempts = 0;
    state.progress.challenge.levelStartTime = null;
    state.progress.challenge.levelCurrentIndex = 0;
    saveProgress();
    initChallengeLevel(level);
    clearQuestionState();
    const q = state.challenge.levelQuestions[0];
    state.current = q.note;
    state.currentNote2 = q.note2;
    state.targetIsNote2 = q.targetIsNote2 || false;
    setButtonsDisabled(false);
    renderQuestionMeta();
    drawStaff(state.current, state.currentNote2);
    updateAnswerSelection();
    els.debugLevelSelect.value = levelId;
  }
  // DEBUG: 测试用关卡跳转，上线前删除 ↑

  // ========== 答题按钮设置 ==========
  function setupAnswerButtons() {
    els.letterButtons.innerHTML = "";
    els.solfegeButtons.innerHTML = "";
    LETTERS.forEach((letter) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "answer-button";
      button.textContent = letter;
      button.dataset.letter = letter;
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => chooseAnswer("letter", letter));
      els.letterButtons.append(button);
    });
    LETTERS.map((letter) => SOLFEGE[letter]).forEach((name) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "answer-button";
      button.textContent = name;
      button.dataset.solfege = name;
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => chooseAnswer("solfege", name));
      els.solfegeButtons.append(button);
    });
  }

  function chooseAnswer(kind, value) {
    if (!state.current || state.answered) return;

    // 闯关模式 note-relation / note-name / note-name-mixed
    if (state.mode === "challenge") {
      const level = currentLevel();
      if (level.type === "note-relation" || level.type === "note-name" || level.type === "note-name-mixed") {
        // 分别记录音名和唱名选择
        if (kind === "letter") state.challengeLetterAnswer = value;
        if (kind === "solfege") state.challengeSolfegeAnswer = value;
        // 更新按钮选中状态（同时显示两个选择）
        updateChallengeNoteSelection();
        // 两个都选了才校验（note-relation 还需要关系）
        if (state.challengeLetterAnswer && state.challengeSolfegeAnswer) {
          tryCheckChallengeAnswer();
        }
        return;
      }
    }

    // 原有逻辑：常规模式
    if (kind === "letter") state.selectedLetter = value;
    if (kind === "solfege") state.selectedSolfege = value;
    updateAnswerSelection();
    if (state.selectedLetter && state.selectedSolfege) checkAnswer();
  }

  function updateChallengeNoteSelection() {
    // 更新音名按钮的选中状态
    els.letterButtons.querySelectorAll("button").forEach((button) => {
      button.classList.toggle("is-selected", button.dataset.letter === state.challengeLetterAnswer);
    });
    // 更新唱名按钮的选中状态
    els.solfegeButtons.querySelectorAll("button").forEach((button) => {
      button.classList.toggle("is-selected", button.dataset.solfege === state.challengeSolfegeAnswer);
    });
  }

  function updateAnswerSelection() {
    els.letterButtons.querySelectorAll("button").forEach((button) => {
      const active = button.dataset.letter === state.selectedLetter;
      button.classList.toggle("is-selected", active);
      button.setAttribute("aria-pressed", String(active));
    });
    els.solfegeButtons.querySelectorAll("button").forEach((button) => {
      const active = button.dataset.solfege === state.selectedSolfege;
      button.classList.toggle("is-selected", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function setButtonsDisabled(disabled) {
    els.letterButtons.querySelectorAll("button").forEach((button) => {
      button.disabled = disabled;
    });
    els.solfegeButtons.querySelectorAll("button").forEach((button) => {
      button.disabled = disabled;
    });
  }

  function checkAnswer() {
    const note = state.current;
    const correct = state.selectedLetter === note.letter && state.selectedSolfege === note.solfege;
    state.answered = true;
    setButtonsDisabled(true);
    recordAnswer(note, correct);

    if (state.mode === "pattern") {
      state.patternAnswers.push({ note, correct, letter: state.selectedLetter, solfege: state.selectedSolfege });
      renderPatternProgress();
      if (correct) {
        setFeedback("good", `对，${note.label}。继续下一个位置。`);
      } else {
        setFeedback("bad", `这里是 ${note.label}，不是 ${state.selectedLetter}/${state.selectedSolfege}。`);
      }
      if (state.patternAnswers.length >= currentPattern().steps.length) {
        const total = state.patternAnswers.length;
        const hits = state.patternAnswers.filter((item) => item.correct).length;
        setFeedback(hits === total ? "good" : "bad", `${currentPattern().title} 完成：${hits}/${total}。按“下一题”换一组。`);
      }
    } else {
      setFeedback(
        correct ? "good" : "bad",
        correct
          ? `对，${note.label}。这个位置是 ${notePositionName(note.staffStep)}。`
          : `正确答案是 ${note.label}，位置是 ${notePositionName(note.staffStep)}。`
      );
    }
    refreshStats();
  }

  function recordAnswer(note, correct) {
    const noteStats = state.progress.notes[note.key] || { attempts: 0, correct: 0 };
    noteStats.attempts += 1;
    noteStats.correct += correct ? 1 : 0;
    noteStats.lastSeen = Date.now();
    state.progress.notes[note.key] = noteStats;
    state.progress.attempts += 1;
    state.progress.correct += correct ? 1 : 0;
    state.progress.streak = correct ? state.progress.streak + 1 : 0;
    state.progress.daily.attempts += 1;
    saveProgress();
  }

  function setFeedback(kind, text) {
    els.feedback.classList.remove("is-good", "is-bad");
    if (kind === "good") els.feedback.classList.add("is-good");
    if (kind === "bad") els.feedback.classList.add("is-bad");
    els.feedback.textContent = text;
  }

  function clearQuestionState() {
    state.selectedLetter = null;
    state.selectedSolfege = null;
    state.answered = false;
    state.currentNote2 = null;
    state.challengeLetterAnswer = null;
    state.challengeSolfegeAnswer = null;
    state.challengeRelationAnswer = null;
    state.targetIsNote2 = false;
    updateAnswerSelection();
    setButtonsDisabled(false);
    setFeedback("", state.settings.hints ? "选择一个音名和一个唱名后自动校验。" : "选择音名和唱名。");
  }

  function setMode(mode) {
    state.mode = mode;
    els.tabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.mode === mode));

    // 隐藏/显示通用 UI
    const isChallenge = mode === "challenge";
    els.patternProgress.hidden = !(mode === "pattern" && !isChallenge);
    els.resetPattern.hidden = !(mode === "pattern" && !isChallenge);
    els.challengeBar.hidden = !isChallenge;
    els.challengeProgress.hidden = !isChallenge;
    els.challengeAnswers.hidden = !isChallenge;
    els.relationAnswers.hidden = true;
    els.playNote.hidden = isChallenge;
    els.showAnswer.hidden = isChallenge;
    els.nextQuestion.hidden = isChallenge;

    // 控件区：闯关模式下隐藏
    const controls = document.querySelector(".controls");
    if (controls) controls.hidden = isChallenge;

    // 恢复常规答题区
    if (!isChallenge) {
      els.letterButtons.parentElement.hidden = false;
      els.solfegeButtons.parentElement.hidden = false;
    }

    state.reviewQueue = mode === "review" ? reviewNotes() : state.reviewQueue;
    saveProgress();

    if (isChallenge) {
      // 初始化或恢复闯关
      const lvl = currentLevel();
      if (!state.challenge.levelQuestions.length || state.challenge.levelCurrentIndex >= state.challenge.levelQuestions.length) {
        initChallengeLevel(lvl);
      } else {
        renderChallengeProgress();
        renderChallengeUI(lvl);
        els.challengeBar.hidden = false;
        els.challengeProgress.hidden = false;
        els.challengeLevelNum.textContent = lvl.id;
        els.challengeLevelTitle.textContent = lvl.title;
        if (state.challenge.levelAttempts > 0) {
          els.challengeAttempts.textContent = `重试 ${state.challenge.levelAttempts} 次`;
        } else {
          els.challengeAttempts.textContent = "";
        }
      }
      nextQuestion(true);
    } else {
      nextQuestion(true);
    }
  }

  function nextQuestion(resetPattern = false) {
    clearQuestionState();
    const mode = MODES[state.mode];
    els.questionType.textContent = mode.type;
    els.questionTitle.textContent = mode.title;
    els.rangeLabel.textContent = mode.range;
    els.modeSubtitle.textContent = subtitleForMode(state.mode);

    if (state.mode === "challenge") {
      // 闯关模式
      const lvl = currentLevel();
      const q = state.challenge.levelQuestions[state.challenge.levelCurrentIndex];
      if (!q) return;
      state.current = q.note;
      state.currentNote2 = q.note2;
      els.questionTitle.textContent = lvl.title;
      els.rangeLabel.textContent = `${state.challenge.levelCurrentIndex + 1} / ${state.challenge.levelQuestions.length}`;
      renderChallengeUI(lvl);
      renderChallengeProgress();
      renderQuestionMeta();
      drawStaff(state.current, state.currentNote2);

      if (lvl.type === "note-relation") {
        setFeedback("", "分别选择目标音的音名和唱名，再选择两音关系。");
      } else if (lvl.type === "note-name" || lvl.type === "note-name-mixed") {
        setFeedback("", "分别选择音名和唱名（两个都必须选对）。");
      }
      return;
    }

    if (state.mode === "pattern") {
      if (resetPattern || state.patternAnswers.length >= currentPattern().steps.length) {
        if (!resetPattern) state.patternIndex += 1;
        state.patternAnswers = [];
      }
      const pattern = currentPattern();
      const index = state.patternAnswers.length;
      state.current = naturalNote(pattern.clef, pattern.steps[index]);
      els.questionTitle.textContent = `${pattern.title}：第 ${index + 1} 个位置`;
      els.rangeLabel.textContent = pattern.title;
      renderPatternProgress();
    } else if (state.mode === "ledger") {
      state.current = ledgerNoteForSettings();
    } else if (state.mode === "audio") {
      state.current = randomNoteForSettings();
    } else if (state.mode === "review") {
      if (!state.reviewQueue.length) state.reviewQueue = reviewNotes();
      state.current = state.reviewQueue.shift();
      els.rangeLabel.textContent = `剩余 ${state.reviewQueue.length} 题`;
    } else {
      state.current = randomNoteForSettings();
    }

    renderQuestionMeta();
    drawStaff(state.current);

    if (state.mode === "audio") {
      setFeedback("", "先播放音高，再点选音名和唱名。");
    }
    if (state.settings.autoplay && state.audioContext) {
      playCurrentNote();
    }
  }

  function subtitleForMode(mode) {
    if (mode === "challenge") return "从线间辨认开始，一关一关攻克，覆盖 90% 乐谱常用音。";
    if (mode === "pattern") return "把常见口诀拆成一个个位置，按顺序填熟。";
    if (mode === "ledger") return "专门练上下加线，不再只会背五线四间。";
    if (mode === "audio") return "把谱面位置、音名、唱名和声音绑在一起。";
    if (mode === "review") return "系统挑你容易错的位置，做 10 题短练。";
    return "随机抽查高音谱和低音谱，答完立即反馈。";
  }

  function renderQuestionMeta() {
    const note = state.current;
    els.clefLabel.textContent = CLEFS[note.clef].name;
    els.stepLabel.textContent = state.settings.hints ? notePositionName(note.staffStep) : "位置待判断";
  }

  function renderPatternProgress() {
    const pattern = currentPattern();
    const currentIndex = state.patternAnswers.length;
    els.patternProgress.innerHTML = "";
    pattern.steps.forEach((step, index) => {
      const slot = document.createElement("div");
      const note = naturalNote(pattern.clef, step);
      const answer = state.patternAnswers[index];
      slot.className = "pattern-slot";
      slot.classList.toggle("is-current", index === currentIndex);
      slot.classList.toggle("is-correct", Boolean(answer?.correct));
      slot.classList.toggle("is-wrong", Boolean(answer && !answer.correct));
      slot.textContent = answer ? note.label : notePositionName(step);
      els.patternProgress.append(slot);
    });
  }

  // ========== 画布绘制（支持双音符）==========
  function drawStaff(note, note2) {
    const canvas = els.canvas;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(320, Math.round(rect.width || 720));
    const height = Math.round(width / 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const lineGap = Math.max(18, Math.min(28, width / 24));
    const topY = height / 2 - lineGap * 2;
    const bottomY = topY + lineGap * 4;
    const left = width * 0.12;
    const right = width * 0.9;
    const noteX1 = note2 ? width * 0.52 : width * 0.61;
    const noteX2 = note2 ? width * 0.68 : width * 0.61;
    const yForStep = (step) => bottomY - step * (lineGap / 2);

    ctx.fillStyle = "#fffdf8";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "#20201d";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    for (let i = 0; i < 5; i += 1) {
      const y = topY + i * lineGap;
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();
    }

    drawClef(note.clef, left - width * 0.035, topY, lineGap);

    // 画第一个音符
    const noteY1 = yForStep(note.staffStep);
    const targetIsNote2 = state.targetIsNote2 && note2;
    drawLedgerLines(note.staffStep, noteX1, yForStep, lineGap);
    drawNoteHead(noteX1, noteY1, lineGap, targetIsNote2 ? "#6d6a62" : undefined);
    drawStem(noteX1, noteY1, lineGap, note.staffStep, targetIsNote2 ? "#6d6a62" : undefined);

    // 画第二个音符（如果有）
    if (note2) {
      const noteY2 = yForStep(note2.staffStep);
      drawLedgerLines(note2.staffStep, noteX2, yForStep, lineGap);
      drawNoteHead(noteX2, noteY2, lineGap, targetIsNote2 ? undefined : "#6d6a62");
      drawStem(noteX2, noteY2, lineGap, note2.staffStep, targetIsNote2 ? undefined : "#6d6a62");

      // 目标音上方画小三角标记
      if (targetIsNote2) {
        drawTargetMarker(noteX2, noteY2, lineGap);
      } else {
        drawTargetMarker(noteX1, noteY1, lineGap);
      }
    }

    ctx.fillStyle = "#6d6a62";
    ctx.font = `700 ${Math.max(12, width / 36)}px Inter, system-ui, sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(CLEFS[note.clef].short, left - width * 0.045, bottomY + lineGap * 1.65);
  }

  function drawClef(clef, x, topY, lineGap) {
    // 使用 Unicode 音乐符号字符 + Bravura 字体直接渲染谱号
    const g = lineGap;
    const fontSize = Math.round(g * 5.2);

    ctx.save();
    ctx.fillStyle = "#20201d";
    ctx.font = `${fontSize}px "Segoe UI Symbol", "Apple Symbols", "Bravura", "Noto Music", sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    const char = clef === "treble" ? '𝄞' : '𝄢';
    // 高音谱号 (𝄞)：对齐 G 线（topY + 3g = 第 2 线）
    // 低音谱号 (𝄢)：对齐 F 线（topY + g  = 第 4 线）
    const targetY = clef === "treble" ? topY + 3 * g : topY + g;
    // 偏移量按 lineGap 比例计算，保证不同分辨率设备位置一致
    const yOffset = clef === "treble"
      ? -fontSize * 0.38 - g * 2.0
      : -fontSize * 0.12 - g * 0.8;

    ctx.fillText(char, x - g * 0.25, targetY + yOffset);
    ctx.restore();
  }

  function drawLedgerLines(step, noteX, yForStep, lineGap) {
    ctx.strokeStyle = "#20201d";
    ctx.lineWidth = 2;
    const half = lineGap * 0.82;
    if (step >= 10) {
      for (let ledger = 10; ledger <= step; ledger += 2) {
        ctx.beginPath();
        ctx.moveTo(noteX - half, yForStep(ledger));
        ctx.lineTo(noteX + half, yForStep(ledger));
        ctx.stroke();
      }
    }
    if (step <= -2) {
      for (let ledger = -2; ledger >= step; ledger -= 2) {
        ctx.beginPath();
        ctx.moveTo(noteX - half, yForStep(ledger));
        ctx.lineTo(noteX + half, yForStep(ledger));
        ctx.stroke();
      }
    }
  }

  function drawNoteHead(x, y, lineGap, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.35);
    ctx.fillStyle = color || "#20201d";
    ctx.beginPath();
    ctx.ellipse(0, 0, lineGap * 0.52, lineGap * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawStem(x, y, lineGap, staffStep, color) {
    ctx.strokeStyle = color || "#20201d";
    ctx.lineWidth = Math.max(2, lineGap / 9);
    ctx.beginPath();
    if (staffStep >= 4) {
      ctx.moveTo(x - lineGap * 0.42, y);
      ctx.lineTo(x - lineGap * 0.42, y + lineGap * 3.2);
    } else {
      ctx.moveTo(x + lineGap * 0.42, y);
      ctx.lineTo(x + lineGap * 0.42, y - lineGap * 3.2);
    }
    ctx.stroke();
  }

  // 目标音标记（箭头）
  function drawTargetMarker(x, y, lineGap) {
    ctx.save();
    ctx.fillStyle = "#207c72";
    ctx.strokeStyle = "#207c72";
    ctx.lineWidth = 1.5;
    const arrowY = y - lineGap * 1.5;
    const arrowSize = lineGap * 0.3;
    ctx.beginPath();
    ctx.moveTo(x, arrowY + arrowSize);
    ctx.lineTo(x - arrowSize * 0.7, arrowY);
    ctx.lineTo(x + arrowSize * 0.7, arrowY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function playCurrentNote() {
    if (!state.current) return;
    try {
      if (!state.audioContext) {
        state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      const audio = state.audioContext;
      if (audio.state === "suspended") audio.resume();
      const now = audio.currentTime;
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 440 * 2 ** ((state.current.midi - 69) / 12);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.22, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.9);
    } catch {
      setFeedback("bad", "当前浏览器暂时不能播放声音，但识谱练习可以继续。");
    }
  }

  function showAnswer() {
    if (!state.current) return;
    state.answered = true;
    setButtonsDisabled(true);
    setFeedback("bad", `答案是 ${state.current.label}，位置是 ${notePositionName(state.current.staffStep)}。`);
  }

  function refreshStats() {
    const attempts = state.progress.attempts;
    const accuracy = attempts ? Math.round((state.progress.correct / attempts) * 100) : 0;
    const weak = Object.values(state.progress.notes).filter((stats) => {
      if (!stats.attempts) return false;
      return stats.attempts - stats.correct > 0 || stats.correct / stats.attempts < 0.75;
    }).length;
    els.stats.accuracy.textContent = `${accuracy}%`;
    els.stats.streak.textContent = String(state.progress.streak);
    els.stats.today.textContent = String(state.progress.daily.attempts);
    els.stats.weak.textContent = String(weak);
  }

  function syncSettingsFromDom() {
    state.settings.clef = els.clefSetting.value;
    state.settings.difficulty = els.difficultySetting.value;
    state.settings.ledgerDirection = els.ledgerDirection.value;
    state.settings.ledgerKind = els.ledgerKind.value;
    state.settings.autoplay = els.autoplaySetting.checked;
    state.settings.hints = els.hintSetting.checked;
    state.settings.useWeak = els.weakSetting.checked;
  }

  function attachEvents() {
    els.tabs.forEach((tab) => {
      tab.addEventListener("click", () => setMode(tab.dataset.mode));
    });
    [
      els.clefSetting,
      els.difficultySetting,
      els.ledgerDirection,
      els.ledgerKind,
      els.autoplaySetting,
      els.hintSetting,
      els.weakSetting,
    ].forEach((control) => {
      control.addEventListener("change", () => {
        syncSettingsFromDom();
        nextQuestion(true);
      });
    });
    els.playNote.addEventListener("click", playCurrentNote);
    els.nextQuestion.addEventListener("click", () => nextQuestion(false));
    els.showAnswer.addEventListener("click", showAnswer);
    els.resetProgress.addEventListener("click", () => {
      const confirmed = window.confirm("确定要清空所有练习统计吗？");
      if (!confirmed) return;
      state.progress = defaultProgress();
      state.patternIndex = 0;
      state.patternAnswers = [];
      state.reviewQueue = [];
      resetChallengeToLevel1();
      saveProgress();
      refreshStats();
      nextQuestion(true);
      setFeedback("good", "所有练习统计已清空，从头开始。");
    });
    els.resetPattern.addEventListener("click", () => {
      const confirmed = window.confirm("确定要完全重置规律练习吗？将从头开始。");
      if (!confirmed) return;
      state.patternIndex = 0;
      state.patternAnswers = [];
      nextQuestion(true);
      setFeedback("good", "已完全重置，从第一组规律从头开始。");
    });

    // DEBUG: 测试用关卡选择器，上线前删除 ↓
    if (els.debugLevelSelect) {
      els.debugLevelSelect.addEventListener("change", () => {
        debugJumpToLevel(Number(els.debugLevelSelect.value));
      });
    }
    // DEBUG: 测试用关卡选择器，上线前删除 ↑

    // 闯关：过关弹窗按钮
    els.modalNextLevel.addEventListener("click", goToNextLevel);
    // 点击遮罩关闭弹窗（但不自动进入下一关）
    els.levelCompleteModal.addEventListener("click", (e) => {
      if (e.target === els.levelCompleteModal) hideModal();
    });

    window.addEventListener("resize", () => drawStaff(state.current, state.currentNote2));
  }

  function runMappingSelfCheck() {
    const trebleLines = [0, 2, 4, 6, 8].map((step) => naturalNote("treble", step).letter).join("");
    const trebleSpaces = [1, 3, 5, 7].map((step) => naturalNote("treble", step).letter).join("");
    const bassLines = [0, 2, 4, 6, 8].map((step) => naturalNote("bass", step).letter).join("");
    const bassSpaces = [1, 3, 5, 7].map((step) => naturalNote("bass", step).letter).join("");
    const checks = [
      trebleLines === "EGBDF",
      trebleSpaces === "FACE",
      bassLines === "GBDFA",
      bassSpaces === "ACEG",
      naturalNote("treble", -2).letter === "C",
      naturalNote("treble", -2).midi === 60,
      naturalNote("bass", 10).letter === "B",
      naturalNote("bass", 10).midi === 59,
    ];
    return {
      passed: checks.every(Boolean),
      trebleLines,
      trebleSpaces,
      bassLines,
      bassSpaces,
    };
  }

  function init() {
    setupAnswerButtons();
    attachEvents();
    refreshStats();
    // 每次刷新页面从第一关重新开始（符合用户要求）
    state.challenge.currentLevel = 1;
    state.challenge.levelAttempts = 0;
    state.challenge.levelStartTime = null;
    state.challenge.levelQuestions = [];
    state.challenge.levelCurrentIndex = 0;
    state.challenge.completed = false;
    state.challengeLetterAnswer = null;
    state.challengeSolfegeAnswer = null;
    state.challengeRelationAnswer = null;
    state.progress.challenge = {
      currentLevel: 1, levelAttempts: 0, levelStartTime: null,
      levelQuestions: [], levelCurrentIndex: 0, completed: false,
    };
    saveProgress();
    const lastMode = MODES[state.progress.lastMode] ? state.progress.lastMode : "random";
    setMode(lastMode);
    window.MusicTrainer = {
      naturalNote,
      runMappingSelfCheck,
      getState: () => JSON.parse(JSON.stringify({
        mode: state.mode,
        current: state.current,
        progress: state.progress,
        settings: state.settings,
      })),
    };
  }

  init();
})();
