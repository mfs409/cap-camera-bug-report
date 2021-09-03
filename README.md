# Test Code for Capacitor Camera

**Update 3 Septempber 2021: This bug has been fixed.  See <https://github.com/ionic-team/capacitor/pull/5004>**

The purpose of this repository is to provide some shareable code for debugging
an issue I've been observing with the Capacitor Camera Plugin on Android.

Initial information about the bug, and the associated bug report, can be found at:

* <https://github.com/ionic-team/capacitor-plugins/issues/572>
* <https://forum.ionicframework.com/t/android-10-camera-plugin-issues/214294>

The problem only arises when "Don't keep activities" is checked.  When it is
checked (or when the device decides not to keep an activity), the main app
closes when the camera opens.  When the camera returns, an `Intent` fails to
deliver.

## Demonstrating the Bug

First, to convince oneself that the code is not blatantly incorrect, launch the
app as a PWA:

```bash
npm install
npm start
```

Then open a browser and navigate to <http://localhost:8080>.  The app should be
present, and both buttons should work.  When the Camera or Gallery returns a
photo, the first few characters of its `webPath` should appear in an alert.

Second, to demonstrate the bug, we will launch the app on Android.  Note that
the Android project is quite vanilla: the project was created by typing `npx cap
add android` and then adding the following permissions:

```xml
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.CAMERA" />
```

To build the android project and open it in Android Studio, type the following:

```bash
npm run android
npx cap open android
```

To configure the device, be sure to check the "Don't keep activities" option in
the Developer Options menu.
https://forum.ionicframework.com/t/android-10-camera-plugin-issues/214294
To launch the app on the device, connect it, wait for Android Studio to
recognize it, and then click `Run` (or press `shift-F10`).

The app makes use of the unique string `CAPTEST` in its `console.log`
statements, so one can filter for it in LogCat:

Run the app, and click "Open Camera".  Take a picture.  The app will return
after the camera finishes.

First, notice that despite `saveToGallery: true` on line 40 of main.ts, the
image does not appear in the Gallery.

Second, in the LogCat (filtering on `CAPTEST`), there is no evidence of
`appRestoredResult` events:

```texthttps://forum.ionicframework.com/t/android-10-camera-plugin-issues/214294
2021-08-28 09:38:11.635 29718-29718/? I/Capacitor/Console: File: http://localhost/bundle.js - Line 2 - Msg: CAPTEST: App state changed. Is active? true
2021-08-28 09:38:13.943 29718-29718/? I/Capacitor/Console: File: http://localhost/bundle.js - Line 2 - Msg: CAPTEST: App state changed. Is active? true
2021-08-28 09:38:17.845 29718-29718/? I/Capacitor/Console: File: http://localhost/bundle.js - Line 2 - Msg: CAPTEST: App state changed. Is active? false
2021-08-28 09:39:55.855 30466-30466/? I/Capacitor/Console: File: http://localhost/bundle.js - Line 2 - Msg: CAPTEST: finished installing appRestoredResult listener:  {}
2021-08-28 09:39:55.861 30466-30466/? I/Capacitor/Console: File: http://localhost/bundle.js - Line 2 - Msg: CAPTEST: App opened with URL: undefined
2021-08-28 09:39:59.781 30466-30466/? I/Capacitor/Console: File: http://localhost/bundle.js - Line 2 - Msg: CAPTEST: App state changed. Is active? true
2021-08-28 09:40:00.693 30466-30466/? I/Capacitor/Console: File: http://localhost/bundle.js - Line 2 - Msg: CAPTEST: App state changed. Is active? false
2021-08-28 09:40:07.009 30808-30808/com.example.capacitor.camera.test I/Capacitor/Console: File: http://localhost/bundle.js - Line 2 - Msg: CAPTEST: finished installing appRestoredResult listener:  {}
2021-08-28 09:40:07.013 30808-30808/com.example.capacitor.camera.test I/Capacitor/Console: File: http://localhost/bundle.js - Line 2 - Msg: CAPTEST: App opened with URL: undefined
2021-08-28 09:40:35.869 30808-30808/com.example.capacitor.camera.test I/Capacitor/Console: File: http://localhost/bundle.js - Line 2 - Msg: CAPTEST: App state changed. Is active? false
```

To dig into the plugin a bit, one can open `CameraPlugin.java` in Android Studio
and add some debugging lines:

Change first three lines of getResultType to these four:

```java
if (resultType == null) {
    Log.d("CAPTEST", "CameraPlugin::getResultType returned null");
    return null;
}
```

Change the first four lines of processCameraImage to these five:

```java
if (imageFileSavePath == null) {
    Log.d("CAPTEST", "CameraPlugin::getResultType returned null");
    call.reject(IMAGE_PROCESS_NO_FILE_ERROR);
    return;
}
```

Re-run the application, and when the activity resumes, LogCat shows the
following:

```text
2021-08-28 09:45:33.885 938-938/com.example.capacitor.camera.test D/CAPTEST: CameraPlugin::getResultType returned null
2021-08-28 09:45:34.907 938-938/com.example.capacitor.camera.test I/Capacitor/Console: File: http://localhost/bundle.js - Line 2 - Msg: CAPTEST: finished installing appRestoredResult listener:  {}
```

There are two peculiarities here.  First, `getResultType` is returning null.
Second, that code is running before the `appRestoredResult` listener is even
installed.

To dig deeper, one can open `BridgeActivity.java` and add some logging to
`onActivityResult` as the first line:

```java
Log.d("CAPTEST", "In onActivityResult.  requestCode = " + requestCode + ", resultCode = " + resultCode + ", data = " + ((data == null) ? "null" : data.toString()));
```

If one cancels the Camera activiy, the log presents the following:

```text
2021-08-28 10:06:27.607 7735-7735/com.example.capacitor.camera.test D/CAPTEST: In onActivityResult.  requestCode = 683762809, resultCode = 0, data = null
2021-08-28 10:06:27.609 7735-7735/com.example.capacitor.camera.test D/CAPTEST: CameraPlugin::getResultType returned null
2021-08-28 10:06:28.274 7735-7735/com.example.capacitor.camera.test I/Capacitor/Console: File: http://localhost/bundle.js - Line 2 - Msg: CAPTEST: finished installing appRestoredResult listener:  {}
2021-08-28 10:06:28.282 7735-7735/com.example.capacitor.camera.test I/Capacitor/Console: File: http://localhost/bundle.js - Line 2 - Msg: CAPTEST: App opened with URL: undefined
2021-08-28 10:06:57.289 7735-7735/com.example.capacitor.camera.test I/Capacitor/Console: File: http://localhost/bundle.js - Line 2 - Msg: CAPTEST: App state changed. Is active? false
```

(Interpretation: the `resultCode` is good, but the `appRestoredResult` handler is not firing).

If one takes a picture and returns, the log presents the following:

```text
2021-08-28 10:07:46.999 8180-8180/com.example.capacitor.camera.test D/CAPTEST: In onActivityResult.  requestCode = 683762809, resultCode = -1, data = null
2021-08-28 10:07:47.000 8180-8180/com.example.capacitor.camera.test D/CAPTEST: CameraPlugin::getResultType returned null
2021-08-28 10:07:47.943 8180-8180/com.example.capacitor.camera.test I/Capacitor/Console: File: http://localhost/bundle.js - Line 2 - Msg: CAPTEST: finished installing appRestoredResult listener:  {}
2021-08-28 10:07:47.948 8180-8180/com.example.capacitor.camera.test I/Capacitor/Console: File: http://localhost/bundle.js - Line 2 - Msg: CAPTEST: App opened with URL: undefined
```

(Interpretation: the `resultCode` indicates an error **and** the `appRestoredResult` handler is not firing).
