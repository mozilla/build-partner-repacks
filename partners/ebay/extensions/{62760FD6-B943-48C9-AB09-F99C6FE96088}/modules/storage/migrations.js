/**
 * Copyright (C) 2007-2009 eBay Inc. All Rights Reserved.
 */

const EXPORTED_SYMBOLS = ["Migrations"];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Ce = Components.Exception;
const Cr = Components.results;
const Cu = Components.utils;

// The format version of the database that is expected
const SCHEMA_VERSION = 8;

var Migrations = {
  /**
   * Initialisation
   */
  _init : function() {
    try {
      // Modules
      Cu.import("resource://ebaycompanion/helpers/logger.js");
      Cu.import("resource://ebaycompanion/helpers/storageHelper.js");
      Cu.import("resource://ebaycompanion/storage/propertiesStorage.js");
    }
    catch (e) {
      Logger.exception(e);
    }
  },

  /**
   * Migrates the database to the current schema
   */
  performMigrations : function() {
    let schemaVersion = PropertiesStorage.get("schemaVersion");

    if (schemaVersion) {
      if (schemaVersion > SCHEMA_VERSION) {
        Logger.warning("Database schema version is higher than expected. " +
                       "It's probably been modified by a later version. " +
                       "We'll use it, but you may get errors.");
        return;
      }
      while (schemaVersion < SCHEMA_VERSION) {
        schemaVersion++;
        this["schema_" + schemaVersion]();
      }
    }

    PropertiesStorage.set("schemaVersion", SCHEMA_VERSION);
  },

  /**
   * Schema migrations
   */
  schema_2 : function() {
    StorageHelper.
      doStatement("ALTER TABLE items ADD COLUMN userQuantityWinning DEFAULT 0");
  },

  schema_3 : function() {
    StorageHelper.
      doStatement("ALTER TABLE items ADD COLUMN thumbnailUrl DEFAULT ''");
  },

  schema_4 : function() {
    StorageHelper.
      doStatement(
        "ALTER TABLE items ADD COLUMN sellerFeedbackPercent DEFAULT 0");
  },

  schema_5 : function() {
    StorageHelper.
      doStatement(
        "ALTER TABLE items ADD COLUMN shippingTermsInDescription DEFAULT false");
    StorageHelper.
      doStatement(
        "ALTER TABLE items ADD COLUMN shipToLocations DEFAULT ''");
    StorageHelper.
      doStatement(
        "ALTER TABLE items ADD COLUMN shippingType DEFAULT ''");
  },

  schema_6 : function() {
    StorageHelper.
      doStatement(
        "ALTER TABLE items ADD COLUMN highBidderId DEFAULT ''");
    StorageHelper.
      doStatement(
        "ALTER TABLE items ADD COLUMN highBidderFeedbackScore DEFAULT 0");
  },

  schema_7 : function() {
    StorageHelper.
      doStatement(
        "ALTER TABLE items ADD COLUMN hitCounterType DEFAULT ''");
  },

  schema_8 : function() {
    StorageHelper.
      doStatement(
        "ALTER TABLE items ADD COLUMN convertedCurrentPrice DEFAULT 0");
    StorageHelper.
      doStatement(
        "ALTER TABLE items ADD COLUMN convertedCurrentPriceCurrency DEFAULT ''");
    StorageHelper.
      doStatement(
        "ALTER TABLE items ADD COLUMN convertedMaxBid DEFAULT 0");
    StorageHelper.
      doStatement(
        "ALTER TABLE items ADD COLUMN convertedMaxBidCurrency DEFAULT ''");
  },

  schema_9 : function() {
  }
};

Migrations._init();
