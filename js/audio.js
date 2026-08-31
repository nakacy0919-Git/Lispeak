class TTSHandler {
  static speak(text, lang = 'en-US', rate = 0.9) {
    // ブラウザがTTSに対応しているかチェック
    if (!window.speechSynthesis) {
      console.warn("お使いのブラウザは音声合成(TTS)に対応していません。");
      return;
    }

    // 再生中の音声があればキャンセル
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate; // リスニング練習用に少しだけゆっくり（0.9）に設定
    
    window.speechSynthesis.speak(utterance);
  }
}