import { UserNote } from "../types";

export async function createStudyNotesPresentation(userNotes: UserNote[]) {
  const pptxModule = await import("pptxgenjs");
  const pres = new pptxModule.default();
  pres.layout = "LAYOUT_WIDE";
  pres.author = "Notsopedia";
  pres.subject = "Notsopedia Study Notes";
  pres.title = "Notsopedia Study Notes";
  pres.company = "Notsopedia";

  const addFooter = (slide: any, pageNumber: number) => {
    slide.addShape("line", {
      x: 0.65,
      y: 7.05,
      w: 12.0,
      h: 0,
      line: { color: "CBD5E1", width: 0.7 }
    });

    slide.addText(`NOTSOPEDIA  |  ${pageNumber}`, {
      x: 10.4,
      y: 7.12,
      w: 2.2,
      h: 0.22,
      fontFace: "Arial",
      fontSize: 8,
      color: "64748B",
      align: "right",
      margin: 0
    });
  };

  let slideNumber = 1;
  const cover = pres.addSlide();
  cover.background = { color: "F8FAFC" };
  cover.addShape("rect", {
    x: 0,
    y: 0,
    w: 13.33,
    h: 0.48,
    fill: { color: "0F172A" },
    line: { color: "0F172A" }
  });
  cover.addText("NOTSOPEDIA", {
    x: 0.9,
    y: 1.7,
    w: 11.5,
    h: 0.65,
    fontFace: "Georgia",
    fontSize: 34,
    bold: true,
    italic: true,
    color: "0F172A",
    align: "center",
    margin: 0
  });
  cover.addText("STUDY NOTEBOOK", {
    x: 0.9,
    y: 2.45,
    w: 11.5,
    h: 0.45,
    fontFace: "Arial",
    fontSize: 18,
    bold: true,
    color: "475569",
    align: "center",
    margin: 0
  });
  cover.addText("Collaborative Academic Notes & Learning Material", {
    x: 1.0,
    y: 3.15,
    w: 11.3,
    h: 0.4,
    fontFace: "Arial",
    fontSize: 14,
    color: "64748B",
    align: "center",
    margin: 0
  });
  cover.addShape("line", {
    x: 4.15,
    y: 4.05,
    w: 5.0,
    h: 0,
    line: { color: "0F172A", width: 1.5 }
  });
  cover.addText(`Exported on ${new Date().toLocaleDateString()}`, {
    x: 1.0,
    y: 4.45,
    w: 11.3,
    h: 0.35,
    fontFace: "Courier New",
    fontSize: 11,
    color: "0F172A",
    bold: true,
    align: "center",
    margin: 0
  });
  cover.addText(`${userNotes.length} study note${userNotes.length === 1 ? "" : "s"} included`, {
    x: 1.0,
    y: 4.9,
    w: 11.3,
    h: 0.35,
    fontFace: "Arial",
    fontSize: 11,
    color: "64748B",
    align: "center",
    margin: 0
  });
  cover.addShape("rect", {
    x: 0,
    y: 7.0,
    w: 13.33,
    h: 0.5,
    fill: { color: "0F172A" },
    line: { color: "0F172A" }
  });
  addFooter(cover, slideNumber++);

  if (userNotes.length === 0) {
    const emptySlide = pres.addSlide();
    emptySlide.addText("No study notes available", {
      x: 1,
      y: 3,
      w: 11.3,
      h: 0.6,
      fontFace: "Georgia",
      fontSize: 24,
      bold: true,
      align: "center",
      color: "0F172A"
    });
    addFooter(emptySlide, slideNumber++);
  }

  userNotes.forEach((note, noteIndex) => {
    const safeTitle = note.title?.trim() || "Untitled Study Note";
    const subject = note.subjectName?.trim() || "General Academic";
    const subjectCode = note.subjectCode?.trim() || "GEN-ACAD";
    const topic = note.topicName?.trim() || "General Topic";
    const uploader = note.uploaderName?.trim() || "Unknown";
    const role = note.uploaderRole?.trim() || "Student";
    const uploadedDate = note.uploadedAt
      ? new Date(note.uploadedAt).toLocaleDateString()
      : "Unknown date";
    const metadata = [
      `Subject: ${subject}`,
      `Code: ${subjectCode}`,
      `Topic: ${topic}`,
      `Author: ${uploader}`,
      `Role: ${role}`,
      `Uploaded: ${uploadedDate}`
    ];

    if (note.language?.trim()) metadata.push(`Language: ${note.language.trim()}`);
    if (note.sourceType?.trim()) metadata.push(`Source: ${note.sourceType.trim()}`);
    if (note.tags?.length) metadata.push(`Tags: ${note.tags.join(", ")}`);

    const cleanContent = (note.content || "")
      .trim()
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n");
    const contentParts: string[] = [];

    if (!cleanContent) {
      contentParts.push("No text content was provided for this note.");
    } else {
      for (let i = 0; i < cleanContent.length; i += 2600) {
        contentParts.push(cleanContent.slice(i, i + 2600));
      }
    }

    contentParts.forEach((contentPart, partIndex) => {
      const slide = pres.addSlide();
      slide.background = { color: "FFFFFF" };
      slide.addShape("rect", {
        x: 0,
        y: 0,
        w: 13.33,
        h: 0.16,
        fill: { color: "0F172A" },
        line: { color: "0F172A" }
      });
      slide.addText(
        partIndex === 0
          ? `NOTE ${noteIndex + 1}  |  ${topic.toUpperCase()}`
          : `NOTE ${noteIndex + 1}  |  CONTINUED`,
        {
          x: 0.7,
          y: 0.38,
          w: 11.9,
          h: 0.28,
          fontFace: "Courier New",
          fontSize: 9,
          bold: true,
          color: "64748B",
          margin: 0
        }
      );
      slide.addText(safeTitle, {
        x: 0.7,
        y: 0.72,
        w: 11.9,
        h: 0.65,
        fontFace: "Georgia",
        fontSize: 21,
        bold: true,
        color: "0F172A",
        margin: 0,
        breakLine: false,
        fit: "shrink"
      });
      slide.addShape("line", {
        x: 0.7,
        y: 1.42,
        w: 11.9,
        h: 0,
        line: { color: "0F172A", width: 1.2 }
      });

      if (partIndex === 0) {
        slide.addText(metadata.join("\n"), {
          x: 0.7,
          y: 1.62,
          w: 3.45,
          h: 2.65,
          fontFace: "Arial",
          fontSize: 9.5,
          color: "334155",
          fill: { color: "F1F5F9" },
          margin: 0.16,
          breakLine: false,
          fit: "shrink"
        });
        slide.addText(contentPart, {
          x: 4.45,
          y: 1.62,
          w: 8.15,
          h: 5.12,
          fontFace: "Arial",
          fontSize: 12,
          color: "1E293B",
          valign: "top",
          margin: 0.08,
          breakLine: false,
          fit: "shrink",
          paraSpaceAfter: 7
        });
      } else {
        slide.addText(contentPart, {
          x: 0.7,
          y: 1.68,
          w: 11.9,
          h: 5.05,
          fontFace: "Arial",
          fontSize: 12,
          color: "1E293B",
          valign: "top",
          margin: 0.08,
          breakLine: false,
          fit: "shrink",
          paraSpaceAfter: 7
        });
      }
      addFooter(slide, slideNumber++);
    });
  });

  return pres;
}
