"use strict";

export const base64Converter = (receiptImage) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader(); // It reads files from input form

    // “Covert the receiptImage to a Base64 data URL.”
    reader.readAsDataURL(receiptImage);

    // When the file finishes loading, reader.result contains the Base64 string value and sends it back from the Promise
    reader.onload = () => resolve(reader.result);

    reader.onerror = (error) => reject(error); // If reading fails reject() throws an error
  });
}; // Convert the IMG to Base64 format
