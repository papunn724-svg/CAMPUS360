/*
 * CAMPUS360 shared API configuration.
 * Default: deployed Render API. For local development, run the backend and set:
 * localStorage.setItem("campus360ApiOrigin", "http://localhost:5000")
 */
(function () {
    const DEFAULT_API_ORIGIN = "https://campus360-lsvd.onrender.com";
    const API_ORIGIN = (localStorage.getItem("campus360ApiOrigin") || DEFAULT_API_ORIGIN)
        .replace(/\/+$/, "");
    window.CAMPUS360_API_ORIGIN = API_ORIGIN;

    const nativeFetch = window.fetch.bind(window);
    window.fetch = function (resource, options) {
        const opts = options ? { ...options } : {};
        let url = typeof resource === "string" ? resource :
            (resource && resource.url ? resource.url : "");

        if (url && url.includes("campus360-lsvd.onrender.com")) {
            url = url.replace(/^https?:\/\/campus360-lsvd\.onrender\.com/i, API_ORIGIN);
            resource = url;
        }

        if (url && /\/api\//.test(url)) {
            const headers = new Headers(opts.headers || (resource instanceof Request ? resource.headers : undefined));
            const isAdmin = /\/api\/admin\//.test(url);
            const token = sessionStorage.getItem(
                isAdmin ? "campus360AdminToken" : "campus360StudentToken"
            );
            if (token && !headers.has("Authorization")) {
                headers.set("Authorization", "Bearer " + token);
            }
            opts.headers = headers;
        }

        return nativeFetch(resource, opts);
    };
})();
