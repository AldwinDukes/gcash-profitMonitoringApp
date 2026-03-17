"use strict";

export const fetchDataFromOCR = async (receipt) => {
  const formData = new FormData();

  // Use import.meta.env to access the variable in Vite
  const apiKey = import.meta.env.VITE_OCR_API_KEY;

  formData.append("apikey", apiKey);

  // Logic: Ensure the receipt has the 'data:image/...' prefix
  // If your base64Converter already includes it, this stays as is.
  // If it's missing, we prepend a default one (usually image/jpeg).
  const base64Image = receipt.startsWith("data:")
    ? receipt
    : `data:image/jpeg;base64,${receipt}`;

  formData.append("base64image", base64Image);

  // Optional: Explicitly tell the API it's a photo to help Engine 2
  formData.append("filetype", "JPG");

  const response = await fetch("https://api.ocr.space/parse/image", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`OCR request failed: ${response.status}`);
  }

  const data = await response.json();

  // Check if OCR.space itself returned an error in the JSON body
  if (data.IsErroredOnProcessing) {
    console.error("OCR Error Message:", data.ErrorMessage);
    throw new Error(data.ErrorMessage[0]);
  }

  return data.ParsedResults[0].ParsedText;
};
