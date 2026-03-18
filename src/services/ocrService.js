"use strict";

export const fetchDataFromOCR = async (receipt) => {
  const formData = new FormData();
  formData.append("apikey", import.meta.env.VITE_OCR_API_KEY);
  formData.append("base64image", receipt);

  // Adding these to help prevent timeouts:
  formData.append("scale", "true"); // Automatically scales image for better OCR
  formData.append("OCREngine", "2"); // Engine 2 is usually faster for receipts

  const response = await fetch("https://api.ocr.space/parse/image", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (data.OCRExitCode === 3 || data.ErrorMessage?.includes("E101")) {
    throw new Error("Server is busy. Please try again in a few seconds.");
  }

  if (data.IsErroredOnProcessing) {
    throw new Error(data.ErrorMessage[0]);
  }

  return data.ParsedResults[0].ParsedText;
};
