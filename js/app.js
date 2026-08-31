class LispeakApp {
  constructor() {
    this.data = [];
    this.playQueue = [];
    this.currentIndex = 0;
    
    this.speechHandler = new SpeechHandler(); 
    this.currentScript = ""; 
    this.currentLevel = "basic"; 

    this.correctSound = new Audio('assets/audio/correct.mp3');
    this.incorrectSound = new Audio('assets/audio/incorrect.mp3');

    // DOM Elements - Start Screen
    this.homeScreen = document.getElementById('home-screen');
    this.categoryBtns = document.querySelectorAll('.category-btn');
    
    // DOM Elements - App
    this.appContainer = document.getElementById('app-container');
    this.progressHeader = document.getElementById('progress');
    this.imageEl = document.getElementById('question-image');
    this.audioEl = document.getElementById('question-audio');
    this.audioLevelContainer = document.getElementById('audio-level-container');
    this.choiceBtns = document.querySelectorAll('.choice-btn');
    this.feedbackSec = document.getElementById('feedback-section');
    this.resultTitle = document.getElementById('result-title');
    this.feedbackText = document.getElementById('feedback-text');
    this.nextBtn = document.getElementById('next-btn');
    this.progressEl = document.getElementById('progress');
    
    // Shadowing Elements
    this.shadowingScriptEl = document.getElementById('shadowing-script');
    this.micBtn = document.getElementById('mic-btn');

    this.bindEvents();
  }

  // 初期化はデータを読み込まず、スタート画面で待機
  init() {
    // 起動時は何もしない（ボタンクリックでスタート）
  }

  bindEvents() {
    // スタートボタン
    this.categoryBtns.forEach(btn => {
      btn.addEventListener('click', () => this.startApp());
    });

    // 選択肢ボタン
    this.choiceBtns.forEach(btn => {
      btn.addEventListener('click', (e) => this.handleAnswer(e));
    });

    // 次へボタン
    this.nextBtn.addEventListener('click', () => {
      this.stopShadowing();
      this.nextQuestion();
    });

    // マイクボタン
    this.micBtn.addEventListener('click', () => this.toggleShadowing());
  }

  async startApp() {
    // 画面切り替え
    this.homeScreen.classList.add('hidden');
    this.appContainer.classList.remove('hidden');
    this.progressHeader.classList.remove('hidden');

    // データロード（初回のみ）
    if (this.data.length === 0) {
      this.data = await DataLoader.loadQuestions();
      if (this.data && this.data.length > 0) {
        this.buildPlayQueue();
        this.loadCurrentQuestion();
      }
    }
  }

  buildPlayQueue() {
    this.playQueue = [];
    const maxQuestions = Math.max(...this.data.map(v => v.questions.length));

    for (let qIndex = 0; qIndex < maxQuestions; qIndex++) {
      for (let vIndex = 0; vIndex < this.data.length; vIndex++) {
        const visual = this.data[vIndex];
        if (visual.questions[qIndex]) {
          this.playQueue.push({
            image: visual.image,
            question: visual.questions[qIndex]
          });
        }
      }
    }
  }

  loadCurrentQuestion() {
    const currentItem = this.playQueue[this.currentIndex];
    const question = currentItem.question;
    this.currentLevel = "basic";

    // UIリセット (1カラムに戻す)
    this.appContainer.classList.remove('show-feedback');
    this.feedbackSec.classList.add('hidden');
    
    this.choiceBtns.forEach(btn => {
      btn.disabled = false;
      btn.style.backgroundColor = '';
      btn.style.color = '';
      btn.style.border = '2px solid var(--primary-color)';
    });

    this.imageEl.src = currentItem.image;
    this.imageEl.onerror = () => {
      this.imageEl.src = 'https://via.placeholder.com/600x450.png?text=Image+Not+Found';
    };

    this.setupAudioSources(question.levels);
    this.updateProgress();
  }

  setupAudioSources(levelsData) {
    this.audioLevelContainer.innerHTML = ''; 

    if (levelsData && typeof levelsData === 'object') {
      this.audioLevelContainer.style.display = 'flex';
      const levels = Object.keys(levelsData);
      
      levels.forEach((levelStr, index) => {
        const btn = document.createElement('button');
        btn.className = 'level-btn';
        btn.textContent = levelStr.charAt(0).toUpperCase() + levelStr.slice(1); 
        
        if (levelStr === this.currentLevel || (index === 0 && !levels.includes(this.currentLevel))) {
            this.currentLevel = levelStr;
            this.audioEl.src = levelsData[levelStr].audio;
            this.currentScript = levelsData[levelStr].script;
            btn.classList.add('active');
        }

        btn.addEventListener('click', () => {
          document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          
          this.currentLevel = levelStr;
          this.audioEl.src = levelsData[levelStr].audio;
          this.currentScript = levelsData[levelStr].script;
          this.audioEl.play();

          if (!this.feedbackSec.classList.contains('hidden')) {
              this.renderChunks(this.currentScript);
              this.setupShadowingScript();
          }
        });
        this.audioLevelContainer.appendChild(btn);
      });
    } else {
        this.audioLevelContainer.style.display = 'none';
    }
  }

  handleAnswer(e) {
    const selectedBtn = e.target;
    const selectedChoice = parseInt(selectedBtn.dataset.choice);
    const question = this.playQueue[this.currentIndex].question;
    const isCorrect = selectedChoice === question.answer;

    this.choiceBtns.forEach(btn => btn.disabled = true);

    if (isCorrect) {
      this.correctSound.currentTime = 0; 
      this.correctSound.play().catch(e => console.log("効果音再生エラー:", e));
      selectedBtn.style.backgroundColor = 'var(--correct-color)';
      selectedBtn.style.borderColor = 'var(--correct-color)';
    } else {
      this.incorrectSound.currentTime = 0;
      this.incorrectSound.play().catch(e => console.log("効果音再生エラー:", e));
      selectedBtn.style.backgroundColor = 'var(--incorrect-color)';
      selectedBtn.style.borderColor = 'var(--incorrect-color)';
      
      const correctBtn = document.querySelector(`.choice-btn[data-choice="${question.answer}"]`);
      if(correctBtn) correctBtn.style.border = '4px solid var(--correct-color)';
    }
    selectedBtn.style.color = 'white';

    this.resultTitle.textContent = isCorrect ? '🎉 正解！' : '❌ 不正解...';
    this.resultTitle.style.color = isCorrect ? 'var(--correct-color)' : 'var(--incorrect-color)';
    this.feedbackText.textContent = question.feedback[selectedChoice];
    
    this.renderChunks(this.currentScript);
    this.setupShadowingScript();

    // 2カラムレイアウトへの切り替えとフィードバック表示
    this.appContainer.classList.add('show-feedback');
    this.feedbackSec.classList.remove('hidden');
    
    // モバイル端末向けに少しだけスクロール
    if (window.innerWidth < 768) {
        this.feedbackSec.scrollIntoView({ behavior: 'smooth' });
    }
  }

  renderChunks(scriptText) {
    const chunkContainer = document.getElementById('audio-script-chunks');
    chunkContainer.innerHTML = ''; 
    const chunks = scriptText.split('/').map(c => c.trim()).filter(c => c.length > 0);

    chunks.forEach(chunkText => {
      const btn = document.createElement('button');
      btn.className = 'chunk-btn';
      btn.textContent = chunkText;
      
      btn.addEventListener('click', () => {
        TTSHandler.speak(chunkText);
      });
      chunkContainer.appendChild(btn);
    });
  }

  setupShadowingScript() {
    const cleanScript = this.currentScript.replace(/\//g, '');
    const words = cleanScript.trim().split(/\s+/);
    this.shadowingScriptEl.innerHTML = words.map(word => `<span>${word}</span>`).join(' ');
  }

  toggleShadowing() {
    if (!this.speechHandler.recognition) {
      alert("お使いのブラウザはマイク認識に対応していません。Chrome等の対応ブラウザをご利用ください。");
      return;
    }

    if (this.speechHandler.isRecording) {
      this.stopShadowing();
    } else {
      this.startShadowing();
    }
  }

  startShadowing() {
    this.micBtn.classList.add('recording');
    this.micBtn.textContent = '⏹️ 停止する';
    
    this.shadowingScriptEl.querySelectorAll('span').forEach(span => {
      span.classList.remove('word-correct');
    });

    this.speechHandler.start((transcript) => {
      this.highlightMatchedWords(transcript);
    });
  }

  stopShadowing() {
    this.speechHandler.stop();
    this.micBtn.classList.remove('recording');
    this.micBtn.textContent = '🎙️ 音読を始める';
  }

  highlightMatchedWords(transcript) {
    const spokenWords = transcript.toLowerCase().match(/\b\w+\b/g) || [];
    const spans = this.shadowingScriptEl.querySelectorAll('span');

    spans.forEach(span => {
      const cleanWord = span.textContent.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (spokenWords.includes(cleanWord)) {
        span.classList.add('word-correct');
      }
    });
  }

  nextQuestion() {
    if (this.currentIndex < this.playQueue.length - 1) {
      this.currentIndex++;
      this.loadCurrentQuestion();
    } else {
      this.showFinishScreen();
    }
  }

  updateProgress() {
    this.progressEl.textContent = `${this.currentIndex + 1} / ${this.playQueue.length}`;
  }

  showFinishScreen() {
    this.appContainer.classList.remove('show-feedback');
    this.imageEl.style.display = 'none';
    this.audioEl.style.display = 'none';
    this.audioLevelContainer.style.display = 'none';
    document.getElementById('answer-section').style.display = 'none';
    
    this.resultTitle.textContent = '🎊 すべての問題をクリアしました！';
    this.resultTitle.style.color = 'var(--primary-color)';
    
    const chunkContainer = document.getElementById('audio-script-chunks');
    if (chunkContainer) chunkContainer.innerHTML = '';
    
    this.feedbackText.textContent = 'シャドーイング練習お疲れ様でした！';
    document.getElementById('shadowing-section').style.display = 'none';
    this.nextBtn.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new LispeakApp();
  app.init();
});