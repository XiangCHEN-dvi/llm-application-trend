export function MethodologyFooter() {
  return (
    <footer className="histomap-methodology">
      <h2 className="histomap-methodology-title">How this chart is built</h2>
      <ol className="histomap-methodology-list">
        <li>
          <strong>Categories and entries are curated by hand.</strong> Concept
          and product lists, groupings, labels, and summaries live in{" "}
          <code>concepts.json</code> and <code>products.json</code>; they are
          not inferred from the signal APIs.
        </li>
        <li>
          <strong>Monthly heat score</strong> comes from Google Trends{" "}
          <code>interestOverTime</code>: each term in{" "}
          <code>src/data/concept-signals.mjs</code> is queried separately, then the
          monthly maximum across those series is used. Finer-grained points are
          rolled up to each calendar month (monthly maximum). Each term is on
          its own 0–100 scale (peak month = 100 for that query).{" "}
          <code>score</code> is the max across terms for that month; raw per-term
          series are stored in <code>heat-series.json</code> as{" "}
          <code>termTrends</code>.
        </li>
        <li>
          <strong>Band width shows monthly share, not raw score.</strong> Within
          each month, every visible entry&apos;s score is turned into a share of
          that month&apos;s row (scores divided by the monthly total), so widths
          show relative salience among entries on screen.
        </li>
      </ol>
    </footer>
  );
}
