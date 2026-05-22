const fs = require("fs");
const path = require("path");

const AUTH_WORKBOOK_FILE_NAME = "auth-login-details.xlsx";

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) ? (0xEDB88320 ^ (value >>> 1)) : (value >>> 1);
    }
    table[index] = value >>> 0;
  }
  return table;
})();

function resolveAuthWorkbookFile(authDataDir) {
  return path.join(authDataDir, AUTH_WORKBOOK_FILE_NAME);
}

function crc32(buffer) {
  let value = 0xFFFFFFFF;
  for (const byte of buffer) {
    value = CRC32_TABLE[(value ^ byte) & 0xFF] ^ (value >>> 8);
  }
  return (value ^ 0xFFFFFFFF) >>> 0;
}

function toDosDateParts(date = new Date()) {
  const safeDate = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
  const year = Math.max(1980, safeDate.getFullYear());
  const month = safeDate.getMonth() + 1;
  const day = safeDate.getDate();
  const hours = safeDate.getHours();
  const minutes = safeDate.getMinutes();
  const seconds = Math.floor(safeDate.getSeconds() / 2);

  return {
    date: ((year - 1980) << 9) | (month << 5) | day,
    time: (hours << 11) | (minutes << 5) | seconds
  };
}

function createZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const timestamp = toDosDateParts();

  for (const entry of entries) {
    const nameBuffer = Buffer.from(String(entry.name).replace(/\\/g, "/"), "utf8");
    const dataBuffer = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(String(entry.data), "utf8");
    const checksum = crc32(dataBuffer);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034B50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(timestamp.time, 10);
    localHeader.writeUInt16LE(timestamp.date, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(dataBuffer.length, 18);
    localHeader.writeUInt32LE(dataBuffer.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, nameBuffer, dataBuffer);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014B50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(timestamp.time, 12);
    centralHeader.writeUInt16LE(timestamp.date, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(dataBuffer.length, 20);
    centralHeader.writeUInt32LE(dataBuffer.length, 24);
    centralHeader.writeUInt16LE(nameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, nameBuffer);
    offset += localHeader.length + nameBuffer.length + dataBuffer.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054B50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(entries.length, 8);
  endRecord.writeUInt16LE(entries.length, 10);
  endRecord.writeUInt32LE(centralDirectory.length, 12);
  endRecord.writeUInt32LE(offset, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDirectory, endRecord]);
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function columnName(index) {
  let value = index + 1;
  let name = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

function buildSheetRows(header, rows) {
  return [header, ...rows];
}

function buildCell(reference, value) {
  const text = String(value ?? "");
  return `<c r="${reference}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(text)}</t></is></c>`;
}

function buildWorksheetXml(rows) {
  const safeRows = Array.isArray(rows) && rows.length ? rows : [["No data"]];
  const maxColumns = safeRows.reduce((currentMax, row) => Math.max(currentMax, Array.isArray(row) ? row.length : 0), 1);
  const lastCell = `${columnName(Math.max(0, maxColumns - 1))}${safeRows.length}`;

  const rowXml = safeRows.map((row, rowIndex) => {
    const cells = Array.from({ length: maxColumns }, (_, columnIndex) => {
      const cellReference = `${columnName(columnIndex)}${rowIndex + 1}`;
      return buildCell(cellReference, Array.isArray(row) ? row[columnIndex] ?? "" : "");
    }).join("");
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join("");

  return [
    "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>",
    "<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\">",
    `<dimension ref="A1:${lastCell}"/>`,
    "<sheetViews><sheetView workbookViewId=\"0\"/></sheetViews>",
    "<sheetFormatPr defaultRowHeight=\"15\"/>",
    `<sheetData>${rowXml}</sheetData>`,
    "</worksheet>"
  ].join("");
}

function buildWorkbookXml(sheetNames) {
  const sheetsXml = sheetNames.map((sheetName, index) => (
    `<sheet name="${escapeXml(sheetName)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`
  )).join("");

  return [
    "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>",
    "<workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\">",
    "<bookViews><workbookView/></bookViews>",
    `<sheets>${sheetsXml}</sheets>`,
    "</workbook>"
  ].join("");
}

function buildWorkbookRelationshipsXml(sheetCount) {
  const worksheetRelationships = Array.from({ length: sheetCount }, (_, index) => (
    `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`
  )).join("");

  return [
    "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>",
    "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">",
    worksheetRelationships,
    `<Relationship Id="rId${sheetCount + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`,
    "</Relationships>"
  ].join("");
}

function buildContentTypesXml(sheetCount) {
  const overrides = Array.from({ length: sheetCount }, (_, index) => (
    `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  )).join("");

  return [
    "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>",
    "<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">",
    "<Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>",
    "<Default Extension=\"xml\" ContentType=\"application/xml\"/>",
    "<Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/>",
    "<Override PartName=\"/xl/styles.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml\"/>",
    "<Override PartName=\"/docProps/core.xml\" ContentType=\"application/vnd.openxmlformats-package.core-properties+xml\"/>",
    "<Override PartName=\"/docProps/app.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.extended-properties+xml\"/>",
    overrides,
    "</Types>"
  ].join("");
}

function buildPackageRelationshipsXml() {
  return [
    "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>",
    "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">",
    "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/>",
    "<Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties\" Target=\"docProps/core.xml\"/>",
    "<Relationship Id=\"rId3\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties\" Target=\"docProps/app.xml\"/>",
    "</Relationships>"
  ].join("");
}

function buildCorePropertiesXml(timestamp) {
  const safeTimestamp = escapeXml(timestamp);
  return [
    "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>",
    "<cp:coreProperties xmlns:cp=\"http://schemas.openxmlformats.org/package/2006/metadata/core-properties\" xmlns:dc=\"http://purl.org/dc/elements/1.1/\" xmlns:dcterms=\"http://purl.org/dc/terms/\" xmlns:dcmitype=\"http://purl.org/dc/dcmitype/\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">",
    "<dc:creator>bug-rca-ui</dc:creator>",
    "<cp:lastModifiedBy>bug-rca-ui</cp:lastModifiedBy>",
    `<dcterms:created xsi:type="dcterms:W3CDTF">${safeTimestamp}</dcterms:created>`,
    `<dcterms:modified xsi:type="dcterms:W3CDTF">${safeTimestamp}</dcterms:modified>`,
    "</cp:coreProperties>"
  ].join("");
}

function buildAppPropertiesXml(sheetNames) {
  const titles = sheetNames.map((sheetName) => `<vt:lpstr>${escapeXml(sheetName)}</vt:lpstr>`).join("");
  return [
    "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>",
    "<Properties xmlns=\"http://schemas.openxmlformats.org/officeDocument/2006/extended-properties\" xmlns:vt=\"http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes\">",
    "<Application>bug-rca-ui</Application>",
    "<DocSecurity>0</DocSecurity>",
    "<ScaleCrop>false</ScaleCrop>",
    "<HeadingPairs><vt:vector size=\"2\" baseType=\"variant\"><vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant><vt:variant><vt:i4>" + sheetNames.length + "</vt:i4></vt:variant></vt:vector></HeadingPairs>",
    `<TitlesOfParts><vt:vector size="${sheetNames.length}" baseType="lpstr">${titles}</vt:vector></TitlesOfParts>`,
    "</Properties>"
  ].join("");
}

function buildStylesXml() {
  return [
    "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>",
    "<styleSheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\">",
    "<fonts count=\"1\"><font><sz val=\"11\"/><name val=\"Calibri\"/><family val=\"2\"/></font></fonts>",
    "<fills count=\"2\"><fill><patternFill patternType=\"none\"/></fill><fill><patternFill patternType=\"gray125\"/></fill></fills>",
    "<borders count=\"1\"><border><left/><right/><top/><bottom/><diagonal/></border></borders>",
    "<cellStyleXfs count=\"1\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\"/></cellStyleXfs>",
    "<cellXfs count=\"1\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\"/></cellXfs>",
    "<cellStyles count=\"1\"><cellStyle name=\"Normal\" xfId=\"0\" builtinId=\"0\"/></cellStyles>",
    "</styleSheet>"
  ].join("");
}

function buildSummaryRows(authUsersStore, localAccountsStore, generatedAt) {
  const authUsers = authUsersStore?.users && typeof authUsersStore.users === "object" ? Object.keys(authUsersStore.users).length : 0;
  const localAccounts = localAccountsStore?.accounts && typeof localAccountsStore.accounts === "object" ? Object.keys(localAccountsStore.accounts).length : 0;

  return buildSheetRows(
    ["Field", "Value"],
    [
      ["Generated At", generatedAt],
      ["Auth Users Updated At", authUsersStore?.updatedAt || ""],
      ["Auth User Count", String(authUsers)],
      ["Local Accounts Updated At", localAccountsStore?.updatedAt || ""],
      ["Local Account Count", String(localAccounts)]
    ]
  );
}

function buildAuthUserRows(authUsersStore) {
  const entries = Object.entries(authUsersStore?.users || {}).sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));
  return buildSheetRows(
    [
      "Record Key",
      "Subject",
      "Username",
      "Display Name",
      "Email",
      "Employee ID",
      "Given Name",
      "Family Name",
      "Groups",
      "Roles",
      "Provider",
      "Issuer",
      "First Login At",
      "Last Login At"
    ],
    entries.map(([key, record]) => ([
      key,
      record?.subject || "",
      record?.username || "",
      record?.displayName || "",
      record?.email || "",
      record?.employeeId || "",
      record?.givenName || "",
      record?.familyName || "",
      Array.isArray(record?.groups) ? record.groups.join("; ") : "",
      Array.isArray(record?.roles) ? record.roles.join("; ") : "",
      record?.provider || "",
      record?.issuer || "",
      record?.firstLoginAt || "",
      record?.lastLoginAt || ""
    ]))
  );
}

function buildLocalAccountRows(localAccountsStore) {
  const entries = Object.entries(localAccountsStore?.accounts || {}).sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));
  return buildSheetRows(
    [
      "Account Key",
      "Email",
      "Registered At",
      "Updated At",
      "Last Login At",
      "Provider",
      "Roles"
    ],
    entries.map(([key, account]) => ([
      key,
      account?.email || "",
      account?.registeredAt || "",
      account?.updatedAt || "",
      account?.lastLoginAt || "",
      "Local Account",
      "registered-user"
    ]))
  );
}

function buildWorkbookBuffer(authUsersStore, localAccountsStore, generatedAt) {
  const sheets = [
    { name: "Summary", rows: buildSummaryRows(authUsersStore, localAccountsStore, generatedAt) },
    { name: "AuthUsers", rows: buildAuthUserRows(authUsersStore) },
    { name: "LocalAccounts", rows: buildLocalAccountRows(localAccountsStore) }
  ];
  const sheetNames = sheets.map((sheet) => sheet.name);

  return createZip([
    { name: "[Content_Types].xml", data: buildContentTypesXml(sheets.length) },
    { name: "_rels/.rels", data: buildPackageRelationshipsXml() },
    { name: "docProps/core.xml", data: buildCorePropertiesXml(generatedAt) },
    { name: "docProps/app.xml", data: buildAppPropertiesXml(sheetNames) },
    { name: "xl/workbook.xml", data: buildWorkbookXml(sheetNames) },
    { name: "xl/_rels/workbook.xml.rels", data: buildWorkbookRelationshipsXml(sheets.length) },
    { name: "xl/styles.xml", data: buildStylesXml() },
    ...sheets.map((sheet, index) => ({
      name: `xl/worksheets/sheet${index + 1}.xml`,
      data: buildWorksheetXml(sheet.rows)
    }))
  ]);
}

function writeAuthWorkbook({ filePath, authUsersStore, localAccountsStore }) {
  const generatedAt = new Date().toISOString();
  const workbookBuffer = buildWorkbookBuffer(authUsersStore, localAccountsStore, generatedAt);

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, workbookBuffer);

  return {
    filePath,
    generatedAt,
    authUserCount: Object.keys(authUsersStore?.users || {}).length,
    localAccountCount: Object.keys(localAccountsStore?.accounts || {}).length
  };
}

module.exports = {
  AUTH_WORKBOOK_FILE_NAME,
  resolveAuthWorkbookFile,
  writeAuthWorkbook
};
