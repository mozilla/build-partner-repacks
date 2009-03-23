/*
 * Copyright (C) 2006 to the Present, Medium, Inc. - ALL RIGHTS RESERVED
 *
 * This source code contains proprietary information of Medium, Inc.
 * and its receipt or possession does not convey any rights to reproduce or
 * disclose its contents, or to manufacture, use or sell anything it may
 * describe. Reproduction, disclosure or use without specific written
 * authorization from Medium, Inc. is strictly prohibited.
 *
 * Medium, Inc. may have patents, patent applications, trademarks, copyrights,
 * or other intellectual property rights covering this source code. The receipt
 * or possession of this source code does not give you any license to these
 * patents, trademarks, copyrights, or other intellectual property.
 *
 * $Id$
 */
pref( "me.dium.log.error.enabled", true);
pref( "me.dium.log.warning.enabled", true);
pref( "me.dium.log.exception.enabled", true);
pref( "me.dium.log.debug.enabled", false);
pref( "me.dium.sensor.allow.url.pattern", "(^(ht|f)tp://([^:/.]+\\.)+[^:/.]+($|/)|^https://(www\\.)?me\\.dium\\.com($|/))");
pref( "me.dium.sensor.deny.url.pattern", "(^https?://.*\\.facebook\\.com/|^https?://(www\\.)?me\\.dium\\.com/shielded/)");
pref( "me.dium.sensor.except.url.pattern", "^http://www\\.facebook\\.com/((home|profile|photos?|album|groups?|events?).php|(friends|marketplace)/)");
pref( "me.dium.sensor.optin.dialog.presented", false);
pref( "me.dium.sensor.optin.dialog.accepted", false);
pref( "me.dium.sensor.default.enabled", false);
pref( "me.dium.update.retry.ramp", 20);
pref( "me.dium.update.retry.interval", 5000);
pref( "me.dium.website.url", "http://me.dium.com");
pref( "me.dium.service.url", "https://match2.me.dium.com/medium");
pref( "me.dium.default.request.timeout", 5000);
pref( "me.dium.update.request.timeout", 30000);
