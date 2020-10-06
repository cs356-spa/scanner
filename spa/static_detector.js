/**
 * @typedef {"react"|"angular"|"angularjs"|"vue"} SpaType
 * @typedef {{ url: string, content: string }} Source
 * @typedef {{ version?: string, reasonURL: string, confidence: number, isStatic: boolean }} SpaInfo 
 * @typedef {{ [SpaType]: SpaInfo }} SpaDetectorOutput
 */

const ConfidenceLevel = {
  LOW: 0,
  MEDIUM: 1, // When no version is found, this is the MAX level we would ever set.
  HIGH: 2,
};

/**
 * 
 * @param {SpaDetectorOutput} output
 * @param {SpaType} spaType
 * @param {SpaInfo} info
 */
function mergeOutput(output, spaType, info) {
  if (!(spaType in output) || (info.confidence >= output[spaType].confidence && !output[spaType].version)) {
    output[spaType] = info;
  } else if (!output[spaType].version && info.version) {
    output[spaType].version = info.version;
    if (info.reasonURL) {
      output[spaType].reasonURL = info.reasonURL;
    }
    // Confidence level inherits previous level
  }
}

/**
 * @param {SpaDetectorOutput} output1 
 * @param {SpaDetectorOutput} output2
 * @returns {SpaDetectorOutput}
 */
function mergeDetectorOutput(output1, output2) {
  const output = {...output1};
  for (const k in output2) {
    mergeOutput(output, k, output2[k])
  }
  return output;
}

/**
 * @param {string} fileURL
 * @return {boolean}
 */
function isURLFileTypeHTML(fileURL) {
  try {
    const url = new URL(fileURL);
    // Basic extension check
    if (url.pathname.endsWith(".html") || url.pathname.endsWith(".htm")) {
      return true;
    }
    // For root page, likely HTML
    if (url.pathname.endsWith("/") || url.pathname === "") {
      return true;
    }
    // For url path where last chunk does not contain any dots (likely no extensions), likely HTML
    const pathChunks = url.pathname.split("/");
    if (pathChunks && !pathChunks.includes(".")) {
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

/**
 * @param {SpaDetectorOutput} output
 * @param {string} content 
 * @param {string} fileURL
 */
function handleHTMLFile(output, content, fileURL) {
  // Angular2 version directly from HTML file
  // https://github.com/angular/angular/issues/16283
  const angular2VersionRegex = /ng\-version=['"]([0-9\.]+)['"]/;
  const angular2VersionResult = angular2VersionRegex.exec(content);
  if (angular2VersionResult && angular2VersionResult[1]) {
    mergeOutput(output, "angular", {
      version: angular2VersionResult[1],
      reasonURL: fileURL,
      confidence: ConfidenceLevel.HIGH,
      isStatic: true,
    });
  }

  // React rough detection
  // Below 2 actually also implies React version < 0.15.0 (aka React 15)
  const reactDataRegex1 = /data\-reactid/; // only occurs before React 15, see https://stackoverflow.com/questions/17585787/whats-data-reactid-attribute-in-html
  const reactDataRegex2 = /data\-reactroot/; // similar as before. https://github.com/kentcdodds/react-detector/blob/master/content-script.js
  if (reactDataRegex1.test(content) || reactDataRegex2.test(content)) {
    mergeOutput(output, "react", {
      reasonURL: fileURL,
      confidence: ConfidenceLevel.MEDIUM,
      isStatic: true,
    });
  }
}

function handleJSFile(output, content, fileURL) {
  // TODO: Mostly handle React here. We can expand around a particular string and search nearby version
}

/**
 * @param {Source[]} sources
 * @param {string} host
 * @param {boolean?} allowThirdParty TODO: make this work.
 * @returns {SpaDetectorOutput}
 */
function staticScanForSPA(sources, host, allowThirdParty = true) {
  const output = {}
  for (const source of sources) {
    // TODO: may be improved by getting MIME type instead of extension
    if (source.url.endsWith(".js")) {
      handleJSFile(output, source.content, source.URL)
    } else if (isURLFileTypeHTML(source.url)) {
      handleHTMLFile(output, source.content, source.url);
    }
  }
  return output;
}


module.exports = {
  staticScanForSPA,
  mergeDetectorOutput,
};
