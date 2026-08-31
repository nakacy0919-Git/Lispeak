class LispeakApp {
  constructor() {
    this.data = [];
    this.visualIndex = 0;
    this.playQueue = [];
    this.currentIndex = 0;
    
    this.speechHandler = new SpeechHandler(); 
    this.currentScript = ""; 
    this.currentLevel = "basic"; 

    this.correctSound = new Audio('assets/audio/correct.mp3');
    this.incorrectSound = new Audio('assets/audio/incorrect.mp3');
    this.cheerSound = new Audio('assets/audio/correct.mp3'); 

    // DOM Elements
    this.homeScreen = document.getElementById('home-screen');
    this.startBtn = document.getElementById('start-btn');
    
    // NEW: List Screen
    this.visualListScreen = document.getElementById('visual-list-screen');
    this.visualGrid = document.getElementById('visual-grid');
    this.backToHomeBtn = document.getElementById('back-to-home-btn');

    // Level Select Screen
    this.levelSelectScreen = document.getElementById('level-select-screen');
    this.levelSelectImage = document.getElementById('level-select-image');
    this.levelSelectBtns = document.querySelectorAll('.level-select-btn');
    this.backToListBtn = document.getElementById('back-to-list-btn');

    this.appContainer = document.getElementById('app-container');
    this.imageEl = document.getElementById('question-image');
    this.audioEl = document.getElementById('question-audio');
    this.choiceBtns = document.querySelectorAll('.choice-btn');
    
    // Feedback Section Elements
    this.feedbackSec = document.getElementById('feedback-section');
    this.resultTitle = document.getElementById('result-title');
    this.correctNumberDisplay = document.getElementById('correct-number');
    this.scriptText = document.getElementById('script-text');
    
    this.toggleExplanationBtn = document.getElementById('toggle-explanation-btn');
    this.explanationWrapper = document.getElementById('explanation-wrapper');
    this.explanationText = document.getElementById('explanation-text');
    this.feedbackText = document.getElementById('feedback-text');
    this.vocabularyContainer = document.getElementById('vocabulary-container');
    this.vocabularyList = document.getElementById('vocabulary-list');
    
    // Tab Elements
    this.tabBtns = document.querySelectorAll('.tab-btn');
    this.tabReading = document.getElementById('tab-reading');
    this.tabShadowing = document.getElementById('tab-shadowing');
    
    // Reading Practice Elements
    this.readingScriptEl = document.getElementById('reading-script');
    this.readingMicBtn = document.getElementById('reading-mic-btn');
    this.readingStopBtn = document.getElementById('reading-stop-btn');
    this.scoreContainer = document.getElementById('score-container');
    this.accuracyGauge = document.getElementById('accuracy-gauge');
    this.accuracyScore = document.getElementById('accuracy-score');
    
    // Shadowing Elements
    this.shadowingStartBtn = document.getElementById('shadowing-start-btn');
    this.shadowingStopBtn = document.getElementById('shadowing-stop-btn');
    this.shadowingModelText = document.getElementById('shadowing-model-text');
    this.shadowingUserText = document.getElementById('shadowing-user-text');
    
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
    this.nextBtn.addEventListener('click', () => { this.stopAllAudioAndMic(); this.nextQuestion(); });
    
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
  }

  async loadDataAndStart() {
    if (this.data.length === 0) this.data = await DataLoader.loadQuestions();
    if (this.data && this.data.length > 0) { 
      this.showVisualList(); 
    }
  }

  // --- NEW: 画面遷移コントロール ---
  showHomeScreen() {
    this.visualListScreen.classList.add('hidden');
    this.homeScreen.classList.remove('hidden');
  }

  showVisualList() {
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
      
      // カードクリックでレベル選択へ
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
    this.levelSelectScreen.classList.add('hidden');
    this.appContainer.classList.remove('hidden');
    this.progressHeader.classList.remove('hidden');

    const currentVisual = this.data[this.visualIndex];
    this.playQueue = this.shuffleArray([...currentVisual.questions]);
    this.currentIndex = 0;
    
    // アプリコンポーネントの表示リセット
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

  loadCurrentQuestion() {
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
    this.audioEl.src = levelData.audio;
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

    if (levelData.explanation) {
      this.explanationText.textContent = levelData.explanation;
    } else {
      this.explanationText.textContent = "解説データがありません。";
    }
    this.feedbackText.textContent = question.feedback[selectedChoice] || "";

    if (levelData.vocabulary && levelData.vocabulary.length > 0) {
      this.vocabularyList.innerHTML = levelData.vocabulary.map(v => `<li><strong>${v.word}</strong> : ${v.meaning}</li>`).join('');
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
    const cleanScript = this.currentScript.replace(/\//g, '');
    const words = cleanScript.trim().split(/\s+/);
    this.readingScriptEl.innerHTML = words.map(word => `<span>${word}</span>`).join(' ');
  }

  startReadingPractice() {
    if (!this.speechHandler.recognition) return alert("マイク対応ブラウザをご利用ください。");
    
    this.scoreContainer.classList.add('hidden'); 
    this.readingScriptEl.querySelectorAll('span').forEach(span => span.classList.remove('word-correct'));
    
    this.readingMicBtn.classList.add('hidden');
    this.readingStopBtn.classList.remove('hidden');
    this.readingStopBtn.classList.add('recording');

    this.speechHandler.start((transcript) => {
      const spokenWords = transcript.toLowerCase().match(/\b\w+\b/g) || [];
      this.readingScriptEl.querySelectorAll('span').forEach(span => {
        const cleanWord = span.textContent.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (spokenWords.includes(cleanWord)) span.classList.add('word-correct');
      });
    });
  }

  stopReadingAndCalculateScore() {
    this.speechHandler.stop();
    this.readingStopBtn.classList.remove('recording');
    this.readingStopBtn.classList.add('hidden');
    this.readingMicBtn.classList.remove('hidden');
    this.readingMicBtn.textContent = '🔄 もう一度音読する';

    const spans = this.readingScriptEl.querySelectorAll('span');
    const totalWords = spans.length;
    let correctWords = 0;
    spans.forEach(span => { if(span.classList.contains('word-correct')) correctWords++; });
    
    const accuracy = Math.round((correctWords / totalWords) * 100) || 0;
    
    this.scoreContainer.classList.remove('hidden');
    this.accuracyScore.textContent = "0";
    
    const offset = 125.6 - (125.6 * accuracy / 100);
    
    setTimeout(() => {
      this.accuracyGauge.style.strokeDashoffset = offset;
      
      let currentNum = 0;
      const interval = setInterval(() => {
        currentNum += 2;
        if(currentNum >= accuracy) {
          currentNum = accuracy;
          clearInterval(interval);
          this.accuracyScore.textContent = currentNum;
          if (accuracy >= 80) this.triggerCelebration();
        } else {
          this.accuracyScore.textContent = currentNum;
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
    if (!this.speechHandler.recognition) return alert("マイク対応ブラウザをご利用ください。");
    
    this.shadowingUserText.textContent = "録音中...";
    this.shadowingStartBtn.classList.add('hidden');
    this.shadowingStopBtn.classList.remove('hidden');
    this.shadowingStopBtn.classList.add('recording');

    this.audioEl.currentTime = 0;
    this.audioEl.play();

    this.speechHandler.start((transcript) => {
      this.shadowingUserText.textContent = transcript || "聞き取れませんでした...";
    });

    this.audioEl.onended = () => {
        if(this.speechHandler.isRecording) this.stopShadowingPractice();
    };
  }

  stopShadowingPractice() {
    this.speechHandler.stop();
    this.audioEl.pause();
    this.shadowingStopBtn.classList.remove('recording');
    this.shadowingStopBtn.classList.add('hidden');
    this.shadowingStartBtn.classList.remove('hidden');
    this.shadowingStartBtn.textContent = '🔄 もう一度Shadowing';
  }

  stopAllAudioAndMic() {
    this.speechHandler.stop();
    this.audioEl.pause();
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

  // 終了画面は「問題一覧へ戻る」ボタンを表示
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