
import PptxGenJS from "pptxgenjs";
import { Slide } from "../types";

export const createPptx = async (slides: Slide[], topic: string) => {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  pptx.title = topic;

  for (const slideData of slides) {
    const slide = pptx.addSlide();

    // If we have an original page image (e.g. from PDF), use it as a full background
    if (slideData.originalImageUrl) {
      slide.addImage({
        data: slideData.originalImageUrl,
        x: 0, y: 0, w: "100%", h: "100%",
        sizing: { type: 'cover', w: "100%", h: "100%" }
      });
    } else {
      // Standard Reconstruction for generated content
      slide.addText(slideData.title, {
        x: 0.5, y: 0.4, w: "90%", h: 0.8,
        fontSize: 32, bold: true, color: "1E293B",
      });

      if (slideData.layout === 'title') {
        slide.addText(slideData.content.join('\n'), { x: 1, y: 2.5, w: "80%", h: 2, fontSize: 24, align: 'center' });
      } else {
        slide.addText(slideData.content.map(c => `• ${c}`).join('\n'), { x: 0.5, y: 1.5, w: "45%", h: "70%", fontSize: 18 });
        if (slideData.imageUrl) {
          slide.addImage({ data: slideData.imageUrl, x: 5.2, y: 1.5, w: 4.5, h: 4.5 });
        }
      }
    }

    slide.addNotes(slideData.speakerNotes);
  }

  return pptx;
};
