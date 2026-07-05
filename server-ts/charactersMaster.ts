/**
 * キャラクターのマスタデータ。
 * - addTestData.ts（新規 DB への seed）
 * - backfillCharacterReadings.ts（既存 DB への reading 後付け）
 * の両方から参照する。
 *
 * reading は検索用の読み仮名（ひらがな・姓名間の区切りなし）。
 * Wikipedia の各作品記事の表記で検証済み（2026-07 時点）。
 * 「きじょうまどか」「さくらいこういち」「かざまりょうた」「つくし」など
 * 直感に反する読みが多いので、変更時は必ず出典に当たること。
 */
export const charactersMaster: {
  name: string;
  series: number;
  sort: number;
  reading: string;
}[] = [
  // GS1
  { name: '葉月珪',     series: 1, sort: 1,  reading: 'はづきけい' },
  { name: '守村桜弥',   series: 1, sort: 2,  reading: 'もりむらさくや' },
  { name: '三原色',     series: 1, sort: 3,  reading: 'みはらしき' },
  { name: '姫条まどか', series: 1, sort: 4,  reading: 'きじょうまどか' },
  { name: '鈴鹿和馬',   series: 1, sort: 5,  reading: 'すずかかずま' },
  { name: '日比谷渉',   series: 1, sort: 6,  reading: 'ひびやわたる' },
  { name: '氷室零一',   series: 1, sort: 7,  reading: 'ひむろれいいち' },
  { name: '天之橋一鶴', series: 1, sort: 8,  reading: 'あまのはしいっかく' },
  { name: '蒼樹千晴',   series: 1, sort: 9,  reading: 'あおきちはる' },
  { name: '天童壬',     series: 1, sort: 10, reading: 'てんどうじん' },
  { name: '益田義人',   series: 1, sort: 11, reading: 'ますだよしひと' },
  { name: '有沢志穂',   series: 1, sort: 12, reading: 'ありさわしほ' },
  { name: '須藤瑞希',   series: 1, sort: 13, reading: 'すどうみずき' },
  { name: '藤井奈津美', series: 1, sort: 14, reading: 'ふじいなつみ' },
  { name: '紺野珠美',   series: 1, sort: 15, reading: 'こんのたまみ' },
  { name: '尽',         series: 1, sort: 16, reading: 'つくし' },
  { name: '花椿吾郎',   series: 1, sort: 17, reading: 'はなつばきごろう' },
  { name: 'ギャリソン伊藤', series: 1, sort: 18, reading: 'ぎゃりそんいとう' },
  // GS2
  { name: '佐伯瑛',     series: 2, sort: 1,  reading: 'さえきてる' },
  { name: '志波勝己',   series: 2, sort: 2,  reading: 'しばかつみ' },
  { name: '氷上格',     series: 2, sort: 3,  reading: 'ひかみいたる' },
  { name: '針谷幸之進', series: 2, sort: 4,  reading: 'はりやこうのしん' },
  { name: 'クリストファー・ウェザーフィールド', series: 2, sort: 5, reading: 'くりすとふぁー・うぇざーふぃーるど' },
  { name: '天地翔太',   series: 2, sort: 6,  reading: 'あまちしょうた' },
  { name: '若王子貴文', series: 2, sort: 7,  reading: 'わかおうじたかふみ' },
  { name: '真咲元春',   series: 2, sort: 8,  reading: 'まさきもとはる' },
  { name: '赤城一雪',   series: 2, sort: 9,  reading: 'あかぎかずゆき' },
  { name: '古森拓',     series: 2, sort: 10, reading: 'こもりたく' },
  { name: '真嶋太郎',   series: 2, sort: 11, reading: 'まじまたろう' },
  { name: '藤堂竜子',   series: 2, sort: 12, reading: 'とうどうたつこ' },
  { name: '小野田千代美', series: 2, sort: 13, reading: 'おのだちよみ' },
  { name: '西本はるひ', series: 2, sort: 14, reading: 'にしもとはるひ' },
  { name: '水島密',     series: 2, sort: 15, reading: 'みずしまひそか' },
  { name: '花椿姫子',   series: 2, sort: 16, reading: 'はなつばきひめこ' },
  { name: '音成遊',     series: 2, sort: 17, reading: 'おとなりゆう' },
  // GS3
  { name: '桜井琉夏',   series: 3, sort: 1,  reading: 'さくらいるか' },
  { name: '桜井琥一',   series: 3, sort: 2,  reading: 'さくらいこういち' },
  { name: '不二山嵐',   series: 3, sort: 3,  reading: 'ふじやまあらし' },
  { name: '新名旬平',   series: 3, sort: 4,  reading: 'にいなじゅんぺい' },
  { name: '紺野玉緒',   series: 3, sort: 5,  reading: 'こんのたまお' },
  { name: '設楽聖司',   series: 3, sort: 6,  reading: 'したらせいじ' },
  { name: '蓮見達也',   series: 3, sort: 7,  reading: 'はすみたつや' },
  { name: '大迫力',     series: 3, sort: 8,  reading: 'おおさこちから' },
  { name: '春日太陽',   series: 3, sort: 9,  reading: 'かすがたいよう' },
  { name: '藍沢秋吾',   series: 3, sort: 10, reading: 'あいざわしゅうご' },
  { name: '平健太',     series: 3, sort: 11, reading: 'たいらけんた' },
  { name: '宇賀神みよ', series: 3, sort: 12, reading: 'うがじんみよ' },
  { name: '花椿カレン', series: 3, sort: 13, reading: 'はなつばきかれん' },
  // GS4
  { name: '風真玲太',   series: 4, sort: 1,  reading: 'かざまりょうた' },
  { name: '颯砂希',     series: 4, sort: 2,  reading: 'さっさのぞむ' },
  { name: '本多行',     series: 4, sort: 3,  reading: 'ほんだいく' },
  { name: '七ツ森実',   series: 4, sort: 4,  reading: 'ななつもりみのる' },
  { name: '柊夜ノ介',   series: 4, sort: 5,  reading: 'ひいらぎやのすけ' },
  { name: '氷室一紀',   series: 4, sort: 6,  reading: 'ひむろいのり' },
  { name: '御影小次郎', series: 4, sort: 7,  reading: 'みかげこじろう' },
  { name: '白羽大地',   series: 4, sort: 8,  reading: 'しらはねだいち' },
  { name: '白羽空也',   series: 4, sort: 9,  reading: 'しらはねくうや' },
  { name: '巴征道',     series: 4, sort: 10, reading: 'ともえゆきみち' },
  { name: '大成功',     series: 4, sort: 11, reading: 'おおなりいさお' },
  { name: '花椿みちる', series: 4, sort: 12, reading: 'はなつばきみちる' },
  { name: '花椿ひかる', series: 4, sort: 13, reading: 'はなつばきひかる' },
];
