import PptxGenJS from "pptxgenjs";
import { Slide } from "../types";

export const createPptx = async (slides: Slide[], topic: string) => {
  const pptx = new PptxGenJS();

  pptx.layout = "LAYOUT_16x9";
  pptx.title = topic;
  pptx.author = "Lumina AI";

  // Master Slide Definition (Simple Theme)
  pptx.defineSlideMaster({
    title: "MASTER_SLIDE",
    background: { color: "F8FAFC" }, // Slate-50
    objects: [
      {
        rect: { x: 0, y: 0, w: "100%", h: 0.1, fill: { color: "6366F1" } }, // Top bar (Indigo-500)
      },
      {
        text: {
            text: "Created with Lumina AI",
            options: { x: 0.5, y: "95%", w: 4, h: 0.3, fontSize: 9, color: "94A3B8" }
        }
      }
    ],
  });

  for (const slideData of slides) {
    const slide = pptx.addSlide({ masterName: "MASTER_SLIDE" });

    // Title
    slide.addText(slideData.title, {
      x: 0.5,
      y: 0.4,
      w: "90%",
      h: 0.8,
      fontSize: 32,
      fontFace: "Arial",
      bold: true,
      color: "1E293B",
    });

    // Content & Image Logic based on Layout
    if (slideData.layout === 'title') {
         // Centered Title Slide
         slide.addText(slideData.content.join('\n'), {
            x: 1, y: 2.5, w: "80%", h: 2,
            fontSize: 24, align: 'center', color: "475569"
         });
         
         // Background image if available, set heavily transparent or small
         if (slideData.imageUrl) {
             slide.addImage({
                 data: slideData.imageUrl,
                 x: "35%", y: 4.5, w: 3, h: 2,
             });
         }

    } else if (slideData.layout === 'diagram_center') {
        // Diagram takes center stage
        if (slideData.imageUrl) {
            slide.addImage({
                data: slideData.imageUrl,
                x: 1.5, y: 1.5, w: 7, h: 4.5,
                sizing: { type: 'contain', w: 7, h: 4.5 }
            });
        }
        
        slide.addText(slideData.content.join('\n• '), {
            x: 1, y: 6.2, w: "80%", h: 1,
            fontSize: 14, color: "334155"
        });

    } else {
        // Content Left or Right
        const isLeft = slideData.layout === 'content_left';
        
        // Text Box
        slide.addText(slideData.content.map(c => `• ${c}`).join('\n'), {
            x: isLeft ? 0.5 : 5.5,
            y: 1.5,
            w: 4.5,
            h: 4.5,
            fontSize: 18,
            color: "334155",
            paraSpaceBefore: 10
        });

        // Image Box
        if (slideData.imageUrl) {
            slide.addImage({
                data: slideData.imageUrl,
                x: isLeft ? 5.2 : 0.5,
                y: 1.5,
                w: 4.5,
                h: 4.5,
                sizing: { type: 'cover', w: 4.5, h: 4.5 }
            });
        }
    }

    // Speaker Notes
    slide.addNotes(slideData.speakerNotes);
  }

  return pptx;
};