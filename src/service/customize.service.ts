import {Injectable, NgZone} from "@angular/core";
import {ipcRenderer} from 'electron';
import {Subject} from "rxjs/Subject";
import {GenerateParameters} from "../../static/model/generateParameters";

@Injectable()
export class CustomizeService {
  private preview = new Subject<string>();
  $preview = this.preview.asObservable();

  private newPreview = new Subject<boolean>();
  $newPreview = this.newPreview.asObservable();
  private maxSize = new Subject<number>();
  $maxSize = this.maxSize.asObservable();

  private _centerImageBuffer: any = null;

  constructor(private zone: NgZone) {
    ipcRenderer.on('selected-center-image', (event, centerImage) => {
      zone.run(() => {
        this._centerImageBuffer = centerImage;
        this.newPreview.next(true);
      });
    });
    ipcRenderer.on('render-preview', (event, image) => {
      this.zone.run(() => {
        this.preview.next(image);
      });
    });
    ipcRenderer.on('max-embedded-image-size', (event, maxSize) => {
      this.zone.run(() => {
        this.maxSize.next(maxSize);
      });
    });
  }

  public getMaxImageSize(genParams) {
    ipcRenderer.send('get-max-embedded-image-size', genParams);
  }

  public selectImage(url: string = ""): void {
    console.log(url);
    ipcRenderer.send('select-custom-image', url);
  }

  regenerate(generateParameters: GenerateParameters): void {
    ipcRenderer.send('generate-preview', generateParameters);
  }

  public getCenterImage(): any {
    return this._centerImageBuffer;
  }

  public clearCenterImage(): void {
    this._centerImageBuffer = null;
  }
}
