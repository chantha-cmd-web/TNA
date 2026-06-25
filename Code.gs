var TOKEN = "tna-sync-2026";

function doGet(e) {
  return handleRequest(e, "GET");
}

function doPost(e) {
  return handleRequest(e, "POST");
}

function handleRequest(e, method) {
  var params = e.parameter;
  var action = params.action || "";
  var token = params.token || "";
  
  if (token !== TOKEN) {
    return sendJson({ error: "Unauthorized" }, 403);
  }
  
  if (method === "GET") {
    if (action === "readVersion") {
      var ver = getProp("_version") || "0";
      return sendJson({ status: "ok", version: parseInt(ver) || 0 });
    }
    if (action.indexOf("read&key=") === 0) {
      var key = action.replace("read&key=", "");
      var val = getProp(key);
      return sendJson({ status: "ok", value: val ? JSON.parse(val) : null });
    }
    if (action === "readAll") {
      return sendJson({ status: "ok", data: readAllData() });
    }
  }
  
  if (method === "POST") {
    var body = JSON.parse(e.postData.contents);
    
    if (action.indexOf("write&key=") === 0) {
      var key = action.replace("write&key=", "");
      setProp(key, JSON.stringify(body.value));
      incVersion();
      return sendJson({ status: "ok" });
    }
    if (action === "writeBatch") {
      Object.keys(body).forEach(function(k) {
        setProp(k, JSON.stringify(body[k]));
      });
      incVersion();
      return sendJson({ status: "ok" });
    }
    if (action === "reset") {
      deleteAllProps();
      return sendJson({ status: "ok" });
    }
  }
  
  return sendJson({ error: "Unknown action: " + action }, 400);
}

function readAllData() {
  var out = {};
  var keys = ["data","users","campusEval","settings","telegram"];
  keys.forEach(function(k) {
    var v = getProp(k);
    if (v) out[k] = JSON.parse(v);
  });
  return out;
}

function getProp(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

function setProp(key, val) {
  PropertiesService.getScriptProperties().setProperty(key, val);
}

function deleteAllProps() {
  PropertiesService.getScriptProperties().deleteAllProperties();
}

function incVersion() {
  var v = parseInt(getProp("_version") || "0") + 1;
  setProp("_version", String(v));
}

function sendJson(obj, statusCode) {
  var output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  if (statusCode) {
    // Google Apps Script doesn't support custom status codes natively,
    // but we can still return the error message
  }
  return output;
}
