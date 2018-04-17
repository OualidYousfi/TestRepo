import {Injectable, NgZone} from "@angular/core";
import {MainService} from "./main.service";
import {ipcRenderer} from 'electron';
import {Subject} from "rxjs/Subject";

/**
 * This service handles the zip operations.
 */

@Injectable()
export class ZipService {
  private valid: boolean;
  private manifest: string;
  private fileUrl: string;
  private validZip = new Subject<boolean>();
  validZip$ = this.validZip.asObservable();

  constructor (private mainService: MainService, zone: NgZone) {
    ipcRenderer.on('work-order-extracted', (event, valid, manifest, noDrop, filePath, previewExtendedId, previewSerial) => {
      this.mainService.setPreviewExtendedId(previewExtendedId);
      this.mainService.setPreviewSerial(previewSerial);
      zone.run(() => {
        this.valid = valid;
        this.fileUrl = filePath;
        if (manifest !== null) {
          this.manifest = manifest;
        }
        this.validZip.next(this.valid);
        if (noDrop) {
          this.workOrderDropped()
        }
      });
    });
  }

  public draggedWorkOrder(filePath): void {
    ipcRenderer.send('extract-work-order', filePath, false);
  }

  public workOrderDropped(): void {
    if (this.valid) {
      this.mainService.setWorkOrderUrl(this.fileUrl);
      this.mainService.setManifest(JSON.parse(this.manifest));
    }
  }

  public selectWorkOrder(): void {
    ipcRenderer.send('select-work-order');
  }

  public recentWoSelected(filePath): void {
    ipcRenderer.send('extract-work-order', filePath, true);
  }
}
