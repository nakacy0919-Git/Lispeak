class LispeakApp {
  constructor() {
    this.data = [];
    this.playQueue = [];
    this.currentIndex = 0;
    
    this.speechHandler = new SpeechHandler(); // 音声認識モジュール
    this.currentScript = ""; // 現在のスクリプト

    // DOM Elements
    this.imageEl = document.getElementById('question-image');
    this.audioEl = document.getElementById('question-audio');
    this.choiceBtns = document.querySelectorAll('.choice-btn');
    this.feedbackSec = document.getElementById('feedback-section');
    this.resultTitle = document.getElementById('result-title');
    this.feedbackText = document.getElementById('feedback-text');
    this.nextBtn = document.getElementById('next-btn');
    this.progressEl = document.getElementById('progress');
    
    // Shadowing & Chunk Elements
    this.shadowingScriptEl = document.getElementById('shadowing-script');
    this.micBtn = document.getElementById('mic-btn');

    this.bindEvents();
  }

  async init() {
    this.data = await DataLoader.loadQuestions();
    if (this.data && this.data.length > 0) {
      this.buildPlayQueue();
      this.loadCurrentQuestion();
    }
  }

  buildPlayQueue() {
    this.playQueue = [];
    const maxQuestions = Math.max(...this.data.map(v => v.questions.length));

    // 画像セットをまたいでローテーション出題するためのキュー構築
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

  bindEvents() {
    this.choiceBtns.forEach(btn => {
      btn.addEventListener('click', (e) => this.handleAnswer(e));
    });
    this.nextBtn.addEventListener('click', () => {
      this.stopShadowing(); // 次へ行く前に録音を確実に停止
      this.nextQuestion();
    });
    this.micBtn.addEventListener('click', () => this.toggleShadowing());
  }

  loadCurrentQuestion() {
    const currentItem = this.playQueue[this.currentIndex];
    const question = currentItem.question;
    this.currentScript = question.script; // スクリプトを保持

    // UIリセット
    this.feedbackSec.classList.add('hidden');
    this.choiceBtns.forEach(btn => {
      btn.disabled = false;
      btn.style.backgroundColor = '';
      btn.style.color = '';
      btn.style.border = '2px solid var(--primary-color)';
    });

    // データセット
    this.imageEl.src = currentItem.image;
    this.imageEl.onerror = () => {
      this.imageEl.src = 'https://via.placeholder.com/600x450.png?text=Image+Not+Found';
    };

    this.audioEl.src = question.audio;
    this.updateProgress();
  }

  handleAnswer(e) {
    const selectedBtn = e.target;
    const selectedChoice = parseInt(selectedBtn.dataset.choice);
    const question = this.playQueue[this.currentIndex].question;
    const isCorrect = selectedChoice === question.answer;

    this.choiceBtns.forEach(btn => btn.disabled = true);

    // 正誤のボタンハイライト表示
    if (isCorrect) {
      selectedBtn.style.backgroundColor = 'var(--correct-color)';
      selectedBtn.style.borderColor = 'var(--correct-color)';
    } else {
      selectedBtn.style.backgroundColor = 'var(--incorrect-color)';
      selectedBtn.style.borderColor = 'var(--incorrect-color)';
      const correctBtn = document.querySelector(`.choice-btn[data-choice="${question.answer}"]`);
      if(correctBtn) correctBtn.style.border = '4px solid var(--correct-color)';
    }
    selectedBtn.style.color = 'white';

    // フィードバックテキストの設定
    this.resultTitle.textContent = isCorrect ? '🎉 正解！' : '❌ 不正解...';
    this.resultTitle.style.color = isCorrect ? 'var(--correct-color)' : 'var(--incorrect-color)';
    this.feedbackText.textContent = question.feedback[selectedChoice];
    
    // チャンク表示とシャドーイングのセットアップ
    this.renderChunks(this.currentScript);
    this.setupShadowingScript();

    this.feedbackSec.classList.remove('hidden');
    this.feedbackSec.scrollIntoView({ behavior: 'smooth' });
  }

  // --- チャンクボタンの生成とTTS連携 ---
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

  // --- シャドーイング機能のロジック ---
  setupShadowingScript() {
    // チャンク用のスラッシュ(/)を消去してから、単語ごとにspanで囲む
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
    
    // 録音開始時に色をリセット
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
      // 記号を消して小文字で比較（カンマやピリオドを無視して判定）
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
    this.imageEl.style.display = 'none';
    this.audioEl.style.display = 'none';
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