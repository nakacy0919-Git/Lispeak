class DataLoader {
  static async loadQuestions() {
    const allData = [];
    let index = 1;
    let keepFetching = true;

    while (keepFetching) {
      // 1, 2, 3... を 001, 002, 003... という3桁の文字列に変換
      const paddedIndex = String(index).padStart(3, '0');
      const url = `data/visual_${paddedIndex}.json`;

      try {
        const response = await fetch(url);
        
        // ファイルが存在しない（404エラー等）場合はループを終了
        if (!response.ok) {
          console.log(`ファイル読み込み完了: ${url} は見つかりませんでした。`);
          keepFetching = false;
          break;
        }

        const data = await response.json();

        // 読み込んだデータが配列なら展開して追加、オブジェクトならそのまま追加
        if (Array.isArray(data)) {
          allData.push(...data);
        } else {
          allData.push(data);
        }
        
        console.log(`${url} を読み込みました。`);
        index++;

      } catch (error) {
        console.log(`データ読み込み終了（これ以降のファイルはありません）`);
        keepFetching = false;
      }
    }
    
    return allData;
  }
}