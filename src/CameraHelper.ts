import { defineCustomElements } from '@ionic/pwa-elements/loader';

/**
 * CameraHelper sets up PWA componenets when we are trying to open a camera from
 * the web.  It's not needed for Android/iOS, and WebPack is set up to replace
 * it with the one in CameraHelper.empty.ts.
 */
export class CameraHelper {
    /**
     * Insert the Ionic PWA elements into the page, so that we can use the
     * camera, then run a callback
     */
    public injectPwa(callback: () => void) {
        defineCustomElements(window).then(() => callback());
    };
}