/**
 * Anti-Phishing module.
 * This part constitutes the backend and maintains
 * the database. It provides methods to
 * check URIs against the database and update
 * its database over http.
 *
 * A temporary whitelist for domain names is also observed.
 * It does not persist across Firefox restarts.
 */

const EXPORTED_SYMBOLS = ["checkURI", "downloadBlacklist"];

Components.utils.import("resource://unitedtb/util/util.js");
Components.utils.import("resource://unitedtb/util/fetchhttp.js");
Components.utils.import("resource://unitedtb/util/sanitizeDatatypes.js");
Components.utils.import("resource://unitedtb/util/globalobject.js");
Components.utils.import("resource://unitedtb/main/brand-var-loader.js");


const PHISHING_DB_FILE_MAIN = "phishing-blacklist.sqlite";
// we do not write into the same DB we're reading from.
// instead, we switch them around.
const PHISHING_DB_FILE_UPDATE = "phishing-blacklist-temp.sqlite";
const PHISH_TABLE_DOMAIN = "domains";
const PHISH_TABLE_PREFIX = "prefixes";
const PHISH_TABLE_EXACT = "exact";

var gPhishingDBMain = null;
var gPhishingDBUpdate = null;
var gCurrentDB = null;

/**
 * Returns the currently active database instance.
 *
 * @return {mozIStorageConnection} Currently active 'Query' database connection
 */
function phishingDB()
{
  if (gCurrentDB)
    return gCurrentDB;

  var storageService = Cc["@mozilla.org/storage/service;1"]
      .getService(Ci.mozIStorageService);
  var dir = getProfileDir();

  var db1file = dir.clone();
  db1file.append(PHISHING_DB_FILE_MAIN);
  var db1fileExisted = db1file.exists();
  gPhishingDBMain = storageService.openDatabase(db1file);
  if (!db1fileExisted)
    createDB(gPhishingDBMain);

  var db2file = dir.clone();
  db2file.append(PHISHING_DB_FILE_UPDATE);
  var db2fileExisted = db2file.exists();
  gPhishingDBUpdate = storageService.openDatabase(db2file);
  if (!db2fileExisted)
    createDB(gPhishingDBUpdate);

  gCurrentDB = gPhishingDBMain;
  return gCurrentDB;
}


/**
 * Initializes DB schema. Will delete old data.
 */
function createDB(dbConn)
{
  ourPref.set("phish.db.version", 1);

  dbConn.executeSimpleSQL("DROP TABLE IF EXISTS " + PHISH_TABLE_PREFIX);
  dbConn.executeSimpleSQL("DROP TABLE IF EXISTS " + PHISH_TABLE_DOMAIN);
  dbConn.executeSimpleSQL("DROP TABLE IF EXISTS " + PHISH_TABLE_EXACT);

  dbConn.createTable(PHISH_TABLE_PREFIX, "pattern TEXT PRIMARY KEY");
  dbConn.createTable(PHISH_TABLE_DOMAIN, "pattern TEXT PRIMARY KEY");
  dbConn.createTable(PHISH_TABLE_EXACT, "pattern TEXT PRIMARY KEY");
}

/**
 * Checks if given URI is blacklisted.
 * 
 * Call is asynchronous. The successCallback is called
 * with a boolean parameter. True indicates that the URI
 * is blacklisted.
 *
 * Prior to querying the blacklist, the domain of the
 * given URI is checked against a whitelist.
 * If the domain is whitelisted, this method will return
 * without firing the callbacks.
 * The whitelist is a simply array registered with globalobjects.js
 * in the "united" namespace with symbol "whitelist".
 *
 * @param anURI {nsIURI} URI to be checked
 * @param successCallback {Function(block {boolean})}
 *     block   true = page is phishing page. block it.
 *             false = innocent (until proven guilty)
 * @param errorCallback {Function(msg {String})}
 */ 
function checkURI(anURI, successCallback, errorCallback)
{
  //debug("CheckURI(<" + anURI.spec + "> using " + gCurrentDB.databaseFile.leafName);
  //(A bug: SQLite only understands upper/lower case for ASCII characters by default. The LIKE operator is case sensitive by default for unicode characters that are beyond the ASCII range. For example, the expression 'a' LIKE 'A' is TRUE but 'æ' LIKE 'Æ' is FALSE.)
  // TODO: lowercase domain?

  var exactQuery = "SELECT 1 FROM " + 
    PHISH_TABLE_EXACT + " WHERE " +
    PHISH_TABLE_EXACT +  ".pattern = :uri";
  var prefixQuery = "SELECT 1 FROM " + 
    PHISH_TABLE_PREFIX + " WHERE :uri LIKE " +  
    PHISH_TABLE_PREFIX + ".pattern || '%'"

  var domainQuery = "SELECT pattern FROM " + PHISH_TABLE_DOMAIN +
      " WHERE substr(:hostname, 0 - length(" + 
      PHISH_TABLE_DOMAIN + ".pattern)) = " + PHISH_TABLE_DOMAIN + ".pattern";
  
  var exactSel = phishingDB().createStatement(exactQuery);
  var prefixSel = phishingDB().createStatement(prefixQuery);
  var domainSel = phishingDB().createStatement(domainQuery);

  // copied from nsIURI documentation
  //* Some characters may be escaped.
  // attribute AUTF8String spec;
  var uri = anURI.spec;
  exactSel.params["uri"] = uri;
  prefixSel.params["uri"] = uri;
  // copied from nsIURI documentation
  /**
   * The host is the internet domain name to which this URI refers.  It could
   * be an IPv4 (or IPv6) address literal.  If supported, it could be a
   * non-ASCII internationalized domain name.
   *
   * Characters are NOT escaped.
   */
  var hostname;
  try
  {
    hostname = anURI.host;
  }
  catch (e)
  {
    //debug("url does not have host. probably chrome: or something like that. Skipping.");
    return;
  }
  //debug("domain is " + hostname);
  if (! haveGlobalObject("united", "whitelist"))
    setGlobalObject("united", "whitelist", []);
  var whitelist = getGlobalObject("united", "whitelist");
  if (arrayContains(whitelist, hostname))
  {
    debug("hostname is whitelisted.");
    return;
  }
  domainSel.params["hostname"] = hostname;
  exactSel.executeAsync(makeQueryCallback(successCallback, errorCallback));
  prefixSel.executeAsync(makeQueryCallback(successCallback, errorCallback));
  domainSel.executeAsync(makeDomainQueryCallback(hostname,
      successCallback, errorCallback))
}


/**
 * Generates callback for queries against
 * PHISH_TABLE_EXACT and PHISH_TABLE_PREFIX.
 *
 * @param successCallback @see checkURI()
 * @param errorCallback @see checkURI()
 */
function makeQueryCallback(successCallback, errorCallback)
{
  return new sqlCallback(function(rows)
  {
    let block = false;
    if (rows && rows.length)
      block = true;
    successCallback(block);
  }, errorCallback);
}

/**
 * Generates callback for queries against
 * PHISH_TABLE_DOMAIN.
 * This case is different from the other tables
 * as results from PHISH_TABLE_DOMAIN need
 * additional post-processing to match subdomains as well.
 *
 * @param visitedHostname {String} hostname of the site being checked
 * @param successCallback @see checkURI()
 * @param errorCallback @see checkURI()
 */ 
function makeDomainQueryCallback(visitedHostname,
                                 successCallback, errorCallback)
{
  return new sqlCallback(function(rows)
  {
    let block = false;
    for each (row in rows)
    {
      let domain = row.getResultByName("pattern");
      assert(domain, "Column expected but not found");
      if (visitedHostname == domain ||
          visitedHostname.charAt(visitedHostname.length - domain.length - 1) == ".")
      {
        block = true;
      }
    }
    successCallback(block);
  }, errorCallback);
}

/**
 * Writes the parsed blacklist into the database.
 * 
 * When updating, we first delete the whole database.
 * To prevent a protection hole of 1-2 seconds,
 * which is right at the startup when the protection is important,
 * we use 2 databases:
 * - The main one will normally be queried.
 *   This is also the one used at startup.
 * - The update database.
 * We empty and write into the update database,
 * then make the update database shortly the current
 * database. Then we empty and write the main database.
 * Then we make the main database the current DB again.
 *
 * @param parsedResults {Object} @see return value of parse()
 * @param targetDB {mozIStorageConnection} (optional)   Database to write to
 *     If not passing this, the alternating logic above is used.
 */
function updateDB(parsedResults, targetDB)
{
  assert(parsedResults);
  var newDB = targetDB;
  if (!newDB)
    newDB = gPhishingDBUpdate;
  assert(newDB instanceof Ci.mozIStorageConnection);
  createDB(newDB);

  var types = ["D", "E", "P"];
  var finishedTypeCounter = types.length;
  for each (let type in types)
  {
    //debug("type is " + type)
    let table = null;
    switch (type)
    {
      case  "D": {table = PHISH_TABLE_DOMAIN; break;}
      case  "E": {table = PHISH_TABLE_EXACT; break;}
      case  "P": {table = PHISH_TABLE_PREFIX; break;}
      default: throw new NotReached("Unknown type in phishing list");
    }
    let statement = newDB.createStatement("INSERT OR IGNORE INTO " +
        table + " (pattern) VALUES (:pattern)");
    let params = statement.newBindingParamsArray();
    let patterns = parsedResults[type];
    //debug("patterns for type " + type + ":  " + patterns);
    if (!patterns.length)
    {
      //debug("got no patterns for type " + type);
      // Starting in Gecko 2.0, bindParameters() returns NS_ERROR_UNEXPECTED 
      // if the specified mozIStorageBindingParamsArray |params| is empty.
      finishedTypeCounter--;    
      continue;
    }
    for each (let pattern in patterns)
    {
      let bp = params.newBindingParams();
      bp.bindByName("pattern", pattern);
      params.addParams(bp);
    }
    statement.bindParameters(params);
    statement.executeAsync(new sqlCallback(function(rows)
    {
     if (--finishedTypeCounter)
        return;
      //debug("phish: now using " + newDB.databaseFile.leafName + " as database");
      gCurrentDB = newDB;
      if (!targetDB && gCurrentDB == gPhishingDBUpdate)
        updateDB(parsedResults, gPhishingDBMain);
      else
      {
        ourPref.set("phish.lastUpdate", Math.round(new Date().getTime() / 1000));
        debug("phish update done");
      }
    }, errorInBackend));
  }
}

/**
 * Downloads blacklist, parses the response and updates the DB.
 */
function downloadBlacklist()
{
  var fetcher =  new FetchHTTP({ url : brand.phish.blacklist },
  function(response)
  {
    //debug("phish: Got response from webserver");
    assert(typeof(response) == "string");
    updateDB(parse(response));
  }, errorInBackend);
  fetcher.start();
}

/**
 * Parses blacklist entries as fetched from the server.
 * Blacklist must be in "Draft v3" format.
 *
 * @param {String} blacklist
 * @return {Object} parsed blacklist
 *    {
 *      E {Array of String}, // exact URLs
 *      P {Array of String}, // prefix URLs
 *      D {Array of String}, // domains
 *    }
 */
function parse(blacklist)
{
  assert(blacklist, "blacklist is null");
  var parsed = { E : [], P : [], D : []};
  var entries = blacklist.split("\r\n");
  // TODO: remove this for production use
  // or find more robust way to detect invalid format
  // such as broken line endings
  for each (let entry in entries)
  {
    try {
    let split = entry.split(" ", 2);
    // TODO: for some reason, first entry in entries
    // is "undefined". Fix this and remove this hack.
    if (split.length != 2)
      continue;
    let type = sanitize.enum(split[0], ["E", "P", "D" ]);
    let pattern = split[1];
    if (type == "P" || type == "E")
      sanitize.url(pattern);
    else if (type == "D")
      sanitize.hostname(pattern);
    else
      throw new NotReached();
    //debug("type is " + type + ", pattern is " + pattern);
    parsed[type].push(pattern);
    } catch (e) { errorInBackend("Invalid blacklist file entry: " + e); }
  }
  //debug(parsed);
  return parsed;
}

var gPoller = null;

/**
 * Starts periodic update of the blacklist.
 * Call this function in the background with runAsync().
 */
function startPeriodicUpdate()
{
  phishingDB(); // trigger DB init
  if (!ourPref.get("phish.lastUpdate") ||
      sanitize.integer(ourPref.get("phish.lastUpdate")) <
        new Date() / 1000 - brand.phish.updateFrequency)
    downloadBlacklist();
  else debug("not updating phishing list, because we got a fresh enough one");
  gPoller = runPeriodically(downloadBlacklist,
      brand.phish.updateFrequency * 1000);
}

startPeriodicUpdate();
