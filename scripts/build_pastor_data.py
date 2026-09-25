from pathlib import Path
from openpyxl import load_workbook
import json
import re


SOURCE = Path("/Users/joshuagbafa/Downloads/PASTORS DATA.xlsx")
ROOT = Path(__file__).resolve().parents[1]


def clean(value):
    if value is None:
        return ""
    value = re.sub(r"\s+", " ", str(value)).strip()
    value = re.sub(r"\s+\.\s+", " ", value)
    return value


def name_case(value):
    words = []
    for part in clean(value).split():
        words.append("-".join(piece.capitalize() for piece in part.split("-")))
    return " ".join(words)


workbook = load_workbook(SOURCE, read_only=True, data_only=True)
sheet = workbook.active
headers = [clean(cell.value) for cell in sheet[1]]
positions = {header: index for index, header in enumerate(headers)}

entries = []
seen = set()
for row in sheet.iter_rows(min_row=2, values_only=True):
    row = tuple(row) + (None,) * max(0, len(headers) - len(row))
    is_leader = (
        "BISHOP" in clean(row[positions["ADMINRANK"]]).upper()
        or clean(row[positions["STATUSRANK"]]).upper() == "BISHOP"
        or bool(row[positions["YEARCONSECRATED"]])
    )
    if is_leader:
        continue
    name = name_case(row[positions["FULLNAME"]])
    denomination = clean(row[positions["DENOMINATION"]])
    branch = name_case(row[positions["BRANCH"]])
    if "FIRST LOVE" in denomination.upper():
        denomination = "PASTORAL NETWORK"
    branch = re.sub(r"(?i)first\s*love", "Central Church", branch)
    country = name_case(row[positions["COUNTRY"]])
    if not name or not denomination:
        continue
    key = (re.sub(r"[^a-z]", "", name.lower()), denomination.lower(), branch.lower(), country.lower())
    if key in seen:
        continue
    seen.add(key)
    entries.append({
        "code": len(entries) + 1,
        "name": name,
        "organization": denomination,
        "region": country or "International",
        "branch": branch,
        "image": None,
        "amount": 50,
        "yearAppointed": clean(row[positions["YEARAPPOINTED"]]),
        "yearOrdained": clean(row[positions["YEARORDAINED"]]),
    })

(ROOT / "data" / "pastors.js").write_text(
    "window.PASTORS = " + json.dumps(entries, ensure_ascii=False, separators=(",", ":")) + ";\n"
)
print(json.dumps({"pastors": len(entries), "first": entries[:2], "last": entries[-1:]}, indent=2))
