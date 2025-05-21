// module.exports = {
//     plugins: {
//       tailwindcss: {},
//       autoprefixer: {},
//     },
//   };
module.exports = {
    plugins: {
      '@tailwindcss/postcss': {}, // Используем новый плагин вместо tailwindcss
      autoprefixer: {},
    },
  };