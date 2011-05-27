Components.utils.import("resource://unitedtb/search/mcollect/mCollectImport.js", this);
Components.utils.import("resource://unitedtb/util/util.js", this);

function startSearch()
{
  var searchField = document.getElementById("searchfield");
  var searchTerm = searchField.value;
  var engine = new mMetaSearch(searchTerm);
  engine.addObserver(function() // may be called many times per search
  {
    showResults(engine.currentResults);
  });
  engine.startSearch();
}

function showResults(results)
{
  //debug("---results:---");
  //debugObject(results, "results", 1);
  var container = document.getElementById("results");
  cleanElement(container);
  for each (let result in results)
  {
    let boxE = document.createElement("vbox");
    boxE.classList.add("result-box");
    let titleE = document.createElement("description");
    titleE.classList.add("result-title");
    let urlE = document.createElement("description");
    urlE.classList.add("result-url");
    boxE.appendChild(titleE);
    container.appendChild(boxE);

    titleE.textContent = result.title;
    if (false && result instanceof mURLResult)
    {
      urlE.textContent = result.url;
      boxE.appendChild(urlE);
    }
    titleE.result = result;
    // closure doesn't work in a loop :(
    titleE.addEventListener("click", onClick, false);
  }
}

function onClick(event)
{
  event.target.result.activate(getTopLevelWindowContext());
}
