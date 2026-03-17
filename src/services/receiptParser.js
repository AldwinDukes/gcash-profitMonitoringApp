"use strict";

export const textParser = (rawText) => {
  return rawText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
};
