/**
 *  Copyright (C) 2007-2008 eBay Inc. All Rights Reserved.
 */

const CI = Components.interfaces;
const CR = Components.results;
const CC = Components.classes;
const CLASS_ID = Components.ID("{8F72AFEC-C7B7-436F-81A2-41788FDE2156}");
const CLASS_NAME = "Account Guard Datasource Service";
const CONTRACT_ID =
  "@glaxstar.org/autotrader/account-guard-datasource-service;1";
const AUTOTRADER_UUID = "{62760FD6-B943-48C9-AB09-F99C6FE96088}";
const AUTOTRADER_DIRECTORY = "eBayComp";
const DS_FILE_NAME = "accountGuard.rdf";
/* Some RDF names we need. */
const AUTOTRADER_NAME =
  "http://www.glaxstar.com/ebayComp/1.0/ebay-comp-schema#";
const AUTOTRADER_LIST_PREFIX = "list-";
const AUTOTRADER_LIST = AUTOTRADER_NAME + AUTOTRADER_LIST_PREFIX;

/**
 * Account Guard datasource service. Provides access to the Account Guard stored
 * information.
 * @author Raymond Lee, Jorge Villalobos Glaxstar Corp.
 */
var AccountGuardDatasourceService = {
  /* Log service */
  _logService : null,
  /* Cached datasource object */
  _datasource : null,
  /* Cached rdf service */
  _rdfService : null,
  /* Cached container utils service. */
  _containerUtils : null,
  /* Arc corresponding to the item url. */
  _itemURLArc : null,
  /* Arc corresponding to the last update time. */
  _lastUpdateArc : null,

  /**
   * Initialize the component.
   */
  init : function() {
    //dump("AccountGuardDatasourceService.init().\n");

    this._logService =
      CC["@glaxstar.org/autotrader/log-service;1"].
        getService(CI.gsILoggingService);
    this._rdfService =
      CC["@mozilla.org/rdf/rdf-service;1"].getService(CI.nsIRDFService);
    this._containerUtils =
      CC["@mozilla.org/rdf/container-utils;1"].
        getService(CI.nsIRDFContainerUtils);
    this.loadDatasource();

    // some RDF resources we use frequently.
    this._itemURLArc =
      this._rdfService.GetResource(AUTOTRADER_NAME + "item-url");
    this._lastUpdateArc =
      this._rdfService.GetResource(AUTOTRADER_NAME + "last-update");
  },

  /**
   * Loads the datasource.
   */
  loadDatasource : function () {
    this._logService.debug("Begin: AccountGuardDatasourceService.loadDatasource");

    var directoryService =
      CC["@mozilla.org/file/directory_service;1"].getService(CI.nsIProperties);
    var fileURLHandler =
      CC["@mozilla.org/network/protocol;1?name=file"].
        getService(CI.nsIFileProtocolHandler);
    var datasourceFile;
    var datasourceURL;

    datasourceFile = directoryService.get("ProfD", CI.nsIFile);
    datasourceFile.append(AUTOTRADER_DIRECTORY);
    // if directory does not exist, create it.
    if (!datasourceFile.exists() || !datasourceFile.isDirectory()) {
      this._logService.debug("Creating Autotrader directory.");
      datasourceFile.create(CI.nsIFile.DIRECTORY_TYPE, 0774);
    }
    datasourceFile.append(DS_FILE_NAME);

    if (!datasourceFile.exists()) {
      this._logService.debug("Creating Account Guard file.");
      this._copyFileFromDefaultDir(DS_FILE_NAME, datasourceFile);
    }

    // load the datasource.
    this._logService.debug("Creating datasource object.");
    datasourceURL = fileURLHandler.getURLSpecFromFile(datasourceFile);
    this._datasource = this._rdfService.GetDataSource(datasourceURL);
    this._rdfService.RegisterDataSource(this._datasource, true);
  },

  /**
   * Attempts to unload the datasource.
   */
  unloadDatasource : function () {
    this._logService.debug(
      "Begin: AccountGuardDatasourceService.unloadDatasource");
    this._rdfService.UnregisterDataSource(this._datasource);
    this._datasource = null;
  },

  /**
   * Returns the datasource object for external use.
   * @returns the datasource object.
   */
  get datasource() {
    return this._datasource;
  },

  /**
   * Saves the datasource to disk.
   */
  _save : function() {
    this._logService.debug("Begin: AccountGuardDatasourceService.save");
    this._datasource.QueryInterface(CI.nsIRDFRemoteDataSource);
    this._datasource.Flush();
    this._datasource.QueryInterface(CI.nsIRDFDataSource);
  },

  /**
   * Adds checked site to checked list in the datasource.
   * @param aURL the url to be added.
   */
  addCheckedSite : function(aURL) {
    this._logService.trace(
      "Begin: AccountGuardDatasourceService.addCheckedSite");

    try {
      // get the URL from the item in the new datasource.
      var itemResource = this._getCheckedSiteResource(aURL);
      var getItemProperty
      if (!itemResource) {
        // assert a new resource.
        itemResource = this._rdfService.GetAnonymousResource();
        this._updateLiteral(itemResource, this._itemURLArc, aURL, true);
        var list = this._getList("checked");
        list.AppendElement(itemResource);
        // upate the last update time.
        var listResource =
          this._rdfService.GetResource(AUTOTRADER_LIST + "checked");
        this._updateLiteral(
          listResource, this._lastUpdateArc, (new Date()).getTime());
        // flush the datasource.
        this._save();
      }
    } catch (e) {
      this._logService.fatal(
        "An error occurred trying to add a site to the checked list.\n["+
          e.name + "] " + e.message);
    }
  },

  /**
   * Sets literal to a resource
   * @param aResource the resource where the date literal should be set.
   * @param aArc the rdf arc.
   * @param aString the string to be used.
   */
  _updateLiteral : function(aResource, aArc, aString) {
    this._logService.trace(
      "Begin: AccountGuardDatasourceService._updateTime");

    try {
      var target =
        this._datasource.GetTarget(aResource, aArc, true);
      if (target == null) {
        this._datasource.Assert (
          aResource, aArc, this._rdfService.GetLiteral(aString), true);
      } else {
        target = target.QueryInterface(CI.nsIRDFLiteral);
        this._datasource.Change(
            aResource, aArc, target,
            this._rdfService.GetLiteral(aString), true);
      }
    } catch (e) {
      this._logService.fatal(
        "An error occurred trying to update a literal.\n["+
          e.name + "] " + e.message);
    }
  },

  /**
   * Checks whether the url is already in the checked list in the datasource.
   * @param aURL the url to be checked.
   * @return the boolean indicating whether the url is in the list or not.
   */
  isCheckedSite : function(aURL) {
    this._logService.trace(
      "Begin: AccountGuardDatasourceService.isCheckedSite");

    var resource = this._getCheckedSiteResource(aURL);
    if (resource) {
        return true;
    }

    return false;
  },

  /**
   * Obtains the resource in the checked list that contains the url.
   * @param aURL the url to be used.
   * @param foundResource the rdf resource that contains the url.
   */
  _getCheckedSiteResource : function(aURL) {
    this._logService.trace(
      "Begin: AccountGuardDatasourceService._getCheckedSiteResource");

    try {
      var list = this._getList("checked");
      var foundResource = null;
      if (list) {
        var urlLiteral = this._rdfService.GetLiteral(aURL);
        var foundResources =
          this._datasource.GetSources(this._itemURLArc, urlLiteral, true);
        var item;
        while (foundResources.hasMoreElements()) {
          item = foundResources.getNext();
          // verify if the item is on the list.
          if (list.IndexOf(item) != -1) {
            foundResource = item;
            break;
          }
        }
      }
    } catch (e) {
      this._logService.fatal(
        "An error occurred trying to get a resource from the checked list.\n[" +
          e.name + "] " + e.message);
    }

    return foundResource;
  },

  /**
   * Obtains the list container that corresponds to the given name.
   * @param aListName the name of the list to obtain. It can be any of the
   * LIST_NAME constants in the interface.
   * @return the nsIRDFContainer corresponding to the named list.
   */
  _getList : function (aListName) {
    this._logService.trace(
      "Begin: AccountGuardDatasourceService._getList(). Name: " + aListName);

    var list = null;
    var listResource =
      this._rdfService.GetResource(AUTOTRADER_LIST + aListName);

    try {
      list = this._containerUtils.MakeSeq(this._datasource, listResource);
    } catch(e) {
      this._logService.error(
        "An error occurred trying to obtain list: " + aListName);
    }

    return list;
  },

  /**
   * Gets the value for a resource or literal.
   * @param aNode the resource or literal we want the value from.
   * @returns the value of the resource or literal.
   */
  _getValue : function(aNode) {
    this._logService.trace("Begin: AccountGuardDatasourceService._getValue");

    var resourceValue = null;

    try {
      aNode.QueryInterface(CI.nsIRDFResource);
      resourceValue = aNode.Value;
    } catch(e) {
      try {
        aNode.QueryInterface(CI.nsIRDFLiteral);
        resourceValue = aNode.Value;
      } catch(e) {
        this._logService.error(
          "An error occurred trying to get the value for a node.\n[" + e.name +
          "] " + e.message);
        throw(e);
      }
    }

    return resourceValue;
  },

  /**
   * Copy a file identified by aFileName from the defaults directory
   * to a location in the filesystem identified by a aDestination.
   * @param aFileName the name of the file to copy.
   * @param aDestination the nsIFile where the file should be copied.
   */
  _copyFileFromDefaultDir : function (aFileName, aDestination) {
    this._logService.trace(
      "Begin: AutotraderDatasourceService._copyFileFromDefaultDir");

    try {
      var file =
        Components.classes["@mozilla.org/extensions/manager;1"].
          getService(Components.interfaces.nsIExtensionManager).
          getInstallLocation(AUTOTRADER_UUID).
          getItemLocation(AUTOTRADER_UUID);

      file.append("defaults");
      file.append(aFileName);
      file.copyTo(aDestination.parent, aDestination.leafName);
    } catch(e) {
      this._logService.error(
        "An error occurred trying to copy a file from the defaults dir. " +
        "File name:" + aFileName + ".\n[" + e.name + "] " + e.message);
    }
  },

  /**
   * The QueryInterface method provides runtime type discovery.
   * More: http://developer.mozilla.org/en/docs/nsISupports
   * @param aIID the IID of the requested interface.
   * @return the resulting interface pointer.
   */
  QueryInterface : function(aIID) {
    if (!aIID.equals(CI.gsIAccountGuardDatasourceService) &&
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
var AccountGuardDatasourceServiceFactory = {
  /* single instance of the component. */
  _singletonObj: null,

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
    // in this case we need a unique instance of the service.
    if (!this._singletonObj) {
      this._singletonObj = AccountGuardDatasourceService;
      AccountGuardDatasourceService.init();
    }

    return this._singletonObj.QueryInterface(aIID);
  }
};

/**
 * The nsIModule interface must be implemented by each XPCOM component. It is
 * the main entry point by which the system accesses an XPCOM component.
 * More: http://developer.mozilla.org/en/docs/nsIModule
 */
var AccountGuardDatasourceServiceModule = {
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
      return AccountGuardDatasourceServiceFactory;
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
  return AccountGuardDatasourceServiceModule;
}
