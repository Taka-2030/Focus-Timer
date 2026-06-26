\# Focus Timer Architecture v1



\## 1. アプリ概要



本アプリは、ポモドーロタイマー、タスク管理、統計、Cookiesによるゲーム要素を組み合わせた学習・作業継続支援アプリである。



単なるタイマーではなく、集中時間を可視化し、Cookies・背景成長・タイマーデザイン・Boostによって、継続したくなる体験を作る。



\## 2. 基本コンセプト



\### 中心思想



集中が主役。

ゲーム要素は集中を邪魔せず、継続を支える補助要素として扱う。



\### アプリの方向性



\* ポモドーロタイマー

\* タスク管理

\* 統計

\* Cookies報酬

\* ショップ

\* タイマーデザイン変更

\* 背景成長

\* Boost

\* 多言語対応

\* 将来的なクラウド同期

\* 将来的なストア公開



\## 3. UI設計ルール



\### タイマー画面



タイマー画面は最も重要な画面であるため、情報を増やしすぎない。



表示するものは原則として以下に限定する。



\* 現在のCookies

\* タイマー本体

\* 開始 / 停止 / リセット

\* 現在有効なBoostの要約

\* 選択中のタイマーデザイン



詳細情報は別画面に逃がす。



\### 情報量のルール



タイマー画面に複数のBoost詳細、ショップ情報、統計詳細を置かない。



複雑な情報は以下の専用画面で管理する。



\* Shop

\* Boost

\* Statistics

\* Settings



\## 4. 多言語対応ルール



画面に直接文字列を書かない。



すべての文言は `i18n` を通して表示する。



例：



```js

t("timer.start")

t("shop.buy")

t("settings.language")

```



翻訳キーは以下の形式で統一する。



```text

画面名.機能名

```



例：



```text

timer.start

timer.pause

timer.reset

task.add

shop.cookies

shop.buy

boost.morning

settings.language

theme.cyber

premium.sync

```



\## 5. データ保存ルール



localStorageを直接呼び出さない。



必ず `storageService` を経由する。



禁止：



```js

localStorage.setItem(...)

localStorage.getItem(...)

```



許可：



```js

storageService.saveGameState(...)

storageService.getGameState()

```



理由は、将来的にFirebase同期へ移行しやすくするためである。



\## 6. Cookies設計



Cookiesは集中時間によって獲得するゲーム内通貨である。



\### 獲得条件



Cookiesは作業タイマー完了時のみ獲得する。



以下では獲得しない。



\* 停止

\* リセット

\* 休憩完了

\* 放置



\### 基本報酬



25分完了で10 Cookies。



作業時間に応じて計算する。



```text

1分 = 0.4 Cookies

```



\## 7. Shop設計



Shopは将来的にカテゴリ分けする。



```text

Shop

├─ Items

├─ Timer Designs

├─ Backgrounds

├─ Themes

└─ Premium

```



現在の施設系アイテムは複数購入可能。



アップグレードは原則1回のみ購入可能。



\## 8. Timer Design System



タイマーの見た目は差し替え可能にする。



将来的に以下を実装する。



\* Ring Timer

\* Flip Clock Timer

\* Water Rising Timer

\* Digital Timer

\* Minimal Timer

\* Neon Timer



実装時は、個別にタイマー処理を書かない。



タイマーの状態は共通化し、見た目だけを切り替える。



理想構造：



```text

components/

├─ timer/

│  ├─ TimerRenderer.jsx

│  ├─ RingTimer.jsx

│  ├─ FlipClockTimer.jsx

│  ├─ WaterTimer.jsx

│  └─ DigitalTimer.jsx

```



\## 9. 背景成長システム



家具を自由配置する方式ではなく、背景そのものが変化する方式を採用する。



理由：



\* UIが散らかりにくい

\* タイマーアプリとしての視認性を保てる

\* 実装が比較的軽い

\* 成長演出を作りやすい



背景は以下の要素で決まる。



```text

時間帯 × 成長レベル × テーマ

```



例：



```text

Morning + Lv1 + Default

Night + Lv5 + Cyber

```



\## 10. Boost System



Boostは個別機能として実装しない。



すべて共通のBoostシステムで管理する。



導入予定：



\* 朝活ボーナス

\* Streak Bonus

\* Weekly Challenge

\* Today's Mission

\* Subject Bonus

\* Random Event



タイマー画面には、現在有効なBoostの要約のみ表示する。



詳細はBoost画面で確認する。



\## 11. マネタイズ方針



実装予定：



\* Cookies販売

\* タイマーデザイン販売

\* 背景テーマ販売

\* Premium



実装しない：



\* シーズンパス

\* 応援パック

\* AI分析



Premium候補：



\* Firebase同期

\* 詳細統計

\* クラウドバックアップ

\* 全テーマ利用

\* データエクスポート



\## 12. AI分析について



AI分析は実装しない。



理由：



\* API費用管理が難しい

\* クレジット管理が複雑

\* 初期段階では技術負担が大きい

\* アプリの主目的がぼやける



\## 13. Firebase同期方針



Firebase同期は後半で実装する。



同期対象：



\* tasks

\* settings

\* statistics

\* gameState

\* cookies

\* purchasedItems

\* purchasedUpgrades

\* language

\* timerDesign

\* backgroundState



未ログイン時はlocalStorageを使用する。



ログイン時はFirestoreを使用する。



\## 14. ストア展開方針



まずはPWAで完成度を高める。



その後、以下の順番で展開する。



```text

PWA

↓

Firebase同期

↓

Androidアプリ

↓

iOSアプリ

↓

Steam検討

```



iOSはApple審査が必要。



SteamはElectronまたはTauriでPCアプリ化する必要がある。



\## 15. 開発ルール



新機能追加時は必ず以下を守る。



\* 既存機能を壊さない

\* `npm run build` が通る

\* スマホ表示を崩さない

\* 文言はi18nに追加する

\* localStorageはstorageService経由

\* タイマー画面を複雑にしない

\* 新機能は将来のFirebase同期を考慮する

\* GitHubへコミットする前に動作確認する



\## 16. 今後の優先順位



1\. 多言語対応の保存

2\. Timer Design System

3\. Background Growth System

4\. Boost System

5\. Firebase同期

6\. Premium設計

7\. ストア公開準備



\## 17. この設計書の役割



この設計書は、今後Codexに機能追加を依頼する際の前提資料である。



以後の実装は、この設計書に従って行う。



