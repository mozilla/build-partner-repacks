function validateRegexpList(json) {
    if (!("white" in json && Array.isArray(json.white) && "black" in json && Array.isArray(json.black))) {
        return false;
    }
    return true;
}
