function extractTopLevelItems(xml: string): string[] {
  const items: string[] = [];
  let depth = 0;
  let start = -1;
  let i = 0;

  while (i < xml.length) {
    if (xml[i] !== "<") {
      i++;
      continue;
    }
    const gt = xml.indexOf(">", i);
    if (gt === -1) break;
    const tag = xml.slice(i, gt + 1);
    if (tag.startsWith("<item") && !tag.endsWith("/>")) {
      if (depth === 0) start = i;
      depth++;
    } else if (tag === "</item>") {
      depth--;
      if (depth === 0 && start >= 0) {
        items.push(xml.slice(start, gt + 1));
        start = -1;
      }
    }
    i = gt + 1;
  }

  return items;
}

function getInner(itemXml: string): string {
  const gt = itemXml.indexOf(">");
  const last = itemXml.lastIndexOf("</item>");
  return itemXml.slice(gt + 1, last);
}

function findValueTag(xml: string): { attrs: string; content: string } | null {
  const vs = xml.indexOf("<value");
  if (vs === -1) return null;
  const gt = xml.indexOf(">", vs);
  const tag = xml.slice(vs, gt + 1);
  if (tag.endsWith("/>")) return { attrs: tag, content: "" };

  let depth = 1;
  let i = gt + 1;
  while (i < xml.length && depth > 0) {
    if (xml[i] === "<") {
      const e = xml.indexOf(">", i);
      const t = xml.slice(i, e + 1);
      if (t.startsWith("<value") && !t.endsWith("/>")) depth++;
      else if (t === "</value>") depth--;
      i = e + 1;
    } else {
      i++;
    }
  }

  return { attrs: tag, content: xml.slice(gt + 1, i - 8) };
}

function parseVal(attrs: string, content: string): unknown {
  if (attrs.includes("xsi:nil")) return null;
  if (attrs.includes("SOAP-ENC:Array") || attrs.includes("arrayType")) {
    return parseArray(content);
  }
  if (attrs.includes("ns2:Map")) return parseMap(content);

  const value = content.trim();
  if (value === "") return null;
  if (/^-?\d+$/.test(value)) return parseInt(value, 10);
  if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);
  return value;
}

function parseMap(xml: string): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const item of extractTopLevelItems(xml)) {
    const inner = getInner(item);
    const keyMatch = inner.match(/<key[^>]*>([^<]*)<\/key>/);
    if (!keyMatch) continue;
    const valueTag = findValueTag(inner);
    obj[keyMatch[1]] = valueTag ? parseVal(valueTag.attrs, valueTag.content) : null;
  }
  return obj;
}

function parseArray(xml: string): unknown[] {
  return extractTopLevelItems(xml).map((item) => parseMap(getInner(item)));
}

export function parseKasSoapResponse(xml: string): unknown {
  const fault = xml.match(/<faultstring>([^<]+)<\/faultstring>/);
  if (fault) {
    throw new Error(fault[1]);
  }

  const returnStart = xml.indexOf("<return");
  const returnEnd = xml.lastIndexOf("</return>");
  if (returnStart === -1 || returnEnd === -1) {
    throw new Error("Return-Block nicht gefunden");
  }

  const returnTagEnd = xml.indexOf(">", returnStart);
  const returnContent = xml.slice(returnTagEnd + 1, returnEnd);
  const topMap = parseMap(returnContent);
  const response = topMap.Response as Record<string, unknown> | undefined;
  if (!response) {
    throw new Error("Response-Block nicht gefunden");
  }

  if (response.ReturnInfo !== undefined && response.ReturnInfo !== null) {
    return response.ReturnInfo;
  }

  return response.ReturnString ?? response;
}
