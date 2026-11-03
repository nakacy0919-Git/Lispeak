class SpeechHandler {
  constructor() {
    this.recognition = null;
    this.isRecording = false;
    this.isStopping = false;
    this.transcript = '';
    this.lastError = null;
    this.onResultCallback = null;
    this.onErrorCallback = null;
    this.onEndCallback = null;
    this.stopPromise = null;
    this.resolveStop = null;
    this.stopTimeout = null;
    this.aborted = false;

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      console.warn('Speech recognition is not available in this browser.');
      return;
    }
    this.recognition = new Recognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = event => {
      if (this.aborted) return;
      const finalParts = [];
      const interimParts = [];
      // Rebuild from the complete result list to avoid losing earlier segments.
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result[0]) continue;
        if (result.isFinal) finalParts.push(result[0].transcript);
        else interimParts.push(result[0].transcript);
      }
      this.transcript = finalParts.join(' ').trim();
      const visibleTranscript = [...finalParts, ...interimParts].join(' ').trim();
      if (this.onResultCallback) this.onResultCallback(visibleTranscript);
    };

    this.recognition.onerror = event => {
      if (this.aborted) return;
      this.lastError = event.error || 'unknown';
      if (this.onErrorCallback) this.onErrorCallback(this.lastError);
    };

    this.recognition.onend = () => this.finish();
  }

  start(onResultCallback, onErrorCallback, onEndCallback) {
    if (!this.recognition || this.isRecording || this.isStopping) return false;
    this.transcript = '';
    this.lastError = null;
    this.aborted = false;
    this.onResultCallback = onResultCallback;
    this.onErrorCallback = onErrorCallback;
    this.onEndCallback = onEndCallback;
    try {
      this.recognition.start();
      this.isRecording = true;
      return true;
    } catch (error) {
      this.isRecording = false;
      this.lastError = error.name || 'start-failed';
      if (onErrorCallback) onErrorCallback(this.lastError);
      return false;
    }
  }

  stop() {
    if (!this.recognition || (!this.isRecording && !this.isStopping)) {
      return Promise.resolve(this.transcript);
    }
    if (this.isStopping) return this.stopPromise;
    this.isStopping = true;
    this.stopPromise = new Promise(resolve => {
      this.resolveStop = resolve;
      // Browser engines do not always deliver onend after a permission failure.
      this.stopTimeout = setTimeout(() => this.finish(), 1800);
      try {
        this.recognition.stop();
      } catch (error) {
        this.lastError = error.name || 'stop-failed';
        this.finish();
      }
    });
    return this.stopPromise;
  }

  abort() {
    this.aborted = true;
    this.onResultCallback = null;
    this.onErrorCallback = null;
    this.onEndCallback = null;
    if (this.recognition && (this.isRecording || this.isStopping)) {
      try { this.recognition.abort(); } catch (error) { /* already stopped */ }
    }
    this.finish();
  }

  finish() {
    if (!this.isRecording && !this.isStopping) return;
    const unexpected = !this.isStopping;
    this.isRecording = false;
    this.isStopping = false;
    if (this.stopTimeout !== null) {
      clearTimeout(this.stopTimeout);
      this.stopTimeout = null;
    }
    const resolve = this.resolveStop;
    this.resolveStop = null;
    this.stopPromise = null;
    if (resolve) resolve(this.transcript);
    if (!this.aborted && this.onEndCallback) {
      this.onEndCallback({ unexpected, error: this.lastError });
    }
  }
}
