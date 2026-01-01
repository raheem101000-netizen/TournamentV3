import { ExpoConfig } from "expo/config"

const config: ExpoConfig = {
  name: "10on10",
  slug: "1010",
  version: "1.0.4",
  orientation: "portrait",
  scheme: "myapp",
  assetBundlePatterns: ["**/*"],
  userInterfaceStyle: "dark",
  backgroundColor: "#000000",
  splash: {
    image: "./src/assets/images/splash.png",
    backgroundColor: "#000000",
  },
  ios: {
    buildNumber: "1",
    bundleIdentifier: "com.aexolstudio.tenOnTen",
    icon: "./src/assets/images/icon.png",
    supportsTablet: false,
  },
  android: {
    allowBackup: false,
    versionCode: 12,
    package: "com.aexolstudio.tenOnTen",
    softwareKeyboardLayoutMode: "resize",
    adaptiveIcon: {
      foregroundImage: "./src/assets/images/adaptive-icon.png",
      backgroundColor: "#000000",
    },
  },
  plugins: [
    "expo-router",
    "expo-localization",
    [
      "expo-font",
      {
        fonts: [
          "./src/assets/fonts/RedHatDisplay-Bold.ttf",
          "./src/assets/fonts/RedHatDisplay-ExtraBold.ttf",
          "./src/assets/fonts/RedHatDisplay-SemiBold.ttf",
          "./src/assets/fonts/RedHatDisplay-Italic.ttf",
          "./src/assets/fonts/RedHatDisplay-Medium.ttf",
          "./src/assets/fonts/RedHatDisplay-Regular.ttf",
        ],
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission: "The app accesses the user's photos to allow you to choose an avatar.",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {
      origin: false,
    },
    eas: {
      projectId: "28b2aa52-6f14-4a1f-968f-5e9c6ac146e8",
    },
  },

  owner: "aexol-studio",
}

export default config
