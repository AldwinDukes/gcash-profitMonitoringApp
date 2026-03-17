"use strict";

import { CHARGE_RATE } from "../constants/gcashConfig";

export const calculateCharge = (amount) => {
  return amount * CHARGE_RATE;
};
