import { createClient } from '@supabase/supabase-js';

// ダミー環境変数
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key';

// ダミーストレージ（セッション中のみ保持）
const dummyStorage: Record<string, any[]> = {
  'users': [],
  'diagnosis_results': [],
  'simulation_runs': [],
  'simulation_yearly_data': []
};

// 環境変数が存在するかログ出力
console.log('Supabase環境設定:', {
  url設定あり: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  APIキー設定あり: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
});

// 実際のSupabaseクライアント（環境変数が設定されている場合）
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// データ保存関数
export const saveData = async (tableName: string, data: any) => {
  console.log(`データを保存します (テーブル: ${tableName}):`, data);
  
  try {
    // 実際のSupabaseにデータを保存
    const { data: supabaseData, error: supabaseError } = await supabase
      .from(tableName)
      .insert(data)
      .select('id')
      .single();
    
    if (!supabaseError && supabaseData) {
      console.log(`Supabaseに保存成功 (${tableName}) - ID:`, supabaseData.id);
      return { data: supabaseData, error: null };
    }
    
    // エラーがあれば記録して、ダミーストレージにフォールバック
    if (supabaseError) {
      console.warn(`Supabaseへの保存エラー (${tableName}):`, supabaseError);
      console.log('ダミーストレージにフォールバックします');
    }
    
    // ダミーストレージに保存
    if (!dummyStorage[tableName]) {
      dummyStorage[tableName] = [];
    }
    
    const id = `dummy-id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newData = { id, ...data, created_at: new Date().toISOString() };
    dummyStorage[tableName].push(newData);
    
    console.log(`ダミーストレージに保存成功 (${tableName}) - ID:`, id);
    
    return { data: newData, error: null };
  } catch (error) {
    console.error(`データ保存中に例外が発生しました (${tableName}):`, error);
    
    // 例外時もダミーストレージにフォールバック
    if (!dummyStorage[tableName]) {
      dummyStorage[tableName] = [];
    }
    
    const id = `dummy-err-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newData = { id, ...data, created_at: new Date().toISOString() };
    dummyStorage[tableName].push(newData);
    
    console.log(`例外後にダミーストレージに保存 (${tableName}) - ID:`, id);
    
    return { data: newData, error: null };
  }
};

// データ取得関数
export const getData = async (tableName: string, id?: string) => {
  console.log(`データを取得します (テーブル: ${tableName}${id ? `, ID: ${id}` : ''})`);
  
  try {
    // 実際のSupabaseからデータを取得
    if (id) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      if (!error && data) {
        console.log(`Supabaseから取得成功 (${tableName}, ID: ${id})`);
        return { data, error: null };
      }
      
      if (error) {
        console.warn(`Supabaseからの取得エラー (${tableName}, ID: ${id}):`, error);
        console.log('ダミーストレージにフォールバックします');
      }
      
      // ダミーストレージから取得
      if (dummyStorage[tableName]) {
        const item = dummyStorage[tableName].find(item => item.id === id);
        if (item) {
          console.log(`ダミーストレージから取得成功 (${tableName}, ID: ${id})`, item);
          return { data: item, error: null };
        }
      }
      
      console.log(`データが見つかりませんでした (${tableName}, ID: ${id})`);
      return { data: null, error: { message: 'データが見つかりませんでした' } };
    } else {
      const { data, error } = await supabase
        .from(tableName)
        .select('*');
      
      if (!error && data) {
        console.log(`Supabaseから取得成功 (${tableName}, ${data.length}件)`);
        return { data, error: null };
      }
      
      if (error) {
        console.warn(`Supabaseからの一括取得エラー (${tableName}):`, error);
        console.log('ダミーストレージにフォールバックします');
      }
      
      // ダミーストレージから取得
      if (dummyStorage[tableName]) {
        console.log(`ダミーストレージから取得 (${tableName}, ${dummyStorage[tableName].length}件)`);
        return { data: dummyStorage[tableName], error: null };
      }
      
      console.log(`テーブルにデータがありません (${tableName})`);
      return { data: [], error: { message: 'データが見つかりませんでした' } };
    }
  } catch (error) {
    console.error(`データ取得中に例外が発生しました (${tableName}):`, error);
    
    // 例外時もダミーストレージにフォールバック
    if (id && dummyStorage[tableName]) {
      const item = dummyStorage[tableName].find(item => item.id === id);
      if (item) {
        console.log(`例外後にダミーストレージから取得 (${tableName}, ID: ${id})`);
        return { data: item, error: null };
      }
    } else if (dummyStorage[tableName]) {
      console.log(`例外後にダミーストレージから一括取得 (${tableName})`);
      return { data: dummyStorage[tableName], error: null };
    }
    
    return { data: id ? null : [], error };
  }
};

// チャットボット進行状況を保存
export const saveChatbotProgress = async (userId: string, progressData: any) => {
  // データの存在確認
  const { data: existingData } = await supabase
    .from('chatbot_progress')
    .select('id')
    .eq('user_id', userId)
    .single();
  
  if (existingData) {
    // 既存データを更新
    return supabase
      .from('chatbot_progress')
      .update({
        progress_data: progressData,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingData.id);
  } else {
    // 新規データを作成
    return supabase
      .from('chatbot_progress')
      .insert({
        user_id: userId,
        progress_data: progressData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
  }
};

// チャットボット進行状況を取得
export const getChatbotProgress = async (userId: string) => {
  return supabase
    .from('chatbot_progress')
    .select('*')
    .eq('user_id', userId)
    .single();
};

// メールアドレスからチャットボット進行状況を取得
export const getChatbotProgressByEmail = async (email: string) => {
  try {
    // ユーザー情報を取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (userError || !userData) {
      return { data: null, error: userError, userId: null };
    }
    
    // チャットボット進行状況を取得
    const { data, error } = await getChatbotProgress(userData.id);
    
    return { data, error, userId: userData.id };
  } catch (error) {
    console.error('メールアドレスからのデータ取得中にエラーが発生しました:', error);
    return { data: null, error, userId: null };
  }
};

// すべての診断結果を取得
export const getAllDiagnosisResults = async () => {
  return getData('diagnosis_results');
}; 