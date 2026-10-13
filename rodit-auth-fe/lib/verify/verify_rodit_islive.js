/**
 * RODiT time-validity check (shared FE / chain entry).
 * Copyright (c) 2026 Discernible IO. All rights reserved.
 */

import { logger } from "../../services/logger.js";

export async function verify_rodit_islive(peer_rodit_notafter, peer_rodit_notbefore) {
  logger.debug("Checking RODiT time validity", {
    component: "verify_rodit_islive",
    notAfter: peer_rodit_notafter,
    notBefore: peer_rodit_notbefore,
  });

  function parseDate(datestring) {
    const date = new Date(datestring);
    return isNaN(date.getTime()) ? new Date(0) : date;
  }

  const datetimenul = new Date(0);
  const datetimenotafter = parseDate(peer_rodit_notafter);
  const datetimenotbefore = parseDate(peer_rodit_notbefore);

  logger.debug("Parsed validity dates", {
    component: "verify_rodit_islive",
    parsedNotAfter: datetimenotafter.toISOString(),
    parsedNotBefore: datetimenotbefore.toISOString(),
    isNotAfterNull: datetimenotafter.getTime() === datetimenul.getTime(),
    isNotBeforeNull: datetimenotbefore.getTime() === datetimenul.getTime(),
  });

  try {
    // In the browser, we'll use the current time instead of blockchain time
    const datetimetimestamp = new Date(); 

    logger.debug("Using browser time", {
      component: "verify_rodit_islive",
      browserTime: datetimetimestamp.toISOString(),
    });

    const isAfterNotBefore =
      datetimetimestamp >= datetimenotbefore ||
      datetimenotbefore.getTime() === datetimenul.getTime();

    const isBeforeNotAfter =
      datetimetimestamp <= datetimenotafter ||
      datetimenotafter.getTime() === datetimenul.getTime();

    const isLive = isAfterNotBefore && isBeforeNotAfter;

    if (isLive) {
      logger.info("RODiT is live", {
        component: "verify_rodit_islive",
        currentTime: datetimetimestamp.toISOString(),
        notBefore: datetimenotbefore.toISOString(),
        notAfter: datetimenotafter.toISOString(),
        isLive: true,
      });
      return true;
    } else {
      logger.warn("RODiT is not live - outside valid time period", {
        component: "verify_rodit_islive",
        currentTime: datetimetimestamp.toISOString(),
        notBefore: datetimenotbefore.toISOString(),
        notAfter: datetimenotafter.toISOString(),
        isBeforeExpiry: isBeforeNotAfter,
        isAfterStart: isAfterNotBefore,
        isLive: false,
      });
      return false;
    }
  } catch (error) {
    logger.error("Failed to check RODiT time validity", {
      component: "verify_rodit_islive",
      notAfter: peer_rodit_notafter,
      notBefore: peer_rodit_notbefore,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
    });
    return false;
  }
}
