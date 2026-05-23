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
4. **書かないもの**:
   - 本番ドメイン・ホスト名・インフラ構成・認証情報・DB ユーザ等の本番固有情報。
   - コード・git 履歴・CLAUDE.md から自明な事実（冗長な再記述）。
   - （個人メモだが、万一の流出や将来の公開リポ転記に備えて秘匿情報は持ち込まない）
5. 更新後、**何を追記/変更したかを1〜2行で報告**する。

## 新規作成テンプレート
```markdown
# TASKS（個人用作業ログ・git 管理外）

## YYYY-MM-DD
- [x] 完了したこと
- [ ] 進行中 / 次にやること
```
