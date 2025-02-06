module.exports = {
    proxy: "localhost:3000",
    files: ["**/*.html", "**/*.css", "**/*.js"],
    ignore: ["node_modules"],
    reloadDelay: 100,
    ui: false,
    notify: false,
    port: 3001,
    cors: true,
    middleware: function(req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        next();
    },
    snippetOptions: {
        rule: {
            match: /<\/body>/i,
            fn: function (snippet, match) {
                return snippet + match;
            }
        }
    }
};
