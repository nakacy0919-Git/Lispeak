class LispeakApp {
  constructor() {
    this.data = [];
    this.visualIndex = 0;
    this.playQueue = [];
    this.currentIndex = 0;
    
    this.speechHandler = new SpeechHandler(); 
    this.currentScript = ""; 
    this.currentLevel = "basic";
    this.isFinished = false;
    this.correctAnswers = 0;
    this.practiceEpoch = 0;
    this.scoreAnimationTimeout = null;
    this.scoreAnimationInterval = null; 

    this.correctSound = new Audio('assets/audio/correct.mp3');
    this.incorrectSound = new Audio('assets/audio/incorrect.mp3');
    this.cheerSound = new Audio('assets/audio/correct.mp3'); 

    // DOM Elements
    this.homeScreen = document.getElementById('home-screen');
    this.startBtn = document.getElementById('start-btn');
    
    this.visualListScreen = document.getElementById('visual-list-screen');
    this.visualGrid = document.getElementById('visual-grid');
    this.backToHomeBtn = document.getElementById('back-to-home-btn');

    this.levelSelectScreen = document.getElementById('level-select-screen');
    this.levelSelectImage = document.getElementById('level-select-image');
    this.levelSelectBtns = document.querySelectorAll('.level-select-btn');
    this.backToListBtn = document.getElementById('back-to-list-btn');

    this.appContainer = document.getElementById('app-container');
    this.imageEl = document.getElementById('question-image');
    this.audioEl = document.getElementById('question-audio');
    this.choiceBtns = document.querySelectorAll('.choice-btn');
    
    // Custom Audio Player Elements
    this.playPauseBtn = document.getElementById('play-pause-btn');
    this.audioProgressContainer = document.getElementById('audio-progress-container');
    this.audioProgressBar = document.getElementById('audio-progress-bar');
    this.audioTimeDisplay = document.getElementById('audio-time-display');

    // Feedback Section Elements
    this.feedbackSec = document.getElementById('feedback-section');
    this.resultTitle = document.getElementById('result-title');
    this.correctNumberDisplay = document.getElementById('correct-number');
    this.scriptText = document.getElementById('script-text');
    this.scriptTranslation = document.getElementById('script-translation'); // 和訳用
    
    this.toggleExplanationBtn = document.getElementById('toggle-explanation-btn');
    this.explanationWrapper = document.getElementById('explanation-wrapper');
    this.explanationText = document.getElementById('explanation-text');
    this.feedbackText = document.getElementById('feedback-text');
    this.vocabularyContainer = document.getElementById('vocabulary-container');
    this.vocabularyList = document.getElementById('vocabulary-list');
    
    this.tabBtns = document.querySelectorAll('.tab-btn');
    this.tabReading = document.getElementById('tab-reading');
    this.tabShadowing = document.getElementById('tab-shadowing');
    
    this.readingScriptEl = document.getElementById('reading-script');
    this.readingMicBtn = document.getElementById('reading-mic-btn');
    this.readingStopBtn = document.getElementById('reading-stop-btn');
    this.scoreContainer = document.getElementById('score-container');
    this.accuracyGauge = document.getElementById('accuracy-gauge');
    this.accuracyScore = document.getElementById('accuracy-score');
    
    this.shadowingStartBtn = document.getElementById('shadowing-start-btn');
    this.shadowingStopBtn = document.getElementById('shadowing-stop-btn');
    this.shadowingModelText = document.getElementById('shadowing-model-text');
    this.shadowingUserText = document.getElementById('shadowing-user-text');
    this.readingStatus = document.getElementById('reading-status');
    this.shadowingStatus = document.getElementById('shadowing-status');
    this.finishMessage = document.getElementById('finish-message');
    this.correctAnswerBlock = document.querySelector('.correct-answer-display');
    this.scriptContainer = document.getElementById('script-container');
    this.practiceSection = document.getElementById('practice-section');
    
    this.nextBtn = document.getElementById('next-btn');
    this.progressEl = document.getElementById('progress');
    this.progressHeader = document.getElementById('progress');

    this.bindEvents();
  }

  init() {}

  bindEvents() {
    this.startBtn.addEventListener('click', () => this.loadDataAndStart());
    this.backToHomeBtn.addEventListener('click', () => this.showHomeScreen());
    this.backToListBtn.addEventListener('click', () => this.showVisualList());

    this.levelSelectBtns.forEach(btn => btn.addEventListener('click', (e) => this.startQuestionSet(e.target.dataset.level)));
    this.choiceBtns.forEach(btn => btn.addEventListener('click', (e) => this.handleAnswer(e)));
    this.nextBtn.addEventListener('click', () => {
      this.stopAllAudioAndMic();
      if (this.isFinished) this.showVisualList();
      else this.nextQuestion();
    });
    
    this.toggleExplanationBtn.addEventListener('click', () => {
      this.explanationWrapper.classList.toggle('hidden');
      this.toggleExplanationBtn.textContent = this.explanationWrapper.classList.contains('hidden') ? '💡 解説・語彙を表示 ▾' : '💡 解説・語彙を隠す ▴';
    });

    this.tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });

    this.readingMicBtn.addEventListener('click', () => this.startReadingPractice());
    this.readingStopBtn.addEventListener('click', () => this.stopReadingAndCalculateScore());

    this.shadowingStartBtn.addEventListener('click', () => this.startShadowingPractice());
    this.shadowingStopBtn.addEventListener('click', () => this.stopShadowingPractice());

    // --- Custom Audio Player Events ---
    this.playPauseBtn.addEventListener('click', () => this.toggleAudio());
    this.audioEl.addEventListener('timeupdate', () => this.updateAudioProgress());
    this.audioEl.addEventListener('loadedmetadata', () => this.updateAudioProgress());
    this.audioEl.addEventListener('ended', () => { this.playPauseBtn.textContent = '▶'; });
    this.audioProgressContainer.addEventListener('click', (e) => this.seekAudio(e));
  }

  async loadDataAndStart() {
    if (this.data.length === 0) this.data = await DataLoader.loadQuestions();
    if (this.data && this.data.length > 0) { 
      this.showVisualList(); 
    }
  }

  showHomeScreen() {
    this.stopAllAudioAndMic();
    this.visualListScreen.classList.add('hidden');
    this.homeScreen.classList.remove('hidden');
  }

  showVisualList() {
    this.stopAllAudioAndMic();
    this.isFinished = false;
    this.homeScreen.classList.add('hidden');
    this.levelSelectScreen.classList.add('hidden');
    this.appContainer.classList.add('hidden');
    this.progressHeader.classList.add('hidden');
    this.visualListScreen.classList.remove('hidden');

    this.renderVisualList();
  }

  renderVisualList() {
    this.visualGrid.innerHTML = '';
    
    this.data.forEach((visual, index) => {
      const card = document.createElement('div');
      card.className = 'visual-card';
      
      const img = document.createElement('img');
      img.src = visual.image;
      img.onerror = () => img.src = 'https://via.placeholder.com/300x200.png?text=No+Image';
      
      const info = document.createElement('div');
      info.className = 'visual-card-info';
      
      const title = document.createElement('div');
      title.className = 'visual-card-title';
      title.textContent = visual.title || `問題セット ${index + 1}`;
      
      info.appendChild(title);
      card.appendChild(img);
      card.appendChild(info);
      
      card.addEventListener('click', () => {
        this.visualIndex = index;
        this.showLevelSelection();
      });
      
      this.visualGrid.appendChild(card);
    });
  }

  showLevelSelection() {
    this.visualListScreen.classList.add('hidden');
    this.levelSelectScreen.classList.remove('hidden');

    const currentVisual = this.data[this.visualIndex];
    this.levelSelectImage.src = currentVisual.image;
    this.levelSelectImage.onerror = () => this.levelSelectImage.src = 'https://via.placeholder.com/600x450.png?text=Image+Not+Found';
  }

  startQuestionSet(level) {
    this.currentLevel = level;
    this.isFinished = false;
    this.correctAnswers = 0;
    this.levelSelectScreen.classList.add('hidden');
    this.appContainer.classList.remove('hidden');
    this.progressHeader.classList.remove('hidden');

    const currentVisual = this.data[this.visualIndex];
    this.playQueue = this.shuffleArray([...currentVisual.questions]);
    this.currentIndex = 0;
    
    document.getElementById('visual-section').style.display = 'block';
    document.getElementById('audio-section').style.display = 'flex';
    document.getElementById('answer-section').style.display = 'block';
    this.nextBtn.textContent = '次の問題へ';
    
    this.loadCurrentQuestion();
  }

  shuffleArray(array) {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  }

  // --- Audio Player Logic ---
  toggleAudio() {
    if (this.audioEl.paused) {
      this.audioEl.play().then(() => {
        this.playPauseBtn.textContent = '⏸';
      }).catch(() => {
        this.playPauseBtn.textContent = '▶';
        this.audioTimeDisplay.textContent = '音声を再生できません';
      });
    } else {
      this.audioEl.pause();
      this.playPauseBtn.textContent = '▶';
    }
  }

  updateAudioProgress() {
    const current = this.audioEl.currentTime;
    const duration = this.audioEl.duration || 0;
    
    if (duration > 0) {
      const progressPercent = (current / duration) * 100;
      this.audioProgressBar.style.width = `${progressPercent}%`;
    } else {
      this.audioProgressBar.style.width = `0%`;
    }
    
    this.audioTimeDisplay.textContent = `${this.formatTime(current)} / ${this.formatTime(duration)}`;
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  }

  seekAudio(e) {
    const rect = this.audioProgressContainer.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const duration = this.audioEl.duration;
    if (duration) {
       this.audioEl.currentTime = (clickX / width) * duration;
    }
  }

  loadCurrentQuestion() {
    this.isFinished = false;
    this.appContainer.classList.remove('is-finished');
    this.finishMessage.classList.add('hidden');
    this.correctAnswerBlock.classList.remove('hidden');
    this.scriptContainer.classList.remove('hidden');
    this.toggleExplanationBtn.classList.remove('hidden');
    this.practiceSection.classList.remove('hidden');
    this.nextBtn.textContent = '次の問題へ';
    this.readingMicBtn.textContent = '🎙️ 音読を始める';
    this.shadowingStartBtn.textContent = '▶️ モデル音声 ＋ 録音スタート';
    this.setPracticeStatus('reading', '');
    this.setPracticeStatus('shadowing', '');
    const question = this.playQueue[this.currentIndex];
    const levelData = question.levels[this.currentLevel] || question.levels['basic'];
    this.currentScript = levelData.script;

    this.appContainer.classList.remove('show-feedback');
    this.feedbackSec.classList.add('hidden');
    this.explanationWrapper.classList.add('hidden');
    this.toggleExplanationBtn.textContent = '💡 解説・語彙を表示 ▾';
    
    this.choiceBtns.forEach(btn => {
      btn.disabled = false; btn.style.backgroundColor = ''; btn.style.color = ''; btn.style.border = '2px solid var(--primary-color)';
    });

    this.imageEl.src = this.data[this.visualIndex].image;
    
    // オーディオソースのセットアップとUIリセット
    this.audioEl.src = levelData.audio;
    this.playPauseBtn.textContent = '▶';
    this.audioProgressBar.style.width = '0%';
    this.audioTimeDisplay.textContent = '0:00 / 0:00';

    this.updateProgress();
    
    this.scoreContainer.classList.add('hidden');
    this.switchTab('reading'); 
  }

  handleAnswer(e) {
    const selectedBtn = e.target;
    const selectedChoice = parseInt(selectedBtn.dataset.choice);
    const question = this.playQueue[this.currentIndex];
    const levelData = question.levels[this.currentLevel] || question.levels['basic'];
    const isCorrect = selectedChoice === question.answer;
    if (isCorrect) this.correctAnswers++;

    this.choiceBtns.forEach(btn => btn.disabled = true);

    if (isCorrect) {
      this.correctSound.currentTime = 0; this.correctSound.play().catch(e=>console.log(e));
      selectedBtn.style.backgroundColor = 'var(--correct-color)'; selectedBtn.style.borderColor = 'var(--correct-color)';
    } else {
      this.incorrectSound.currentTime = 0; this.incorrectSound.play().catch(e=>console.log(e));
      selectedBtn.style.backgroundColor = 'var(--incorrect-color)'; selectedBtn.style.borderColor = 'var(--incorrect-color)';
      const correctBtn = document.querySelector(`.choice-btn[data-choice="${question.answer}"]`);
      if(correctBtn) correctBtn.style.border = '4px solid var(--correct-color)';
    }
    selectedBtn.style.color = 'white';

    this.resultTitle.textContent = isCorrect ? '🎉 正解！' : '❌ 不正解...';
    this.resultTitle.style.color = isCorrect ? 'var(--correct-color)' : 'var(--incorrect-color)';
    this.correctNumberDisplay.textContent = `①②③④`[question.answer - 1]; 
    this.scriptText.textContent = this.currentScript; 
    
    // 和訳の表示 (JSONに translation がない場合は空欄)
    this.scriptTranslation.textContent = levelData.translationJa || "";

    if (levelData.explanation) {
      this.explanationText.textContent = levelData.explanation;
    } else {
      this.explanationText.textContent = "解説データがありません。";
    }
    this.feedbackText.textContent = question.feedback[selectedChoice] || "";

    if (levelData.vocabulary && levelData.vocabulary.length > 0) {
      const entries = levelData.vocabulary.map(v => {
        const item = document.createElement('li');
        const term = document.createElement('strong');
        term.textContent = v.word;
        item.append(term, document.createTextNode(' : ' + v.meaning));
        return item;
      });
      this.vocabularyList.replaceChildren(...entries);
      this.vocabularyContainer.classList.remove('hidden');
    } else {
      this.vocabularyContainer.classList.add('hidden');
    }

    this.setupReadingScript();
    this.shadowingModelText.textContent = this.currentScript;

    this.appContainer.classList.add('show-feedback');
    this.feedbackSec.classList.remove('hidden');
    
    if (window.innerWidth < 768) this.feedbackSec.scrollIntoView({ behavior: 'smooth' });
  }

  switchTab(tabName) {
    this.stopAllAudioAndMic();
    this.tabBtns.forEach(btn => {
      if(btn.dataset.tab === tabName) btn.classList.add('active');
      else btn.classList.remove('active');
    });
    
    if(tabName === 'reading') {
      this.tabReading.classList.remove('hidden');
      this.tabShadowing.classList.add('hidden');
    } else {
      this.tabReading.classList.add('hidden');
      this.tabShadowing.classList.remove('hidden');
      this.shadowingUserText.textContent = "...";
    }
  }

  setupReadingScript() {
    const fragments = this.currentScript.split(/([A-Za-z0-9]+(?:['’][A-Za-z0-9]+)*)/g);
    this.readingScriptEl.replaceChildren(...fragments.flatMap((part, index) => {
      if (!part) return [];
      if (index % 2 === 1) {
        const span = document.createElement('span');
        span.textContent = part;
        return [span];
      }
      return [document.createTextNode(part)];
    }));
  }

  setPracticeStatus(mode, message) {
    const el = mode === 'reading' ? this.readingStatus : this.shadowingStatus;
    el.textContent = message;
    el.classList.toggle('hidden', !message);
  }

  showSpeechError(mode, error) {
    const messages = {
      'not-allowed': 'マイクを許可してください。ブラウザのマイク設定を確認してください。',
      'service-not-allowed': '音声認識が許可されていません。',
      'audio-capture': 'マイクが見つかりません。端末設定を確認してください。',
      'no-speech': '音声を認識できませんでした。再度お試しください。',
      'network': '音声認識サービスに接続できません。通信状態を確認してください。',
      'unsupported': '音声認識に対応したブラウザで開いてください。',
      'audio-failed': 'モデル音声を再生できません。'
    };
    this.setPracticeStatus(mode, messages[error] || '音声認識を開始できません。もう一度お試しください。');
  }

  onRecognitionEnd(mode, state) {
    if (!state.unexpected) return;
    if (!state.error) this.setPracticeStatus(mode, '音声認識が終了しました。もう一度お試しください。');
    if (mode === 'reading') {
      this.readingStopBtn.classList.add('hidden');
      this.readingStopBtn.classList.remove('recording');
      this.readingMicBtn.classList.remove('hidden');
    } else {
      this.audioEl.pause();
      this.audioEl.onended = null;
      this.shadowingStopBtn.classList.add('hidden');
      this.shadowingStopBtn.classList.remove('recording');
      this.shadowingStartBtn.classList.remove('hidden');
    }
  }

  renderReadingMatches(transcript) {
    const score = SpeakingScorer.compare(this.currentScript, transcript);
    const matched = new Set(score.matchedIndices);
    this.readingScriptEl.querySelectorAll('span').forEach((span, index) => {
      span.classList.toggle('word-correct', matched.has(index));
    });
    return score;
  }

  startReadingPractice() {
    if (!this.speechHandler.recognition) return this.showSpeechError('reading', 'unsupported');
    this.practiceEpoch++;
    this.clearScoreAnimation();
    this.scoreContainer.classList.add('hidden');
    this.accuracyGauge.style.strokeDashoffset = '125.6';
    this.readingScriptEl.querySelectorAll('span').forEach(span => span.classList.remove('word-correct'));
    this.setPracticeStatus('reading', '');
    const started = this.speechHandler.start(
      transcript => this.renderReadingMatches(transcript),
      error => this.showSpeechError('reading', error),
      state => this.onRecognitionEnd('reading', state)
    );
    if (!started) {
      if (!this.readingStatus.textContent) this.showSpeechError('reading', 'start-failed');
      return;
    }
    this.readingMicBtn.classList.add('hidden');
    this.readingStopBtn.classList.remove('hidden');
    this.readingStopBtn.classList.add('recording');
  }

  async stopReadingAndCalculateScore() {
    const epoch = this.practiceEpoch;
    this.readingStopBtn.disabled = true;
    const transcript = await this.speechHandler.stop();
    if (epoch !== this.practiceEpoch) return;
    this.readingStopBtn.disabled = false;
    this.readingStopBtn.classList.remove('recording');
    this.readingStopBtn.classList.add('hidden');
    this.readingMicBtn.classList.remove('hidden');
    this.readingMicBtn.textContent = '🔄 もう一度音読する';
    const score = this.renderReadingMatches(transcript);
    this.setPracticeStatus('reading', '単語認識の一致率です。発音の品質自体は測定していません。');
    this.animateAccuracy(score.accuracy);
  }

  clearScoreAnimation() {
    if (this.scoreAnimationTimeout !== null) clearTimeout(this.scoreAnimationTimeout);
    if (this.scoreAnimationInterval !== null) clearInterval(this.scoreAnimationInterval);
    this.scoreAnimationTimeout = null;
    this.scoreAnimationInterval = null;
  }

  animateAccuracy(accuracy) {
    this.clearScoreAnimation();
    this.scoreContainer.classList.remove('hidden');
    this.accuracyScore.textContent = '0';
    this.accuracyGauge.style.strokeDashoffset = '125.6';
    const offset = 125.6 * (1 - accuracy / 100);
    this.scoreAnimationTimeout = setTimeout(() => {
      this.accuracyGauge.style.strokeDashoffset = String(offset);
      let value = 0;
      this.scoreAnimationInterval = setInterval(() => {
        value = Math.min(accuracy, value + 2);
        this.accuracyScore.textContent = String(value);
        if (value >= accuracy) {
          this.clearScoreAnimation();
          if (accuracy >= 80) this.triggerCelebration();
        }
      }, 20);
    }, 100);
  }

  triggerCelebration() {
    this.cheerSound.currentTime = 0;
    this.cheerSound.play().catch(e=>console.log(e));
    
    if(typeof confetti === 'function') {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  }

  startShadowingPractice() {
    if (!this.speechHandler.recognition) return this.showSpeechError('shadowing', 'unsupported');
    this.practiceEpoch++;
    this.setPracticeStatus('shadowing', '');
    this.shadowingUserText.textContent = '録音中...';
    const started = this.speechHandler.start(
      transcript => { this.shadowingUserText.textContent = transcript || '録音中...'; },
      error => this.showSpeechError('shadowing', error),
      state => this.onRecognitionEnd('shadowing', state)
    );
    if (!started) {
      if (!this.shadowingStatus.textContent) this.showSpeechError('shadowing', 'start-failed');
      return;
    }
    this.shadowingStartBtn.classList.add('hidden');
    this.shadowingStopBtn.classList.remove('hidden');
    this.shadowingStopBtn.classList.add('recording');
    this.audioEl.currentTime = 0;
    this.audioEl.onended = () => {
      if (this.speechHandler.isRecording) this.stopShadowingPractice();
    };
    this.audioEl.play().then(() => {
      this.playPauseBtn.textContent = '⏸';
    }).catch(() => {
      this.speechHandler.abort();
      this.audioEl.onended = null;
      this.shadowingStopBtn.classList.add('hidden');
      this.shadowingStopBtn.classList.remove('recording');
      this.shadowingStartBtn.classList.remove('hidden');
      this.showSpeechError('shadowing', 'audio-failed');
    });
  }

  async stopShadowingPractice() {
    const epoch = this.practiceEpoch;
    this.shadowingStopBtn.disabled = true;
    const transcript = await this.speechHandler.stop();
    if (epoch !== this.practiceEpoch) return;
    this.shadowingStopBtn.disabled = false;
    this.audioEl.pause();
    this.audioEl.onended = null;
    this.playPauseBtn.textContent = '▶';
    this.shadowingStopBtn.classList.remove('recording');
    this.shadowingStopBtn.classList.add('hidden');
    this.shadowingStartBtn.classList.remove('hidden');
    this.shadowingStartBtn.textContent = '🔄 もう一度Shadowing';
    this.shadowingUserText.textContent = transcript || '音声を認識できませんでした。';
  }

  stopAllAudioAndMic() {
    this.practiceEpoch++;
    this.clearScoreAnimation();
    this.speechHandler.abort();
    this.audioEl.pause();
    this.audioEl.onended = null;
    this.playPauseBtn.textContent = '▶';
    this.readingStopBtn.disabled = false;
    this.shadowingStopBtn.disabled = false;
    this.readingStopBtn.classList.add('hidden');
    this.readingStopBtn.classList.remove('recording');
    this.readingMicBtn.classList.remove('hidden');
    this.shadowingStopBtn.classList.add('hidden');
    this.shadowingStopBtn.classList.remove('recording');
    this.shadowingStartBtn.classList.remove('hidden');
  }

  nextQuestion() {
    if (this.currentIndex < this.playQueue.length - 1) {
      this.currentIndex++; 
      this.loadCurrentQuestion();
    } else {
      this.showFinishScreen();
    }
  }

  updateProgress() { this.progressEl.textContent = `Q ${this.currentIndex + 1} / ${this.playQueue.length}`; }

  showFinishScreen() {
    this.appContainer.classList.remove('show-feedback');
    document.getElementById('visual-section').style.display = 'none';
    document.getElementById('audio-section').style.display = 'none';
    document.getElementById('answer-section').style.display = 'none';
    
    this.resultTitle.textContent = '🎊 この問題セットをクリアしました！';
    this.resultTitle.style.color = 'var(--primary-color)';
    this.feedbackText.textContent = '素晴らしい集中力です！一覧から次の問題を選んでください。';
    
    this.feedbackSec.classList.remove('hidden');
    
    this.nextBtn.textContent = '🔙 問題一覧に戻る';
    this.nextBtn.onclick = () => {
      this.feedbackSec.classList.add('hidden');
      this.showVisualList();
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new LispeakApp();
  app.init();
});