# AI簡易住宅予算診断ツール

AI簡易住宅予算診断ツールは、ユーザーが自身の住宅予算を迅速かつ簡単に算出できるWebアプリケーションです。年収、負債状況、貯金額、家族構成などの情報に基づいて、適切な住宅予算の上限（MAXライン）を算出し、住宅購入の参考情報を提供します。

## 主な機能

- **簡単な質問形式**: 1問1答形式で簡単に情報を入力
- **AI予算診断**: 入力情報をもとに最適な住宅予算を算出
- **PDF出力**: 診断結果をPDFでダウンロード可能
- **FP相談連携**: 診断後、専門家との相談予約が可能

## 技術スタック

- **フロントエンド**: Next.js, TypeScript, Tailwind CSS
- **バックエンド**: Supabase (PostgreSQL, 認証, ストレージ)
- **PDF生成**: jsPDF
- **フォーム処理**: React Hook Form, Formik, Yup

## インストール方法

1. リポジトリをクローン:
```bash
git clone https://github.com/yourusername/ai-housing-budget-calculator.git
cd ai-housing-budget-calculator
```

2. 依存関係をインストール:
```bash
npm install
```

3. 環境変数を設定:
`.env.local`ファイルを作成し、以下の環境変数を設定:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NODE_ENV=development
```

**注意**: 環境変数が設定されていない場合、アプリケーションはダミーのSupabaseクライアントを使用します。これにより、データはブラウザセッション中のみ一時的に保持されますが、永続的には保存されません。実運用環境では必ず正しい環境変数を設定してください。

4. 開発サーバーを起動:
```bash
npm run dev
```

## デバッグモード

開発環境（`NODE_ENV=development`）では、アプリケーションはデバッグモードで実行されます。デバッグモードでは以下の機能が利用可能です：

1. チャットボットステップでの「デバッグ: スキップ」ボタン
   - クリックすると、サンプルデータで自動入力され、チャットボットステップをスキップできます
   - これにより、開発中にチャットボットとの対話を毎回行う必要がなくなります

2. デバッグ情報表示
   - チャットボットステップで現在の質問番号と収集されたデータが表示されます
   - これにより、データの収集状況をリアルタイムで確認できます

本番環境（`NODE_ENV=production`）では、これらのデバッグ機能は自動的に無効化されます。

## Supabaseセットアップ

1. Supabaseプロジェクトを作成
2. `supabase/schema.sql`ファイルの内容をSQLエディタで実行
3. 必要なテーブル(users, diagnosis_results, fp_consultation_requests)が作成されます

## 使用方法

1. ホームページからAI診断を開始
2. プライバシーポリシーに同意
3. 基本情報と詳細情報を入力
4. 診断結果を確認し、PDFでダウンロードまたはFP相談を予約

## ライセンス

MITライセンス
