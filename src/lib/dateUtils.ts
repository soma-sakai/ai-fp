/**
 * 日本時間（JST）のタイムスタンプを生成するユーティリティ関数
 * 
 * @returns {string} ISO形式で日本時間を表すタイムスタンプ文字列（例: '2023-05-06T12:34:56.789+09:00'）
 */
export const getJSTTimestamp = (): string => {
  // 現在のUTC時間を取得
  const now = new Date();
  
  // 日本時間はUTC+9
  const jstOffset = 9 * 60; // 分単位
  
  // 現在時刻にオフセットを加算
  const jstTime = new Date(now.getTime() + jstOffset * 60000);
  
  // ISO文字列に変換し、末尾の'Z'を'+09:00'に置換して日本時間であることを明示
  return jstTime.toISOString().replace('Z', '+09:00');
};

/**
 * 日付を日本時間（JST）フォーマットの文字列に変換する
 * 
 * @param {Date|string} date - 変換する日付（Date オブジェクトまたは ISO 文字列）
 * @returns {string} 'YYYY/MM/DD HH:mm:ss' 形式の日本時間文字列
 */
export const formatToJST = (date: Date | string): string => {
  // 文字列の場合はDateオブジェクトに変換
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // 日本時間に調整
  const jstOffset = 9 * 60; // 分単位
  const jstTime = new Date(dateObj.getTime() + jstOffset * 60000);
  
  // フォーマット: YYYY/MM/DD HH:mm:ss
  const year = jstTime.getUTCFullYear();
  const month = String(jstTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(jstTime.getUTCDate()).padStart(2, '0');
  const hours = String(jstTime.getUTCHours()).padStart(2, '0');
  const minutes = String(jstTime.getUTCMinutes()).padStart(2, '0');
  const seconds = String(jstTime.getUTCSeconds()).padStart(2, '0');
  
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}; 