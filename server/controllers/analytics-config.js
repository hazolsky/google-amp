const DEBUG = false;

module.exports = (req, res, next) => {

	// TODO: cache this?
	res.setHeader('Cache-Control', 'no-cache, max-age=0');

	// CORS
	const origin = req.headers.origin;
	if (origin) {
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
		res.setHeader('Access-Control-Allow-Headers', 'accept, content-type, spoor-ticket');
		res.setHeader('Access-Control-Allow-Origin', origin);
		res.setHeader('Access-Control-Allow-Credentials', 'true');

		// AMP-specific
		res.setHeader('AMP-Access-Control-Allow-Source-Origin', req.query.__amp_source_origin);
		res.setHeader('Access-Control-Expose-Headers', 'AMP-Access-Control-Allow-Source-Origin');
	}

	const spoor = {
		category: "${category}",
		action: "${action}",
		context: {
			content: {
				uuid: "${uuid}",
				title: "${title}",
			},
			product: "AMP",
			url: "${canonicalUrl}",
			amp_url: "${ampdocUrl}",
			amp_canonical_url: "${canonicalUrl}",
			referrer: "${documentReferrer}",
		},
		device: {
			spoor_id: "${clientId(spoor-id)}"
		},
		system: {
			api_key: "7107dae3-7c77-4312-92c6-93a4ba7b79ae",
			source: "amp-analytics",

			// TODO: check these
			environment: (process.env.NODE_ENV === "production" ? "p" : "d"),
			is_live: (process.env.NODE_ENV === "production"),

			// TODO: versioning
			version: "1.0.0"
		},
		user: {
			amp_reader_id: "ACCESS_READER_ID"
		},
		time: {
			amp_timestamp: "${timestamp}"
		}
	};

	const url = DEBUG ? "//localhost:5000/analytics" : "https://spoor-api.ft.com/ingest";

	const json = {
		requests: {
			standard: url + "?data=" + JSON.stringify(spoor)
		},
		triggers: {
			pageview: {
				on: "visible",
				request: "standard",
				vars: {
					category: "page",
					action: "view"
				}
			},

			// NB: https://github.com/ampproject/amphtml/issues/2046
			anchorclick: {
				on: "click",
				selector: "a",
				request: "standard",
				vars: {
					category: "link",
					action: "click"
				}
			}
		},
		transport: {
			beacon: true,
			xhrpost: true,
			image: true
		}
	};

	res.setHeader('Content-Type', 'application/json');
	res.status(202).send(JSON.stringify(json));
};

