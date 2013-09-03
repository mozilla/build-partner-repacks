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

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://unitedtb/util/common-jsm.js");
Components.utils.import("resource://unitedtb/util/globalobject.js");

const PHISHING_DB_FILE = "phishing-blacklist.sqlite";
const PHISHING_DB_FILE_OLD = "phishing-blacklist-temp.sqlite";
const PHISH_TABLE_DOMAIN = "domains";
const PHISH_TABLE_PREFIX = "prefixes";
const PHISH_TABLE_EXACT = "exact";

// URLs that should always pass. If not, the phishing DB is ignored.
var sanityCheckURLs = [
  "http://freemail.web.de",
  "https://freemail.web.de",
  "http://www.google.com",
  "http://www.gmx.net",
  ];

// Same as sanityCheckURLs, but cached as nsIURI. Populated onLoad().
var sanityCheckURIsCache = [];

var gPhishingDB = null;

/**
 * Initialilizes the phishing database.
 *
 */
function initDB(successCallback)
{
  if (gPhishingDB) {
    successCallback();
    return;
  }

  var dbfile = getProfileDir();

  // Migration, remove in 2.5
  var olddbfile = dbfile.clone();
  olddbfile.append(PHISHING_DB_FILE_OLD);
  if (olddbfile.exists()) {
    try {
      olddbfile.remove(false);
    } catch(ex) {/*Just in case remove fails for some reason*/}
  }

  dbfile.append(PHISHING_DB_FILE);
  var dbfileExisted = dbfile.exists();
  gPhishingDB = Services.storage.openDatabase(dbfile);
  if (!dbfileExisted)
    makeEmptyDB(gPhishingDB, successCallback);
  else
    successCallback();
}


/**
 * Initializes DB schema. Will delete old data.
 */
function makeEmptyDB(dbConn, successCallback)
{
  ourPref.set("phish.db.version", 1);

  var dropStmts = [];
  dropStmts.push(dbConn.createStatement("DROP TABLE IF EXISTS " + PHISH_TABLE_PREFIX));
  dropStmts.push(dbConn.createStatement("DROP TABLE IF EXISTS " + PHISH_TABLE_DOMAIN));
  dropStmts.push(dbConn.createStatement("DROP TABLE IF EXISTS " + PHISH_TABLE_EXACT));
  dbConn.executeAsync(dropStmts, dropStmts.length, new sqlCallback(function()
  {
    // You can't do a DROP TABLE and CREATE TABLE in the same statement set
    var createStmts = [];
    createStmts.push(dbConn.createStatement("CREATE TABLE " + PHISH_TABLE_PREFIX + " (pattern TEXT PRIMARY KEY)"));
    createStmts.push(dbConn.createStatement("CREATE TABLE " + PHISH_TABLE_DOMAIN + " (pattern TEXT PRIMARY KEY)"));
    createStmts.push(dbConn.createStatement("CREATE TABLE " + PHISH_TABLE_EXACT + " (pattern TEXT PRIMARY KEY)"));
    dbConn.executeAsync(createStmts, createStmts.length, new sqlCallback(successCallback, errorInBackend));
  }, errorInBackend));
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
  // If we haven't initialized the database, just return success
  if (!gPhishingDB)
    successCallback();

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
  
  var exactSel = gPhishingDB.createStatement(exactQuery);
  var prefixSel = gPhishingDB.createStatement(prefixQuery);
  var domainSel = gPhishingDB.createStatement(domainQuery);

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
  var whitelist = getGlobalObject("united", "whitelist");
  if (!whitelist) {
    whitelist = [];
    setGlobalObject("united", "whitelist", whitelist);
  }
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

function updateDB_Start(parsedResults)
{
  initDB(function() // Make sure the database is there, just in case
  {
    makeEmptyDB(gPhishingDB, function()  // Empty the DB
    {
      if (!parsedResults) {
        // if we get an invalid list from the server, continue with empty DB
        return;
      }
      updateDB(parsedResults);
    });
  });
}


/**
 * Writes the parsed blacklist into the database.
 * 
 * When updating, we first delete the whole database.
 *
 * @param parsedResults {Object} @see return value of parse()
 */
function updateDB(parsedResults)
{
  assert(parsedResults.E instanceof Array);
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
    let statement = gPhishingDB.createStatement("INSERT OR IGNORE INTO " +
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
      // Do a sanity check on a few major URLs
      for (var i = 0; i < sanityCheckURIsCache.length; i++)
      {
        checkURI(sanityCheckURIsCache[i], function(block)
        {
          if (block) {
            errorInBackend("Blacklist is blocking a major URL");
            makeEmptyDB(gPhishingDB);
            ourPref.reset("phish.lastUpdate");
          }
        }, errorInBackend);
      }
      ourPref.set("phish.lastUpdate", Math.round(new Date().getTime() / 1000));
      debug("phish update done");
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
    var parsedResults = parse(response.trim());
    updateDB_Start(parsedResults);
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
  if (!blacklist)
    return;
  var parsed = { E : [], P : [], D : []};
  var entries = blacklist.split("\r\n");
  // If we have too many entries (too slow), bail
  if (entries.length > 10000)
  {
    errorInBackend("Blacklist file is too large: " + entries.length + " entries");
    return null;
  }
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
    {
      sanitize.url(pattern);
      // If the pattern doesn't contain a '.', ignore.
      // This is to prevent things like http://www and http:// or https://
      // We also check for things like https://www.
      if (pattern.indexOf('.') == -1 ||
          pattern.indexOf('.') == pattern.length - 1) {
        errorInBackend("Invalid blacklist file entry (no dot): " + pattern);
        continue;
      }
    }
    else if (type == "D")
    {
      sanitize.hostname(pattern);
      // If the hostname doesn't contain a '.', ignore.
      // This is to prevent blocking all of com, org, net, de, uk, etc.
      if (pattern.indexOf('.') == -1) {
        errorInBackend("Invalid blacklist file entry (no dot): D " + pattern);
        continue;
      }
    }
    else
      throw new NotReached();
    //debug("type is " + type + ", pattern is " + pattern);
    parsed[type].push(pattern);
    } catch (e) { errorInBackend("Invalid blacklist file entry: " + e); }
  }
  //debug(parsed);
  return parsed;
}

/**
 * Checks to see if the blacklist has been downloaded recently
 * If not, download it.
 */
function downloadIfNeeded() {
  if (!ourPref.get("phish.enable"))
    return;
  if (!ourPref.get("phish.lastUpdate", null) ||
      sanitize.integer(ourPref.get("phish.lastUpdate")) <
        new Date() / 1000 - brand.phish.updateFrequency)
    downloadBlacklist();
  else
    debug("not updating phishing list, because we got a fresh enough one");
}

/**
 * The poller must not check lastUpdate again, to avoid time differences
 * due to event queues and network download times.
 */
function downloadIfEnabled() {
  if (!ourPref.get("phish.enable"))
    return;
  downloadBlacklist();
}

var gPoller = null;

function onLoad()
{
  // sanityCheckURLs --nsIURI--> sanityCheckURIsCache
  for (var i = 0; i < sanityCheckURLs.length; i++)
    sanityCheckURIsCache.push(Services.io.newURI(sanityCheckURLs[i], null, null));

  initDB(function()
  {
    downloadIfNeeded();
    // Start periodic update of the blacklist
    gPoller = runPeriodically(downloadIfEnabled, errorInBackend,
        brand.phish.updateFrequency * 1000);
  });
}
runAsync(onLoad);

ourPref.observe("phish.enable", downloadIfNeeded);
