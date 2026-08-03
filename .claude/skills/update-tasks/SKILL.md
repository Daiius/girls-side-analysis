---
name: update-tasks
description: Update this project's personal task log at .claude/local/TASKS.md. Use when the user asks to record progress, log completed/in-progress work, add a TODO, or says "update TASKS" / "タスクを記録". Keeps the log organized, dated, and free of secrets and production-specific details.
---

# update-tasks

個人用の作業ログ `.claude/local/TASKS.md` を更新するスキル。

## 前提
- 場所: リポジトリルートの **`.claude/local/TASKS.md`**
- **git 管理外**。除外はリポジトリ内の 2 箇所で二重にかかっている（global gitignore ではない）:
  - ルート `.gitignore` の `/.claude/local/`
  - `.claude/local/.gitignore` の `*`
  コミットされない個人メモで、各開発者ローカル。
- 無ければ下のテンプレで新規作成する。

## 手順
1. まず `.claude/local/TASKS.md` を読む（無ければテンプレで作成）。
2. 直近の作業を簡潔に反映する:
   - 完了は `- [x]`、進行中/次にやることは `- [ ]` で記録。
   - 日付セクション `## YYYY-MM-DD` 配下に追記。**相対日付（今日/昨日）は絶対日付に変換**。
   - 関連 PR / issue / コミットがあれば短く添える。
3. 構成を保つ: 重複を避け、解決済みの「保留」は更新または削除。
   - **完了した作業は `.claude/local/TASKS-archive.md` へ移す**（新しいものが上）。
     TASKS.md 側には 1 行のポインタだけ残す。無ければ作る。
   - ⚠️ **まとめて移さない。** 完了した節には「まだ手が必要な項目」「この先の作業が参照する知見」が
     混ざっていることが多い。**移す前に中身を仕分けし、生きているものは TASKS.md に残す**
     （未修正のバグ、未着手の TODO、次の作業が前提にする実測値・方針など）。
   - アーカイブに置くのは「終わったが、経緯や実測値を後から参照したくなるもの」だけ。
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
