enum BROWSER_ENUM {
  BRAVE = "brave",
  EDGE = "edge",
  INTERNET_EXPLORER = "internet_explorer",
  FIRE_FOX = "firefox",
  OPERA = "opera",
  UC_BROWSER = "uc_browser",
  SAMSUNG_BROWSER = "samsung_browser",
  CHROME = "chrome",
  SAFARI = "safari",
  UNKNOWN = "unknown",
}

enum STORAGE_ESTIMATE {
  AVAILABLE = "available",
  UNAVAILABLE = "unavailable",
}

type STORAGE_INFO = {
  raw: StorageEstimate;
  baked: {
    usage: string;
    quota: string;
  };
  storage_estimate: STORAGE_ESTIMATE;
};

/**
 *
 * @param bytes required
 * @param decimals optional
 * @returns
 */
function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = [
    "Bytes",
    "KiB",
    "MiB",
    "GiB",
    "TiB",
    "PiB",
    "EiB",
    "ZiB",
    "YiB",
  ];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function isBrave() {
  if (window.navigator?.brave?.isBrave?.name == "isBrave") {
    return true;
  } else {
    return false;
  }
}

const testUserAgent = (regexp: RegExp): boolean =>
  regexp.test(window?.navigator?.userAgent);

function detectBrowser(): BROWSER_ENUM {
  switch (true) {
    case isBrave():
      return BROWSER_ENUM.BRAVE;
    case testUserAgent(/edg/i):
      return BROWSER_ENUM.EDGE;
    case testUserAgent(/trident/i):
      return BROWSER_ENUM.INTERNET_EXPLORER;
    case testUserAgent(/firefox|fxios/i):
      return BROWSER_ENUM.FIRE_FOX;
    case testUserAgent(/opr\//i):
      return BROWSER_ENUM.OPERA;
    case testUserAgent(/ucbrowser/i):
      return BROWSER_ENUM.UC_BROWSER;
    case testUserAgent(/samsungbrowser/i):
      return BROWSER_ENUM.SAMSUNG_BROWSER;
    case testUserAgent(/chrome|chromium|crios/i):
      return BROWSER_ENUM.CHROME;
    case testUserAgent(/safari/i):
      return BROWSER_ENUM.SAFARI;
    default:
      return BROWSER_ENUM.UNKNOWN;
  }
}

/**
 * @description get `Browser` name
 */
const BROWSER: BROWSER_ENUM = detectBrowser();

/**
 *
 * @param indexDBName optional (required for `Mozilla FireFox`)
 * @param reload optional (set `true` to reload the website once storage is clear)
 * @description it clears all browser storage for current site i.e. Cookies, Local Storage, Session Storage, Cache Storage, IndexDB Storage.
 */
const clearSiteData = async ({
  indexDBName,
  reload,
}: {
  indexDBName?: string;
  reload?: boolean;
}) => {
  try {
    // clear local storage
    window.localStorage.clear();
    // clear session storage
    window.sessionStorage.clear();
    // clear cookies
    const allCookies = window.document.cookie.split(";");
    // The "expire" attribute of every cookie is Set to "Thu, 01 Jan 1970 00:00:00 GMT"
    for (let i = 0; i < allCookies.length; i++)
      window.document.cookie =
        allCookies[i] + "=;expires=" + new Date(0).toUTCString();

    // clear cache storage
    await window.caches
      .keys()
      .then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      })
      .then(() => {
        console.info("Cache Storage Cleared.");
      });

    if ((BROWSER === BROWSER_ENUM.FIRE_FOX && indexDBName) || indexDBName) {
      window.indexedDB.deleteDatabase(indexDBName);
      console.info("IndexDB Storage Cleared.");
    } else {
      await window.indexedDB
        ?.databases()
        .then((r) => {
          for (var i = 0; i < r.length; i++) {
            if (typeof r[i].name === "string")
              window.indexedDB.deleteDatabase(r[i].name!);
          }
        })
        .then(() => {
          console.info("IndexDB Storage Cleared.");
        });
    }

    if (typeof reload === "boolean" && reload) {
      window.location.reload();
    }
  } catch (error) {
    console.error(error);
  }
};

/**
 *
 * @description get website browser storage `Usage` & `Quota`,
 */
const getStorageUsageAndQuota = async () => {
  let storageInfo: STORAGE_INFO = {
    raw: {
      usage: 0,
      quota: 0,
    },
    baked: {
      usage: formatBytes(0),
      quota: formatBytes(0),
    },
    storage_estimate: STORAGE_ESTIMATE.UNAVAILABLE,
  };

  if ("storage" in navigator && "estimate" in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    storageInfo = {
      raw: estimate,
      baked: {
        usage: formatBytes(estimate.usage ?? 0),
        quota: formatBytes(estimate.quota ?? 0),
      },
      storage_estimate: STORAGE_ESTIMATE.AVAILABLE,
    };
  }

  return storageInfo;
};

export {
  BROWSER,
  BROWSER_ENUM,
  getStorageUsageAndQuota,
  STORAGE_ESTIMATE,
  STORAGE_INFO,
  clearSiteData,
};
