module.exports = {
  devServer: {
    port: 8083,
    proxy: { "/api": { target: "http://localhost:8080", changeOrigin: true } },
  },
  chainWebpack: (config) =>
    config.plugin("html").tap((args) => {
      args[0].title = "Emerald Housing";
      return args;
    }),
};
