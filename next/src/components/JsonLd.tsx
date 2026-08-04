/**
 * JSON-LD を `<script type="application/ld+json">` として出す。
 *
 * App Router では head を直接触らず、コンポーネントツリーの中にこの script を
 * 置くのが Next.js のやり方（`metadata` は JSON-LD を扱えない）。
 */
const JsonLd = ({ data }: { data: object }) => (
  <script
    type='application/ld+json'
    // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD は script の中身として出すしかなく、React の子要素にすると HTML エスケープされて JSON が壊れる
    dangerouslySetInnerHTML={{
      // `</script>` でのブレイクアウトを防ぐ。データにはキャラ名（DB 由来）が入るため、
      // 「自分たちのデータだから安全」に寄りかからない。
      __html: JSON.stringify(data).replace(/</g, '\\u003c'),
    }}
  />
);

export default JsonLd;
