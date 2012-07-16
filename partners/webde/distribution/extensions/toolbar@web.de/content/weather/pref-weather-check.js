function isValidPostalCode(postalcodeStr)
{
  /*
  // TODO countries with postalcode with letters, e.g. UK
  var postalcode = parseInt(postalcodeStr);
  if (isNaN(postalcode))
    return false;
  // TODO countries with postalcode with more or less than 5 digits
  if (postalcode < 10000 || postalcode > 99999)
    return false;
  if (postalcode < 10000 || postalcode > 99999)
    return false;
  */
  if (!postalcodeStr || postalcodeStr.length < 2)
    return false;
  return true;
}
