"""Build a standalone fill-only script from the original U1 DOCX."""

import json
import re
from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "读写提高级U校园答案" / "U1读写 提高.docx"
NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}


def paragraphs():
    with ZipFile(SOURCE) as package:
        document = ET.fromstring(package.read("word/document.xml"))
    body = document.find("w:body", NS)
    return ["".join(t.text or "" for t in p.findall(".//w:t", NS))
            for p in body.findall("w:p", NS)]


def numbered_answer(text):
    text = text.replace("**", "").replace("\u00a0", " ").strip()
    return re.sub(r"^\d+\s*[)）]\s*", "", text).strip()


def build():
    source = paragraphs()
    if "Unit 1" not in source[1] or source[46].find("Words in use") < 0:
        raise ValueError("DOCX structure changed; recheck paragraph mapping first")
    words = [numbered_answer(x) for x in source[47:55]]
    translations = [numbered_answer(x) for x in source[56:60]]
    if words != ["unprecedented", "metabolic", "counteract", "thermal",
                 "erosion", "finite", "prolong", "skeptical"]:
        raise ValueError("Unexpected Words in use answer mapping")
    if len(translations) != 4 or any(not x for x in translations):
        raise ValueError("Missing translation answers")
    data = {
        "source": SOURCE.relative_to(ROOT).as_posix(),
        "unit": "Unit 1 Challenge",
        "sections": [
            {
                "id": "ae1-words",
                "route": "/courseware/u2/u2g101/u2g107/u2g109",
                "title": "Academic exploration 1 / Words in use",
                "kind": "input",
                "evidence": ["Research suggests that our planet is warming",
                             "rate is the speed at which your body transforms food into energy",
                             "the declining of domestic demand", "management system optimizes battery range",
                             "from winds and weather", "and irreplaceable resource",
                             "the pandemic", "about artificial intelligence"],
                "answers": words,
                "paragraphs": list(range(47, 55)),
            },
            {
                "id": "ae1-translation",
                "route": "/courseware/u2/u2g101/u2g107/u2g110",
                "title": "Academic exploration 1 / Translation",
                "kind": "multiline",
                "evidence": ["A landmark new report on biodiversity and ecosystem",
                             "the loss of fertile topsoil by water, wind",
                             "If the right amount of the boat is submerged",
                             "receive a great amount of direct solar energy"],
                "answers": translations,
                "paragraphs": list(range(56, 60)),
            },
        ],
    }
    encoded = json.dumps(data, ensure_ascii=False, indent=2)
    (ROOT / "unit1-answers.json").write_text(encoded + "\n", encoding="utf-8")
    template = (ROOT / "unit1-autofill.template.js").read_text(encoding="utf-8")
    (ROOT / "unit1-autofill.js").write_text(
        template.replace("/* UNIT1_DATA */ null", encoded), encoding="utf-8")
    print("Built unit1-autofill.js and unit1-answers.json: 8 words + 4 translations")


if __name__ == "__main__":
    build()
