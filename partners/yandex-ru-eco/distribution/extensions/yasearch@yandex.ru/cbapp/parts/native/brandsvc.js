"use strict";
const branding = application.branding;
const brandingService = {
findFile: function PartnerPackSvc_findFile(filePath) {
return branding.brandPackage.findFile(filePath);
}
,
getXMLDocument: function PartnerPackSvc_getXMLDocument(docPath, privilegedParser) {
return branding.brandPackage.getXMLDocument(docPath,privilegedParser);
}
,
getBrandID: function PartnerPackSvc_getBrandID() {
return branding.productInfo.BrandID;
}
,
getPackageDate: function PartnerPackSvc_getPackageDate() {
Cu.reportError("PartnerPackSvc_getPackageDate is deprecated.");
return branding.brandingDate;
}
,
resolvePath: function PartnerPackSvc_resolvePath(path, base) {
return branding.brandPackage.resolvePath(path,base);
}
,
expandBrandTemplates: function PartnerPackSvc_expandBrandTemplates(templateString, params) {
return branding.expandBrandTemplates(templateString,params);
}
,
expandBrandTemplatesEscape: function PartnerPackSvc_expandBrandTemplatesEscape(templateString, params) {
return branding.expandBrandTemplatesEscape(templateString,params);
}
,
getYandexFeatureState: function PartnerPackSvc_getYandexFeatureState(aFeatureName) {
return branding.getYandexFeatureState(aFeatureName);
}
};
