/**
 * Copyright (C) 2007-2008 eBay Inc. All Rights Reserved.
 */

const CI = Components.interfaces;
const CR = Components.results;
const CC = Components.classes;
const CLASS_ID = Components.ID("{F4EB5305-5A00-4327-B5A1-CDD92A19C218}");
const CLASS_NAME = "Autotrader Feedback";
const CONTRACT_ID = "@glaxstar.org/autotrader/autotrader-feedback;1";

const AUTOTRADER_FEEDBACK_SCORE_POSITIVE = "Positive";
const AUTOTRADER_FEEDBACK_SCORE_NEUTRAL = "Neutral";
const AUTOTRADER_FEEDBACK_SCORE_NEGATIVE = "Negative";

/**
 * Represents an ebay feedback item.
 * @author Jorge Villalobos Glaxstar Corp.
 */
function AutotraderFeedback() {
  this._init();
}

AutotraderFeedback.prototype = {
  /* Log service. */
  _logService : null,
  /* The id of the feedback. */
  _id : null,
  /* The id of the item this feedback refers to. */
  _itemId : null,
  /* The user that submitted the feedback. */
  _user : null,
  /* The feedback score */
  _score : null,
  /* The comment on the feedback. */
  _comment : null,
  /* Indicates if the feedback comment was replaced. */
  _commentReplaced : false,

  /**
   * Initializes the component.
   */
  _init : function() {
    //dump("AutotraderFeedback._init().\n");
    this._logService =
      CC["@glaxstar.org/autotrader/log-service;1"].
        getService(CI.gsILoggingService);
  },

  /**
   * Object constructor.
   * @param aFeedback RDF reference to the feedback.
   */
  init : function(aFeedback) {
    this._logService.debug("Begin: AutotraderFeedback.init");

    var dsService =
      CC["@glaxstar.org/autotrader/autotrader-datasource-service;1"].
        getService(CI.gsIAutotraderDatasourceService);
    var scoreProp =
      dsService.getItemProperty(aFeedback, "comment-type");
    var replacedProp =
      dsService.getItemProperty(aFeedback, "comment-replaced");

    this._id = dsService.getItemProperty(aFeedback, "feedback-id");
    this._itemId = dsService.getItemProperty(aFeedback, "item-id");
    this._user = dsService.getItemProperty(aFeedback, "commenting-user");
    this._comment = dsService.getItemProperty(aFeedback, "comment-text");
    this._commentReplaced =  (replacedProp == "true");

    switch (scoreProp) {
      case AUTOTRADER_FEEDBACK_SCORE_POSITIVE:
        this._score = 1;
        break;
      case AUTOTRADER_FEEDBACK_SCORE_NEUTRAL:
        this._score = 0;
        break;
      case AUTOTRADER_FEEDBACK_SCORE_NEGATIVE:
        this._score = -1;
        break;
    }
  },

  /**
   * Indicates whether this feedback is equal to the given feedback.
   * @param aFeedbackItem the feedback to compare this object with.
   * @return true is both items are equal. false otherwise.
   */
  equals : function(aAutotraderFeedback) {
    this._logService.debug("Begin: AutotraderFeedback.equals");
    return (this.id == aAutotraderFeedback.id);
  },

  /**
   * Obtains the id of the feedback.
   * @returns the id of the feedback.
   */
  get id() {
    this._logService.trace("Begin: AutotraderFeedback.get id");
    return this._id;
  },

  /**
   * Obtains the id of the item this feedback refers to.
   * @returns the id of the item this feedback refers to.
   */
  get itemId() {
    this._logService.trace("Begin: AutotraderFeedback.get itemId");
    return this._itemId;
  },

  /**
   * Obtains the user that submitted the feedback.
   * @returns the user that submitted the feedback.
   */
  get user() {
    this._logService.trace("Begin: AutotraderFeedback.get user");
    return this._user;
  },

  /**
   * Obtains the feedback score.
   * @returns the feedback score.
   */
  get score() {
    this._logService.trace("Begin: AutotraderFeedback.get score");
    return this._score;
  },

  /**
   * Obtains the comment on the feedback.
   * @returns the comment on the feedback.
   */
  get comment() {
    this._logService.trace("Begin: AutotraderFeedback.get comment");
    return this._comment;
  },

  /**
   * Indicates if the feedback comment was replaced.
   * @returns true if the feedback comment was replaced. false otherwise.
   */
  get commentReplaced() {
    this._logService.trace("Begin: AutotraderFeedback.get commentReplaced");
    return this._commentReplaced;
  },

  /**
   * The QueryInterface method provides runtime type discovery.
   * More: http://developer.mozilla.org/en/docs/nsISupports
   * @param aIID the IID of the requested interface.
   * @return the resulting interface pointer.
   */
  QueryInterface : function(aIID) {
    if (!aIID.equals(CI.gsIAutotraderFeedback) &&
        !aIID.equals(CI.nsISupports)) {
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
var AutotraderFeedbackFactory = {
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

    return (new AutotraderFeedback()).QueryInterface(aIID);
  }
};

/**
 * The nsIModule interface must be implemented by each XPCOM component. It is
 * the main entry point by which the system accesses an XPCOM component.
 * More: http://developer.mozilla.org/en/docs/nsIModule
 */
var AutotraderFeedbackModule = {
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
      return AutotraderFeedbackFactory;
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
  return AutotraderFeedbackModule;
}
