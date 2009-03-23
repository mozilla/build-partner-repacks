/**
 * Copyright (C) 2007-2008 eBay Inc. All Rights Reserved.
 */

const CI = Components.interfaces;
const CR = Components.results;
const CC = Components.classes;
const CLASS_ID = Components.ID("{689A0CE9-68ED-4749-A87C-CB3373FBB139}");
const CLASS_NAME = "Autotrader Alert";
const CONTRACT_ID = "@glaxstar.org/autotrader/autotrader-alert;1";

/**
 * Represents an Autotrader alert.
 * @author Jorge Villalobos Glaxstar Corp.
 */
function AutotraderAlert() {
  this._init();
}

AutotraderAlert.prototype = {
  /* The alert type. */
  _type : -1,
  /* The timestamp of the alert. */
  _timestamp : 0,
  _item : null,
  /* The feedback object associated with the alert (null when not a feedback
     alert) */
  _feedback : null,

  /**
   * Initializes the component.
   */
  _init : function() {
    // nothing to do here yet.
  },

  /**
   * Initializes the object.
   * @param aType the type of alert.
   * @param aTimestamp the timestamp of the alert.
   * @param aItem the item that triggered the alert.
   * @param aFeedback the feedback object associated with the alert (null when
   * not a feedback alert).
   */
  init : function(aType, aTimestamp, aItem, aFeedback) {
    this._type = aType;
    this._timestamp = aTimestamp;
    this._item = aItem;
    this._feedback = aFeedback;
  },

  /**
   * Initializes the object as a feedback score alert.
   * @param aTimestamp the timestamp of the alert.
   * @param aFeedbackScore the new feedback score.
   */
  initFeedbackScore : function(aTimestamp, aFeedbackScore) {
    this._type = CI.gsIAutotraderAlert.ALERT_TYPE_FEEDBACK_SCORE;
    this._timestamp = aTimestamp;
    this._feedbackScore = aFeedbackScore;
  },

  /**
   * Indicates whether this alert is equal to the given alert.
   * @param aAlert the alert to compare this object with.
   * @return true is both alerts are equal. false otherwise.
   */
  equals : function(aAlert) {
    var areEqual = false;
    var typeEqual = (this.type == aAlert.type);

    if (typeEqual) {
      var itemEqual =
        (this.type == CI.gsIAutotraderAlert.ALERT_TYPE_FEEDBACK_SCORE &&
         this.item == null && aAlert.item == null) ||
        this.item.equals(aAlert.item);
      var feedbackEqual =
        (this.feedback == null && aAlert.feedback == null) ||
         this.feedback.equals(aAlert.feedback);

      areEqual = itemEqual && feedbackEqual;
    }

    return areEqual;
  },

  /**
   * Obtains the alert type.
   * @returns the alert type.
   */
  get type() {
    return this._type;
  },

  /**
   * Obtains the timestamp of the alert.
   * @returns the timestamp of the alert.
   */
  get timestamp() {
    return this._timestamp;
  },

  /**
   * Obtains the item that triggered the alert.
   * @returns the item that triggered the alert.
   */
  get item() {
    return this._item;
  },

  /**
   * Obtains the feedback object associated with the alert (null when not a
   * feedback alert).
   * @returns the feedback object associated with the alert (null when not a
   * feedback alert).
   */
  get feedback() {
    return this._feedback;
  },

  /**
   * Obtains the feedback score for feedback score alerts.
   * @returns the feedback score for feedback score alerts.
   */
  get feedbackScore() {
    return this._feedbackScore;
  },

  /**
   * The QueryInterface method provides runtime type discovery.
   * More: http://developer.mozilla.org/en/docs/nsISupports
   * @param aIID the IID of the requested interface.
   * @return the resulting interface pointer.
   */
  QueryInterface : function(aIID) {
    if (!aIID.equals(CI.gsIAutotraderAlert) && !aIID.equals(CI.nsISupports)) {
      throw CR.NS_ERROR_NO_INTERFACE;
    }

    return this;
  }
};

/**
 * The nsIFactory interface allows for the creation of nsISupports derived
 * classes without specifying a concrete class type.
 * More: http://developer.mozilla.org/en/docs/nsIFactory
 */
var AutotraderAlertFactory = {
  /**
   * Creates an instance of the class associated with this factory.
   * @param aOuter pointer to a component that wishes to be aggregated in the
   * resulting instance. This can be nsnull if no aggregation is requested.
   * @param aIID the interface type to be returned.
   * @return the resulting interface pointer.
   * @throws NS_ERROR_NO_AGGREGATION if aOuter is not null. This component
   * doesn't support aggregation.
   */
  createInstance: function(aOuter, aIID) {
    if (aOuter != null) {
      throw CR.NS_ERROR_NO_AGGREGATION;
    }

    return (new AutotraderAlert()).QueryInterface(aIID);
  }
};

/**
 * The nsIModule interface must be implemented by each XPCOM component. It is
 * the main entry point by which the system accesses an XPCOM component.
 * More: http://developer.mozilla.org/en/docs/nsIModule
 */
var AutotraderAlertModule = {
  /**
   * When the nsIModule is discovered, this method will be called so that any
   * setup registration can be preformed.
   * @param aCompMgr the global component manager.
   * @param aLocation the location of the nsIModule on disk.
   * @param aLoaderStr opaque loader specific string.
   * @param aType loader type being used to load this module.
   */
  registerSelf : function(aCompMgr, aLocation, aLoaderStr, aType) {
    aCompMgr.QueryInterface(CI.nsIComponentRegistrar);
    aCompMgr.registerFactoryLocation(
      CLASS_ID, CLASS_NAME, CONTRACT_ID, aLocation, aLoaderStr, aType);
  },

  /**
   * When the nsIModule is being unregistered, this method will be called so
   * that any cleanup can be preformed.
   * @param aCompMgr the global component manager.
   * @param aLocation the location of the nsIModule on disk.
   * @param aLoaderStr opaque loader specific string.
   */
  unregisterSelf : function (aCompMgr, aLocation, aLoaderStr) {
    aCompMgr.QueryInterface(CI.nsIComponentRegistrar);
    aCompMgr.unregisterFactoryLocation(CLASS_ID, aLocation);
  },

  /**
   * This method returns a class object for a given ClassID and IID.
   * @param aCompMgr the global component manager.
   * @param aClass the ClassID of the object instance requested.
   * @param aIID the IID of the object instance requested.
   * @return the resulting interface pointer.
   * @throws NS_ERROR_NOT_IMPLEMENTED if aIID is inadequate.
   * @throws NS_ERROR_NO_INTERFACE if the interface is not found.
   */
  getClassObject : function(aCompMgr, aClass, aIID) {
    if (!aIID.equals(CI.nsIFactory)) {
      throw CR.NS_ERROR_NOT_IMPLEMENTED;
    }

    if (aClass.equals(CLASS_ID)) {
      return AutotraderAlertFactory;
    }

    throw CR.NS_ERROR_NO_INTERFACE;
  },

  /**
   * This method may be queried to determine whether or not the component
   * module can be unloaded by XPCOM.
   * @param aCompMgr the global component manager.
   * @return true if the module can be unloaded by XPCOM. false otherwise.
   */
  canUnload: function(aCompMgr) {
    return true;
  }
};

/**
 * Initial entry point.
 * @param aCompMgr the global component manager.
 * @param aFileSpec component file.
 * @return the module for the service.
 */
function NSGetModule(aCompMgr, aFileSpec) {
  return AutotraderAlertModule;
}
