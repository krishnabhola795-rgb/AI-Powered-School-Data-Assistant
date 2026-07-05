// Minimal, safe Markdown-lite renderer for chat responses.
// Supports: # headers, **bold**, *italic*, `code`, - lists, 1. lists, GFM tables, paragraphs.
function escape(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}

function inline(s) {
  s = escape(s);
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  return s;
}

function renderTable(lines) {
  if (lines.length < 2) return null;
  const header = lines[0].split("|").slice(1, -1).map((c) => c.trim());
  const align = lines[1].split("|").slice(1, -1);
  if (!align.every(a => /^\s*:?-+:?\s*$/.test(a))) return null;
  const rows = lines.slice(2).map(r => r.split("|").slice(1, -1).map(c => c.trim()));
  const th = header.map(h => `<th>${inline(h)}</th>`).join("");
  const trs = rows.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join("")}</tr>`).join("");
  return `<table><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>`;
}

export function renderMarkdown(md) {
  if (!md) return "";
  const lines = md.split(/\r?\n/);
  const out = [];
  let i = 0;
  let listBuf = null; // { ordered: bool, items: [] }

  const flushList = () => {
    if (!listBuf) return;
    const tag = listBuf.ordered ? "ol" : "ul";
    out.push(`<${tag}>${listBuf.items.map(x => `<li>${inline(x)}</li>`).join("")}</${tag}>`);
    listBuf = null;
  };

  while (i < lines.length) {
    const line = lines[i];

    // Table detection: line has | and next line is separator
    if (/^\s*\|.*\|\s*$/.test(line) && i+1 < lines.length && /^\s*\|[\s|:-]+\|\s*$/.test(lines[i+1])) {
      flushList();
      const buf = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      const html = renderTable(buf);
      if (html) out.push(html);
      continue;
    }

    if (/^\s*#{1,3}\s+/.test(line)) {
      flushList();
      const m = line.match(/^\s*(#{1,3})\s+(.*)$/);
      const level = m[1].length;
      out.push(`<h${level}>${inline(m[2])}</h${level}>`);
      i++; continue;
    }

    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    const ol = line.match(/^\s*\d+\.\s+(.*)$/);
    if (ul || ol) {
      const ordered = !!ol;
      if (!listBuf || listBuf.ordered !== ordered) { flushList(); listBuf = { ordered, items: [] }; }
      listBuf.items.push(ul ? ul[1] : ol[1]);
      i++; continue;
    }

    if (line.trim() === "") {
      flushList();
      i++; continue;
    }

    flushList();
    out.push(`<p>${inline(line)}</p>`);
    i++;
  }
  flushList();
  return out.join("\n");
}
