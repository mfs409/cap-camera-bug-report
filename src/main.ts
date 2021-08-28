import { Camera, CameraResultType, Photo, CameraSource, } from '@capacitor/camera';
import { CameraHelper } from "./CameraHelper";
import { Device } from "@capacitor/device"
import { App, AppState, RestoredListenerEvent, URLOpenListenerEvent } from "@capacitor/app";
import { PluginListenerHandle } from "@capacitor/core";

/** The platform (This test is only concerned about android and web) */
let platform: string = "unknown";

/** Track if PWA elements have been loaded (only matters when platform is web) */
let pwaInit = false;

/**
 * Get a picture from the gallery using Capacitor.
 *
 * @param success A callback to run on the image that the gallery returns
 * @param failure A callback to run on the error result when the gallery fails
 */
function openGallery(success: (image: string) => void, failure: (reason: any) => void) {
    Camera.getPhoto({ allowEditing: false, resultType: CameraResultType.Uri, source: CameraSource.Photos })
        .then((image: Photo) => { success(image.webPath!); })
        .catch((reason: any) => { failure(reason); });
}

/**
 * Get a picture from the camera using Capacitor.
 *
 * @param success A callback to run on the image that the camera returns
 * @param failure A callback to run on the error result when the camera fails
 */
function openCamera(success: (image: string) => void, failure: (reason: any) => void) {
    // We wrap Camera.getPhoto in a lambda, because we can't run it right away
    // on the web platform: we need to install PWA elements first.
    let f = () => {
        Camera.getPhoto({
            quality: 90,
            allowEditing: false,
            resultType: CameraResultType.Uri,
            source: CameraSource.Camera,
            saveToGallery: true
        }
        ).then((image: Photo) => { success(image.webPath!); }
        ).catch((reason: any) => { failure(reason); });
    }
    // On web, make sure PWA elements are loaded
    if (!pwaInit && platform === "web") {
        pwaInit = true;
        new CameraHelper().injectPwa(f);
    }
    else {
        f();
    }
}

/**
 * Initialization routine: set up android lifecycle events, configure the
 * buttons for opening gallery and camera.
 */
async function init() {
    // Subscribe to Android lifecycle events
    //
    // NB: Make sure to install listeners before any `await` calls
    App.addListener('appStateChange', (state: AppState) => {
        console.log('CAPTEST: App state changed. Is active?', state.isActive);
    });
    App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
        console.log('CAPTEST: App opened with URL:', event.url);
    });
    App.addListener('appRestoredResult', (event: RestoredListenerEvent) => {
        console.log('CAPTEST: Restored state:', JSON.stringify(event.data));
        console.log('CAPTEST: Restored state:', event.error);
        console.log('CAPTEST: Restored state:', event.methodName);
        console.log('CAPTEST: Restored state:', event.pluginId);
        console.log('CAPTEST: Restored state:', event.success);
        window.alert((event.data as Photo).webPath!.substr(0, 100));
    }).then((v: PluginListenerHandle) => {
        console.log("CAPTEST: finished installing appRestoredResult listener: ", JSON.stringify(v));
    });
    App.getLaunchUrl().then((a: any) => {
        console.log('CAPTEST: App opened with URL: ' + a);
    });

    // Ask capacitor if we're mobile or not, then update config
    let info = await Device.getInfo();
    platform = info.platform;

    // Set up the buttons.  For now we'll just print the first 100 characters of
    // the image's webpath.
    document.getElementById("btnCamera")!.onclick = () => {
        openCamera((image: string) => {
            window.alert(image.substr(0, 100));
        }, (reason: any) => {
            window.alert(JSON.stringify(reason));
        });
    };
    document.getElementById("btnGallery")!.onclick = () => {
        openGallery((image: string) => {
            window.alert(image.substr(0, 100));
        }, (reason: any) => {
            window.alert(JSON.stringify(reason));
        });
    };
}

// Initialize the app
init();