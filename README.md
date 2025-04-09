# 安心予算AI診断＆シミュレーションチャットボットツール

チャット形式で家計状況を診断し、将来の資産形成をシミュレーションするWebアプリケーションです。ユーザーフレンドリーなインターフェースで、短時間で家計の健全性を把握し、複数のシナリオによる将来予測を確認できます。

## 主な機能

- **チャットボットによる簡易診断**: 対話形式で基本的な家計情報を入力し、即時に診断結果を表示
- **詳細シミュレーション**: 年齢、収入、支出、貯蓄、投資などの情報をもとに将来の資産推移を予測
- **複数シナリオの比較**: 現状維持、支出削減、投資実施などの複数シナリオを同時に比較
- **グラフによる視覚化**: 資産推移や収支バランスをグラフで分かりやすく表示
- **PDFレポート生成**: シミュレーション結果をPDFレポートとしてダウンロード可能
- **FP相談予約**: 詳細な分析やアドバイスが必要な場合のFP相談予約機能

## 技術スタック

- **フロントエンド**: Next.js, React, TailwindCSS
- **バックエンド/データベース**: Supabase (PostgreSQL)
- **認証**: Supabase Auth
- **グラフ表示**: Chart.js, react-chartjs-2
- **PDF生成**: @react-pdf/renderer

## セットアップ方法

1. リポジトリをクローン
   ```
   git clone [リポジトリURL]
   cd bye-bye-fp
   ```

2. 依存パッケージのインストール
   ```
   npm install
   ```

3. Supabaseプロジェクトの設定
   - [Supabase](https://supabase.com/)でアカウントを作成
   - 新しいプロジェクトを作成
   - SQLエディタを開き、`db/schema.sql`の内容を実行してテーブルを作成
   - プロジェクトの設定からAPI URLと匿名キーを取得

4. 環境変数の設定
   - `.env.local` ファイルを作成し、Supabaseの接続情報を設定
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. 開発サーバーの起動
   ```
   npm run dev
   ```

6. ブラウザで `http://localhost:3000` にアクセス

## Supabaseデータベース設計

以下のテーブルが`db/schema.sql`で作成されます：

1. **profiles** - ユーザープロファイル情報
   - id (UUID, primary key)
   - name (text)
   - email (text)
   - phone (text)
   - created_at (timestamp)
   - updated_at (timestamp)

2. **chat_logs** - チャットの対話ログ
   - id (UUID, primary key)
   - user_id (UUID, foreign key to auth.users)
   - message (text)
   - is_from_user (boolean)
   - created_at (timestamp)

3. **diagnosis_results** - 診断結果
   - id (UUID, primary key)
   - user_id (UUID, foreign key to auth.users)
   - monthly_salary (integer)
   - monthly_expenses (integer)
   - savings (integer)
   - has_investment (boolean)
   - risk_level (text)
   - created_at (timestamp)

4. **consultation_requests** - FP相談予約
   - id (UUID, primary key)
   - user_id (UUID, foreign key to auth.users)
   - name (text)
   - email (text)
   - phone (text)
   - preferred_date_1 (date)
   - preferred_date_2 (date)
   - preferred_date_3 (date)
   - preferred_time (text)
   - consultation_type (text)
   - message (text)
   - status (text)
   - created_at (timestamp)
   - updated_at (timestamp)

5. **user_actions** - ユーザーアクション記録
   - id (UUID, primary key)
   - user_id (UUID, foreign key to auth.users)
   - action (text)
   - created_at (timestamp)

## Supabaseの設定手順

1. **テーブルの作成**
   - Supabaseコンソールの「SQL」メニューを選択
   - 新しいクエリを作成し、`db/schema.sql`の内容を貼り付けて実行

2. **認証設定**
   - 「Authentication」メニューを選択
   - 「Settings」タブを開き、「Email Auth」を有効化
   - 必要に応じてメールテンプレートをカスタマイズ

3. **セキュリティ設定**
   - Row Level Security (RLS)はスキーマで自動設定されます
   - 各テーブルに対して、ユーザーは自分のデータのみにアクセス可能

4. **ストレージの設定（オプション）**
   - PDFレポートなどを保存する場合は、「Storage」メニューでバケットを作成
   - 適切なセキュリティポリシーを設定

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 開発者

開発に関するお問い合わせやご質問は、開発チームまでご連絡ください。
