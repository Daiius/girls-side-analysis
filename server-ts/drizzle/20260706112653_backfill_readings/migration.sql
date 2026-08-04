-- 既存 DB の Characters.reading をマスタ値で backfill する（新規 DB は seed 済み）。
-- 0001 の ALTER で全行 reading='' になった直後に流す想定。管理ユーザで実行。
-- charactersMaster.ts から生成。読みの出典は同ファイル冒頭コメント参照。
UPDATE `Characters` SET `reading` = 'はづきけい' WHERE `name` = '葉月珪';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'もりむらさくや' WHERE `name` = '守村桜弥';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'みはらしき' WHERE `name` = '三原色';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'きじょうまどか' WHERE `name` = '姫条まどか';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'すずかかずま' WHERE `name` = '鈴鹿和馬';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'ひびやわたる' WHERE `name` = '日比谷渉';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'ひむろれいいち' WHERE `name` = '氷室零一';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'あまのはしいっかく' WHERE `name` = '天之橋一鶴';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'あおきちはる' WHERE `name` = '蒼樹千晴';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'てんどうじん' WHERE `name` = '天童壬';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'ますだよしひと' WHERE `name` = '益田義人';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'ありさわしほ' WHERE `name` = '有沢志穂';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'すどうみずき' WHERE `name` = '須藤瑞希';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'ふじいなつみ' WHERE `name` = '藤井奈津美';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'こんのたまみ' WHERE `name` = '紺野珠美';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'つくし' WHERE `name` = '尽';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'はなつばきごろう' WHERE `name` = '花椿吾郎';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'ぎゃりそんいとう' WHERE `name` = 'ギャリソン伊藤';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'さえきてる' WHERE `name` = '佐伯瑛';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'しばかつみ' WHERE `name` = '志波勝己';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'ひかみいたる' WHERE `name` = '氷上格';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'はりやこうのしん' WHERE `name` = '針谷幸之進';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'くりすとふぁー・うぇざーふぃーるど' WHERE `name` = 'クリストファー・ウェザーフィールド';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'あまちしょうた' WHERE `name` = '天地翔太';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'わかおうじたかふみ' WHERE `name` = '若王子貴文';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'まさきもとはる' WHERE `name` = '真咲元春';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'あかぎかずゆき' WHERE `name` = '赤城一雪';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'こもりたく' WHERE `name` = '古森拓';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'まじまたろう' WHERE `name` = '真嶋太郎';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'とうどうたつこ' WHERE `name` = '藤堂竜子';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'おのだちよみ' WHERE `name` = '小野田千代美';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'にしもとはるひ' WHERE `name` = '西本はるひ';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'みずしまひそか' WHERE `name` = '水島密';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'はなつばきひめこ' WHERE `name` = '花椿姫子';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'おとなりゆう' WHERE `name` = '音成遊';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'さくらいるか' WHERE `name` = '桜井琉夏';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'さくらいこういち' WHERE `name` = '桜井琥一';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'ふじやまあらし' WHERE `name` = '不二山嵐';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'にいなじゅんぺい' WHERE `name` = '新名旬平';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'こんのたまお' WHERE `name` = '紺野玉緒';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'したらせいじ' WHERE `name` = '設楽聖司';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'はすみたつや' WHERE `name` = '蓮見達也';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'おおさこちから' WHERE `name` = '大迫力';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'かすがたいよう' WHERE `name` = '春日太陽';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'あいざわしゅうご' WHERE `name` = '藍沢秋吾';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'たいらけんた' WHERE `name` = '平健太';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'うがじんみよ' WHERE `name` = '宇賀神みよ';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'はなつばきかれん' WHERE `name` = '花椿カレン';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'かざまりょうた' WHERE `name` = '風真玲太';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'さっさのぞむ' WHERE `name` = '颯砂希';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'ほんだいく' WHERE `name` = '本多行';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'ななつもりみのる' WHERE `name` = '七ツ森実';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'ひいらぎやのすけ' WHERE `name` = '柊夜ノ介';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'ひむろいのり' WHERE `name` = '氷室一紀';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'みかげこじろう' WHERE `name` = '御影小次郎';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'しらはねだいち' WHERE `name` = '白羽大地';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'しらはねくうや' WHERE `name` = '白羽空也';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'ともえゆきみち' WHERE `name` = '巴征道';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'おおなりいさお' WHERE `name` = '大成功';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'はなつばきみちる' WHERE `name` = '花椿みちる';
--> statement-breakpoint
UPDATE `Characters` SET `reading` = 'はなつばきひかる' WHERE `name` = '花椿ひかる';
