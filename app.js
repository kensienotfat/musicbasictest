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
  };
  const PATTERNS = [
    { id: "treble-lines", clef: "treble", title: "高音谱五条线", steps: [0, 2, 4, 6, 8] },
    { id: "treble-spaces", clef: "treble", title: "高音谱四个间", steps: [1, 3, 5, 7] },
    { id: "bass-lines", clef: "bass", title: "低音谱五条线", steps: [0, 2, 4, 6, 8] },
    { id: "bass-spaces", clef: "bass", title: "低音谱四个间", steps: [1, 3, 5, 7] },
    { id: "treble-ledger-above", clef: "treble", title: "高音谱上加四线", steps: [10, 12, 14, 16] },
    { id: "treble-ledger-below", clef: "treble", title: "高音谱下加四线", steps: [-2, -4, -6, -8] },
    { id: "bass-ledger-above", clef: "bass", title: "低音谱上加四线", steps: [10, 12, 14, 16] },
    { id: "bass-ledger-below", clef: "bass", title: "低音谱下加四线", steps: [-2, -4, -6, -8] },
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
  };
  const ctx = els.canvas.getContext("2d");

  const state = {
    mode: "random",
    current: null,
    selectedLetter: null,
    selectedSolfege: null,
    answered: false,
    patternIndex: 0,
    patternAnswers: [],
    reviewQueue: [],
    audioContext: null,
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
    if (kind === "letter") state.selectedLetter = value;
    if (kind === "solfege") state.selectedSolfege = value;
    updateAnswerSelection();
    if (state.selectedLetter && state.selectedSolfege) checkAnswer();
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
    updateAnswerSelection();
    setButtonsDisabled(false);
    setFeedback("", state.settings.hints ? "选择一个音名和一个唱名后自动校验。" : "选择音名和唱名。");
  }

  function setMode(mode) {
    state.mode = mode;
    els.tabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.mode === mode));
    els.patternProgress.hidden = mode !== "pattern";
    state.reviewQueue = mode === "review" ? reviewNotes() : state.reviewQueue;
    saveProgress();
    nextQuestion(true);
  }

  function nextQuestion(resetPattern = false) {
    clearQuestionState();
    const mode = MODES[state.mode];
    els.questionType.textContent = mode.type;
    els.questionTitle.textContent = mode.title;
    els.rangeLabel.textContent = mode.range;
    els.modeSubtitle.textContent = subtitleForMode(state.mode);

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

  function drawStaff(note) {
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
    const left = width * 0.14;
    const right = width * 0.9;
    const noteX = width * 0.61;
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

    drawClef(note.clef, left - width * 0.045, topY, lineGap);

    const noteY = yForStep(note.staffStep);
    drawLedgerLines(note.staffStep, noteX, yForStep, lineGap);
    drawNoteHead(noteX, noteY, lineGap);
    drawStem(noteX, noteY, lineGap, note.staffStep);

    ctx.fillStyle = "#6d6a62";
    ctx.font = `700 ${Math.max(12, width / 36)}px Inter, system-ui, sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(CLEFS[note.clef].short, left - width * 0.055, bottomY + lineGap * 1.65);
  }

  function drawClef(clef, x, topY, lineGap) {
    ctx.save();
    ctx.strokeStyle = "#20201d";
    ctx.fillStyle = "#20201d";
    ctx.lineWidth = Math.max(2.2, lineGap / 7);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (clef === "treble") {
      const cx = x + lineGap * 0.7;
      const cy = topY + lineGap * 2.2;
      ctx.beginPath();
      ctx.moveTo(cx, topY + lineGap * 5.1);
      ctx.bezierCurveTo(cx - lineGap * 0.2, topY + lineGap * 2.7, cx + lineGap * 1.15, topY + lineGap * 1.8, cx + lineGap * 0.28, topY + lineGap * 1.15);
      ctx.bezierCurveTo(cx - lineGap * 0.7, topY + lineGap * 0.45, cx - lineGap * 1.0, topY + lineGap * 2.3, cx + lineGap * 0.15, topY + lineGap * 2.75);
      ctx.bezierCurveTo(cx + lineGap * 1.3, topY + lineGap * 3.2, cx + lineGap * 1.1, topY + lineGap * 4.25, cx + lineGap * 0.08, topY + lineGap * 4.05);
      ctx.bezierCurveTo(cx - lineGap * 0.85, topY + lineGap * 3.86, cx - lineGap * 0.58, topY + lineGap * 2.9, cx + lineGap * 0.2, cy);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + lineGap * 0.05, topY + lineGap * 2.95, lineGap * 0.18, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const cx = x + lineGap * 0.5;
      const cy = topY + lineGap * 1.55;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.bezierCurveTo(cx + lineGap * 1.05, cy - lineGap * 0.3, cx + lineGap * 1.18, cy + lineGap * 1.0, cx + lineGap * 0.14, cy + lineGap * 2.1);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx - lineGap * 0.05, cy, lineGap * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + lineGap * 1.25, cy + lineGap * 0.55, lineGap * 0.09, 0, Math.PI * 2);
      ctx.arc(cx + lineGap * 1.25, cy + lineGap * 1.05, lineGap * 0.09, 0, Math.PI * 2);
      ctx.fill();
    }
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

  function drawNoteHead(x, y, lineGap) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.35);
    ctx.fillStyle = "#20201d";
    ctx.beginPath();
    ctx.ellipse(0, 0, lineGap * 0.52, lineGap * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawStem(x, y, lineGap, staffStep) {
    ctx.strokeStyle = "#20201d";
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
      saveProgress();
      refreshStats();
      nextQuestion(true);
    });
    window.addEventListener("resize", () => drawStaff(state.current));
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
