const SUPPORTED_VERSIONS = ['v1'];
const LATEST_VERSION = SUPPORTED_VERSIONS[SUPPORTED_VERSIONS.length - 1];

const isValidVersion = (version) => SUPPORTED_VERSIONS.includes(version);

const versionRegex = /\/api\/(v\d+)/i;

const urlVersioning = () => (req, res, next) => {
  const requestedVersion = req.path.match(versionRegex)?.[1]?.toLowerCase();

  if (!requestedVersion || !isValidVersion(requestedVersion)) {
    console.error(`Invalid API version requested: ${requestedVersion}`);
    return res.status(400).json({
      success: false,
      error: `API version ${requestedVersion || 'undefined'} not supported`,
      supportedVersions: SUPPORTED_VERSIONS,
      latestVersion: LATEST_VERSION,
      example: `/api/${LATEST_VERSION}/resource`
    });
  }

  next();
};

const headerVerisoning = (version) => (req, res, next) => {
  const requestedVersion = req.get("Accept-Version");

  if (!requestedVersion || !isValidVersion(requestedVersion)) {
    return res.status(406).json({
      success: false,
      error: requestedVersion ? `Version ${requestedVersion} not accepted` : 'Version header missing',
      supportedVersions: SUPPORTED_VERSIONS,
      latestVersion: LATEST_VERSION,
      example: `Accept-Version: ${LATEST_VERSION}`
    });
  }
  next();
};

const contentType = (version) => (req, res, next) => {
  const contentTypeHeader = req.get("Content-Type");
  const validTypes = SUPPORTED_VERSIONS.map(v => `application/json; version=${v}`);

  if (!contentTypeHeader || !validTypes.includes(contentTypeHeader)) {
    return res.status(415).json({
      success: false,
      error: 'Invalid Content-Type version',
      supportedTypes: validTypes,
      current: contentTypeHeader || 'missing'
    });
  }
  next();
};

module.exports = {
  urlVersioning,
  headerVerisoning,
  contentType,
};