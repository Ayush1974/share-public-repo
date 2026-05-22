const { MAX_BODY_SIZE } = require("./config");

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, contentType, payload, fileName) {
  const headers = {
    "Content-Type": contentType,
    "Cache-Control": "no-store"
  };

  if (fileName) {
    headers["Content-Disposition"] = `attachment; filename="${fileName}"`;
  }

  res.writeHead(statusCode, headers);
  res.end(payload);
}

function safeSendSse(res, event, payload) {
  if (res.writableEnded || res.destroyed) {
    return;
  }

  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function parseRequestBody(req, callback) {
  let body = "";
  let aborted = false;
  let settled = false;

  function finish(error, payload) {
    if (settled) {
      return;
    }

    settled = true;
    callback(error, payload);
  }

  req.on("data", (chunk) => {
    if (aborted) {
      return;
    }

    body += chunk.toString("utf8");
    if (body.length > MAX_BODY_SIZE) {
      aborted = true;
      finish(new Error("Request body too large"));
      req.destroy();
    }
  });

  req.on("end", () => {
    if (aborted) {
      return;
    }

    if (!body) {
      finish(null, {});
      return;
    }

    try {
      finish(null, JSON.parse(body));
    } catch (error) {
      finish(error);
    }
  });

  req.on("error", (error) => {
    if (!aborted) {
      finish(error);
    }
  });
}

function applyCommonHeaders(req, res) {
  const origin = req.headers.origin || "*";
  const privateNetworkRequest = String(req.headers["access-control-request-private-network"] || "").trim().toLowerCase() === "true";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
  res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
  res.setHeader("Access-Control-Max-Age", "600");
  if (privateNetworkRequest) {
    // Allow hosted UI pages to reach the localhost agent in browsers enforcing Private Network Access.
    res.setHeader("Access-Control-Allow-Private-Network", "true");
  }
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (origin !== "*") {
    res.setHeader("Vary", privateNetworkRequest ? "Origin, Access-Control-Request-Private-Network" : "Origin");
  }
}

module.exports = {
  applyCommonHeaders,
  parseRequestBody,
  safeSendSse,
  sendJson,
  sendText
};
