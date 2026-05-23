---
name: update-tasks
description: Update this project's personal task log at .claude/local/TASKS.md. Use when the user asks to record progress, log completed/in-progress work, add a TODO, or says "update TASKS" / "タスクを記録". Keeps the log organized, dated, and free of secrets and production-specific details.
---

# update-tasks

個人用の作業ログ `.claude/local/TASKS.md` を更新するスキル。

## 前提
- 場所: リポジトリルートの **`.claude/local/TASKS.md`**
- **git 管理外**（global gitignore の `.claude/local/`）。コミットされない個人メモで、各開発者ローカル。
- 無ければ下のテンプレで新規作成する。

## 手順
1. まず `.claude/local/TASKS.md` を読む（無ければテンプレで作成）。
2. 直近の作業を簡潔に反映する:
   - 完了は `- [x]`、進行中/次にやることは `- [ ]` で記録。
   - 日付セクション `## YYYY-MM-DD` 配下に追記。**相対日付（今日/昨日）は絶対日付に変換**。
   - 関連 PR / issue / コミットがあれば短く添える。
3. 構成を保つ: 重複を避け、解決済みの「保留」は更新または削除。肥大化したら古い完了分を圧縮。
4. **このファイルの扱い**: git 管理外のローカル個人メモなので、本番環境のメンテナンス手順・ドメイン/ホスト・インフラ構成・運用トラブルの記録など、**運用に役立つ情報は書いてよい**（リポジトリには入らない前提）。
   - ただし **生のクレデンシャル（パスワード / API キー / トークン / 秘密鍵）は書かない**（環境変数・シークレット管理に置く）。
   - コードや git 履歴から自明な事実の冗長な再記述は避ける。
5. 更新後、**何を追記/変更したかを1〜2行で報告**する。

## 新規作成テンプレート
```markdown
# TASKS（個人用作業ログ・git 管理外）

## YYYY-MM-DD
- [x] 完了したこと
- [ ] 進行中 / 次にやること
```
