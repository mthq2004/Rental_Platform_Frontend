/**
 * Detox skeleton config (example). Full Detox setup requires native build setup.
 * This file is a starting point; adapt per platform and CI.
 */
module.exports = {
  testRunner: 'jest',
  runnerConfig: 'e2e/config.json',
  apps: {
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
    }
  },
  devices: {
    emulator: { type: 'android.emulator', device: { avdName: 'Pixel_3a_API_30_x86' } }
  },
  configurations: {
    'android.emu.debug': { device: 'emulator', app: 'android.debug' }
  }
}
