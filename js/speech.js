class SpeechHandler {
  constructor() {
    this.recognition = null;
    this.isRecording = false;
    
    // Chrome等に搭載されている SpeechRecognition API を取得
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true; // 連続認識
      this.recognition.interimResults = true; // 途中結果も取得
      this.recognition.lang = 'en-US'; // 英語認識モード
    } else {
      console.warn("お使いのブラウザはWeb Speech APIに対応していません。");
    }
  }

  start(onResultCallback) {
    if (!this.recognition) return false;
    
    this.recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript && onResultCallback) {
        onResultCallback(finalTranscript);
      }
    };

    this.isRecording = true;
    this.recognition.start();
    return true;
  }

  stop() {
    if (this.recognition && this.isRecording) {
      this.isRecording = false;
      this.recognition.stop();
    }
  }
}