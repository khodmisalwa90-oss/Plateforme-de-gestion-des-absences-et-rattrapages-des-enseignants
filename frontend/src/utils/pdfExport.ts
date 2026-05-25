import { toPng } from "html-to-image";
import jsPDF from "jspdf";

export async function exportTimetableToPDF(elementId: string, filename = "emploi-du-temps.pdf") {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with ID ${elementId} not found`);
    return;
  }

  try {
    const originalStyle = element.style.cssText;
    element.style.background = "#ffffff";
    element.style.width = "1200px";
    element.style.padding = "20px";
    element.style.borderRadius = "8px";

    const scrollableElements = element.querySelectorAll('.overflow-x-auto, .overflow-y-auto, .overflow-auto');
    const originalOverflows: string[] = [];
    scrollableElements.forEach((el, index) => {
      originalOverflows[index] = (el as HTMLElement).style.overflow;
      (el as HTMLElement).style.overflow = 'visible';
    });

    const imgData = await toPng(element, {
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    });

    element.style.cssText = originalStyle;
    scrollableElements.forEach((el, index) => {
      (el as HTMLElement).style.overflow = originalOverflows[index];
    });

    const img = new Image();
    img.src = imgData;
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const margin = 10;
    const maxContentWidth = pdfWidth - 2 * margin;
    const maxContentHeight = pdfHeight - 2 * margin;

    const imgWidth = img.width;
    const imgHeight = img.height;
    
    const ratio = imgWidth / imgHeight;
    
    let renderWidth = maxContentWidth;
    let renderHeight = renderWidth / ratio;
    
    if (renderHeight > maxContentHeight) {
      renderHeight = maxContentHeight;
      renderWidth = renderHeight * ratio;
    }

    const xOffset = margin + (maxContentWidth - renderWidth) / 2;
    const yOffset = margin + (maxContentHeight - renderHeight) / 2;

    pdf.addImage(imgData, "PNG", xOffset, yOffset, renderWidth, renderHeight);
    pdf.save(filename);
  } catch (error) {
    console.error("Error generating PDF:", error);
  }
}
