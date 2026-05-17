module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@hooks': './src/hooks',
            '@store': './src/store',
            '@utils': './src/utils',
            '@types': './src/types',
            '@api': './src/api',
            '@assets': './src/assets',
          },
        },
      ],
      // Reanimated MUST be last
      require.resolve('react-native-worklets/plugin'),
    ],
  };
};
