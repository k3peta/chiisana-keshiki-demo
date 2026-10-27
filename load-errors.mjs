// Presentation only: never retries, clears caches, or relaxes validation.
export function loadErrorAdvice(error){
 const detail=String(error?.message||error||'原因を取得できませんでした').slice(0,1500);
 let reason='読み込みを完了できませんでした',next='現在の場面をJSONへ保存し、選んだファイルと起動手順を確認してください。解決しない場合は下の詳細を添えて相談してください。';
 if(/hash|SHA256|ハッシュ|素材版|版が|版または|要求する素材/i.test(detail)){reason='素材の版が一致しません';next='作品を保存したときと同じGLBを選んでください。公開素材なら配布版とアプリ版を確認してください。検証を無効にしたり、キャッシュを一括削除したりする必要はありません。';}
 else if(/timeout|timed out|abort|時間切れ/i.test(detail)){reason='読み込みが時間内に終わりませんでした';next='通信状態を確認し、少し待って同じ素材をもう一度選んでください。';}
 else if(/fetch|network|HTTP|urlopen|connection|通信/i.test(detail)){reason='素材の取得先に接続できませんでした';next='起動したターミナルを閉じていないか、ブラウザのポート番号と通信状態を確認してください。確認後に同じ操作を試してください。';}
 else if(/localhost|127\.0\.0\.1|ローカルサーバー/.test(detail)){reason='ローカルサーバーから開く必要があります';next='起動手順のコマンドでサーバーを起動し、同じPCのhttp://127.0.0.1と表示されたポート番号で開いてください。HTMLの直接ダブルクリックでは利用できません。';}
 else if(/未対応|非対応|外部画像|拡張/.test(detail)){reason='この素材形式には対応していません';next='外部画像を参照しない通常のGLB 2.0を選んでください。圧縮・アニメーション等を必要とする素材は使えません。元ファイルは変更しません。';}
 else if(/以内|exceeds|too large|多すぎ|limit|budget|size outside/i.test(detail)){reason='ファイルの大きさ・件数の制限に達しました';next='GLBは32MiB以内、ZIPは64MiB以内、選択合計64MiB以内、場面JSONは1,000,000 bytes以内です。ZIPは「2 アイテムを登録」で選べます。展開後の容量やモデル資源にも上限があります。';}
 else if(!/先に|見つかりません/.test(detail)&&/GLB|JSON|破損|Unexpected|不正|token/i.test(detail)){reason='ファイルの形式を確認してください';next='場面JSONは「JSONを開く」、素材GLB・対応ZIPは「2 アイテムを登録」から選び「メニューを再構築」を押します。元ファイルは残してください。';}
 else if(/先に|見つかりません|manifest/.test(detail)){reason='必要な素材ファイルが見つかりません';next='保存JSONにはモデル本体が入りません。不足GLBを再指定するか、元の素材フォルダを選んでください。';}
 return {reason,next,detail};
}
