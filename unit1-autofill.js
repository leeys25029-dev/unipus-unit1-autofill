/* Build with build_unit1.py. Load the generated file in the Safari page console. */
(() => {
  "use strict";
  const DATA = {
  "source": "读写提高级U校园答案/U1读写 提高.docx",
  "unit": "Unit 1 Challenge",
  "sections": [
    {
      "id": "ae1-words",
      "route": "/courseware/u2/u2g101/u2g107/u2g109",
      "title": "Academic exploration 1 / Words in use",
      "kind": "input",
      "evidence": [
        "Research suggests that our planet is warming",
        "rate is the speed at which your body transforms food into energy",
        "the declining of domestic demand",
        "management system optimizes battery range",
        "from winds and weather",
        "and irreplaceable resource",
        "the pandemic",
        "about artificial intelligence"
      ],
      "answers": [
        "unprecedented",
        "metabolic",
        "counteract",
        "thermal",
        "erosion",
        "finite",
        "prolong",
        "skeptical"
      ],
      "paragraphs": [
        47,
        48,
        49,
        50,
        51,
        52,
        53,
        54
      ]
    },
    {
      "id": "ae1-translation",
      "route": "/courseware/u2/u2g101/u2g107/u2g110",
      "title": "Academic exploration 1 / Translation",
      "kind": "multiline",
      "evidence": [
        "A landmark new report on biodiversity and ecosystem",
        "the loss of fertile topsoil by water, wind",
        "If the right amount of the boat is submerged",
        "receive a great amount of direct solar energy"
      ],
      "answers": [
        "周一，一份关于生物多样性和生态系统的里程碑式的新报告在巴黎发布，对全球自然界前所未有的衰退速度发出了警告。",
        "土壤侵蚀是水、风以及耕作导致的肥沃表土流失，这已是全球性问题，其后果正受到越来越广泛的关注。",
        "如果适量的船体没入水中，强大的浮力足以抵消将船向下拉坠的重力，船就会漂浮起来。",
        "热带地区接收到大量太阳直射的能量，比高纬度地区产生更多的蒸发。"
      ],
      "paragraphs": [
        56,
        57,
        58,
        59
      ]
    }
  ]
};
  const COURSE = "#/course-v2:754dcc51a002d9a+zzyf_iexplore_rw_senior+2022_02";
  const normalize = value => String(value).replace(/\s+/g, " ").trim();
  const visible = element => element.getClientRects().length > 0;
  const read = element => element.isContentEditable ? element.textContent : element.value;
  let guarded = false;

  function plan() {
    if (location.hostname !== "ucontent.unipus.cn" ||
        location.pathname !== "/_explorationpc_default/pc.html") {
      throw new Error("Not the supported Unipus course page");
    }
    const section = DATA.sections.find(item => location.hash === COURSE + item.route);
    if (!section) throw new Error("Unsupported exercise; no fields changed");
    const text = normalize(document.body.innerText);
    if (!text.includes(DATA.unit)) throw new Error("Unit 1 identity missing");
    if (text.includes("答案解析") || text.includes("你的答案")) {
      throw new Error("Already answered/review mode; no fields changed");
    }
    let previous = -1;
    for (const evidence of section.evidence) {
      const position = text.indexOf(evidence, previous + 1);
      if (position < 0) throw new Error("Question text/order mismatch: " + evidence);
      previous = position;
    }
    const selector = section.kind === "input" ? 'input:not([type]), input[type="text"]' :
      'textarea, [contenteditable="true"], [contenteditable=""]';
    const fields = [...document.querySelectorAll(selector)].filter(element =>
      visible(element) && !element.disabled && !element.readOnly &&
      element.getAttribute("aria-disabled") !== "true" &&
      !element.parentElement?.closest('[contenteditable="true"], [contenteditable=""]'));
    if (fields.length !== section.answers.length) {
      throw new Error(`Field count mismatch: ${fields.length}, expected ${section.answers.length}`);
    }
    for (let i = 0; i < fields.length; i++) {
      const current = normalize(read(fields[i]));
      if (current && current !== normalize(section.answers[i])) {
        throw new Error(`Field ${i + 1} contains a different draft; will not overwrite`);
      }
    }
    return { section, fields };
  }

  function block(event) {
    let blocked = event.type === "submit";
    if (event.type === "keydown") {
      blocked = event.key === "Enter" && Boolean(event.target.closest("input, textarea, [contenteditable]"));
    }
    if (event.type === "click") {
      for (let element = event.target; element && element !== document.body; element = element.parentElement) {
        const label = String(element.innerText || element.value || element.getAttribute?.("aria-label") || "")
          .replace(/\s+/g, "");
        if (element.matches?.('button[type="submit"], input[type="submit"]') ||
            (label.length < 80 && /提交|交卷|submit|finishattempt/i.test(label))) {
          blocked = true;
          break;
        }
      }
    }
    if (blocked) {
      event.preventDefault();
      event.stopImmediatePropagation();
      console.warn("Unit 1 fill-only guard blocked submission/Enter");
    }
  }

  function guard() {
    if (guarded) return;
    for (const type of ["submit", "click", "keydown"]) document.addEventListener(type, block, true);
    guarded = true;
  }

  function preview() {
    const { section, fields } = plan();
    const result = fields.map((element, i) => ({
      question: i + 1, current: read(element), answer: section.answers[i],
    }));
    console.log(section.title + ": preview only, nothing changed");
    console.table(result);
    return result;
  }

  async function fill() {
    const { section, fields } = plan();
    if (fields.some(element => element.isContentEditable)) {
      throw new Error("Rich-text editor unsupported; no fields changed");
    }
    const hash = location.hash;
    guard();
    for (let i = 0; i < fields.length; i++) {
      if (location.hash !== hash || !fields[i].isConnected) {
        throw new Error("Page changed while filling; stopped without navigation or submission");
      }
      const element = fields[i];
      if (normalize(read(element)) === normalize(section.answers[i])) continue;
      const prototype = element.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(prototype, "value").set.call(element, section.answers[i]);
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    }
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    if (location.hash !== hash || fields.some((element, i) =>
      !element.isConnected || normalize(read(element)) !== normalize(section.answers[i]))) {
      throw new Error("Values did not persist in the current DOM; inspect the page manually");
    }
    const result = { exercise: section.title, filled: fields.length, submittedByScript: false };
    console.log(result, "Stay on this page to review. No navigation or submit calls were made.");
    return result;
  }

  if (window.UnipusUnit1) {
    console.warn("UnipusUnit1 already loaded; reuse the existing instance");
    return;
  }
  window.UnipusUnit1 = Object.freeze({ preview, fill, sections: DATA.sections.map(s => ({ id: s.id, title: s.title })) });
  console.log("Loaded fill-only Unit 1 pilot. Run UnipusUnit1.preview(), then UnipusUnit1.fill().");
})();
