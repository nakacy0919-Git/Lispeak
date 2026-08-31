class DataLoader {
  static async loadQuestions(url = 'data/questions.json') {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error('Error loading questions:', error);
      return null;
    }
  }
}