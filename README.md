# Customer-representative-status-ui

1. [Setup](#Setup)
1.1 [Creating react application](#Creating-react-application)
1.2 [Creating react-native application](#Creating-react-native-application)
1.3 [Index files](#index-files)
1.4 [Adding react-native-web](#Adding-react-native-web)
1.5 [Adding electron](#Adding-electron)
1.6 [Removing default android permissions (optional)](#Removing-default-android-permissions)
1.7 [Fastlane](#Fastlane)
2. [Code signing](#Code-signing)
2.1 [Code signing on Android](#Code-signing-on-Android)
2.1.1 [Manual code signing](#Manual-code-signing)
2.1.2 [Automatic code signing](#Automatic-code-signing)
2.2 [Code signing on iOS](#Code-signing-on-iOS)
2.2.1 [Manual code siging](#Manual-code-signing-on-iOS)
2.2.2 [Automatic code signing](#Automatic-code-signing-on-iOS)
3. [Deployment](#Deployment)
3.1 [Deployment on Android](#Deployment-on-Android)
3.1.1 [Manual deployment on Android](#Manual-deployment-on-Android)
3.1.2 [Automatic deployment on android](#Automatic-deployment-on-Android)
3.2 [Deployment on iOS](#Deployment-on-iOS)
3.2.1 [Manual deployment on iOS](#Manual-deployment-on-iOS)
3.2.2 [Automatic deployment on iOS](#Automatic-deployment-on-iOS)
# Setup
---

This guide is mainly focusing on developing on macOS as ios requires mac to build and Fastlane doesn't fully support linux/Windows yet.

##### Creating react application

In react version use create react app
```
  $ npx create-react app [applicationname]
```
Save `package.json` and `.gitignore` as you will be combining files after overwrite

You can remove `.css files`, `logo.svg`, `app.js` and `app.test.js` from `src`

Create react app scripts will check dependency versions, as they might be different from react-native, you can skip the check. However this "might lead to hard to debug" issues.
Add `.env` file to root
```
SKIP_PREFLIGHT_CHECK=true
```

##### Creating react-native application
react-native init is used on react-native side

```
npm install -g react-native-cli

react-native init [applicationname]
```
 
 Application name should be the same. React-native will point out that folder already exists and asks if you want to continue; `yes`.
 
 
Add build and start scripts, dependencies and the browserlist to the new package.json, `Do not replace start script`

Combine the two `.gitignore` files

Move `app.js` from the `root` to the `src`

##### index files
There are two index files in the application, one in `src` is for electron/web and should contain:

```javascript
import { AppRegistry } from 'react-native';
import App from './App';

AppRegistry.registerComponent("applicationname", () => App);
AppRegistry.runApplication("applicationname", { rootTag: document.getElementById('root') })
```

Other one in root is for ios/android and should contain:
```javascript
import {AppRegistry} from 'react-native';
import App from './src/App';

AppRegistry.registerComponent("applicationname", () => App);
```

##### Adding react-native-web

React-native-web replaces react-native elements in react/electron build with react-dom elements, so the code is made with react-native but works on the web and electron.

```
$ yarn add react-native-web react-art
```

At this point application should work on android, ios and on the web with react-native code.

```
//Start metro builder
$ yarn start

// Test android or ios
$ react-native run-android
// or
$ react-native run-ios
```
Add to `package.json`

```diff
"jest": {
- "preset": "react-native"
+ "preset": "react-native-web"
}

```

##### Adding electron

Electron is used to run the application with windows, linux and macOS

```
$ yarn add electron-is-dev

$ yarn add -D electron electron-builder electron-packager concurrently wait-on typescript
```

`electron-builder` and `electron-packager` are added to build electron. `electron-is-dev`, `concurrently` and `wait-on` are added to help development.

Add `electron.js` to `public` folder

```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');
const isdev = require('electron-is-dev');

let mainWindow = null;


const createWindow = () => {

    mainWindow = new BrowserWindow({ width: 1200, height: 800 });
    
    mainWindow.loadURL(isdev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`);
    // mainWindow.webContents.openDevTools(); // Uncomment if for devtools on launch
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        app.quit(); 
});

app.on('activate', () => {
    if (mainWindow === null)
        createWindow();
})
```

Add to `package.json`
```json
{
...
"scripts": {
  "dev:web": "react-scripts start",
  "prod:web": "react-scripts build",
  "electron": "electron .",
  "dev:ele": "concurrently \"BROWSER=none yarn dev:web\" \"wait-on http://localhost:3000 && yarn electron\"",
  "prod:ele": "yarn prod:web && yarn dist",
  "dist": "electron-builder"
  
}
...
"build": {
    "appId": "com.appID",
    "mac": {
      "category": "your.app.category.type"
    },
    "files": [
      "build/**/*",
      "node_modules/**/*"
    ],
    "directories": {
      "buildResources": "assets"
    }
  },
  "main": "public/electron.js",
  "homepage": "."
...
}
```

At this point the application can be run in development on all platforms and build on electron and web.

###### Removing default android permissions
**Optional**

Some default permissions by react-native might not be needed, they can be removed if they are not used. If application needs permissions, play store requires link to privacy page.

Open `android/app/src/main/AndroidManifest.xml`

```diff
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
  package="com.appID"
+ xmlns:tools="http://schemas.android.com/tools"
  >

  <uses-permission android:name="android.permission.INTERNET" />
+ <uses-permission tools:node="remove" android:name="android.permission.READ_PHONE_STATE" />
+ <uses-permission tools:node="remove" android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
+ <uses-permission tools:node="remove" android:name="android.permission.READ_EXTERNAL_STORAGE" />


<application
...
</manifest>
```

##### Fastlane
*Optional but recommended*

Fastlane is used for automatic code signing, deployment and asset management. Fastlane is not currently fully supported on Windows/linux.

```
$ xcode-select --install

$ sudo gem install fastlane -NV
// or
$ brew cask install fastlane
```

# Code signing
---

Singing is used to make sure that application is updated by authorized source.
### Code signing on Android

Navigate to java jdk bin folder and generate keystore.

```
$ cd /library/java/JavaVirtualMachines/jdkx.x.x_x.jdk/Contents/Home
// Or
$ cd /library/java/JavaVirtualMachines/jdkx.x.x_x.jdk/bin
```
`C:\Program Files\Java\jdkx.x.x_x\bin`

```
sudo keytool -genkey -v -keystore [keystoreName].keystore -alias [keystoreAlias] -keyalg RSA -keysize 2048 -validity 10000
```

Set keystore and key passwords and answer the questions asked.

##### Manual code signing on Android

**For signing manually if not using `CI`**

move `[keystoreName].keystore` to applications `android/app` folder and add `*.keystore` to `.gitignore` if its not there already.

Add to `android/gradle.properties`. *These might be too sensetive to add to public version control.*
```
MYAPP_RELEASE_STORE_FILE=[keystoreName].keystore
MYAPP_RELEASE_STORE_PASSWORD=[keystorePassword]
MYAPP_RELEASE_KEY_ALIAS=[keystoreAlias]
MYAPP_RELEASE_KEY_PASSWORD=[keystoreAliasPassword]
```

Add to `android/app/build.gradle`

```diff
android {
...
defaultConfigs { ... }
+ signingConfigs {
+        release {
+           if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
+               storeFile file(MYAPP_RELEASE_STORE_FILE)
+               storePassword MYAPP_RELEASE_STORE_PASSWORD
+               keyAlias MYAPP_RELEASE_KEY_ALIAS
+               keyPassword MYAPP_RELEASE_KEY_PASSWORD
+           }
+       }
+   }

    buildTypes {
      release {
        ...
+       signingConfig signingConfigs.release
      }
    }
}

```

You can now build release ready android application.

```
$ cd android
$ ./gradlew assembleRelease
```

Build application should be in `android/app/build/outputs/apk/release/app-release.apk`, name `app-release-unsigned.apk` means something went wrong with code signing.

##### Automatic code signing on Android

Automatic code signing is done using Fastlane. 

Setup fastlane for android
```
$ fastlane init
```

Options can be set later.

Fastlane creates `android/fastlane/` with two files in it `fastfile` which contains fastlane commands and `appfile` which contains info about the app.

Modify existing lanes or add new one to `android/fastlane/fastfile`, *Might be too sensitive to public version control*.

```ruby
desc "build code signed apk"
lane :build do
  Dir.chdir('../app')
  path = Dir.pwd
  file = path + "/" + "[keystore].keystore"
  
  gradle(
    task: "clean assembleRelease",
    properties: {
    'android.injected.signing.store.file' => "file",
    'android.injected.signing.store.password' => "[keystorePassword]",
    'android.injected.signing.key.alias' => "[keyAlias]",
    'android.injected.signing.key.password' => "[keyPassword]"
    }
  )
end
```

### Code signing on iOS

##### Manual code signing on iOS

##### Automatic code signing on iOS


# Deployment
---
### Deployment on Android

Build APK is added to google play console. Even if Fastlane is used to deploy, initial setup needs to be done manually.

##### Manual deployment on Android

1. Build signed APK locally. 
2. Log in to [Google Play Console](https://play.google.com/apps/publish).
3. Create Application.
4. Fill in details. 
You will need: 
- Hi-res icon `(512x512) 32-bit PNG`
- 2 x Screenshots `JPEG or 24-bit PNG (no alpha). Min length for any side: 320px. Max length for any side: 3840px`
- Feature graphic `1024 w x 500 h JPG or 24-bit PNG (no alpha)`
- Address to privacy policy page (if the application requires permissions)

5. Complete checkmarks not in `App releases`
6. In `App relases` choose track and upload APK

After app has been released on at least one track, it can be updated manually in `Google Play Console` or automatically with `Fastlane`.

##### Automatic deployment on Android



Get the Google play api service account api-*.json and move it to `android/app/`. 

Add `api-*.json` to `.gitignore`.

Update path to json key file in `android/fastlane/appfile`.

```diff
- json_key_file("")
+ json_key_file("app/api-....json")
```

### Deployment on iOS

##### Manual deployment on iOS

##### Automatic deployment on iOS
