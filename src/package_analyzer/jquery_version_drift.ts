// These versions are taken from jquery_general_classifier.json's falsePositives.
// This file is used to run false positive analysis of our general crawler.
const versions = {
  "microsoft.com": [
    "3.0.0",
    "3.3.1"
  ],
  "goo.gl": [
    "1.11.2",
    "1.11.3"
  ],
  "wordpress.com": [
    "1.11.2",
    "1.12.4"
  ],
  "wordpress.org": [
    "1.11.2",
    "1.12.4"
  ],
  "gravatar.com": [
    "1.11.0",
    "1.11.0"
  ],
  "apache.org": [
    "2.1.1",
    "2.1.1"
  ],
  "cnn.com": [
    "1.11.2",
    "1.12.3"
  ],
  "virginmedia.com": [
    "1.11.2",
    "1.11.2"
  ],
  "archive.org": [
    "1.11.0",
    "1.10.2"
  ],
  "weebly.com": [
    "2.1.2",
    "2.1.4"
  ],
  "tinyurl.com": [
    "1.11.0",
    "1.11.0"
  ],
  "reuters.com": [
    "2.1.2",
    "2.2.4"
  ],
  "harvard.edu": [
    "1.11.2",
    "1.11.2"
  ],
  "wp.com": [
    "1.11.2",
    "1.12.4"
  ],
  "web.archive.org": [
    "1.11.0",
    "1.10.2"
  ],
  "cpanel.net": [
    "3.0.0",
    "3.3.1 -ajax,-ajax/jsonp,-ajax/load,-ajax/parseXML,-ajax/script,-ajax/var/location,-ajax/var/nonce,-ajax/var/rquery,-ajax/xhr,-manipulation/_evalUrl,-event/ajax,-effects,-effects/Tween,-effects/animatedSelector"
  ],
  "go.com": [
    "3.5.0",
    "3.5.1"
  ],
  "bitly.com": [
    "1.11.2",
    "1.12.4"
  ],
  "nasa.gov": [
    "3.0.0",
    "3.4.1"
  ],
  "cpanel.com": [
    "3.0.0",
    "3.3.1 -ajax,-ajax/jsonp,-ajax/load,-ajax/parseXML,-ajax/script,-ajax/var/location,-ajax/var/nonce,-ajax/var/rquery,-ajax/xhr,-manipulation/_evalUrl,-event/ajax,-effects,-effects/Tween,-effects/animatedSelector"
  ],
  "cnet.com": [
    "1.8.2",
    "1.8.3"
  ],
  "nginx.com": [
    "1.11.2",
    "1.12.4"
  ],
  "ebay.com": [
    "3.0.0",
    "3.5.1"
  ],
  "office.com": [
    "2.1.2",
    "2.2.2"
  ],
  "hp.com": [
    "1.8.2",
    "1.8.3"
  ],
  "hugedomains.com": [
    "1.12.0",
    "2.2.0"
  ],
  "www.gov.uk": [
    "1.11.2",
    "1.12.4"
  ],
  "onlinelibrary.wiley.com": [
    "3.0.0",
    "3.1.1"
  ],
  "xinhuanet.com": [
    "1.12.0",
    "1.12.4"
  ],
  "yelp.com": [
    "1.8.2",
    "1.8.3"
  ],
  "s3.amazonaws.com": [
    "3.0.0",
    "3.4.1"
  ],
  "loc.gov": [
    "1.8.2",
    "1.8.2"
  ],
  "statcounter.com": [
    "2.1.2",
    "2.1.3"
  ],
  "washington.edu": [
    "1.11.2",
    "1.12.4"
  ],
  "link.springer.com": [
    "3.0.0",
    "3.3.1"
  ],
  "about.com": [
    "2.1.2",
    "2.2.2"
  ],
  "akismet.com": [
    "2.1.2",
    "2.2.4"
  ],
  "scribd.com": [
    "3.0.0",
    "3.3.1"
  ],
  "arnebrachhold.de": [
    "3.0.0",
    "3.4.1"
  ],
  "princeton.edu": [
    "3.0.0",
    "3.4.1"
  ],
  "ca.gov": [
    "3.0.0",
    "3.4.1"
  ],
  "typepad.com": [
    "3.0.0",
    "3.3.1"
  ],
  "marriott.com": [
    "1.11.2",
    "3.4.1"
  ],
  "foxnews.com": [
    "3.0.0",
    "3.1.1"
  ],
  "sciencemag.org": [
    "1.11.0",
    "1.11.0"
  ],
  "youronlinechoices.com": [
    "1.7.2",
    "1.7.1"
  ],
  "webmd.com": [
    "1.8.2",
    "1.8.2"
  ],
  "plesk.com": [
    "1.11.2",
    "1.12.4"
  ],
  "mashable.com": [
    "1.11.2",
    "1.12.4"
  ],
  "aboutads.info": [
    "1.5.1",
    "1.4.4"
  ],
  "tandfonline.com": [
    "3.5.0",
    "3.5.0"
  ],
  "whitehouse.gov": [
    "3.5.0",
    "3.5.1"
  ],
  "usda.gov": [
    "3.5.0",
    "3.5.1"
  ],
  "bandcamp.com": [
    "1.7.2",
    "1.7.1"
  ],
  "geocities.com": [
    "3.5.0",
    "3.5.1"
  ],
  "tripod.com": [
    "1.8.2",
    "1.8.2"
  ],
  "sun.com": [
    "3.5.0",
    "3.5.1"
  ],
  "oup.com": [
    "1.8.2",
    "1.9.1"
  ],
  "epa.gov": [
    "1.7.2",
    "1.7.2"
  ],
  "noaa.gov": [
    "1.11.0",
    "1.10.2"
  ],
  "sciencedaily.com": [
    "1.11.2",
    "1.11.2"
  ],
  "psu.edu": [
    "3.0.0",
    "3.4.1"
  ],
  "myshopify.com": [
    "1.11.0",
    "2.0.3"
  ],
  "upenn.edu": [
    "1.11.0",
    "2.2.4"
  ],
  "state.gov": [
    "3.0.0",
    "3.3.1"
  ],
  "businesswire.com": [
    "1.8.2",
    "1.9.1"
  ],
  "wpengine.com": [
    "3.5.0",
    "3.5.0"
  ],
  "yandex.ru": [
    "2.1.2",
    "2.1.4"
  ],
  "ox.ac.uk": [
    "1.11.0",
    "1.10.2"
  ],
  "dev.mysql.com": [
    "1.11.2",
    "1.12.2"
  ],
  "oreilly.com": [
    "3.0.0",
    "3.3.1"
  ],
  "cambridge.org": [
    "3.5.0",
    "3.5.1"
  ],
  "plos.org": [
    "3.5.0",
    "3.5.1"
  ],
  "psychologytoday.com": [
    "1.11.0",
    "1.10.2"
  ],
  "uci.edu": [
    "2.1.2",
    "2.1.4"
  ],
  "afternic.com": [
    "1.7.2",
    "1.7.1"
  ],
  "mayoclinic.org": [
    "1.11.0",
    "1.11.0"
  ],
  "elegantthemes.com": [
    "3.0.0",
    "3.3.1"
  ],
  "britannica.com": [
    "3.5.0",
    "3.5.0"
  ],
  "ieee.org": [
    "1.11.2",
    "1.11.2"
  ],
  "nypost.com": [
    "1.11.2",
    "1.12.4"
  ],
  "zendesk.com": [
    "3.5.0",
    "3.5.1"
  ],
  "uk.com": [
    "1.5.1",
    "1.5.2"
  ],
  "ucla.edu": [
    "1.7.2",
    "1.7.1"
  ],
  "entrepreneur.com": [
    "3.0.0",
    "3.4.1"
  ],
  "cam.ac.uk": [
    "3.5.0",
    "3.5.1"
  ],
  "jhu.edu": [
    "3.0.0",
    "3.1.1"
  ],
  "chicagotribune.com": [
    "3.0.0",
    "3.3.1"
  ],
  "utexas.edu": [
    "1.11.0",
    "1.10.2"
  ],
  "deloitte.com": [
    "1.11.2",
    "1.12.4-aem"
  ],
  "uiuc.edu": [
    "1.11.1",
    "1.11.1"
  ],
  "aboutcookies.org": [
    "1.11.2",
    "1.12.4"
  ],
  "oecd.org": [
    "1.11.0",
    "1.10.2"
  ],
  "elsevier.com": [
    "2.1.2",
    "2.1.4"
  ],
  "uchicago.edu": [
    "3.0.0",
    "3.3.1"
  ],
  "gotowebinar.com": [
    "1.11.2",
    "2.2.4"
  ],
  "nps.gov": [
    "1.11.2",
    "1.12.0"
  ],
  "newsweek.com": [
    "2.1.2",
    "2.2.4"
  ],
  "parallels.com": [
    "3.0.0",
    "3.1.1"
  ],
  "arstechnica.com": [
    "1.11.0",
    "2.2.4"
  ],
  "ftc.gov": [
    "3.0.0",
    "1.8.3"
  ],
  "steampowered.com": [
    "1.8.2",
    "1.8.3"
  ],
  "jd.com": [
    "1.11.2",
    "1.11.3"
  ],
  "ed.gov": [
    "1.11.0",
    "1.10.2"
  ],
  "si.edu": [
    "3.0.0",
    "3.1.1"
  ],
  "sfgate.com": [
    "1.11.2",
    "2.2.4"
  ],
  "howstuffworks.com": [
    "3.0.0",
    "3.3.1"
  ],
  "widgets.wp.com": [
    "1.11.2",
    "1.12.4"
  ],
  "irs.gov": [
    "3.5.0",
    "1.6.4"
  ],
  "altervista.org": [
    "1.11.2",
    "1.12.0"
  ],
  "dw.com": [
    "3.0.0",
    "3.4.1"
  ],
  "zend.com": [
    "1.11.2",
    "3.5.1"
  ],
  "getpocket.com": [
    "1.11.0",
    "1.10.2"
  ],
  "www.gov.cn": [
    "1.8.2",
    "1.8.3"
  ],
  "purdue.edu": [
    "1.11.0",
    "1.10.2"
  ],
  "house.gov": [
    "3.0.0",
    "3.4.1"
  ],
  "pnas.org": [
    "1.8.2",
    "1.8.2"
  ],
  "joomla.org": [
    "1.11.2",
    "1.12.4"
  ],
  "ow.ly": [
    "3.0.0",
    "3.4.1"
  ],
  "store.steampowered.com": [
    "1.8.2",
    "1.8.3"
  ],
  "fao.org": [
    "1.11.2",
    "2.2.4"
  ],
  "openstreetmap.org": [
    "3.5.0",
    "3.5.1"
  ],
  "evernote.com": [
    "3.0.0",
    "3.3.1"
  ],
  "merriam-webster.com": [
    "1.11.2",
    "3.5.1"
  ],
  "usc.edu": [
    "1.11.2",
    "1.12.4"
  ],
  "angelfire.com": [
    "1.5.1",
    "1.4.2"
  ],
  "pewresearch.org": [
    "1.11.2",
    "1.12.4"
  ],
  "earthlink.net": [
    "1.11.2",
    "1.12.4"
  ],
  "senate.gov": [
    "1.11.2",
    "1.11.3"
  ],
  "fc2.com": [
    "1.5.1",
    "1.2.6"
  ],
  "journals.sagepub.com": [
    "1.8.2",
    "1.9.1"
  ],
  "postgresql.org": [
    "3.0.0",
    "3.4.1 -ajax,-ajax/jsonp,-ajax/load,-ajax/parseXML,-ajax/script,-ajax/var/location,-ajax/var/nonce,-ajax/var/rquery,-ajax/xhr,-manipulation/_evalUrl,-event/ajax,-effects,-effects/Tween,-effects/animatedSelector"
  ],
  "ning.com": [
    "3.0.0",
    "3.4.1"
  ],
  "usgs.gov": [
    "1.11.0",
    "1.10.2"
  ],
  "umd.edu": [
    "1.11.0",
    "1.10.2"
  ],
  "rt.com": [
    "1.11.2",
    "1.11.2"
  ],
  "mozilla.com": [
    "3.0.0",
    "3.4.1"
  ],
  "acs.org": [
    "1.11.0",
    "1.10.2"
  ],
  "variety.com": [
    "1.11.2",
    "1.12.4"
  ],
  "unc.edu": [
    "2.1.2",
    "2.2.4"
  ],
  "politico.com": [
    "1.11.0",
    "1.11.0"
  ],
  "slashdot.org": [
    "2.1.2",
    "1.3.2"
  ],
  "jquery.com": [
    "1.11.2",
    "1.11.3"
  ],
  "mitre.org": [
    "1.7.2",
    "1.9.1"
  ],
  "bls.gov": [
    "3.5.0",
    "3.5.0"
  ],
  "nejm.org": [
    "3.0.0",
    "3.4.1"
  ],
  "rollingstone.com": [
    "1.11.2",
    "1.12.4"
  ],
  "wp.me": [
    "1.11.2",
    "1.12.4"
  ],
  "vmware.com": [
    "1.11.2",
    "1.12.4-aem"
  ],
  "news.com.au": [
    "1.11.2",
    "1.12.4"
  ],
  "nist.gov": [
    "3.5.0",
    "3.5.1"
  ],
  "icann.org": [
    "1.5.1",
    "2.2.4"
  ],
  "trello.com": [
    "2.1.1",
    "2.1.1"
  ],
  "jstor.org": [
    "3.0.0",
    "3.2.1"
  ],
  "chinanews.com": [
    "1.11.2",
    "1.11.3"
  ],
  "nvidia.com": [
    "1.11.2",
    "1.12.4-aem"
  ],
  "dedecms.com": [
    "3.5.0",
    "3.5.1"
  ],
  "getbootstrap.com": [
    "3.5.0",
    "3.5.1 -ajax,-ajax/jsonp,-ajax/load,-ajax/script,-ajax/var/location,-ajax/var/nonce,-ajax/var/rquery,-ajax/xhr,-manipulation/_evalUrl,-deprecated/ajax-event-alias,-effects,-effects/Tween,-effects/animatedSelector"
  ],
  "eff.org": [
    "1.7.2",
    "1.7.2"
  ],
  "sec.gov": [
    "3.5.0",
    "3.5.1"
  ],
  "arizona.edu": [
    "3.0.0",
    "3.1.1"
  ],
  "prezi.com": [
    "1.11.2",
    "2.1.0"
  ],
  "hollywoodreporter.com": [
    "2.1.1",
    "2.1.1"
  ],
  "illinois.edu": [
    "1.11.1",
    "1.11.1"
  ],
  "boston.com": [
    "1.11.2",
    "1.11.2"
  ],
  "stackexchange.com": [
    "1.11.2",
    "1.12.4"
  ],
  "iana.org": [
    "1.8.2",
    "1.9.0"
  ],
  "docker.com": [
    "3.0.0",
    "3.4.1"
  ],
  "technologyreview.com": [
    "1.11.2",
    "3.3.1"
  ],
  "opensource.org": [
    "1.11.0",
    "1.10.2"
  ],
  "thehill.com": [
    "1.7.2",
    "1.7.2"
  ],
  "unicef.org": [
    "3.5.0",
    "3.5.1"
  ],
  "phys.org": [
    "3.0.0",
    "3.4.1"
  ],
  "chron.com": [
    "1.11.2",
    "2.2.4"
  ],
  "thenextweb.com": [
    "3.0.0",
    "3.1.1"
  ],
  "rutgers.edu": [
    "3.5.0",
    "3.5.1"
  ],
  "techtarget.com": [
    "1.11.2",
    "1.12.4"
  ],
  "cve.mitre.org": [
    "3.0.0",
    "3.2.1"
  ],
  "colorlib.com": [
    "1.11.2",
    "1.12.4"
  ],
  "ssrn.com": [
    "1.11.2",
    "1.12.4"
  ],
  "discovery.com": [
    "2.1.2",
    "2.1.4"
  ],
  "kde.org": [
    "3.5.0",
    "3.5.1"
  ],
  "jotform.com": [
    "2.1.1",
    "2.1.1"
  ],
  "phpbb.com": [
    "1.11.0",
    "2.0.3"
  ],
  "moz.com": [
    "2.1.2",
    "2.2.4"
  ],
  "perl.org": [
    "1.11.2",
    "1.12.3"
  ],
  "theregister.co.uk": [
    "1.11.2",
    "1.11.2"
  ],
  "com.com": [
    "3.0.0",
    "3.4.1"
  ],
  "colorado.edu": [
    "1.8.2",
    "1.9.1"
  ],
  "ny.gov": [
    "1.11.0",
    "1.10.2"
  ],
  "bu.edu": [
    "1.11.2",
    "1.12.4"
  ],
  "playstation.com": [
    "1.11.2",
    "3.4.1-aem"
  ],
  "fedoraproject.org": [
    "3.0.0",
    "3.3.1"
  ],
  "tamu.edu": [
    "1.11.1",
    "1.11.1"
  ],
  "readthedocs.io": [
    "1.11.0",
    "2.0.3"
  ],
  "fcc.gov": [
    "2.1.2",
    "2.2.4"
  ],
  "bitbucket.org": [
    "2.1.2",
    "2.1.3"
  ],
  "pwc.com": [
    "1.11.2",
    "1.12.4-aem"
  ],
  "smithsonianmag.com": [
    "1.11.0",
    "1.10.2"
  ],
  "snapchat.com": [
    "2.1.2",
    "2.1.4"
  ],
  "udel.edu": [
    "1.11.2",
    "1.11.3"
  ],
  "novell.com": [
    "3.0.0",
    "3.2.1"
  ],
  "dhs.gov": [
    "1.8.2",
    "1.9.1"
  ],
  "thoughtco.com": [
    "3.0.0",
    "3.4.1"
  ],
  "matterport.com": [
    "3.5.0",
    "3.5.1"
  ],
  "podbean.com": [
    "1.8.2",
    "1.8.3"
  ],
  "attendee.gotowebinar.com": [
    "1.11.1",
    "1.11.1"
  ],
  "autodesk.com": [
    "1.11.2",
    "1.12.4-aem"
  ],
  "bigcartel.com": [
    "3.0.0",
    "3.2.1"
  ],
  "cancer.org": [
    "1.11.2",
    "1.12.4-aem"
  ],
  "windows.net": [
    "3.5.0",
    "3.5.1"
  ],
  "admin.ch": [
    "1.11.2",
    "1.12.4"
  ],
  "mlb.com": [
    "1.8.2",
    "1.9.1"
  ],
  "tiny.cc": [
    "3.0.0",
    "3.4.1"
  ],
  "atlassian.com": [
    "2.1.2",
    "2.1.3"
  ],
  "people.com": [
    "3.5.0",
    "3.5.1"
  ],
  "tufts.edu": [
    "1.7.2",
    "1.7.2"
  ],
  "consumerreports.org": [
    "1.11.2",
    "2.1.3"
  ],
  "hatenablog.com": [
    "1.11.2",
    "1.12.4"
  ],
  "ap.org": [
    "2.2.0",
    "2.2.4"
  ],
  "computerworld.com": [
    "1.11.0",
    "1.10.2"
  ],
  "eurekalert.org": [
    "1.11.0",
    "1.10.2"
  ],
  "ebay.co.uk": [
    "3.0.0",
    "3.5.1"
  ],
  "cia.gov": [
    "1.8.2",
    "1.8.3"
  ],
  "frontiersin.org": [
    "2.1.1",
    "2.1.1"
  ],
  "narod.ru": [
    "1.11.2",
    "1.12.4"
  ],
  "fool.com": [
    "3.0.0",
    "3.3.1"
  ],
  "utah.edu": [
    "3.0.0",
    "3.3.1"
  ],
  "voanews.com": [
    "3.5.0",
    "3.5.1"
  ],
  "mercurynews.com": [
    "1.11.2",
    "1.11.3"
  ],
  "imageshack.com": [
    "1.11.0",
    "2.0.3"
  ],
  "sony.com": [
    "3.0.0",
    "3.2.1"
  ],
  "snopes.com": [
    "1.11.2",
    "1.12.4"
  ],
  "athemes.com": [
    "3.0.0",
    "3.4.1"
  ],
  "ucsb.edu": [
    "3.5.0",
    "3.5.1"
  ],
  "lenovo.com": [
    "3.0.0",
    "3.3.1"
  ],
  "form.jotform.com": [
    "2.1.1",
    "2.1.1"
  ],
  "digital.com": [
    "3.0.0",
    "3.1.1"
  ],
  "nielsen.com": [
    "1.11.2",
    "1.12.4"
  ],
  "redcross.org": [
    "1.11.2",
    "1.12.4-aem"
  ],
  "theregister.com": [
    "1.11.2",
    "1.11.2"
  ],
  "usembassy.gov": [
    "3.0.0",
    "3.2.1"
  ],
  "nsw.gov.au": [
    "3.5.0",
    "3.5.1"
  ],
  "garmin.com": [
    "1.11.2",
    "1.12.4"
  ],
  "cancer.gov": [
    "3.5.0",
    "3.5.1"
  ],
  "irishtimes.com": [
    "1.8.2",
    "1.9.0"
  ],
  "us.org": [
    "1.11.1",
    "1.11.1"
  ],
  "ccc.de": [
    "1.5.1",
    "1.3.2"
  ],
  "youronlinechoices.eu": [
    "1.7.2",
    "1.7.1"
  ],
  "hawaii.edu": [
    "1.11.2",
    "1.12.4"
  ],
  "perl.com": [
    "1.12.0",
    "2.2.0"
  ],
  "vt.edu": [
    "3.0.0",
    "3.4.1"
  ],
  "ndtv.com": [
    "1.11.2",
    "3.5.1"
  ],
  "reference.com": [
    "1.11.1",
    "1.11.1"
  ],
  "csmonitor.com": [
    "1.11.0",
    "1.10.2"
  ],
  "americanexpress.com": [
    "3.0.0",
    "3.1.0"
  ],
  "zoho.com": [
    "3.0.0",
    "3.4.0"
  ],
  "medlineplus.gov": [
    "3.0.0",
    "3.4.1"
  ],
  "fedex.com": [
    "1.11.2",
    "1.12.4-aem"
  ],
  "ilo.org": [
    "1.7.2",
    "1.7.1"
  ],
  "duckduckgo.com": [
    "1.11.0",
    "1.10.2"
  ],
  "colostate.edu": [
    "1.11.1",
    "1.11.1"
  ],
  "cuny.edu": [
    "1.11.2",
    "1.12.4"
  ],
  "service.gov.uk": [
    "1.11.2",
    "1.12.4"
  ],
  "mcafee.com": [
    "3.0.0",
    "3.3.1"
  ],
  "searchengineland.com": [
    "1.11.0",
    "1.11.0"
  ],
  "isc.org": [
    "3.0.0",
    "3.3.1"
  ],
  "iop.org": [
    "3.0.0",
    "3.4.1"
  ],
  "oregonstate.edu": [
    "3.5.0",
    "3.5.1"
  ],
  "hrw.org": [
    "3.0.0",
    "3.4.1"
  ],
  "bell-labs.com": [
    "3.0.0",
    "3.2.1"
  ],
  "gmw.cn": [
    "1.7.2",
    "1.7.2"
  ],
  "fema.gov": [
    "3.5.0",
    "3.5.1"
  ],
  "japantimes.co.jp": [
    "1.11.2",
    "1.8.3"
  ],
  "nyc.gov": [
    "1.8.2",
    "1.9.1"
  ],
  "blackberry.com": [
    "3.0.0",
    "3.3.1"
  ],
  "thawte.com": [
    "1.11.2",
    "1.11.3"
  ],
  "esa.int": [
    "2.1.2",
    "2.2.4"
  ],
  "osha.gov": [
    "1.8.2",
    "1.9.1"
  ],
  "xkcd.com": [
    "1.11.0",
    "1.11.0"
  ]
};
const diffMap = new Map<number, number>(); // diff => count
const patchDiffMap = new Map<number, number>(); // diff => count

for (const host in versions) {
  const predicted = versions[host][0];
  const actual = versions[host][1];
  const predictedChunks = predicted.split(".");
  const actualChunks = actual.split(".");
  const predictedMajor = +predictedChunks[0];
  const predictedMinor = +predictedChunks[1];
  const actualMajor = +actualChunks[0];
  const actualMinor = +actualChunks[1];

  if (predictedMajor === actualMajor) {
    const diff = Math.abs(predictedMinor - actualMinor);
    diffMap.set(diff, (diffMap.get(diff) || 0) + 1);
    if (predictedMinor === actualMinor) {
      const predictedPatch = parseInt(predictedChunks[2]);
      const actualPatch = parseInt(actualChunks[2]);
      const patchDiff = Math.abs(predictedPatch - actualPatch);
      patchDiffMap.set(patchDiff, (patchDiffMap.get(patchDiff) || 0) + 1);
    }
  } else {
    let diff = 0;
    if (predictedMajor === 1 && actualMajor === 2) {
      diff = Math.abs(actualMinor + 12 - predictedMinor);
    } else if (predictedMajor === 2 && actualMajor === 1) {
      diff = Math.abs(predictedMinor+ 12 - actualMinor);
    } else if (predictedMajor === 2 && actualMajor === 3) {
      diff = Math.abs(actualMinor + 2 - predictedMinor);
    } else if (predictedMajor === 3 && actualMajor === 2) {
      diff = Math.abs(predictedMinor + 2 - actualMinor);
    } else {
      console.log(`>>> WARNING: large diff found: ${predicted} vs ${actual}`)
    }
    if (diff > 0) {
      diffMap.set(diff, (diffMap.get(diff) || 0) + 1);
    }
  }
}

console.log(">> MINOR DIFF:")
console.log(diffMap);
console.log(">> PATCH DIFF:")
console.log(patchDiffMap);

/*
>>> WARNING: large diff found: 1.11.2 vs 3.4.1
>>> WARNING: large diff found: 3.0.0 vs 1.8.3
>>> WARNING: large diff found: 3.5.0 vs 1.6.4
>>> WARNING: large diff found: 1.11.2 vs 3.5.1
>>> WARNING: large diff found: 1.11.2 vs 3.5.1
>>> WARNING: large diff found: 1.11.2 vs 3.3.1
>>> WARNING: large diff found: 1.11.2 vs 3.4.1-aem
>>> WARNING: large diff found: 1.11.2 vs 3.5.1
Map {
  3 => 28,
  0 => 101,
  1 => 101,
  4 => 25,
  5 => 2,
  2 => 13,
  10 => 1,
  9 => 1
}
 */