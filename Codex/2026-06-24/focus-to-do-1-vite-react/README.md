# Focus Pomodoro

Focus To-Do風の、ポモドーロタイマー付きタスク管理Webアプリです。

## 起動方法

```bash
npm install
npm run dev
```

表示されたローカルURLをブラウザで開くと利用できます。

Windowsで `Missing script: "dev"` と表示される場合は、別のフォルダで実行しています。
先にこのプロジェクトフォルダへ移動してから実行してください。

```bat
cd C:\Users\jf65j\Documents\Codex\2026-06-24\focus-to-do-1-vite-react
npm install
npm run dev
```

PowerShellで `npm` が止まる場合は、代わりに次のように実行できます。

```bat
npm.cmd install
npm.cmd run dev
```

## 主な機能

- タスク追加、削除、完了チェック
- 予定ポモドーロ数、優先度、締切日の設定
- 作業、短い休憩、長い休憩のタイマー切り替え
- 作業タイマー完了時に、選択中タスクの完了ポモドーロ数を自動加算
- 今日と今週のポモドーロ統計、集中時間、完了タスク数の表示
- 作業時間、休憩時間、テーマカラーのカスタマイズ
- localStorageによるデータ保存

## 技術構成

- Vite
- React
- JavaScript
- CSS
- localStorage
