import assert from "assert";
import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { createRequire } from "module";
import { imageSize } from "image-size";
import { imageSizeFromFile } from "image-size/fromFile";
import { createStudyNotesPresentation } from "../src/utils/studyNotesPptx";
import { UserNote } from "../src/types";

const require = createRequire(import.meta.url);
const cjsImageSize = require("image-size");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "notsopedia-pptx-"));
let passed = 0;
let failed = 0;

const zipInspectionScript = [
  "import json, sys, zipfile, xml.etree.ElementTree as ET",
  "with zipfile.ZipFile(sys.argv[1]) as archive:",
  "  assert archive.testzip() is None, 'ZIP CRC validation failed'",
  "  names = set(archive.namelist())",
  "  assert '[Content_Types].xml' in names",
  "  assert 'ppt/presentation.xml' in names",
  "  presentation = ET.fromstring(archive.read('ppt/presentation.xml'))",
  "  size = presentation.find('{http://schemas.openxmlformats.org/presentationml/2006/main}sldSz')",
  "  slides = [name for name in names if name.startswith('ppt/slides/slide') and name.endswith('.xml')]",
  "  media = [name for name in names if name.startswith('ppt/media/') and not name.endswith('/')]",
  "  texts = []",
  "  for name in slides:",
  "    root = ET.fromstring(archive.read(name))",
  "    texts.extend(node.text or '' for node in root.iter() if node.tag.endswith('}t'))",
  "  print(json.dumps({'slides': len(slides), 'media': len(media), 'texts': texts, 'files': sorted(names), 'width': int(size.attrib['cx']), 'height': int(size.attrib['cy'])}))"
].join("\n");

async function test(name: string, run: () => Promise<void> | void) {
  try {
    await run();
    passed++;
    console.log(`  PASS ${name}`);
  } catch (error) {
    failed++;
    console.error(`  FAIL ${name}`);
    console.error(error);
  }
}

function makeNote(overrides: Partial<UserNote> = {}): UserNote {
  return {
    id: "pptx-note",
    title: "Test Note",
    content: "This note contains enough text to validate generated presentation content.",
    subjectName: "Computer Science",
    subjectCode: "CS-101",
    topicName: "Testing",
    uploaderName: "Test User",
    uploaderRole: "Student",
    uploadedAt: "2026-01-01T00:00:00.000Z",
    likes: 0,
    ...overrides
  };
}

function crc32(data: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBytes = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
  return Buffer.concat([length, typeBytes, data, checksum]);
}

function makePng(width: number, height: number): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const rows = Buffer.alloc(height * (width * 4 + 1));
  const pixels = require("zlib").deflateSync(rows);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", pixels),
    pngChunk("IEND", Buffer.alloc(0))
  ]);
}

async function writeAndInspect(
  name: string,
  notes: UserNote[],
  addImages?: (presentation: Awaited<ReturnType<typeof createStudyNotesPresentation>>) => void
) {
  const filePath = path.join(tempDir, `${name}.pptx`);
  const presentation = await createStudyNotesPresentation(notes);
  addImages?.(presentation);
  await presentation.writeFile({ fileName: filePath });
  assert.ok(fs.existsSync(filePath), "PPTX output must exist");
  assert.ok(fs.statSync(filePath).size > 0, "PPTX output must be nonempty");
  const result = execFileSync("python", ["-c", zipInspectionScript, filePath], {
    encoding: "utf8"
  });
  return JSON.parse(result) as {
    slides: number;
    media: number;
    texts: string[];
    files: string[];
    width: number;
    height: number;
  };
}

async function run() {
  console.log("\nNotsopedia real PPTX export regression tests");

  await test("image-size named/default CJS and ESM exports accept PNG buffers", async () => {
    const png = makePng(1, 1);
    assert.strictEqual(typeof imageSize, "function");
    assert.strictEqual(typeof cjsImageSize.imageSize, "function");
    assert.strictEqual(typeof cjsImageSize.default, "function");
    assert.strictEqual(imageSize(png).width, 1);
    assert.strictEqual(cjsImageSize.default(png).height, 1);

    const imagePath = path.join(tempDir, "source.png");
    fs.writeFileSync(imagePath, png);
    const fromFile = await imageSizeFromFile(imagePath);
    assert.deepStrictEqual(
      { width: fromFile.width, height: fromFile.height, type: fromFile.type },
      { width: 1, height: 1, type: "png" }
    );
  });

  await test("text-only note generates a valid PPTX with expected slide and text", async () => {
    const artifact = await writeAndInspect("text-only", [makeNote()]);
    assert.strictEqual(artifact.slides, 2);
    assert.ok(artifact.texts.some((text) => text.includes("Test Note")));
    assert.ok(artifact.files.includes("[Content_Types].xml"));
    assert.ok(artifact.files.includes("ppt/presentation.xml"));
    assert.ok(Math.abs(artifact.width / artifact.height - 16 / 9) < 0.001);
  });

  await test("multiple notes appear in the generated presentation", async () => {
    const artifact = await writeAndInspect("multiple-notes", [
      makeNote({ id: "first", title: "First note" }),
      makeNote({ id: "second", title: "Second note" })
    ]);
    assert.strictEqual(artifact.slides, 3);
    assert.ok(artifact.texts.some((text) => text.includes("First note")));
    assert.ok(artifact.texts.some((text) => text.includes("Second note")));
  });

  await test("empty notes and empty note content produce explanatory slides", async () => {
    const noNotes = await writeAndInspect("empty-deck", []);
    assert.strictEqual(noNotes.slides, 2);
    assert.ok(noNotes.texts.some((text) => text.includes("No study notes available")));

    const emptyNote = await writeAndInspect("empty-content", [makeNote({ content: "" })]);
    assert.strictEqual(emptyNote.slides, 2);
    assert.ok(emptyNote.texts.some((text) => text.includes("No text content was provided")));
  });

  await test("Unicode and multiline text survive PPTX XML generation", async () => {
    const artifact = await writeAndInspect("unicode", [
      makeNote({ title: "शिक्षा — 学習 📚", content: "First line\r\nSecond line\nThird line" })
    ]);
    const joinedText = artifact.texts.join("\n");
    assert.ok(joinedText.includes("शिक्षा"));
    assert.ok(joinedText.includes("学習"));
    assert.ok(joinedText.includes("First line"));
    assert.ok(joinedText.includes("Third line"));
  });

  await test("large content is split over multiple PPTX slides", async () => {
    const artifact = await writeAndInspect("large-content", [
      makeNote({ content: "Academic content ".repeat(600) })
    ]);
    assert.strictEqual(artifact.slides, 5);
    assert.ok(artifact.texts.some((text) => text.includes("CONTINUED")));
  });

  await test("PptxGenJS embeds multiple supported and unusually sized images", async () => {
    const imageOne = makePng(1, 1);
    const imageTwo = makePng(10000, 1);
    assert.deepStrictEqual(
      { width: imageSize(imageTwo).width, height: imageSize(imageTwo).height },
      { width: 10000, height: 1 }
    );

    const artifact = await writeAndInspect("with-images", [makeNote()], (presentation) => {
      const slide = presentation.addSlide();
      slide.addImage({ data: `image/png;base64,${imageOne.toString("base64")}`, x: 1, y: 1, w: 1, h: 1 });
      slide.addImage({ data: `image/png;base64,${imageTwo.toString("base64")}`, x: 2, y: 1, w: 5, h: 1 });
    });
    assert.strictEqual(artifact.media, 2);
    assert.ok(artifact.slides >= 3);
  });

  await test("invalid image data is rejected by image-size without corrupting a text deck", async () => {
    assert.throws(() => imageSize(Buffer.from("not an image")));
    const artifact = await writeAndInspect("invalid-image-isolated", [makeNote()]);
    assert.strictEqual(artifact.media, 0);
    assert.strictEqual(artifact.slides, 2);
  });

  const remaining = fs.readdirSync(tempDir);
  assert.ok(remaining.length > 0, "test artifacts should exist until cleanup");
  fs.rmSync(tempDir, { recursive: true, force: true });
  assert.ok(!fs.existsSync(tempDir), "temporary PPTX artifacts must be removed after the suite");

  console.log(`\nPPTX EXPORT RESULTS: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

run().catch((error) => {
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.error("PPTX test runner failure:", error);
  process.exitCode = 1;
});
