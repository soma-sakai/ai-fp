import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // CORSプリフライトリクエストの処理
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { method, url } = req;
    const urlObj = new URL(url);
    const path = urlObj.pathname.split('/').filter(Boolean).pop() || '';

    // Supabaseクライアントの初期化
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // エンドポイントに応じた処理の振り分け
    switch (path) {
      case 'simple-budget':
        return handleSimpleBudget(req, supabaseClient);
      case 'run-simulation':
        return handleRunSimulation(req, supabaseClient);
      case 'get-simulation':
        return handleGetSimulation(req, supabaseClient);
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid endpoint' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// 簡易住宅予算診断のリクエスト処理
async function handleSimpleBudget(req: Request, supabaseClient: any) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );
  }

  // リクエストボディを取得
  const requestData = await req.json();

  // データを検証
  if (!requestData.annualIncome) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }

  // Supabaseで簡易住宅予算診断関数を呼び出し
  const { data, error } = await supabaseClient.rpc('fn_calculate_simple_budget', {
    params: requestData
  });

  if (error) {
    console.error('Error calculating budget:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }

  return new Response(
    JSON.stringify({ maxBudget: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// シミュレーション実行のリクエスト処理
async function handleRunSimulation(req: Request, supabaseClient: any) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );
  }

  // リクエストボディを取得
  const requestData = await req.json();

  // データを検証
  if (!requestData.diagnosisResultId) {
    return new Response(
      JSON.stringify({ error: 'Missing diagnosis result ID' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }

  // Supabaseでシミュレーション実行関数を呼び出し
  const { data, error } = await supabaseClient.rpc('fn_simulate_life_plan', {
    diagnosis_result_id: requestData.diagnosisResultId
  });

  if (error) {
    console.error('Error running simulation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }

  return new Response(
    JSON.stringify({ simulationId: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// シミュレーション結果取得のリクエスト処理
async function handleGetSimulation(req: Request, supabaseClient: any) {
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );
  }

  const url = new URL(req.url);
  const simulationId = url.searchParams.get('id');

  if (!simulationId) {
    return new Response(
      JSON.stringify({ error: 'Missing simulation ID' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }

  // シミュレーション実行結果を取得
  const { data: simulationRun, error: simulationError } = await supabaseClient
    .from('simulation_runs')
    .select('*')
    .eq('id', simulationId)
    .single();

  if (simulationError) {
    console.error('Error fetching simulation run:', simulationError);
    return new Response(
      JSON.stringify({ error: simulationError.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }

  // 年次データを取得
  const { data: yearlyData, error: yearlyError } = await supabaseClient
    .from('simulation_yearly_data')
    .select('*')
    .eq('run_id', simulationId)
    .order('year', { ascending: true });

  if (yearlyError) {
    console.error('Error fetching simulation yearly data:', yearlyError);
    return new Response(
      JSON.stringify({ error: yearlyError.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }

  return new Response(
    JSON.stringify({
      simulationRun,
      yearlyData
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
} 