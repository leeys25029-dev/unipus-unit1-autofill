const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const data = JSON.parse(fs.readFileSync(__dirname + "/unit1-answers.json", "utf8"));
const script = fs.readFileSync(__dirname + "/unit1-autofill.js", "utf8");

function fixture(index = 0, options = {}) {
  class Field {
    constructor() {
      this._value = "";
      this.tagName = index === 0 ? "INPUT" : "TEXTAREA";
      this.isConnected = true;
      this.isContentEditable = false;
      this.events = [];
    }
    get value() { return this._value; }
    set value(value) { this._value = value; }
    getClientRects() { return [1]; }
    getAttribute() { return null; }
    dispatchEvent(event) { this.events.push(event.type); }
  }
  const section = data.sections[index];
  const fields = Array.from({ length: options.count ?? section.answers.length }, () => new Field());
  if (options.draft) fields[0].value = options.draft;
  if (options.rich) fields[0].isContentEditable = true;
  const listeners = {};
  const context = {
    window: {},
    location: {
      hostname: options.host || "ucontent.unipus.cn",
      pathname: "/_explorationpc_default/pc.html",
      hash: "#/course-v2:754dcc51a002d9a+zzyf_iexplore_rw_senior+2022_02" + section.route,
    },
    document: {
      body: { innerText: data.unit + " " + section.evidence.join(" ") + (options.review ? " 你的答案" : "") },
      querySelectorAll: () => fields,
      addEventListener: (type, handler) => { listeners[type] = handler; },
    },
    HTMLInputElement: Field,
    HTMLTextAreaElement: Field,
    Event: class { constructor(type) { this.type = type; } },
    requestAnimationFrame: callback => callback(),
    console: { log() {}, table() {}, warn() {} },
  };
  vm.runInNewContext(script, context);
  return { api: context.window.UnipusUnit1, fields, listeners, context, section };
}

test("load and preview do not change fields", () => {
  const f = fixture();
  assert.equal(f.api.preview().length, 8);
  assert.ok(f.fields.every(x => x.value === "" && x.events.length === 0));
  assert.deepEqual(Object.keys(f.listeners), []);
});

for (const index of [0, 1]) {
  test(`fill exercise ${index} with input/change only and no submit`, async () => {
    const f = fixture(index);
    const result = await f.api.fill();
    assert.equal(result.submittedByScript, false);
    assert.deepEqual(f.fields.map(x => x.value), f.section.answers);
    assert.ok(f.fields.every(x => x.events.join(",") === "input,change"));
    const event = {
      type: "submit", prevented: false, stopped: false,
      preventDefault() { this.prevented = true; },
      stopImmediatePropagation() { this.stopped = true; },
    };
    f.listeners.submit(event);
    assert.ok(event.prevented && event.stopped);
  });
}

for (const options of [{ count: 7 }, { draft: "existing draft" }, { review: true }, { host: "evil.example" }]) {
  test(`reject unsafe context ${JSON.stringify(options)}`, async () => {
    const f = fixture(0, options);
    await assert.rejects(f.api.fill());
    assert.ok(f.fields.every(x => x.events.length === 0));
  });
}

test("unsupported route, reordered questions, and rich editors are rejected before writing", async () => {
  const wrongRoute = fixture();
  wrongRoute.context.location.hash += "other";
  await assert.rejects(wrongRoute.api.fill());
  const reordered = fixture();
  reordered.context.document.body.innerText = data.unit + " " + [...data.sections[0].evidence].reverse().join(" ");
  await assert.rejects(reordered.api.fill());
  const rich = fixture(1, { rich: true });
  await assert.rejects(rich.api.fill());
  for (const f of [wrongRoute, reordered, rich]) assert.ok(f.fields.every(x => x.events.length === 0));
});
