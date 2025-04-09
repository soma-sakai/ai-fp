import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-12">
      <div className="max-w-5xl w-full text-center">
        <h1 className="text-4xl font-bold mb-6">安心予算AI診断＆シミュレーション</h1>
        <p className="text-xl mb-12">
          あなたの家計状況を分析し、将来の資産形成をシミュレーションします。
          チャット形式で簡単に診断できます。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">簡易診断</h2>
            <p className="mb-6">
              数分で完了する簡単な質問に答えるだけで、
              あなたの家計状況を診断します。
            </p>
            <Link 
              href="/diagnosis"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              簡易診断を始める
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">詳細シミュレーション</h2>
            <p className="mb-6">
              より詳細な情報を入力して、複数のシナリオでの
              長期的な資産形成をシミュレーションします。
            </p>
            <Link 
              href="/simulation"
              className="inline-block px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              詳細シミュレーションを始める
            </Link>
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">無料でFP相談も予約できます</h2>
          <p className="mb-6">
            診断結果に基づいた個別のアドバイスをご希望の方は、
            無料のFP相談をご利用ください。
          </p>
          <Link 
            href="/consultation"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            FP相談を予約する
          </Link>
        </div>

        <div className="mt-12 text-center">
          <h3 className="text-xl font-semibold mb-4">安心予算の特徴</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4">
              <h4 className="text-lg font-medium mb-2">簡単操作</h4>
              <p>チャット形式で誰でも簡単に診断できます。専門知識は不要です。</p>
            </div>
            <div className="p-4">
              <h4 className="text-lg font-medium mb-2">詳細なシミュレーション</h4>
              <p>複数のシナリオで将来の資産推移を確認できます。</p>
            </div>
            <div className="p-4">
              <h4 className="text-lg font-medium mb-2">プロのサポート</h4>
              <p>診断後はプロのFPによる個別相談を無料で受けられます。</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
